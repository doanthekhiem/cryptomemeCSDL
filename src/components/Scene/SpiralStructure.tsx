import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../utils/constants';
import {
  createSpiralRampGeometry,
  createInnerWallGeometry,
  createOuterWallGeometry,
} from '../../utils/spiralGenerator';

export const SpiralStructure = () => {
  // Memoize geometries to avoid recreating on every render
  const rampGeometry = useMemo(() => createSpiralRampGeometry(), []);
  const innerWallGeometry = useMemo(() => createInnerWallGeometry(), []);
  const outerWallGeometry = useMemo(() => createOuterWallGeometry(), []);

  // Materials - brighter with emissive glow
  const rampMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a3a5a',
        metalness: 0.4,
        roughness: 0.5,
        side: THREE.DoubleSide,
        emissive: COLORS.neonCyan,
        emissiveIntensity: 0.03,
      }),
    []
  );

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e2d4a',
        metalness: 0.3,
        roughness: 0.6,
        side: THREE.DoubleSide,
        emissive: COLORS.neonPurple,
        emissiveIntensity: 0.02,
      }),
    []
  );

  return (
    <group name="spiral-structure">
      {/* Ramp/Floor */}
      <mesh
        geometry={rampGeometry}
        material={rampMaterial}
        receiveShadow
        name="spiral-ramp"
      />

      {/* Inner Wall */}
      <mesh
        geometry={innerWallGeometry}
        material={wallMaterial}
        receiveShadow
        name="inner-wall"
      />

      {/* Outer Wall */}
      <mesh
        geometry={outerWallGeometry}
        material={wallMaterial}
        receiveShadow
        name="outer-wall"
      />

      {/* Neon edge strips on ramp */}
      <NeonEdges />

      {/* Center column (decorative) */}
      <CenterColumn />
    </group>
  );
};

// Neon edge strips along the spiral
const NeonEdges = () => {
  const neonMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: COLORS.neonCyan,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  // Create neon strips at different heights along the spiral
  const neonStrips = useMemo(() => {
    const strips = [];
    const segments = 72;
    const turns = 6;

    for (let turn = 0; turn < turns; turn++) {
      for (let seg = 0; seg < segments; seg++) {
        const angle = ((turn * segments + seg) / segments) * Math.PI * 2;
        const height = ((turn * segments + seg) / segments) * 4;
        const innerX = Math.cos(angle) * 8.5;
        const innerZ = Math.sin(angle) * 8.5;

        strips.push({
          position: [innerX, height + 0.1, innerZ] as [number, number, number],
          rotation: [0, -angle, 0] as [number, number, number],
        });
      }
    }
    return strips;
  }, []);

  return (
    <group name="neon-edges">
      {neonStrips.filter((_, i) => i % 6 === 0).map((strip, i) => (
        <mesh
          key={`neon-${i}`}
          position={strip.position}
          rotation={strip.rotation}
          material={neonMaterial}
        >
          <boxGeometry args={[0.1, 0.05, 1]} />
        </mesh>
      ))}
    </group>
  );
};

// Decorative center column with glow
const CenterColumn = () => {
  return (
    <group name="center-column">
      {/* Main column */}
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[2, 2, 30, 32]} />
        <meshStandardMaterial
          color="#1a2a4a"
          metalness={0.6}
          roughness={0.4}
          emissive={COLORS.neonCyan}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Glowing rings on column */}
      {[0, 6, 12, 18, 24].map((y) => (
        <mesh key={`ring-${y}`} position={[0, y, 0]}>
          <torusGeometry args={[2.2, 0.1, 8, 32]} />
          <meshBasicMaterial color={COLORS.neonCyan} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};
