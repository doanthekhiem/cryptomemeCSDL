import * as THREE from 'three';
import { MUSEUM_CONFIG, SPIRAL_CONFIG } from './constants';

const TWO_PI = Math.PI * 2;

// Angular ranges (absolute spiral angle, 0 → totalTurns·2π and beyond for
// the roof) where geometry is opened up for windows / the skylight.
export interface SpiralOpening {
  start: number;
  end: number;
}

// Window openings on the outer wall, snapped to the segment grid so the
// hole in the wall geometry lines up exactly with the glass/frame meshes.
export const getWindowOpenings = (): SpiralOpening[] => {
  const { totalTurns, segments } = SPIRAL_CONFIG;
  const segAngle = TWO_PI / segments;
  const snap = (a: number) => Math.round(a / segAngle) * segAngle;
  const half = MUSEUM_CONFIG.windowArc / 2;

  const openings: SpiralOpening[] = [];
  // One Moon-facing window per turn — the climb keeps the destination in view
  for (let turn = 0; turn < totalTurns; turn++) {
    const center = turn * TWO_PI + MUSEUM_CONFIG.moonWindowAngle;
    openings.push({ start: snap(center - half), end: snap(center + half) });
  }
  // Earth window on the lowest turn only — where the journey started
  openings.push({
    start: snap(MUSEUM_CONFIG.earthWindowAngle - half),
    end: snap(MUSEUM_CONFIG.earthWindowAngle + half),
  });
  return openings;
};

// The roof is the floor helix extended one extra turn above the spiral;
// the skylight is cut out of its last stretch, right above the summit.
export const getRoofRange = (): SpiralOpening => {
  const start = SPIRAL_CONFIG.totalTurns * TWO_PI;
  return { start, end: start + TWO_PI };
};

export const getSkylightOpening = (): SpiralOpening => {
  const roofEnd = getRoofRange().end;
  return { start: roofEnd - MUSEUM_CONFIG.skylightArc, end: roofEnd };
};

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

// Create a thin strip following the spiral floor between two radii.
// Used for the glowing "rainbow road" bands along the ramp edges.
// UV.y runs 0→1 over the whole spiral so a shader can color by progress.
export const createRampStripGeometry = (
  radiusStart: number,
  radiusEnd: number,
  yOffset = 0.03
): THREE.BufferGeometry => {
  const { heightPerTurn, totalTurns, segments } = SPIRAL_CONFIG;
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const totalSegments = segments * totalTurns;

  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * totalTurns * Math.PI * 2;
    const height = t * totalTurns * heightPerTurn + yOffset;

    vertices.push(
      Math.cos(angle) * radiusStart, height, Math.sin(angle) * radiusStart,
      Math.cos(angle) * radiusEnd, height, Math.sin(angle) * radiusEnd
    );
    uvs.push(0, t, 1, t);
    normals.push(0, 1, 0, 0, 1, 0);

    if (i < totalSegments) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1);
      indices.push(base + 1, base + 2, base + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

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

// Create outer wall geometry, with window openings cut out per segment.
// Inside a window arc the wall keeps a sill band (0→windowSill) and a
// lintel band (windowTop→wallHeight); the glass goes in between.
export const createOuterWallGeometry = (): THREE.BufferGeometry => {
  const { outerRadius, heightPerTurn, totalTurns, segments, wallHeight } = SPIRAL_CONFIG;
  const openings = getWindowOpenings();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const totalSegments = segments * totalTurns;
  const segAngle = TWO_PI / segments;

  // One quad between two angles, y measured above the local ramp height
  const pushQuad = (a0: number, a1: number, yLo: number, yHi: number) => {
    const base = vertices.length / 3;
    for (const angle of [a0, a1]) {
      const ramp = (angle / TWO_PI) * heightPerTurn;
      const x = Math.cos(angle) * outerRadius;
      const z = Math.sin(angle) * outerRadius;
      vertices.push(x, ramp + yLo, z, x, ramp + yHi, z);
      uvs.push(angle / TWO_PI, yLo / wallHeight, angle / TWO_PI, yHi / wallHeight);
    }
    // Reversed winding for inward-facing normals
    indices.push(base, base + 2, base + 1);
    indices.push(base + 1, base + 2, base + 3);
  };

  for (let i = 0; i < totalSegments; i++) {
    const a0 = i * segAngle;
    const a1 = a0 + segAngle;
    const mid = a0 + segAngle / 2;
    const inWindow = openings.some((o) => mid > o.start && mid < o.end);

    if (inWindow) {
      pushQuad(a0, a1, 0, MUSEUM_CONFIG.windowSill);
      pushQuad(a0, a1, MUSEUM_CONFIG.windowTop, wallHeight);
    } else {
      pushQuad(a0, a1, 0, wallHeight);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

// Horizontal band between two radii following the ramp slope, over an
// arbitrary angle range. yOffset is measured above the local ramp height.
// Used for the roof pieces, skylight glass and the ceiling light strips.
export const createSpiralBandGeometry = (
  radiusStart: number,
  radiusEnd: number,
  yOffset: number,
  angleStart: number,
  angleEnd: number
): THREE.BufferGeometry => {
  const { heightPerTurn, segments } = SPIRAL_CONFIG;
  const segAngle = TWO_PI / segments;
  const count = Math.max(2, Math.ceil((angleEnd - angleStart) / segAngle));

  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = angleStart + t * (angleEnd - angleStart);
    const height = (angle / TWO_PI) * heightPerTurn + yOffset;

    vertices.push(
      Math.cos(angle) * radiusStart, height, Math.sin(angle) * radiusStart,
      Math.cos(angle) * radiusEnd, height, Math.sin(angle) * radiusEnd
    );
    uvs.push(0, t, 1, t);
    normals.push(0, 1, 0, 0, 1, 0);

    if (i < count) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1);
      indices.push(base + 1, base + 2, base + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
};

// Vertical curved band on a wall cylinder, following the ramp slope.
// yLo/yHi are measured above the local ramp height. Used for window glass
// and neon window frames (render with DoubleSide).
export const createWallBandGeometry = (
  radius: number,
  angleStart: number,
  angleEnd: number,
  yLo: number,
  yHi: number
): THREE.BufferGeometry => {
  const { heightPerTurn, segments } = SPIRAL_CONFIG;
  const segAngle = TWO_PI / segments;
  const count = Math.max(1, Math.ceil((angleEnd - angleStart) / segAngle));

  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = angleStart + t * (angleEnd - angleStart);
    const ramp = (angle / TWO_PI) * heightPerTurn;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    vertices.push(x, ramp + yLo, z, x, ramp + yHi, z);
    uvs.push(t, 0, t, 1);

    if (i < count) {
      const base = i * 2;
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
