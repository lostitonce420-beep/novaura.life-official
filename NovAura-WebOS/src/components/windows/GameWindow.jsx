import React, { useState } from 'react';
import { Gamepad2, Maximize2, Minimize2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

// Generic game window that loads web games via iframe
export default function GameWindow({ gameId, title, url, description }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const gameUrl = url || getGameUrl(gameId);
  const gameTitle = title || getGameTitle(gameId);
  const gameDesc = description || getGameDescription(gameId);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Game Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{gameTitle}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsLoading(true);
              setError(false);
              const iframe = document.getElementById(`game-frame-${gameId}`);
              if (iframe) iframe.src = iframe.src;
            }}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 relative">
        {/* Loading state */}
        {isLoading && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
            <Gamepad2 className="w-12 h-12 text-primary/30 mb-4 animate-pulse" />
            <p className="text-sm text-white/50">Loading {gameTitle}...</p>
            <p className="text-[10px] text-white/25 mt-1">{gameDesc}</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
            <Gamepad2 className="w-12 h-12 text-destructive/30 mb-4" />
            <p className="text-sm text-white/50">Could not load game</p>
            <p className="text-[10px] text-white/25 mt-1 mb-4">The game server may not be running</p>
            <Button
              onClick={() => { setError(false); setIsLoading(true); }}
              variant="outline"
              size="sm"
              className="border-primary/30"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* Game iframe */}
        <iframe
          id={`game-frame-${gameId}`}
          src={gameUrl}
          className="w-full h-full border-0"
          title={gameTitle}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setError(true); }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          style={{ background: 'black' }}
        />
      </div>
    </div>
  );
}

// Game registry
function getGameUrl(id) {
  const games = {
    'gilded-cage': 'http://localhost:3100', // Will be the Gilded Cage dev server
    'aetherium': 'http://localhost:3101',
    'galactica': 'http://localhost:3102',
  };
  return games[id] || '';
}

function getGameTitle(id) {
  const titles = {
    'gilded-cage': 'The Gilded Cage',
    'aetherium': 'Aetherium TCG',
    'galactica': 'Galactica',
  };
  return titles[id] || 'Game';
}

function getGameDescription(id) {
  const descs = {
    'gilded-cage': 'Steampunk RPG Adventure',
    'aetherium': 'Strategic Trading Card Game',
    'galactica': 'Space Exploration',
  };
  return descs[id] || '';
}
