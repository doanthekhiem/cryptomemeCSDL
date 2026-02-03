// Spiral configuration
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

// Camera configuration
export const CAMERA_CONFIG = {
  offset: [0, 4, 10] as const,
  lookAtOffset: [0, 1, 0] as const,
  smoothing: 0.08,
  fov: 60,
  near: 0.1,
  far: 500,
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
