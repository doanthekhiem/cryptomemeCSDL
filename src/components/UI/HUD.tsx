import { useGalleryStore } from '../../stores/galleryStore';
import { ControlsGuide } from './ControlsGuide';
import { TokenPreview } from './TokenPreview';
import { TokenDetailPanel } from './TokenDetailPanel';
import { LoadingScreen } from './LoadingScreen';
import { MenuPanel } from './MenuPanel';
import { SearchOverlay } from './SearchOverlay';
import { ListView } from './ListView';
import { Leaderboard } from './Leaderboard';
import { TouchControls } from './TouchControls';
import { Minimap } from './Minimap';
import { Onboarding } from './Onboarding';
import { SPIRAL_CONFIG } from '../../utils/constants';

// Current spiral level derived from character height (1 = bottom)
const LocationIndicator = () => {
  const level = useGalleryStore((s) =>
    Math.min(
      SPIRAL_CONFIG.totalTurns,
      Math.max(
        1,
        Math.floor(s.characterPosition.y / SPIRAL_CONFIG.heightPerTurn) + 1
      )
    )
  );
  const nearestSymbol = useGalleryStore(
    (s) => s.nearestToken?.token.symbol ?? null
  );
  const nearestRank = useGalleryStore(
    (s) => s.nearestToken?.token.market_cap_rank ?? null
  );

  return (
    <p className="text-gray-400 text-xs font-mono">
      Level {level}/{SPIRAL_CONFIG.totalTurns}
      {nearestSymbol && (
        <span className="text-neon-cyan">
          {' '}· near #{nearestRank ?? '—'} {nearestSymbol.toUpperCase()}
        </span>
      )}
    </p>
  );
};

export const HUD = () => {
  const showControls = useGalleryStore((s) => s.showControls);
  const tokens = useGalleryStore((s) => s.tokens);
  const toggleMenu = useGalleryStore((s) => s.toggleMenu);

  return (
    <>
      {/* Loading / error / empty screen */}
      <LoadingScreen />

      {/* Token detail modal */}
      <TokenDetailPanel />

      {/* Search overlay (/) */}
      <SearchOverlay />

      {/* 2D token list */}
      <ListView />

      {/* 24h gainers/losers */}
      <Leaderboard />

      {/* Slide-in menu */}
      <MenuPanel />

      {/* First-visit tour */}
      <Onboarding />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-4 flex justify-between items-start pointer-events-none">
        {/* Title */}
        <div className="pointer-events-auto ui-element">
          <h1 className="text-base sm:text-xl font-bold leading-tight">
            <span className="text-neon-cyan">SPIRAL</span>{' '}
            <span className="text-neon-magenta">MEME</span>{' '}
            <span className="text-white">GALLERY</span>
          </h1>
          <p className="text-gray-400 text-xs">{tokens.length} meme tokens loaded</p>
          <LocationIndicator />
        </div>

        {/* Menu button */}
        <button
          onClick={toggleMenu}
          aria-label="Open menu"
          aria-haspopup="dialog"
          className="pointer-events-auto px-4 py-2 bg-cyber-primary/80 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-cyber-primary hover:border-neon-cyan/60 transition-colors"
        >
          MENU
        </button>
      </div>

      {/* Spiral minimap */}
      <Minimap />

      {/* Token preview (when near a token) */}
      <TokenPreview />

      {/* Virtual joystick on touch devices */}
      <TouchControls />

      {/* Controls guide */}
      {showControls && <ControlsGuide />}
    </>
  );
};
