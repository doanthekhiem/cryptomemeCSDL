import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
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
  isListViewOpen: boolean;
  isLeaderboardOpen: boolean;
  showMinimap: boolean;
  showControls: boolean;
  hasSeenTour: boolean;

  // Watchlist (token ids, persisted)
  watchlist: string[];

  // Performance
  performanceMode: PerformanceMode;
  /** Quality actually in effect — equals performanceMode unless 'auto' */
  effectiveQuality: Quality;

  // Loading
  isLoading: boolean;
  error: string | null;
}

export type PerformanceMode = 'auto' | 'high' | 'low';
export type Quality = 'high' | 'low';

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
  setMenuOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setListViewOpen: (open: boolean) => void;
  setLeaderboardOpen: (open: boolean) => void;
  toggleLeaderboard: () => void;
  toggleWatchlist: (tokenId: string) => void;
  toggleMinimap: () => void;
  toggleControls: () => void;
  setHasSeenTour: (seen: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setEffectiveQuality: (quality: Quality) => void;
  /** Close the topmost open overlay. Returns true if something was closed. */
  closeTopOverlay: () => boolean;

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

// Last position is saved separately from prefs (on page hide, not every frame —
// persisting it through the zustand middleware would write localStorage 60×/s)
const POSITION_KEY = 'spiral-meme-gallery-position';

const loadSavedPosition = (): THREE.Vector3 | null => {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const arr: unknown = JSON.parse(raw);
    if (
      !Array.isArray(arr) ||
      arr.length !== 3 ||
      arr.some((n) => typeof n !== 'number' || !Number.isFinite(n))
    ) {
      return null;
    }
    const [x, y, z] = arr as [number, number, number];
    // Sanity check: must be on the spiral ramp
    const radius = Math.hypot(x, z);
    const maxHeight = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn + 3;
    if (
      radius < SPIRAL_CONFIG.innerRadius ||
      radius > SPIRAL_CONFIG.outerRadius ||
      y < 0 ||
      y > maxHeight
    ) {
      return null;
    }
    return new THREE.Vector3(x, y, z);
  } catch {
    return null;
  }
};

export const saveCharacterPosition = () => {
  try {
    const pos = useGalleryStore.getState().characterPosition;
    localStorage.setItem(POSITION_KEY, JSON.stringify([pos.x, pos.y, pos.z]));
  } catch {
    // storage unavailable (private mode, quota) — losing the position is fine
  }
};

const initialState: GalleryState = {
  characterPosition: loadSavedPosition() ?? getStartPosition(),
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
  isListViewOpen: false,
  isLeaderboardOpen: false,
  showMinimap: true,
  showControls: true,
  hasSeenTour: false,
  watchlist: [],

  performanceMode: 'auto',
  effectiveQuality: 'high',

  isLoading: true,
  error: null,
};

export const useGalleryStore = create<GalleryState & GalleryActions>()(
  persist(
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

          // Face the token after teleporting
          const lookRotY = Math.atan2(
            tp.position[0] - targetPos.x,
            tp.position[2] - targetPos.z
          );

          set({
            characterPosition: targetPos,
            characterRotation: new THREE.Euler(0, lookRotY, 0),
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
      setMenuOpen: (open) => set({ isMenuOpen: open }),
      toggleSearch: () =>
        set((s) => ({ isSearchOpen: !s.isSearchOpen, isMenuOpen: false })),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setListViewOpen: (open) =>
        set({ isListViewOpen: open, isMenuOpen: open ? false : get().isMenuOpen }),
      setLeaderboardOpen: (open) =>
        set({ isLeaderboardOpen: open, isMenuOpen: open ? false : get().isMenuOpen }),
      toggleLeaderboard: () =>
        set((s) => ({ isLeaderboardOpen: !s.isLeaderboardOpen, isMenuOpen: false })),
      toggleWatchlist: (tokenId) =>
        set((s) => ({
          watchlist: s.watchlist.includes(tokenId)
            ? s.watchlist.filter((id) => id !== tokenId)
            : [...s.watchlist, tokenId],
        })),
      toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
      toggleControls: () => set((s) => ({ showControls: !s.showControls })),
      setHasSeenTour: (seen) => set({ hasSeenTour: seen }),
      setPerformanceMode: (mode) =>
        set((s) => ({
          performanceMode: mode,
          effectiveQuality: mode === 'auto' ? s.effectiveQuality : mode,
        })),
      setEffectiveQuality: (quality) => set({ effectiveQuality: quality }),

      closeTopOverlay: () => {
        const s = get();
        if (s.isSearchOpen) {
          set({ isSearchOpen: false });
          return true;
        }
        if (s.selectedToken) {
          s.selectToken(null);
          return true;
        }
        if (s.isLeaderboardOpen) {
          set({ isLeaderboardOpen: false });
          return true;
        }
        if (s.isListViewOpen) {
          set({ isListViewOpen: false });
          return true;
        }
        if (s.isMenuOpen) {
          set({ isMenuOpen: false });
          return true;
        }
        return false;
      },

      // Loading
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),

      // Reset
      reset: () => set(initialState),
    })),
    {
      name: 'spiral-meme-gallery-prefs',
      // Only persist user preferences — never 3D state or fetched data
      partialize: (s) => ({
        showMinimap: s.showMinimap,
        showControls: s.showControls,
        hasSeenTour: s.hasSeenTour,
        performanceMode: s.performanceMode,
        watchlist: s.watchlist,
      }),
    }
  )
);
