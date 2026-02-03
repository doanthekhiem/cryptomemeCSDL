import { useGalleryStore } from '../../stores/galleryStore';

export const LoadingScreen = () => {
  const isLoading = useGalleryStore((s) => s.isLoading);
  const error = useGalleryStore((s) => s.error);

  if (!isLoading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-bg">
      <div className="text-center">
        {/* Logo/Title */}
        <h1 className="text-4xl font-bold mb-8">
          <span className="text-neon-cyan">SPIRAL</span>{' '}
          <span className="text-neon-magenta">MEME</span>{' '}
          <span className="text-white">GALLERY</span>
        </h1>

        {error ? (
          // Error state
          <div className="text-dump-red">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-lg mb-2">Failed to load</p>
            <p className="text-sm text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-neon-cyan/20 border border-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors text-neon-cyan"
            >
              Retry
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

            <p className="text-gray-400 animate-pulse">
              Loading meme tokens...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
