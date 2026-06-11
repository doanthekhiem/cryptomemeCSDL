import { COLORS, SPIRAL_CONFIG } from '../../utils/constants';

export const SceneLighting = () => {
  const topHeight = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn + 10;

  return (
    <>
      {/* Low cool ambient — just enough that nothing goes pitch black.
          Contrast comes from the directional + hemisphere pair below;
          a high flat ambient is what made every surface look like
          unlit cardboard. */}
      <ambientLight intensity={0.45} color="#bcc8f5" />

      {/* Warm sky / cool ground: gallery halogen bounce from above,
          deep blue floor bounce from below */}
      <hemisphereLight
        intensity={0.85}
        color="#ffe7c4"
        groundColor="#141b38"
      />

      {/* Main key light, slightly warm — gives the curved walls a smooth
          bright-to-dark sweep around each turn instead of one flat tone */}
      <directionalLight
        position={[10, topHeight, 10]}
        intensity={1.7}
        color="#fff1dd"
      />
      {/* Cool fill from the opposite side so the dark half of the cylinder
          stays readable instead of dropping to black */}
      <directionalLight
        position={[-12, topHeight * 0.4, -8]}
        intensity={0.5}
        color="#7e9bff"
      />

      {/* Two accent lights only */}
      <pointLight
        position={[0, topHeight / 2, 0]}
        intensity={2}
        color={COLORS.neonCyan}
        distance={80}
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={1}
        color={COLORS.neonMagenta}
        distance={40}
      />
    </>
  );
};
