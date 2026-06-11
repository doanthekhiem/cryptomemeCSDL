import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, MUSEUM_CONFIG, SPIRAL_CONFIG } from '../../utils/constants';
import { getEmojiTexture } from '../../utils/proceduralTextures';
import { useGalleryStore } from '../../stores/galleryStore';

// Walkway furniture filling the dead stretches between exhibits: museum
// benches along the inner wall and one neon "TO THE MOON" sign per turn.
// Everything static is instanced; skipped entirely on low quality, same
// policy as the candlestick décor.

const BENCH_RADIUS = SPIRAL_CONFIG.innerRadius + 1.3;
// Inner frames sit on a 2π/9 grid at half-step offsets; benches take the
// whole steps in between. Slot 0 is skipped — it lands next to the end caps.
const BENCH_STEP = (Math.PI * 2) / 9;
const BENCHES_PER_TURN = 8;

// Ry(-(a + π/2)) puts the local x axis along the spiral tangent and +z
// toward the center — long side of the bench follows the corridor, and a
// Text plane with the same rotation faces the walkway.
const tangentRotationY = (angle: number) => -(angle + Math.PI / 2);

const buildBenchMatrices = () => {
  const { heightPerTurn, totalTurns } = SPIRAL_CONFIG;
  const seats: THREE.Matrix4[] = [];
  const bases: THREE.Matrix4[] = [];

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const unit = new THREE.Vector3(1, 1, 1);

  for (let turn = 0; turn < totalTurns; turn++) {
    for (let k = 1; k <= BENCHES_PER_TURN; k++) {
      const angle = turn * Math.PI * 2 + k * BENCH_STEP;
      const ramp = (angle / (Math.PI * 2)) * heightPerTurn;
      const position = new THREE.Vector3(
        Math.cos(angle) * BENCH_RADIUS,
        0,
        Math.sin(angle) * BENCH_RADIUS
      );
      quaternion.setFromAxisAngle(up, tangentRotationY(angle));

      position.y = ramp + 0.39;
      matrix.compose(position, quaternion, unit);
      seats.push(matrix.clone());

      position.y = ramp + 0.16;
      matrix.compose(position, quaternion, unit);
      bases.push(matrix.clone());
    }
  }

  return { seats, bases };
};

const makeInstanced = (
  matrices: THREE.Matrix4[],
  geometry: THREE.BufferGeometry,
  material: THREE.Material
) => {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
};

// One sign per turn on the outer wall, opposite the Moon window — looking
// away from the Moon still tells you where the climb is headed
const buildSignPlacements = () => {
  const { heightPerTurn, totalTurns, outerRadius } = SPIRAL_CONFIG;
  const signAngleInTurn = (MUSEUM_CONFIG.moonWindowAngle + Math.PI) % (Math.PI * 2);
  const radius = outerRadius - 0.4;

  return Array.from({ length: totalTurns }, (_, turn) => {
    const angle = turn * Math.PI * 2 + signAngleInTurn;
    const ramp = (angle / (Math.PI * 2)) * heightPerTurn;
    return {
      position: [
        Math.cos(angle) * radius,
        ramp + 3.45,
        Math.sin(angle) * radius,
      ] as [number, number, number],
      rotationY: tangentRotationY(angle),
    };
  });
};

export const CorridorProps = () => {
  const quality = useGalleryStore((s) => s.effectiveQuality);

  const benches = useMemo(() => {
    if (quality === 'low') return null;

    const { seats, bases } = buildBenchMatrices();
    const seatGeometry = new THREE.BoxGeometry(1.5, 0.07, 0.5);
    const baseGeometry = new THREE.BoxGeometry(1.3, 0.32, 0.42);

    const seatMaterial = new THREE.MeshStandardMaterial({
      color: '#2a3558',
      metalness: 0.7,
      roughness: 0.3,
    });
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#0d1326',
      metalness: 0.6,
      roughness: 0.4,
      emissive: COLORS.neonCyan,
      emissiveIntensity: 0.04,
    });

    return [
      makeInstanced(seats, seatGeometry, seatMaterial),
      makeInstanced(bases, baseGeometry, baseMaterial),
    ];
  }, [quality]);

  const signs = useMemo(() => (quality === 'low' ? [] : buildSignPlacements()), [quality]);

  return (
    <group name="corridor-props">
      {benches?.map((mesh, i) => (
        <primitive key={`bench-${i}`} object={mesh} />
      ))}

      {signs.map((s, i) => (
        <group key={`sign-${i}`} position={s.position} rotation={[0, s.rotationY, 0]}>
          <Text
            fontSize={0.34}
            color={COLORS.neonGold}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#3a2c00"
          >
            TO THE MOON ↗
          </Text>
          <sprite position={[-1.7, 0, 0.1]} scale={[0.45, 0.45, 1]}>
            <spriteMaterial map={getEmojiTexture('🚀')} transparent depthWrite={false} />
          </sprite>
        </group>
      ))}
    </group>
  );
};
