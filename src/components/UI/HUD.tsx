import { useGalleryStore } from '../../stores/galleryStore';
import { ControlsGuide } from './ControlsGuide';
import { TokenPreview } from './TokenPreview';
import { TokenDetailPanel } from './TokenDetailPanel';
import { LoadingScreen } from './LoadingScreen';

export const HUD = () => {
  const showControls = useGalleryStore((s) => s.showControls);
  const tokens = useGalleryStore((s) => s.tokens);

  return (
    <>
      {/* Loading screen */}
      <LoadingScreen />

      {/* Token detail modal */}
      <TokenDetailPanel />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
        {/* Title */}
        <div className="pointer-events-auto">
          <h1 className="text-xl font-bold">
            <span className="text-neon-cyan">SPIRAL</span>{' '}
            <span className="text-neon-magenta">MEME</span>{' '}
            <span className="text-white">GALLERY</span>
          </h1>
          <p className="text-gray-500 text-xs">
            {tokens.length} meme tokens loaded
          </p>
        </div>

        {/* Menu button */}
        <button className="pointer-events-auto px-4 py-2 bg-cyber-primary/80 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-cyber-primary transition-colors">
          MENU
        </button>
      </div>

      {/* Token preview (when near a token) */}
      <TokenPreview />

      {/* Controls guide */}
      {showControls && <ControlsGuide />}
    </>
  );
};
