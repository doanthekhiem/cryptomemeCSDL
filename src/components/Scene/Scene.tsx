import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import { SpiralStructure } from './SpiralStructure';
import { MoonAndSky } from './MoonAndSky';
import { DataColumn } from './DataColumn';
import { TokenGallery } from './TokenGallery';
import { PlayerCharacter } from './PlayerCharacter';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { SceneLighting } from './SceneLighting';
import { TeleportEffect, AmbientEmoji } from './MovementEffects';
import { PerformanceMonitor } from './PerformanceMonitor';
import { KeyboardController } from '../../hooks/useKeyboardControls';
import { useGalleryStore } from '../../stores/galleryStore';
import { useMemeTokens } from '../../hooks/useMemeTokens';
import { COLORS, CAMERA_CONFIG, MUSEUM_CONFIG } from '../../utils/constants';

// Loading fallback component
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color={COLORS.neonCyan} wireframe />
  </mesh>
);

// Main 3D scene content
const SceneContent = () => {
  const tokenPositions = useGalleryStore((s) => s.tokenPositions);
  const quality = useGalleryStore((s) => s.effectiveQuality);

  return (
    <>
      {/* Camera */}
      <ThirdPersonCamera />

      {/* Environment — the climb from Earth to the Moon */}
      <MoonAndSky />
      <SpiralStructure />
      <DataColumn />
      <Stars
        radius={100}
        depth={50}
        count={quality === 'low' ? 1200 : 3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Lighting */}
      <SceneLighting />

      {/* Token displays */}
      <TokenGallery tokenPositions={tokenPositions} />

      {/* Character */}
      <PlayerCharacter />

      {/* Movement / teleport effects + ambient meme particles */}
      <TeleportEffect />
      <AmbientEmoji />

      {/* Controls */}
      <KeyboardController />

      {/* FPS watcher — drives effectiveQuality in auto mode */}
      <PerformanceMonitor />

      {/* Post Processing - enhanced glow. Skipped entirely in low quality:
          fullscreen bloom passes are the single biggest GPU cost */}
      {quality === 'high' && (
        <EffectComposer>
          {/* Threshold above mid-grays: only true neons bloom. At 0.1 every
              lit wall hazed over and the whole scene went soft */}
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.6}
            intensity={0.7}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.2} />
        </EffectComposer>
      )}
    </>
  );
};

// Main Scene component
export const Scene = () => {
  const setTokens = useGalleryStore((s) => s.setTokens);
  const setError = useGalleryStore((s) => s.setError);
  const setLoading = useGalleryStore((s) => s.setLoading);
  const quality = useGalleryStore((s) => s.effectiveQuality);

  // Fetch meme tokens
  const { data: tokens, isLoading, error } = useMemeTokens();

  // Update store when data changes
  useEffect(() => {
    if (tokens && tokens.length > 0) {
      setTokens(tokens);
    }
  }, [tokens, setTokens]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (error) {
      setError(error.message);
    }
  }, [error, setError]);

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={quality === 'low' ? 1 : [1, 2]}
      camera={{
        fov: CAMERA_CONFIG.fov,
        near: CAMERA_CONFIG.near,
        far: CAMERA_CONFIG.far,
        position: [0, 30, 30],
      }}
      style={{ background: COLORS.bgPrimary }}
    >
      {/* Indoor fog: distant bends of the corridor fade out like a real
          gallery hallway — and it hides any tiny geometry seam */}
      <color attach="background" args={[MUSEUM_CONFIG.fogColor]} />
      <fog
        attach="fog"
        args={[MUSEUM_CONFIG.fogColor, MUSEUM_CONFIG.fogNear, MUSEUM_CONFIG.fogFar]}
      />

      <Suspense fallback={<LoadingFallback />}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
};
