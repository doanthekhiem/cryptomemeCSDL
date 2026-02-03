import * as THREE from 'three';
import { MemeToken, TokenPosition } from '../types';
import { SPIRAL_CONFIG } from './constants';

// Calculate 3D positions for all tokens on the spiral walls
export const calculateTokenPositions = (tokens: MemeToken[]): TokenPosition[] => {
  const { innerRadius, outerRadius, heightPerTurn, tokensPerTurn } =
    SPIRAL_CONFIG;

  const placements: TokenPosition[] = [];
  const tokensPerWall = tokensPerTurn / 2; // 6 per wall per turn
  const frameHeight = 2; // Height of token frame center above ramp

  tokens.forEach((token, index) => {
    const turnIndex = Math.floor(index / tokensPerTurn);
    const positionInTurn = index % tokensPerTurn;
    const isInnerWall = positionInTurn < tokensPerWall;
    const wallPosition = positionInTurn % tokensPerWall;

    // Calculate angle within the turn
    const angleOffset = ((wallPosition + 0.5) / tokensPerWall) * Math.PI * 2;
    const baseAngle = turnIndex * Math.PI * 2 + angleOffset;

    // Height based on turn
    const turnHeight = turnIndex * heightPerTurn;
    const heightInTurn = (wallPosition / tokensPerWall) * heightPerTurn;
    const height = turnHeight + heightInTurn + frameHeight;

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

    // Rotation - face towards the walkway
    // Inner wall faces outward, outer wall faces inward
    const rotationY = isInnerWall ? baseAngle + Math.PI : baseAngle;
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
  const rotY = tokenPosition.rotation[1];
  const offsetX = Math.sin(rotY) * viewDistance;
  const offsetZ = -Math.cos(rotY) * viewDistance;

  return new THREE.Vector3(pos.x + offsetX, pos.y - 0.5, pos.z + offsetZ);
};
