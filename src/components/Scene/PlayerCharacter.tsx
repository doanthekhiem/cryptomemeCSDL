import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { CHARACTER_CONFIG, COLORS } from '../../utils/constants';
import { Spring, oscillation } from '../../utils/animation';

export const PlayerCharacter = () => {
  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const isMoving = useGalleryStore((s) => s.isMoving);

  const particlesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const time = useRef(0);

  // Springs for smooth animations
  const breathingSpring = useRef(new Spring(50, 8, 1));
  const movementSpring = useRef(new Spring(100, 12, 0));

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

  // Animate particles with improved procedural animation
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    time.current += dt;

    // Update springs
    breathingSpring.current.target = isMoving ? 1.05 : 1.0;
    const breathScale = breathingSpring.current.update(dt);

    movementSpring.current.target = isMoving ? 1 : 0;
    const movementIntensity = movementSpring.current.update(dt);

    if (particlesRef.current) {
      const positionAttr = particlesRef.current.geometry.attributes.position;
      const colorAttr = particlesRef.current.geometry.attributes.color;
      const posArray = positionAttr.array as Float32Array;
      const colorArray = colorAttr.array as Float32Array;

      // Breathing effect
      const breathing = oscillation.breathing(time.current, 0.8, 0.98, 1.02);

      for (let i = 0; i < CHARACTER_CONFIG.particleCount; i++) {
        const baseX = positions[i * 3];
        const baseY = positions[i * 3 + 1];
        const baseZ = positions[i * 3 + 2];

        // Different noise patterns for organic movement
        const phase = i * 0.1;
        const idleNoise = oscillation.sine(time.current, 0.5, 0.008, phase);
        const moveNoise = oscillation.sine(time.current, 3, 0.025, phase);

        // Combine idle and movement noise based on spring
        const noiseX = idleNoise + moveNoise * movementIntensity;
        const noiseY = oscillation.cosine(time.current, 0.7, 0.006, phase * 1.3)
          + oscillation.bounce(time.current, 2, 0.015) * movementIntensity;
        const noiseZ = oscillation.sine(time.current, 0.6, 0.008, phase * 0.7)
          + moveNoise * movementIntensity * 0.5;

        // Apply breathing and movement scale
        posArray[i * 3] = (baseX + noiseX) * breathing * breathScale;
        posArray[i * 3 + 1] = (baseY + noiseY) * breathing;
        posArray[i * 3 + 2] = (baseZ + noiseZ) * breathing * breathScale;

        // Pulse colors when moving
        const colorPulse = isMoving
          ? oscillation.pulse(time.current, 2, 2) * 0.3
          : 0;

        colorArray[i * 3] = Math.min(1, colors[i * 3] + colorPulse * 0.2);
        colorArray[i * 3 + 1] = Math.min(1, colors[i * 3 + 1] + colorPulse * 0.5);
        colorArray[i * 3 + 2] = Math.min(1, colors[i * 3 + 2] + colorPulse * 0.3);
      }

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }

    // Animate light intensity
    if (lightRef.current) {
      const lightPulse = oscillation.breathing(time.current, 1.2, 0.4, 0.8);
      lightRef.current.intensity = lightPulse + movementIntensity * 0.3;
    }
  });

  return (
    <group
      position={[characterPosition.x, characterPosition.y, characterPosition.z]}
      rotation={[characterRotation.x, characterRotation.y, characterRotation.z]}
    >
      {/* Particle character */}
      <points ref={particlesRef}>
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

      {/* Glow effect */}
      <pointLight
        ref={lightRef}
        position={[0, 1, 0]}
        intensity={0.5}
        color={COLORS.neonCyan}
        distance={4}
      />

      {/* Secondary glow for movement */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={0.3}
        color={COLORS.neonMagenta}
        distance={2}
      />
    </group>
  );
};
