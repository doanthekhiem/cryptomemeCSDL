import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Scene } from './components/Scene/Scene';
import { HUD } from './components/UI/HUD';

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
