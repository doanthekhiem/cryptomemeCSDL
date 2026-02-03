import * as THREE from 'three';
import { SPIRAL_CONFIG } from './constants';

export interface SpiralPoint {
  position: THREE.Vector3;
  angle: number;
  height: number;
  normal: THREE.Vector3;
  tangent: THREE.Vector3;
}

// Generate points along the spiral center path
export const generateSpiralPath = (): SpiralPoint[] => {
  const { innerRadius, outerRadius, heightPerTurn, totalTurns, segments } = SPIRAL_CONFIG;
  const points: SpiralPoint[] = [];
  const totalSegments = segments * totalTurns;
  const centerRadius = (innerRadius + outerRadius) / 2;

  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * totalTurns * Math.PI * 2;
    const height = t * totalTurns * heightPerTurn;

    const x = Math.cos(angle) * centerRadius;
    const z = Math.sin(angle) * centerRadius;

    const position = new THREE.Vector3(x, height, z);

    // Normal pointing outward from center
    const normal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();

    // Tangent along the spiral path
    const tangent = new THREE.Vector3(
      -Math.sin(angle),
      heightPerTurn / (Math.PI * 2 * centerRadius),
      Math.cos(angle)
    ).normalize();

    points.push({ position, angle, height, normal, tangent });
  }

  return points;
};

// Create ramp geometry for the spiral
export const createSpiralRampGeometry = (): THREE.BufferGeometry => {
  const { innerRadius, outerRadius, heightPerTurn, totalTurns, segments } = SPIRAL_CONFIG;
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const totalSegments = segments * totalTurns;

  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * totalTurns * Math.PI * 2;
    const height = t * totalTurns * heightPerTurn;

    // Inner edge
    const innerX = Math.cos(angle) * innerRadius;
    const innerZ = Math.sin(angle) * innerRadius;
    vertices.push(innerX, height, innerZ);

    // Outer edge
    const outerX = Math.cos(angle) * outerRadius;
    const outerZ = Math.sin(angle) * outerRadius;
    vertices.push(outerX, height, outerZ);

    // UVs
    uvs.push(0, t * totalTurns);
    uvs.push(1, t * totalTurns);

    // Normals (pointing up)
    normals.push(0, 1, 0);
    normals.push(0, 1, 0);

    // Indices for triangles
    if (i < totalSegments) {
      const base = i * 2;
      // First triangle
      indices.push(base, base + 2, base + 1);
      // Second triangle
      indices.push(base + 1, base + 2, base + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

// Create inner wall geometry
export const createInnerWallGeometry = (): THREE.BufferGeometry => {
  const { innerRadius, heightPerTurn, totalTurns, segments, wallHeight } = SPIRAL_CONFIG;
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const totalSegments = segments * totalTurns;

  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * totalTurns * Math.PI * 2;
    const baseHeight = t * totalTurns * heightPerTurn;

    const x = Math.cos(angle) * innerRadius;
    const z = Math.sin(angle) * innerRadius;

    // Bottom vertex
    vertices.push(x, baseHeight, z);
    // Top vertex
    vertices.push(x, baseHeight + wallHeight, z);

    uvs.push(t * totalTurns, 0);
    uvs.push(t * totalTurns, 1);

    if (i < totalSegments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

// Create outer wall geometry
export const createOuterWallGeometry = (): THREE.BufferGeometry => {
  const { outerRadius, heightPerTurn, totalTurns, segments, wallHeight } = SPIRAL_CONFIG;
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const totalSegments = segments * totalTurns;

  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * totalTurns * Math.PI * 2;
    const baseHeight = t * totalTurns * heightPerTurn;

    const x = Math.cos(angle) * outerRadius;
    const z = Math.sin(angle) * outerRadius;

    // Bottom vertex
    vertices.push(x, baseHeight, z);
    // Top vertex
    vertices.push(x, baseHeight + wallHeight, z);

    uvs.push(t * totalTurns, 0);
    uvs.push(t * totalTurns, 1);

    if (i < totalSegments) {
      const base = i * 2;
      // Reversed winding for inward-facing normals
      indices.push(base, base + 2, base + 1);
      indices.push(base + 1, base + 2, base + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

// Constrain a position to be on the spiral ramp
export const constrainToSpiral = (position: THREE.Vector3): THREE.Vector3 => {
  const { innerRadius, outerRadius, heightPerTurn, totalTurns } = SPIRAL_CONFIG;
  const totalHeight = totalTurns * heightPerTurn;

  // Convert to cylindrical coordinates
  const angle = Math.atan2(position.z, position.x);
  const currentRadius = Math.sqrt(position.x ** 2 + position.z ** 2);

  // Clamp radius to ramp bounds
  const clampedRadius = Math.max(
    innerRadius + 0.5,
    Math.min(outerRadius - 0.5, currentRadius)
  );

  // Clamp height to spiral bounds
  const clampedHeight = Math.max(0, Math.min(totalHeight, position.y));

  return new THREE.Vector3(
    Math.cos(angle) * clampedRadius,
    clampedHeight,
    Math.sin(angle) * clampedRadius
  );
};

// Get the height of the spiral at a given x, z position
export const getSpiralHeightAt = (x: number, z: number): number => {
  const { heightPerTurn } = SPIRAL_CONFIG;

  const angle = Math.atan2(z, x);
  const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

  // This is simplified - assumes we're on the first turn
  // For multiple turns, would need to track which turn the character is on
  const heightInTurn = (normalizedAngle / (Math.PI * 2)) * heightPerTurn;

  return heightInTurn;
};
