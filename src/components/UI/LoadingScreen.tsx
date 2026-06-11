import { useGalleryStore } from '../../stores/galleryStore';

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
          // Error state
          <div>
            <svg
              className="w-16 h-16 mx-auto mb-4 text-dump-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-lg text-white mb-2">Couldn't load token data</p>
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
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-lg text-white mb-2">No tokens found</p>
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

            <p className="text-gray-300 animate-pulse">
              Loading meme tokens from CoinGecko…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
