import { useEffect, useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';

// Degen-flavored loading captions, rotated while waiting for CoinGecko
const LOADING_CAPTIONS = [
  'Summoning doge…',
  'Mining copium…',
  'Asking wen lambo…',
  'Counting diamond hands…',
  'Fueling the rocket…',
  'Charting the path to the Moon…',
];

const Title = () => (
  <h1 className="text-3xl sm:text-4xl font-bold mb-8">
    <span className="text-neon-cyan">SPIRAL</span>{' '}
    <span className="text-neon-magenta">MEME</span>{' '}
    <span className="text-white">GALLERY</span>
  </h1>
);

export const LoadingScreen = () => {
  const isLoading = useGalleryStore((s) => s.isLoading);
  const error = useGalleryStore((s) => s.error);
  const tokens = useGalleryStore((s) => s.tokens);
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const id = window.setInterval(
      () => setCaptionIndex((i) => (i + 1) % LOADING_CAPTIONS.length),
      1600
    );
    return () => window.clearInterval(id);
  }, [isLoading]);

  const isEmpty = !isLoading && !error && tokens.length === 0;

  if (!isLoading && !error && !isEmpty) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-cyber-bg px-4"
      role="status"
      aria-live="polite"
    >
      <div className="text-center max-w-md">
        <Title />

        {error ? (
          // Error state — degen tone, but the real cause stays visible
          <div>
            <div className="text-5xl mb-4" aria-hidden="true">💀</div>
            <p className="text-lg text-white mb-2">rekt — the API rugged us</p>
            <p className="text-sm text-gray-300 mb-1">
              CoinGecko didn't respond — it may be rate-limited or your
              connection dropped. Please try again in a minute.
            </p>
            <p className="text-xs text-gray-500 font-mono break-all">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-neon-cyan/20 border border-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors text-neon-cyan"
            >
              Retry
            </button>
          </div>
        ) : isEmpty ? (
          // Empty state — API answered but returned no tokens
          <div>
            <div className="text-5xl mb-4" aria-hidden="true">🐸</div>
            <p className="text-lg text-white mb-2">no memes?</p>
            <p className="text-sm text-gray-300">
              The market data feed returned an empty list. This is usually
              temporary — try reloading.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-neon-cyan/20 border border-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors text-neon-cyan"
            >
              Reload
            </button>
          </div>
        ) : (
          // Loading state
          <div>
            {/* Animated loader */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-t-neon-magenta rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            {/* aria-live region already announces politely; captions rotate for fun */}
            <p className="text-gray-300 animate-pulse">
              {LOADING_CAPTIONS[captionIndex]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
