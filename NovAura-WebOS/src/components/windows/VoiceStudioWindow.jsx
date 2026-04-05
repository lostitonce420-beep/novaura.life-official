import React from 'react';
import { Mic } from 'lucide-react';

// Voice Studio Window - Wraps the platform Voice Studio as a WebOS window
export default function VoiceStudioWindow() {
  return (
    <div className="w-full h-full bg-[#0a0a0f] overflow-auto">
      <iframe
        src="/platform/voice-studio"
        className="w-full h-full border-0"
        title="Voice Studio"
        sandbox="allow-scripts allow-same-origin allow-microphone allow-camera"
      />
    </div>
  );
}

VoiceStudioWindow.title = 'Voice Studio';
VoiceStudioWindow.icon = Mic;
VoiceStudioWindow.defaultSize = { width: 1200, height: 800 };
VoiceStudioWindow.minSize = { width: 800, height: 600 };
