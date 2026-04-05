import React from 'react';
import { Guitar, Clock } from 'lucide-react';

// Practice Tools Window - Tuner and Metronome
export default function PracticeToolsWindow() {
  return (
    <div className="w-full h-full bg-[#0a0a0f] overflow-auto">
      <iframe
        src="/platform/practice"
        className="w-full h-full border-0"
        title="Practice Tools"
        sandbox="allow-scripts allow-same-origin allow-microphone"
      />
    </div>
  );
}

PracticeToolsWindow.title = 'Practice Tools';
PracticeToolsWindow.icon = Guitar;
PracticeToolsWindow.defaultSize = { width: 600, height: 800 };
PracticeToolsWindow.minSize = { width: 400, height: 600 };
