// Spiral configuration
// NOTE: wallHeight === heightPerTurn is load-bearing for the museum look —
// each turn's wall top meets the next turn's floor exactly, so the corridor
// is sealed with zero gaps and zero duplicated surfaces. Raising the walls
// above heightPerTurn would make them z-fight the next turn's wall.
export const SPIRAL_CONFIG = {
  innerRadius: 8,
  outerRadius: 20,
  rampWidth: 5,
  heightPerTurn: 4,
  totalTurns: 6,
  segments: 72, // segments per turn
  wallHeight: 4,
  tokensPerTurn: 12, // 6 inner + 6 outer
} as const;

// Museum enclosure (Phase 7): roof over the top turn, windows aimed at the
// Moon, a skylight at the summit, indoor fog as the safety net for seams
export const MUSEUM_CONFIG = {
  // Outer-wall windows (glass between sill and top, relative to local ramp)
  windowArc: 0.36, // ~20.6° opening
  windowSill: 1.1,
  windowTop: 3.4,
  moonWindowAngle: Math.atan2(-70, 90) + Math.PI * 2, // ≈5.62 rad — faces the Moon, one per turn
  earthWindowAngle: Math.atan2(60, -65), // ≈2.40 rad — faces Earth, turn 0 only
  // Skylight cut into the roof right before the summit
  skylightArc: 0.5,
  skylightInnerRadius: 10,
  skylightOuterRadius: 18,
  // Indoor atmosphere
  fogColor: '#141a30',
  fogNear: 18,
  fogFar: 60,
} as const;

// Character configuration - optimized for performance
export const CHARACTER_CONFIG = {
  particleCount: 500, // Reduced from 2000
  particleSize: 0.05, // Larger particles to compensate
  moveSpeed: 8, // Faster movement
  rotationSpeed: 4, // Faster rotation
  height: 1.5,
  bodyColor: '#00fff5',
  glowColor: '#ff00ff',
} as const;

// Camera configuration — a museum visitor's eye: low, close, looking at
// the art (frame centers hang at ramp+2.1), never above the walls
export const CAMERA_CONFIG = {
  offset: [0, 2.0, 5.0] as const,
  lookAtOffset: [0, 1.7, 0] as const,
  smoothing: 0.08,
  fov: 60,
  near: 0.1,
  far: 500,
  maxZoom: 1.3,
  // Hard constraints keeping the camera inside the gallery corridor
  wallMargin: 0.6, // min distance from either wall
  minAboveCharacter: -0.2,
  maxAboveCharacter: 2.0, // stays below the wall top at any ramp point
} as const;

// Color palette
export const COLORS = {
  // Background
  bgPrimary: '#0a0a0f',
  bgSecondary: '#1a1a2e',
  bgTertiary: '#16213e',

  // Neon accents
  neonCyan: '#00fff5',
  neonMagenta: '#ff00ff',
  neonPurple: '#bf00ff',
  neonGold: '#ffd700',

  // Status
  pumpGreen: '#00ff88',
  dumpRed: '#ff4757',

  // Neutral
  white: '#ffffff',
  gray: '#a0a0a0',
  darkGray: '#2a2a3e',
} as const;

// API configuration
export const API_CONFIG = {
  baseUrl: 'https://api.coingecko.com/api/v3',
  refetchInterval: 60000, // 1 minute
  staleTime: 30000, // 30 seconds
} as const;
