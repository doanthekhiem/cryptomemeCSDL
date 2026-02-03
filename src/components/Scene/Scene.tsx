import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import { SpiralStructure } from './SpiralStructure';
import { TokenGallery } from './TokenGallery';
import { PlayerCharacter } from './PlayerCharacter';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { SceneLighting } from './SceneLighting';
import { KeyboardController } from '../../hooks/useKeyboardControls';
import { useGalleryStore } from '../../stores/galleryStore';
import { useMemeTokens } from '../../hooks/useMemeTokens';
import { COLORS, CAMERA_CONFIG } from '../../utils/constants';

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

  return (
    <>
      {/* Camera */}
      <ThirdPersonCamera />

      {/* Environment */}
      <SpiralStructure />
      <Stars
        radius={100}
        depth={50}
        count={3000}
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

      {/* Controls */}
      <KeyboardController />

      {/* Post Processing - enhanced glow */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.1}
          luminanceSmoothing={0.8}
          intensity={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.2} />
      </EffectComposer>
    </>
  );
};

// Main Scene component
export const Scene = () => {
  const setTokens = useGalleryStore((s) => s.setTokens);
  const setError = useGalleryStore((s) => s.setError);
  const setLoading = useGalleryStore((s) => s.setLoading);

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
      dpr={[1, 2]}
      camera={{
        fov: CAMERA_CONFIG.fov,
        near: CAMERA_CONFIG.near,
        far: CAMERA_CONFIG.far,
        position: [0, 30, 30],
      }}
      style={{ background: COLORS.bgPrimary }}
    >
      <color attach="background" args={['#0d1020']} />
      <fog attach="fog" args={['#0d1020', 40, 150]} />

      <Suspense fallback={<LoadingFallback />}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
};
