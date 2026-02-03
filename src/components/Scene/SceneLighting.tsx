import { COLORS, SPIRAL_CONFIG } from '../../utils/constants';

export const SceneLighting = () => {
  const topHeight = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn + 10;
  const midHeight = topHeight / 2;

  return (
    <>
      {/* Ambient light - strong base illumination */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Hemisphere light for natural sky/ground gradient */}
      <hemisphereLight
        intensity={0.6}
        color="#ffffff"
        groundColor={COLORS.bgSecondary}
      />

      {/* Skylight from top center - very bright */}
      <pointLight
        position={[0, topHeight + 10, 0]}
        intensity={3}
        color="#ffffff"
        distance={150}
        decay={1.5}
      />

      {/* Multiple directional lights for even coverage */}
      <directionalLight
        position={[20, topHeight, 20]}
        intensity={1}
        color="#ffffff"
      />
      <directionalLight
        position={[-20, topHeight, -20]}
        intensity={0.8}
        color="#ffffff"
      />

      {/* Spiral interior lights - multiple levels */}
      {[0, 1, 2, 3, 4, 5].map((level) => {
        const y = level * SPIRAL_CONFIG.heightPerTurn + 2;
        const angle = (level * Math.PI) / 3;
        return (
          <pointLight
            key={`level-light-${level}`}
            position={[
              Math.cos(angle) * 14,
              y,
              Math.sin(angle) * 14,
            ]}
            intensity={1.5}
            color="#ffffff"
            distance={20}
            decay={1}
          />
        );
      })}

      {/* Neon accent lights - brighter */}
      <pointLight
        position={[SPIRAL_CONFIG.outerRadius + 3, midHeight, 0]}
        intensity={2}
        color={COLORS.neonCyan}
        distance={60}
      />
      <pointLight
        position={[-SPIRAL_CONFIG.outerRadius - 3, midHeight, 0]}
        intensity={2}
        color={COLORS.neonCyan}
        distance={60}
      />
      <pointLight
        position={[0, midHeight, SPIRAL_CONFIG.outerRadius + 3]}
        intensity={2}
        color={COLORS.neonMagenta}
        distance={60}
      />
      <pointLight
        position={[0, midHeight, -SPIRAL_CONFIG.outerRadius - 3]}
        intensity={2}
        color={COLORS.neonMagenta}
        distance={60}
      />

      {/* Bottom ambient light */}
      <pointLight
        position={[0, 2, 0]}
        intensity={1.5}
        color={COLORS.neonPurple}
        distance={40}
      />
    </>
  );
};
