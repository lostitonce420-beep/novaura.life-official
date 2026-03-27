import React, { useState, useEffect, useRef } from 'react';
import { Timer, Target, FileText, Hash, Play, Pause, RotateCcw } from 'lucide-react';

export default function StatusBar({ wordCount = 0, charCount = 0, wordGoal = 1000, activeFileName = '' }) {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      intervalRef.current = setInterval(() => {
        setPomodoroTime((t) => {
          if (t <= 1) {
            setPomodoroRunning(false);
            setSessionsCompleted((s) => s + 1);
            // Play notification sound
            try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==').play(); } catch {}
            return 25 * 60;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [pomodoroRunning]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const goalPct = Math.min(100, Math.round((wordCount / Math.max(1, wordGoal)) * 100));
  const pageEstimate = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="h-6 bg-[#1a1a2e] border-t border-[#2a2a4a] flex items-center px-3 gap-4 text-[10px] text-gray-400 select-none flex-shrink-0">
      {/* File info */}
      <div className="flex items-center gap-1">
        <FileText className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{activeFileName || 'No file'}</span>
      </div>

      <div className="w-px h-3 bg-gray-700" />

      {/* Word count */}
      <div className="flex items-center gap-1">
        <Hash className="w-3 h-3" />
        <span>{wordCount.toLocaleString()} words</span>
        <span className="text-gray-600">|</span>
        <span>{charCount.toLocaleString()} chars</span>
        <span className="text-gray-600">|</span>
        <span>~{pageEstimate} pg{pageEstimate !== 1 ? 's' : ''}</span>
      </div>

      <div className="w-px h-3 bg-gray-700" />

      {/* Word goal */}
      <div className="flex items-center gap-1.5">
        <Target className="w-3 h-3" />
        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${goalPct}%`,
              background: goalPct >= 100 ? '#22c55e' : goalPct >= 50 ? '#00d9ff' : '#a855f7',
            }}
          />
        </div>
        <span className={goalPct >= 100 ? 'text-green-400' : ''}>{goalPct}%</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pomodoro timer */}
      <div className="flex items-center gap-1.5">
        <Timer className="w-3 h-3" />
        <span className={pomodoroRunning ? 'text-accent' : ''}>{formatTime(pomodoroTime)}</span>
        <button
          onClick={() => setPomodoroRunning(!pomodoroRunning)}
          className="hover:text-white transition-colors"
        >
          {pomodoroRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
        </button>
        <button
          onClick={() => { setPomodoroRunning(false); setPomodoroTime(25 * 60); }}
          className="hover:text-white transition-colors"
        >
          <RotateCcw className="w-2.5 h-2.5" />
        </button>
        {sessionsCompleted > 0 && (
          <span className="text-green-400">{sessionsCompleted} done</span>
        )}
      </div>
    </div>
  );
}
