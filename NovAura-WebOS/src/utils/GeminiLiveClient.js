/**
 * GeminiLiveClient — direct WebSocket connection to Gemini Multimodal Live API
 *
 * Handles:
 *  - WebSocket session setup + teardown
 *  - Mic capture via AudioWorklet (PCM16 @ 16 kHz)
 *  - Camera capture via canvas (JPEG @ 1 fps)
 *  - Audio playback queue (PCM16 @ 24 kHz from Gemini)
 *  - Text input
 */

const LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

// ── helpers ──────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToPCMFloat32(base64) {
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  const sampleCount = bytes.length / 2;
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    let sample = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
    if (sample >= 32768) sample -= 65536;
    float32[i] = sample / 32768;
  }
  return float32;
}

// Inline AudioWorklet source — runs in its own thread
const WORKLET_NAME = 'pcm-recorder-worklet';
const WORKLET_SOURCE = `
class PCMRecorderWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(2048);
    this.idx = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.buffer[this.idx++] = Math.max(-32768, Math.min(32767, ch[i] * 32768));
      if (this.idx >= this.buffer.length) {
        this.port.postMessage({ event: 'chunk', data: this.buffer.slice(0).buffer }, [this.buffer.slice(0).buffer]);
        this.buffer = new Int16Array(2048);
        this.idx = 0;
      }
    }
    return true;
  }
}
registerProcessor('${WORKLET_NAME}', PCMRecorderWorklet);
`;

// ── class ────────────────────────────────────────────────────────────────────

export default class GeminiLiveClient {
  constructor() {
    this.ws = null;
    // mic
    this.micStream = null;
    this.micCtx = null;
    this.micWorklet = null;
    this.micMuted = false;
    // camera
    this.camStream = null;
    this.camInterval = null;
    this.camCanvas = null;
    this.camCtx2d = null;
    // playback
    this.playCtx = null;
    this.nextPlayTime = 0;
    this.speakingSources = 0;
    // events
    this._cbs = {};
  }

  // ── event emitter ────────────────────────────────

  on(evt, fn) {
    (this._cbs[evt] ||= []).push(fn);
  }
  off(evt, fn) {
    this._cbs[evt] = (this._cbs[evt] || []).filter((f) => f !== fn);
  }
  _emit(evt, ...args) {
    (this._cbs[evt] || []).forEach((fn) => fn(...args));
  }

  // ── connect / disconnect ─────────────────────────

  connect(apiKey, opts = {}) {
    const model = opts.model || 'gemini-2.0-flash-live-001';
    const voice = opts.voice || 'Puck';
    const sysPrompt =
      opts.systemInstruction ||
      'You are Nova, the NovAura AI assistant. You are helpful, friendly, and knowledgeable. Keep responses concise and conversational since this is a real-time voice chat.';

    return new Promise((resolve, reject) => {
      const url = `${LIVE_WS_URL}?key=${apiKey}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.ws.send(
          JSON.stringify({
            setup: {
              model: `models/${model}`,
              generationConfig: {
                responseModalities: ['AUDIO', 'TEXT'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                  },
                },
              },
              systemInstruction: { parts: [{ text: sysPrompt }] },
            },
          })
        );
      };

      this.ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        // Setup complete
        if (msg.setupComplete !== undefined) {
          this._emit('connected');
          resolve();
          return;
        }

        // Server content (model response)
        if (msg.serverContent) {
          const parts = msg.serverContent.modelTurn?.parts || [];
          let textAcc = '';
          for (const part of parts) {
            if (part.text) textAcc += part.text;
            if (part.inlineData?.data) {
              this._playPCM(part.inlineData.data);
            }
          }
          if (textAcc) {
            this._emit('transcript', 'assistant', textAcc);
          }
          if (msg.serverContent.turnComplete) {
            this._emit('turnComplete');
          }
        }

        // Input transcription (user's speech-to-text)
        if (msg.serverContent?.inputTranscription?.text) {
          this._emit('transcript', 'user', msg.serverContent.inputTranscription.text);
        }
      };

      this.ws.onerror = (err) => {
        this._emit('error', err);
        reject(err);
      };

      this.ws.onclose = () => {
        this._emit('disconnected');
        this._cleanup();
      };
    });
  }

  disconnect() {
    this.stopMic();
    this.stopCamera();
    this.ws?.close();
    this.ws = null;
    if (this.playCtx && this.playCtx.state !== 'closed') {
      this.playCtx.close().catch(() => {});
    }
    this.playCtx = null;
  }

  _cleanup() {
    this.stopMic();
    this.stopCamera();
    this.ws = null;
  }

  // ── microphone ───────────────────────────────────

  async startMic() {
    if (this.micStream) return;
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.micCtx = new AudioContext({ sampleRate: 16000 });
    const source = this.micCtx.createMediaStreamSource(this.micStream);

    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    await this.micCtx.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);

    this.micWorklet = new AudioWorkletNode(this.micCtx, WORKLET_NAME);
    this.micWorklet.port.onmessage = (e) => {
      if (e.data.event === 'chunk' && !this.micMuted && this.ws?.readyState === WebSocket.OPEN) {
        const b64 = arrayBufferToBase64(e.data.data);
        this.ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: { data: b64, mimeType: 'audio/pcm;rate=16000' },
            },
          })
        );
      }
    };

    source.connect(this.micWorklet);
    // Don't connect to destination (we don't want to hear ourselves)
    this.micMuted = false;
    this._emit('micStarted');
  }

  stopMic() {
    this.micWorklet?.disconnect();
    this.micWorklet = null;
    if (this.micCtx && this.micCtx.state !== 'closed') {
      this.micCtx.close().catch(() => {});
    }
    this.micCtx = null;
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
    this._emit('micStopped');
  }

  muteMic() {
    this.micMuted = true;
  }
  unmuteMic() {
    this.micMuted = false;
  }

  // ── camera ───────────────────────────────────────

  async startCamera(videoElement) {
    if (this.camStream) return;
    this.camStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    });

    if (videoElement) {
      videoElement.srcObject = this.camStream;
      await videoElement.play().catch(() => {});
    }

    this.camCanvas = document.createElement('canvas');
    this.camCanvas.width = 640;
    this.camCanvas.height = 480;
    this.camCtx2d = this.camCanvas.getContext('2d');

    this.camInterval = setInterval(() => {
      if (!videoElement || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      this.camCtx2d.drawImage(videoElement, 0, 0, 640, 480);
      const jpegB64 = this.camCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      this.ws.send(
        JSON.stringify({
          realtimeInput: {
            video: { data: jpegB64, mimeType: 'image/jpeg' },
          },
        })
      );
    }, 1000); // 1 fps

    this._emit('cameraStarted');
  }

  stopCamera() {
    if (this.camInterval) {
      clearInterval(this.camInterval);
      this.camInterval = null;
    }
    this.camStream?.getTracks().forEach((t) => t.stop());
    this.camStream = null;
    this.camCanvas = null;
    this.camCtx2d = null;
    this._emit('cameraStopped');
  }

  // ── text input ───────────────────────────────────

  sendText(text) {
    if (!text?.trim() || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      })
    );
    this._emit('transcript', 'user', text);
  }

  // ── audio playback ──────────────────────────────

  _playPCM(base64Data) {
    if (!this.playCtx || this.playCtx.state === 'closed') {
      this.playCtx = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = this.playCtx.currentTime;
    }

    const float32 = base64ToPCMFloat32(base64Data);
    if (float32.length === 0) return;

    const buf = this.playCtx.createBuffer(1, float32.length, 24000);
    buf.copyToChannel(float32, 0);

    const src = this.playCtx.createBufferSource();
    src.buffer = buf;
    src.connect(this.playCtx.destination);

    if (this.nextPlayTime < this.playCtx.currentTime) {
      this.nextPlayTime = this.playCtx.currentTime;
    }

    src.start(this.nextPlayTime);
    this.nextPlayTime += buf.duration;

    this.speakingSources++;
    this._emit('speaking', true);

    src.onended = () => {
      this.speakingSources--;
      if (this.speakingSources <= 0) {
        this.speakingSources = 0;
        this._emit('speaking', false);
      }
    };
  }
}
