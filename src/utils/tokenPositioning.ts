import * as THREE from 'three';
import { MemeToken, TokenPosition } from '../types';
import { SPIRAL_CONFIG } from './constants';

// Frame centers hang this far above the local ramp height
export const FRAME_HANG_HEIGHT = 2.1;

// Calculate 3D positions for all tokens on the spiral walls
export const calculateTokenPositions = (tokens: MemeToken[]): TokenPosition[] => {
  const { innerRadius, outerRadius, heightPerTurn, tokensPerTurn } =
    SPIRAL_CONFIG;

  const placements: TokenPosition[] = [];
  const tokensPerWall = tokensPerTurn / 2; // per wall per turn (9 at 18/turn)
  const frameHeight = FRAME_HANG_HEIGHT;

  tokens.forEach((token, index) => {
    const turnIndex = Math.floor(index / tokensPerTurn);
    const positionInTurn = index % tokensPerTurn;
    const isInnerWall = positionInTurn < tokensPerWall;
    const wallPosition = positionInTurn % tokensPerWall;

    // Museum rhythm: outer wall staggered half a step (+30°) from the inner
    // wall, so walking one turn meets frames alternating left/right every
    // ~30° instead of facing pairs
    const stagger = isInnerWall ? 0 : Math.PI / tokensPerWall;
    const angleOffset =
      ((wallPosition + 0.5) / tokensPerWall) * Math.PI * 2 + stagger;
    const baseAngle = turnIndex * Math.PI * 2 + angleOffset;

    // Height follows the ramp at the exact hanging angle, so every frame
    // sits the same distance above the sloped floor
    const height = (baseAngle / (Math.PI * 2)) * heightPerTurn + frameHeight;

    // Radius with offset from wall
    const wallOffset = 0.3;
    const radius = isInnerWall
      ? innerRadius + wallOffset
      : outerRadius - wallOffset;

    // Position
    const position: [number, number, number] = [
      Math.cos(baseAngle) * radius,
      height,
      Math.sin(baseAngle) * radius,
    ];

    // Rotation - face towards the walkway. Ry(θ) maps the plane normal +z
    // to (sinθ, 0, cosθ), so facing the center (−r̂) needs θ = −(a + π/2)
    // and facing outward (+r̂) needs θ = π/2 − a. The old `baseAngle`-based
    // values only faced the walkway at a few lucky angles — elsewhere the
    // frames turned sideways or showed their backs to the corridor.
    const rotationY = isInnerWall
      ? Math.PI / 2 - baseAngle
      : -(baseAngle + Math.PI / 2);
    const rotation: [number, number, number] = [0, rotationY, 0];

    placements.push({
      token,
      position,
      rotation,
      spiralIndex: index,
      wall: isInnerWall ? 'inner' : 'outer',
    });
  });

  return placements;
};

// Find the nearest token to a given position
export const findNearestToken = (
  position: THREE.Vector3,
  tokenPositions: TokenPosition[],
  maxDistance: number = 4
): TokenPosition | null => {
  let nearest: TokenPosition | null = null;
  let minDistance = maxDistance;

  for (const tp of tokenPositions) {
    const tokenPos = new THREE.Vector3(...tp.position);
    const distance = position.distanceTo(tokenPos);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = tp;
    }
  }

  return nearest;
};

// Get tokens visible from a position (within view distance)
export const getVisibleTokens = (
  position: THREE.Vector3,
  tokenPositions: TokenPosition[],
  viewDistance: number = 30
): TokenPosition[] => {
  return tokenPositions.filter((tp) => {
    const tokenPos = new THREE.Vector3(...tp.position);
    return position.distanceTo(tokenPos) <= viewDistance;
  });
};

// Calculate viewing position for a token (where to stand to view it)
export const getTokenViewingPosition = (
  tokenPosition: TokenPosition
): THREE.Vector3 => {
  const pos = new THREE.Vector3(...tokenPosition.position);
  const viewDistance = 3;

  // Calculate offset based on rotation (face the token)
  // Stand viewDistance in front of the frame, along its +z normal
  // (Ry(rotY) maps +z to (sin rotY, 0, cos rotY))
  const rotY = tokenPosition.rotation[1];
  const offsetX = Math.sin(rotY) * viewDistance;
  const offsetZ = Math.cos(rotY) * viewDistance;

  // Feet on the ramp: the frame hangs FRAME_HANG_HEIGHT above it
  return new THREE.Vector3(
    pos.x + offsetX,
    pos.y - FRAME_HANG_HEIGHT,
    pos.z + offsetZ
  );
};
