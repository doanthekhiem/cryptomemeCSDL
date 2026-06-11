import { useState } from 'react';
import { isTouchDevice } from '../../utils/inputState';

export const ControlsGuide = () => {
  const [isTouch] = useState(isTouchDevice);

  // On touch devices the joystick + tap gestures replace keyboard hints
  if (isTouch) {
    return (
      <div className="fixed bottom-28 right-4 z-30 bg-cyber-primary/80 backdrop-blur-sm border border-neon-cyan/30 rounded-lg p-3 text-white text-xs max-w-[160px]">
        <p className="text-gray-300">
          Drag the <span className="text-neon-cyan">joystick</span> to move ·
          tap a <span className="text-neon-cyan">token</span> for details
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 bg-cyber-primary/80 backdrop-blur-sm border border-neon-cyan/30 rounded-lg p-3 text-white text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <Key>W</Key>
            <Key>A</Key>
            <Key>S</Key>
            <Key>D</Key>
          </div>
          <span className="text-gray-300">Move</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>Enter</Key>
          <span className="text-gray-300">Details</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>ESC</Key>
          <span className="text-gray-300">Menu / Close</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>/</Key>
          <span className="text-gray-300">Search</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>M</Key>
          <span className="text-gray-300">Minimap</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>L</Key>
          <span className="text-gray-300">Leaderboard</span>
        </div>
      </div>
    </div>
  );
};

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-cyber-secondary border border-neon-cyan/50 rounded text-neon-cyan text-xs font-mono">
    {children}
  </span>
);
