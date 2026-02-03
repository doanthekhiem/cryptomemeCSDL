import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { CHARACTER_CONFIG, COLORS } from '../../utils/constants';

export const PlayerCharacter = () => {
  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const isMoving = useGalleryStore((s) => s.isMoving);

  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  // Generate particle positions for fuzzy character
  const { positions, colors } = useMemo(() => {
    const count = CHARACTER_CONFIG.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const bodyColor = new THREE.Color(COLORS.neonCyan);
    const glowColor = new THREE.Color(COLORS.neonMagenta);

    for (let i = 0; i < count; i++) {
      // Create humanoid shape with particles
      const segment = Math.floor(i / (count / 4));
      let x, y, z;

      switch (segment) {
        case 0: // Head
          const headRadius = 0.25;
          const theta1 = Math.random() * Math.PI * 2;
          const phi1 = Math.acos(2 * Math.random() - 1);
          x = headRadius * Math.sin(phi1) * Math.cos(theta1);
          y = 1.5 + headRadius * Math.cos(phi1);
          z = headRadius * Math.sin(phi1) * Math.sin(theta1);
          break;
        case 1: // Body
          const bodyRadius = 0.3;
          const bodyHeight = Math.random() * 0.8;
          const theta2 = Math.random() * Math.PI * 2;
          x = bodyRadius * Math.cos(theta2) * (1 - bodyHeight * 0.3);
          y = 0.7 + bodyHeight;
          z = bodyRadius * Math.sin(theta2) * (1 - bodyHeight * 0.3);
          break;
        case 2: // Left arm/leg
          x = -0.3 + (Math.random() - 0.5) * 0.15;
          y = Math.random() * 1.2;
          z = (Math.random() - 0.5) * 0.15;
          break;
        case 3: // Right arm/leg
          x = 0.3 + (Math.random() - 0.5) * 0.15;
          y = Math.random() * 1.2;
          z = (Math.random() - 0.5) * 0.15;
          break;
        default:
          x = (Math.random() - 0.5) * 0.5;
          y = Math.random() * 1.8;
          z = (Math.random() - 0.5) * 0.5;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Mix colors
      const mixRatio = Math.random();
      const color = bodyColor.clone().lerp(glowColor, mixRatio * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  // Simple optimized animation - just scale the whole group
  useFrame((_, delta) => {
    time.current += delta;

    if (groupRef.current) {
      // Simple breathing effect on the whole group
      const breathe = 1 + Math.sin(time.current * 2) * 0.02;
      const moveScale = isMoving ? 1.05 : 1;
      groupRef.current.scale.setScalar(breathe * moveScale);
    }
  });

  return (
    <group
      position={[characterPosition.x, characterPosition.y, characterPosition.z]}
      rotation={[characterRotation.x, characterRotation.y, characterRotation.z]}
    >
      <group ref={groupRef}>
        {/* Particle character */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={CHARACTER_CONFIG.particleCount}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={CHARACTER_CONFIG.particleCount}
              array={colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={CHARACTER_CONFIG.particleSize}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Single glow light */}
        <pointLight
          position={[0, 1, 0]}
          intensity={0.6}
          color={COLORS.neonCyan}
          distance={5}
        />
      </group>
    </group>
  );
};
