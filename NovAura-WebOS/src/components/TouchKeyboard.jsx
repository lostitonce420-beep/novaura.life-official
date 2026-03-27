import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

const TouchKeyboard = ({ onKeyPress, onClose, isVisible }) => {
  if (!isVisible) return null;

  const keys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['space', 'enter'],
  ];

  const handleKeyPress = (key) => {
    if (key === 'space') {
      onKeyPress(' ');
    } else if (key === 'enter') {
      onKeyPress('\n');
    } else if (key === 'backspace') {
      onKeyPress('backspace');
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[950] bg-window-bg border-t border-primary/30 p-4 glass">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Touch Keyboard</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => handleKeyPress(key)}
                variant="outline"
                className={`touch-manipulation active:scale-95 ${
                  key === 'space' 
                    ? 'flex-1 max-w-xs' 
                    : key === 'enter' || key === 'backspace'
                    ? 'px-6'
                    : 'w-10 h-10 p-0'
                } hover:bg-primary/20 hover:text-primary`}
              >
                <span className="text-sm font-medium">
                  {key === 'backspace' ? '←' : key === 'enter' ? '↵' : key}
                </span>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TouchKeyboard;
