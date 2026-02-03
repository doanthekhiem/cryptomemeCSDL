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

      {/* Simple center column */}
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[2, 2, 30, 16]} />
        <meshStandardMaterial
          color="#1a2a4a"
          emissive={COLORS.neonCyan}
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
};
