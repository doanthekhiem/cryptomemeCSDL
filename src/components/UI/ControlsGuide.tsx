export const ControlsGuide = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-cyber-primary/80 backdrop-blur-sm border border-neon-cyan/30 rounded-lg p-3 text-white text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <Key>W</Key>
            <Key>A</Key>
            <Key>S</Key>
            <Key>D</Key>
          </div>
          <span className="text-gray-400">Move</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>Enter</Key>
          <span className="text-gray-400">Details</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>ESC</Key>
          <span className="text-gray-400">Menu</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>/</Key>
          <span className="text-gray-400">Search</span>
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
