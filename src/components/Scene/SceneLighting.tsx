import { COLORS, SPIRAL_CONFIG } from '../../utils/constants';

export const SceneLighting = () => {
  const topHeight = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn + 10;

  return (
    <>
      {/* Strong ambient for base visibility */}
      <ambientLight intensity={1.2} color="#ffffff" />

      {/* Hemisphere light - cheap and effective */}
      <hemisphereLight
        intensity={0.8}
        color="#ffffff"
        groundColor="#1a1a3e"
      />

      {/* Single directional light - main light source */}
      <directionalLight
        position={[10, topHeight, 10]}
        intensity={1.5}
        color="#ffffff"
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
