import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Scene } from './components/Scene/Scene';
import { HUD } from './components/UI/HUD';
import { useGalleryStore, saveCharacterPosition } from './stores/galleryStore';
import { useTokenDeepLink } from './hooks/useTokenDeepLink';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

function App() {
  // #/token/<id> deep links ↔ selected token
  useTokenDeepLink();

  // Save the character position when the page is hidden/closed, so the next
  // visit resumes where the user left off (written here once instead of
  // persisting through zustand, which would hit localStorage every frame).
  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === 'hidden') saveCharacterPosition();
    };
    window.addEventListener('pagehide', saveCharacterPosition);
    document.addEventListener('visibilitychange', handleHide);

    // Apply a persisted manual performance mode immediately on startup
    const { performanceMode, setPerformanceMode } = useGalleryStore.getState();
    setPerformanceMode(performanceMode);

    return () => {
      window.removeEventListener('pagehide', saveCharacterPosition);
      document.removeEventListener('visibilitychange', handleHide);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative w-screen h-screen overflow-hidden">
        {/* 3D Scene */}
        <Scene />

        {/* UI Overlay */}
        <HUD />
      </div>
    </QueryClientProvider>
  );
}

export default App;
