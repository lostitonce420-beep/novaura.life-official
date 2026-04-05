import React from 'react';
import { Music } from 'lucide-react';

// Music Studio Window - Wraps the platform Music Studio as a WebOS window
export default function MusicStudioWindow() {
  return (
    <div className="w-full h-full bg-[#0a0a0f] overflow-auto">
      <iframe
        src="/platform/music-studio"
        className="w-full h-full border-0"
        title="Music Studio"
        sandbox="allow-scripts allow-same-origin allow-microphone"
      />
    </div>
  );
}

MusicStudioWindow.title = 'Music Studio';
MusicStudioWindow.icon = Music;
MusicStudioWindow.defaultSize = { width: 1400, height: 900 };
MusicStudioWindow.minSize = { width: 1000, height: 700 };
