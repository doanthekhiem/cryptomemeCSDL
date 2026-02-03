import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import { MemeToken, TokenPosition } from '../types';
import { SPIRAL_CONFIG } from '../utils/constants';
import { calculateTokenPositions } from '../utils/tokenPositioning';

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
  showControls: boolean;

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
  toggleControls: () => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

// Calculate start position at top of spiral
// Character starts at angle=0 (positive X axis), top turn
const getStartPosition = () => {
  const topTurn = SPIRAL_CONFIG.totalTurns - 1;
  // At angle 0, height = topTurn * heightPerTurn + (0 / 2PI) * heightPerTurn = topTurn * heightPerTurn
  const startHeight = topTurn * SPIRAL_CONFIG.heightPerTurn + 1.5; // Add character height offset
  const centerRadius = (SPIRAL_CONFIG.innerRadius + SPIRAL_CONFIG.outerRadius) / 2;
  return new THREE.Vector3(centerRadius, startHeight, 0);
};

const initialState: GalleryState = {
  characterPosition: getStartPosition(),
  characterRotation: new THREE.Euler(0, -Math.PI / 2, 0),
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
  showControls: true,

  isLoading: true,
  error: null,
};

export const useGalleryStore = create<GalleryState & GalleryActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Character actions
    setCharacterPosition: (pos) => set({ characterPosition: pos.clone() }),
    setCharacterRotation: (rot) => set({ characterRotation: rot.clone() }),
    setIsMoving: (moving) => set({ isMoving: moving }),

    // Token actions
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

    // Navigation
    teleportToToken: (tokenId) => {
      const { tokenPositions, tokens } = get();
      const index = tokens.findIndex((t) => t.id === tokenId);

      if (index >= 0 && tokenPositions[index]) {
        const tp = tokenPositions[index];
        const targetPos = new THREE.Vector3(...tp.position);

        // Calculate position to stand in front of token
        const offset = new THREE.Vector3(0, 0, 3);
        const rotY = tp.rotation[1];
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
        targetPos.add(offset);

        set({
          characterPosition: targetPos,
          isSearchOpen: false,
        });
      }
    },

    teleportToTop: () => {
      set({
        characterPosition: getStartPosition(),
        characterRotation: new THREE.Euler(0, -Math.PI / 2, 0),
      });
    },

    // Camera
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.5, Math.min(2, zoom)) }),

    // UI toggles
    toggleMenu: () => set((s) => ({ isMenuOpen: !s.isMenuOpen })),
    toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
    toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
    toggleLeaderboard: () => set((s) => ({ showLeaderboard: !s.showLeaderboard })),
    toggleControls: () => set((s) => ({ showControls: !s.showControls })),

    // Loading
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),

    // Reset
    reset: () => set(initialState),
  }))
);
