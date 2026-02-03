# High-Level Design (HLD): Spiral Meme Token Gallery

## 1. System Architecture

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │  Zustand    │  │   React Three Fiber     │  │
│  │    App      │◄─┤   Store     │◄─┤   (Three.js Renderer)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │               ▲                      │                 │
│         ▼               │                      ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │     UI      │  │   TanStack  │  │    3D Scene Manager     │  │
│  │ Components  │  │    Query    │  │  (Spiral, Tokens, etc)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL API (CoinGecko)                      │
│  GET /coins/markets?category=meme-token&order=market_cap_desc   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | React | 18.2+ | UI Framework |
| 3D Engine | Three.js | 0.160+ | 3D Rendering |
| React 3D | React Three Fiber | 8.15+ | React bindings cho Three.js |
| 3D Helpers | @react-three/drei | 9.88+ | Camera, Controls, Effects |
| Post-Processing | @react-three/postprocessing | 2.15+ | Bloom, Vignette |
| State | Zustand | 4.4+ | Global state management |
| Data Fetching | TanStack Query | 5.0+ | API caching & sync |
| Styling | Tailwind CSS | 3.4+ | UI styling |
| Build | Vite | 5.0+ | Fast development & build |
| Language | TypeScript | 5.3+ | Type safety |

---

## 2. CoinGecko API Integration

### 2.1 API Endpoints

**Primary Endpoint - Meme Tokens List:**

```
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd
  &category=meme-token
  &order=market_cap_desc
  &per_page=100
  &page=1
  &sparkline=true
```

**Token Detail (on demand):**

```
GET https://api.coingecko.com/api/v3/coins/{id}
  ?localization=false
  &tickers=false
  &community_data=true
  &sparkline=true
```

### 2.2 Data Models

```typescript
// types/token.ts

export interface MemeToken {
  id: string;                    // "dogecoin"
  symbol: string;                // "doge"
  name: string;                  // "Dogecoin"
  image: string;                 // Logo URL
  current_price: number;         // 0.12345
  market_cap: number;            // 18500000000
  market_cap_rank: number;       // 8
  price_change_24h: number;      // 0.005
  price_change_percentage_24h: number; // 5.2
  total_volume: number;          // 1200000000
  high_24h: number;
  low_24h: number;
  sparkline_in_7d: {
    price: number[];             // 7-day price history
  };
  ath: number;                   // All-time high
  ath_date: string;
  atl: number;                   // All-time low
  atl_date: string;
}

export interface TokenPosition {
  token: MemeToken;
  position: [number, number, number];  // x, y, z in 3D space
  rotation: [number, number, number];  // facing direction
  spiralIndex: number;                 // position in spiral (0 = top)
  wall: 'inner' | 'outer';
}

export interface TokenDetail extends MemeToken {
  description: { en: string };
  links: {
    homepage: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
  };
  community_data: {
    twitter_followers: number;
    telegram_channel_user_count: number;
  };
}
```

### 2.3 API Service

```typescript
// services/coingeckoService.ts

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const RATE_LIMIT_DELAY = 1500; // ms between requests (free tier)

export const fetchMemeTokens = async (
  page: number = 1,
  perPage: number = 100
): Promise<MemeToken[]> => {
  const url = new URL(`${COINGECKO_BASE_URL}/coins/markets`);
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('category', 'meme-token');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', perPage.toString());
  url.searchParams.set('page', page.toString());
  url.searchParams.set('sparkline', 'true');

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait.');
    }
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.json();
};

export const fetchTokenDetail = async (id: string): Promise<TokenDetail> => {
  const url = new URL(`${COINGECKO_BASE_URL}/coins/${id}`);
  url.searchParams.set('localization', 'false');
  url.searchParams.set('tickers', 'false');
  url.searchParams.set('community_data', 'true');
  url.searchParams.set('sparkline', 'true');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.status}`);
  }

  return response.json();
};
```

### 2.4 React Query Setup

```typescript
// hooks/useMemeTokens.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMemeTokens, fetchTokenDetail } from '../services/coingeckoService';

export const useMemeTokens = (page: number = 1) => {
  return useQuery({
    queryKey: ['memeTokens', page],
    queryFn: () => fetchMemeTokens(page, 100),
    refetchInterval: 60000,      // Refresh every 1 minute
    staleTime: 30000,            // Data fresh for 30 seconds
    gcTime: 5 * 60 * 1000,       // Cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useTokenDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['tokenDetail', id],
    queryFn: () => fetchTokenDetail(id!),
    enabled: !!id,
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  });
};

// Prefetch for performance
export const usePrefetchTokenDetail = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['tokenDetail', id],
      queryFn: () => fetchTokenDetail(id),
    });
  };
};
```

---

## 3. 3D Scene Architecture

### 3.1 Spiral Geometry Configuration

```typescript
// utils/constants.ts

export const SPIRAL_CONFIG = {
  innerRadius: 8,        // Inner wall radius
  outerRadius: 25,       // Outer wall radius
  rampWidth: 6,          // Walkable path width
  heightPerTurn: 4,      // Height gained per 360°
  totalTurns: 6,         // Number of spiral rotations
  segments: 72,          // Segments per turn (5° each)
  wallHeight: 5,         // Height of walls
  tokenSpacing: 3,       // Distance between tokens
  tokensPerTurn: 12,     // 6 inner + 6 outer
} as const;

export const CHARACTER_CONFIG = {
  particleCount: 3000,
  particleSize: 0.03,
  moveSpeed: 4,
  rotationSpeed: 3,
  height: 1.8,
} as const;

export const CAMERA_CONFIG = {
  offset: [0, 3, 8] as const,
  lookAtOffset: [0, 1, 0] as const,
  smoothing: 0.1,
  fov: 60,
  near: 0.1,
  far: 1000,
} as const;
```

### 3.2 Spiral Geometry Generation

```typescript
// utils/spiralGenerator.ts

import * as THREE from 'three';
import { SPIRAL_CONFIG } from './constants';

interface SpiralPoint {
  position: THREE.Vector3;
  angle: number;
  height: number;
  normal: THREE.Vector3;
}

export const generateSpiralPath = (): SpiralPoint[] => {
  const { innerRadius, outerRadius, heightPerTurn, totalTurns, segments } = SPIRAL_CONFIG;
  const points: SpiralPoint[] = [];
  const totalSegments = segments * totalTurns;
  const centerRadius = (innerRadius + outerRadius) / 2;

  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments;
    const angle = t * totalTurns * Math.PI * 2;
    const height = t * totalTurns * heightPerTurn;

    const position = new THREE.Vector3(
      Math.cos(angle) * centerRadius,
      height,
      Math.sin(angle) * centerRadius
    );

    // Normal pointing outward from center
    const normal = new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    ).normalize();

    points.push({ position, angle, height, normal });
  }

  return points;
};

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
    vertices.push(
      Math.cos(angle) * innerRadius,
      height,
      Math.sin(angle) * innerRadius
    );

    // Outer edge
    vertices.push(
      Math.cos(angle) * outerRadius,
      height,
      Math.sin(angle) * outerRadius
    );

    // UVs
    uvs.push(0, t);
    uvs.push(1, t);

    // Normals (up)
    normals.push(0, 1, 0);
    normals.push(0, 1, 0);

    // Indices (triangles)
    if (i < totalSegments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
};
```

### 3.3 Token Position Calculator

```typescript
// utils/tokenPositioning.ts

import * as THREE from 'three';
import { MemeToken, TokenPosition } from '../types/token';
import { SPIRAL_CONFIG } from './constants';

export const calculateTokenPositions = (
  tokens: MemeToken[]
): TokenPosition[] => {
  const {
    innerRadius,
    outerRadius,
    heightPerTurn,
    totalTurns,
    tokensPerTurn,
  } = SPIRAL_CONFIG;

  const placements: TokenPosition[] = [];
  const tokensPerWall = tokensPerTurn / 2; // 6 per wall

  tokens.forEach((token, index) => {
    const turnIndex = Math.floor(index / tokensPerTurn);
    const positionInTurn = index % tokensPerTurn;
    const isInnerWall = positionInTurn < tokensPerWall;
    const wallPosition = positionInTurn % tokensPerWall;

    // Calculate angle within the turn
    const angleOffset = (wallPosition / tokensPerWall) * Math.PI * 2;
    const baseAngle = turnIndex * Math.PI * 2 + angleOffset;

    // Height based on turn + offset within turn
    const heightOffset = (wallPosition / tokensPerWall) * heightPerTurn;
    const height = turnIndex * heightPerTurn + heightOffset + 2; // +2 for frame center

    // Radius - slightly offset from wall
    const wallOffset = 0.5;
    const radius = isInnerWall
      ? innerRadius + wallOffset
      : outerRadius - wallOffset;

    const position: [number, number, number] = [
      Math.cos(baseAngle) * radius,
      height,
      Math.sin(baseAngle) * radius,
    ];

    // Rotation - face the walkway
    const rotation: [number, number, number] = [
      0,
      isInnerWall ? baseAngle + Math.PI : baseAngle,
      0,
    ];

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

// Find nearest token to a position
export const findNearestToken = (
  position: THREE.Vector3,
  tokenPositions: TokenPosition[],
  maxDistance: number = 3
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
```

### 3.4 Component Structure

```tsx
// components/Scene/Scene.tsx

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import { SpiralStructure } from './SpiralStructure';
import { TokenGallery } from './TokenGallery';
import { PlayerCharacter } from './PlayerCharacter';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { SceneLighting } from './SceneLighting';
import { AmbientParticles } from './AmbientParticles';
import { LoadingScreen } from '../UI/LoadingScreen';
import { KeyboardController } from './KeyboardController';
import { ProximityDetector } from './ProximityDetector';

export const Scene = () => {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0a0a0f']} />
      <fog attach="fog" args={['#1a1a2e', 10, 100]} />

      <Suspense fallback={<LoadingScreen />}>
        {/* Camera */}
        <ThirdPersonCamera />

        {/* Environment */}
        <SpiralStructure />
        <AmbientParticles />

        {/* Lighting */}
        <SceneLighting />

        {/* Tokens */}
        <TokenGallery />

        {/* Character */}
        <PlayerCharacter />

        {/* Systems */}
        <KeyboardController />
        <ProximityDetector />

        {/* Post Processing */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.5}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};
```

---

## 4. State Management

### 4.1 Store Structure

```typescript
// stores/galleryStore.ts

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import { MemeToken, TokenPosition } from '../types/token';
import { calculateTokenPositions } from '../utils/tokenPositioning';
import { SPIRAL_CONFIG } from '../utils/constants';

interface GalleryState {
  // Character
  characterPosition: THREE.Vector3;
  characterRotation: THREE.Euler;
  isMoving: boolean;

  // Camera
  cameraMode: 'follow' | 'detail' | 'overview';
  cameraZoom: number;

  // Tokens
  tokens: MemeToken[];
  tokenPositions: TokenPosition[];
  selectedToken: MemeToken | null;
  nearestToken: TokenPosition | null;

  // UI
  isMenuOpen: boolean;
  isSearchOpen: boolean;
  showMinimap: boolean;
  showLeaderboard: boolean;

  // Loading
  isLoading: boolean;
  error: string | null;
}

interface GalleryActions {
  // Character
  setCharacterPosition: (pos: THREE.Vector3) => void;
  setCharacterRotation: (rot: THREE.Euler) => void;
  setIsMoving: (moving: boolean) => void;

  // Tokens
  setTokens: (tokens: MemeToken[]) => void;
  selectToken: (token: MemeToken | null) => void;
  setNearestToken: (tp: TokenPosition | null) => void;

  // Navigation
  teleportToToken: (tokenId: string) => void;
  teleportToTop: () => void;

  // Camera
  setCameraMode: (mode: 'follow' | 'detail' | 'overview') => void;
  setCameraZoom: (zoom: number) => void;

  // UI
  toggleMenu: () => void;
  toggleSearch: () => void;
  toggleMinimap: () => void;
  toggleLeaderboard: () => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState: GalleryState = {
  // Start at top of spiral
  characterPosition: new THREE.Vector3(0, SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn, 15),
  characterRotation: new THREE.Euler(0, Math.PI, 0),
  isMoving: false,

  cameraMode: 'follow',
  cameraZoom: 1,

  tokens: [],
  tokenPositions: [],
  selectedToken: null,
  nearestToken: null,

  isMenuOpen: false,
  isSearchOpen: false,
  showMinimap: true,
  showLeaderboard: false,

  isLoading: true,
  error: null,
};

export const useGalleryStore = create<GalleryState & GalleryActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setCharacterPosition: (pos) => set({ characterPosition: pos }),
    setCharacterRotation: (rot) => set({ characterRotation: rot }),
    setIsMoving: (moving) => set({ isMoving: moving }),

    setTokens: (tokens) => {
      const tokenPositions = calculateTokenPositions(tokens);
      set({ tokens, tokenPositions, isLoading: false });
    },

    selectToken: (token) => {
      set({
        selectedToken: token,
        cameraMode: token ? 'detail' : 'follow',
      });
    },

    setNearestToken: (tp) => set({ nearestToken: tp }),

    teleportToToken: (tokenId) => {
      const { tokenPositions, tokens } = get();
      const index = tokens.findIndex((t) => t.id === tokenId);

      if (index >= 0 && tokenPositions[index]) {
        const tp = tokenPositions[index];
        const targetPos = new THREE.Vector3(...tp.position);

        // Offset to stand in front of token
        const offset = new THREE.Vector3(0, 0, 3);
        offset.applyEuler(new THREE.Euler(...tp.rotation));
        targetPos.add(offset);

        set({
          characterPosition: targetPos,
          isSearchOpen: false,
        });
      }
    },

    teleportToTop: () => {
      set({
        characterPosition: new THREE.Vector3(
          0,
          SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn,
          15
        ),
        characterRotation: new THREE.Euler(0, Math.PI, 0),
      });
    },

    setCameraMode: (mode) => set({ cameraMode: mode }),
    setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.5, Math.min(2, zoom)) }),

    toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
    toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
    toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
    toggleLeaderboard: () => set((state) => ({ showLeaderboard: !state.showLeaderboard })),

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
  }))
);
```

### 4.2 UI Store (Separate for Performance)

```typescript
// stores/uiStore.ts

import { create } from 'zustand';

interface UIState {
  hoveredTokenId: string | null;
  tooltipPosition: { x: number; y: number } | null;
  showTutorial: boolean;
  controlsVisible: boolean;
}

interface UIActions {
  setHoveredToken: (id: string | null, position?: { x: number; y: number }) => void;
  dismissTutorial: () => void;
  toggleControls: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  hoveredTokenId: null,
  tooltipPosition: null,
  showTutorial: true,
  controlsVisible: true,

  setHoveredToken: (id, position) =>
    set({
      hoveredTokenId: id,
      tooltipPosition: position || null,
    }),

  dismissTutorial: () => set({ showTutorial: false }),
  toggleControls: () => set((state) => ({ controlsVisible: !state.controlsVisible })),
}));
```

---

## 5. Directory Structure

```
src/
├── components/
│   ├── Scene/
│   │   ├── Scene.tsx                 # Main 3D scene wrapper
│   │   ├── SpiralStructure.tsx       # Spiral geometry + walls
│   │   ├── SpiralRamp.tsx            # Walkable ramp
│   │   ├── SpiralWalls.tsx           # Inner/outer walls
│   │   ├── TokenFrame.tsx            # Individual token display
│   │   ├── TokenGallery.tsx          # All tokens manager
│   │   ├── PlayerCharacter.tsx       # Particle character
│   │   ├── ThirdPersonCamera.tsx     # Camera system
│   │   ├── SceneLighting.tsx         # Lights setup
│   │   ├── Skylight.tsx              # Top light source
│   │   ├── NeonStrips.tsx            # Path lighting
│   │   ├── AmbientParticles.tsx      # Floating particles
│   │   ├── KeyboardController.tsx    # Input handling
│   │   └── ProximityDetector.tsx     # Token detection
│   │
│   ├── UI/
│   │   ├── HUD.tsx                   # Main HUD container
│   │   ├── ControlsGuide.tsx         # Control hints
│   │   ├── TokenPreview.tsx          # Nearby token card
│   │   ├── TokenDetailPanel.tsx      # Full token info
│   │   ├── SearchModal.tsx           # Token search
│   │   ├── Minimap.tsx               # Spiral minimap
│   │   ├── Leaderboard.tsx           # Top tokens list
│   │   ├── LoadingScreen.tsx         # Loading state
│   │   └── Menu.tsx                  # ESC menu
│   │
│   └── Effects/
│       ├── FootprintTrail.tsx        # Walking effect
│       ├── TokenGlow.tsx             # Token highlight
│       └── PriceChangeEffect.tsx     # Pump/dump visual
│
├── hooks/
│   ├── useKeyboardControls.ts        # Keyboard input
│   ├── useCharacterMovement.ts       # Movement logic
│   ├── useProximityDetection.ts      # Near token detection
│   ├── useCameraFollow.ts            # Camera logic
│   ├── useMemeTokens.ts              # Token data fetching
│   ├── useSpiralConstraint.ts        # Keep on path
│   └── useTokenSearch.ts             # Search functionality
│
├── services/
│   ├── coingeckoService.ts           # API calls
│   └── imageCache.ts                 # Token image caching
│
├── stores/
│   ├── galleryStore.ts               # Main state
│   └── uiStore.ts                    # UI-specific state
│
├── utils/
│   ├── spiralGenerator.ts            # Spiral geometry math
│   ├── tokenPositioning.ts           # Position calculations
│   ├── constants.ts                  # Config values
│   ├── helpers.ts                    # Utility functions
│   └── formatters.ts                 # Number/price formatting
│
├── types/
│   ├── token.ts                      # Token interfaces
│   ├── scene.ts                      # 3D types
│   └── index.ts                      # Exports
│
├── styles/
│   └── globals.css                   # Tailwind + custom styles
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## 6. Data Flow

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   CoinGecko  │────▶│   TanStack     │────▶│   Zustand    │
│     API      │     │    Query       │     │    Store     │
└──────────────┘     └────────────────┘     └──────────────┘
                            │                      │
                     (cache/refetch)               │
                            │                      ▼
                            │               ┌──────────────┐
                            │               │   Position   │
                            │               │  Calculator  │
                            │               └──────────────┘
                            │                      │
                            ▼                      ▼
                     ┌─────────────────────────────────┐
                     │          React Components        │
                     │  ┌──────────┐  ┌──────────────┐ │
                     │  │    UI    │  │   3D Scene   │ │
                     │  │ (Panels) │  │ (R3F/Three)  │ │
                     │  └──────────┘  └──────────────┘ │
                     └─────────────────────────────────┘
```

### 6.1 Data Refresh Strategy

| Data Type | Refresh Interval | Strategy |
|-----------|------------------|----------|
| Token List | 60 seconds | Background refetch |
| Token Prices | 30 seconds | Polling with stale check |
| Token Detail | On demand | User action trigger |
| Token Images | Permanent | Browser cache + CDN |

### 6.2 Error Handling

```typescript
// Retry logic với exponential backoff
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

// Fallback data khi API fail
const useFallbackTokens = () => {
  // Return cached data hoặc static demo data
};
```

---

## 7. Performance Considerations

### 7.1 Optimization Strategies

```typescript
// 1. Instanced Meshes for Token Frames
import { Instances, Instance } from '@react-three/drei';

const TokenGallery = ({ positions }: { positions: TokenPosition[] }) => {
  return (
    <Instances limit={200} castShadow receiveShadow>
      <boxGeometry args={[2.5, 3.5, 0.1]} />
      <meshStandardMaterial color="#2a2a3e" metalness={0.5} />
      {positions.map((tp, i) => (
        <Instance
          key={tp.token.id}
          position={tp.position}
          rotation={tp.rotation}
        />
      ))}
    </Instances>
  );
};

// 2. LOD (Level of Detail) for distant tokens
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

const TokenWithLOD = ({ tokenPosition, characterPosition }) => {
  const distance = useMemo(() => {
    return new THREE.Vector3(...tokenPosition.position)
      .distanceTo(characterPosition);
  }, [tokenPosition, characterPosition]);

  if (distance > 40) return null; // Cull very distant
  if (distance > 25) return <LowDetailToken />;
  if (distance > 12) return <MediumDetailToken />;
  return <HighDetailToken />;
};

// 3. Texture Pooling
const useTexturePool = (urls: string[], maxConcurrent: number = 10) => {
  const [textures, setTextures] = useState<Map<string, THREE.Texture>>(new Map());
  const loadingQueue = useRef<string[]>([]);
  const activeLoads = useRef(0);

  // Load textures progressively
  // ...
};

// 4. Memoization for expensive calculations
const tokenPositions = useMemo(
  () => calculateTokenPositions(tokens),
  [tokens]
);

// 5. RAF throttling for non-critical updates
const useThrottledFrame = (callback: FrameCallback, fps: number = 30) => {
  const lastTime = useRef(0);
  const interval = 1000 / fps;

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime * 1000;
    if (now - lastTime.current >= interval) {
      callback(state, delta);
      lastTime.current = now;
    }
  });
};
```

### 7.2 Target Metrics

| Metric | Target | Minimum |
|--------|--------|---------|
| FPS | 60 | 30 |
| Initial Load | < 3s | < 5s |
| Time to Interactive | < 2s | < 4s |
| GPU Memory | < 500MB | < 800MB |
| Bundle Size | < 500KB | < 1MB |

### 7.3 Monitoring

```typescript
// Performance monitoring hooks
const usePerformanceMonitor = () => {
  const [stats, setStats] = useState({
    fps: 0,
    memory: 0,
    drawCalls: 0,
  });

  useFrame((state) => {
    // Update stats
    setStats({
      fps: 1 / state.clock.getDelta(),
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      drawCalls: state.gl.info.render.calls,
    });
  });

  return stats;
};
```

---

## 8. Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "@react-three/postprocessing": "^2.15.0",
    "three": "^0.160.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "fuse.js": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/three": "^0.160.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 9. Security Considerations

### 9.1 API Security

- Rate limiting handling (CoinGecko free tier: 10-30 calls/min)
- CORS handling
- No API keys exposed (CoinGecko free API)

### 9.2 Client Security

- Input sanitization for search
- CSP headers
- No eval() or dynamic code execution

---

## 10. Future Enhancements

### Phase 2

1. **WebSocket** cho real-time price updates
2. **Token filtering** theo chain (Solana, Ethereum, etc.)
3. **User favorites** với localStorage
4. **Share functionality** - share position/token via URL

### Phase 3

1. **VR support** với WebXR
2. **Multiplayer** - see other users in gallery
3. **Historical view** - time travel to see past prices
4. **Portfolio integration** - connect wallet to see holdings

### Phase 4

1. **Mobile app** với React Native
2. **AR mode** - view tokens in real world
3. **AI insights** - token analysis và predictions
