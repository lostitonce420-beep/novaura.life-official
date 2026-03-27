import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Download, Globe, Monitor, Smartphone, Package,
  Loader2, Check, FileArchive, Rocket, ExternalLink, Copy,
  FileCode, AlertCircle,
} from 'lucide-react';
import useRepoStore from './useRepoStore';

// ── Deploy targets ───────────────────────────────────────────
const DEPLOY_TARGETS = [
  {
    id: 'zip',
    name: 'Download ZIP',
    desc: 'Download as a ZIP file — import into any IDE or project',
    icon: FileArchive,
    available: true,
    badge: null,
  },
  {
    id: 'web',
    name: 'Deploy to Web',
    desc: 'Publish to a live NovAura-hosted URL',
    icon: Globe,
    available: false,
    badge: 'Coming Soon',
  },
  {
    id: 'tauri',
    name: 'Build Desktop (Tauri)',
    desc: 'Package as a native desktop app (.exe / .dmg / .AppImage)',
    icon: Monitor,
    available: false,
    badge: 'Requires EXE',
  },
  {
    id: 'android',
    name: 'Build Android (APK)',
    desc: 'Package as an Android app via Tauri Mobile',
    icon: Smartphone,
    available: false,
    badge: 'Requires EXE',
  },
];

// ── ZIP generator ────────────────────────────────────────────
async function generateZip(files, projectName) {
  // Simple ZIP implementation using Blob — no external deps
  // Creates a valid ZIP with stored (uncompressed) files
  const encoder = new TextEncoder();

  const entries = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = encoder.encode(file.content || '');
    const crc = crc32(contentBytes);

    // Local file header (30 + name + content)
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 0x04034b50, true);   // signature
    lv.setUint16(4, 20, true);            // version needed
    lv.setUint16(6, 0, true);             // flags
    lv.setUint16(8, 0, true);             // compression: stored
    lv.setUint16(10, 0, true);            // mod time
    lv.setUint16(12, 0, true);            // mod date
    lv.setUint32(14, crc, true);          // crc32
    lv.setUint32(18, contentBytes.length, true); // compressed size
    lv.setUint32(22, contentBytes.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);    // name length
    lv.setUint16(28, 0, true);            // extra length
    new Uint8Array(localHeader, 30).set(nameBytes);

    entries.push({
      nameBytes,
      contentBytes,
      crc,
      localHeaderOffset: offset,
      localHeader,
    });

    offset += localHeader.byteLength + contentBytes.length;
  }

  // Central directory
  const centralEntries = [];
  for (const entry of entries) {
    const cd = new ArrayBuffer(46 + entry.nameBytes.length);
    const cv = new DataView(cd);
    cv.setUint32(0, 0x02014b50, true);    // signature
    cv.setUint16(4, 20, true);            // version made by
    cv.setUint16(6, 20, true);            // version needed
    cv.setUint16(8, 0, true);             // flags
    cv.setUint16(10, 0, true);            // compression
    cv.setUint16(12, 0, true);            // mod time
    cv.setUint16(14, 0, true);            // mod date
    cv.setUint32(16, entry.crc, true);
    cv.setUint32(20, entry.contentBytes.length, true);
    cv.setUint32(24, entry.contentBytes.length, true);
    cv.setUint16(28, entry.nameBytes.length, true);
    cv.setUint16(30, 0, true);            // extra length
    cv.setUint16(32, 0, true);            // comment length
    cv.setUint16(34, 0, true);            // disk start
    cv.setUint16(36, 0, true);            // internal attrs
    cv.setUint32(38, 0, true);            // external attrs
    cv.setUint32(42, entry.localHeaderOffset, true);
    new Uint8Array(cd, 46).set(entry.nameBytes);
    centralEntries.push(cd);
  }

  const cdSize = centralEntries.reduce((s, c) => s + c.byteLength, 0);

  // End of central directory
  const ecd = new ArrayBuffer(22);
  const ev = new DataView(ecd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  // Assemble
  const parts = [];
  for (const entry of entries) {
    parts.push(entry.localHeader);
    parts.push(entry.contentBytes.buffer.slice(
      entry.contentBytes.byteOffset,
      entry.contentBytes.byteOffset + entry.contentBytes.byteLength
    ));
  }
  for (const cd of centralEntries) parts.push(cd);
  parts.push(ecd);

  const blob = new Blob(parts, { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName || 'project'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── CRC32 ────────────────────────────────────────────────────
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[i] = c;
    }
    return t;
  })());

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Main Component ───────────────────────────────────────────
export default function DeployPanel({ app, onBack }) {
  const [deploying, setDeploying] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('zip');

  if (!app) return null;

  const handleDeploy = async () => {
    if (selectedTarget === 'zip') {
      setDeploying(true);
      try {
        const name = (app.rebrandedName || app.name || 'project').replace(/\s+/g, '-').toLowerCase();
        await generateZip(app.files, name);
        setDeployDone(true);
        useRepoStore.getState().updateApp(app.id, { status: 'deployed' });
      } catch (err) {
        console.error('ZIP generation failed:', err);
      } finally {
        setDeploying(false);
      }
    }
    // Future: web deploy, tauri build, android build
  };

  const totalSize = app.files.reduce((s, f) => s + (f.content?.length || 0), 0);
  const target = DEPLOY_TARGETS.find(t => t.id === selectedTarget);

  return (
    <div className="flex flex-col h-full bg-[#12121e] text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <button onClick={onBack} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <Rocket className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Deploy: {app.rebrandedName || app.name}</span>
        {app.status === 'enhanced' && (
          <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded ml-auto">Enhanced</span>
        )}
      </div>

      {/* App summary */}
      <div className="px-3 py-2 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><FileCode className="w-3 h-3" /> {app.files.length} files</span>
          <span>{(totalSize / 1024).toFixed(1)} KB</span>
          <span>{app.language}</span>
          {app.status !== 'enhanced' && (
            <span className="flex items-center gap-1 text-yellow-500">
              <AlertCircle className="w-3 h-3" /> Not enhanced yet
            </span>
          )}
        </div>
      </div>

      {/* Deploy targets */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Deploy Target</div>

        {DEPLOY_TARGETS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => t.available && setSelectedTarget(t.id)}
              disabled={!t.available}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all ${
                selectedTarget === t.id && t.available
                  ? 'border-primary/30 bg-primary/10'
                  : t.available
                    ? 'border-white/5 bg-black/20 hover:border-white/10'
                    : 'border-white/5 bg-black/10 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                selectedTarget === t.id && t.available ? 'bg-primary/20' : 'bg-white/5'
              }`}>
                <Icon className={`w-4.5 h-4.5 ${selectedTarget === t.id && t.available ? 'text-primary' : 'text-gray-500'}`} />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium ${selectedTarget === t.id && t.available ? 'text-gray-200' : 'text-gray-400'}`}>
                    {t.name}
                  </span>
                  {t.badge && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-600">{t.badge}</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-600 mt-0.5">{t.desc}</p>
              </div>
              {selectedTarget === t.id && t.available && (
                <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
              )}
            </button>
          );
        })}

        {/* Deploy info */}
        {selectedTarget === 'zip' && (
          <div className="p-3 rounded-lg bg-black/20 border border-white/5 mt-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">What's Included</div>
            <ul className="space-y-1">
              {app.files.slice(0, 10).map(f => (
                <li key={f.path} className="text-[10px] text-gray-400 flex items-center gap-1.5">
                  <FileCode className="w-3 h-3 text-gray-600 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </li>
              ))}
              {app.files.length > 10 && (
                <li className="text-[9px] text-gray-600">...and {app.files.length - 10} more files</li>
              )}
            </ul>
          </div>
        )}

        {selectedTarget === 'tauri' && (
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 mt-4">
            <div className="text-[10px] text-amber-400 font-medium mb-1">Desktop Build</div>
            <p className="text-[9px] text-gray-500 leading-relaxed">
              Desktop builds require the NovAura Desktop app (Tauri).
              The app will be packaged with a native shell for Windows, macOS, and Linux.
              Local AI models can be bundled for offline inference.
            </p>
          </div>
        )}

        {selectedTarget === 'android' && (
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 mt-4">
            <div className="text-[10px] text-green-400 font-medium mb-1">Android Build</div>
            <p className="text-[9px] text-gray-500 leading-relaxed">
              Android builds use Tauri 2.0 mobile targets. Same codebase as desktop —
              one web frontend, native shell per platform. Requires the NovAura Desktop app
              with Android SDK configured.
            </p>
          </div>
        )}
      </div>

      {/* Deploy button */}
      <div className="px-3 py-3 border-t border-white/10">
        {deployDone ? (
          <div className="flex items-center justify-center gap-2 py-2 text-green-400 text-[11px]">
            <Check className="w-4 h-4" />
            <span>Downloaded successfully!</span>
          </div>
        ) : (
          <button
            onClick={handleDeploy}
            disabled={deploying || !target?.available}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-medium transition-colors"
          >
            {deploying ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-3.5 h-3.5" /> {target?.name || 'Deploy'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
