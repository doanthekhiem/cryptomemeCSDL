import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../stores/galleryStore';
import { CHARACTER_CONFIG, SPIRAL_CONFIG } from '../utils/constants';
import { findNearestToken } from '../utils/tokenPositioning';
import { joystickState } from '../utils/inputState';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLElement && target.isContentEditable);

// True when a UI overlay should capture input instead of the 3D scene
const isOverlayOpen = () => {
  const s = useGalleryStore.getState();
  return !!(
    s.selectedToken ||
    s.isMenuOpen ||
    s.isSearchOpen ||
    s.isListViewOpen ||
    s.isLeaderboardOpen
  );
};

export const useKeyboardControls = () => {
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const setCharacterPosition = useGalleryStore((s) => s.setCharacterPosition);
  const setCharacterRotation = useGalleryStore((s) => s.setCharacterRotation);
  const setIsMoving = useGalleryStore((s) => s.setIsMoving);
  const tokenPositions = useGalleryStore((s) => s.tokenPositions);
  const setNearestToken = useGalleryStore((s) => s.setNearestToken);

  // Keyboard event handlers — read store via getState() to avoid stale closures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never react while the user is typing in an input (search, list filter)
      if (isTypingTarget(e.target)) return;

      const store = useGalleryStore.getState();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Enter':
          if (!isOverlayOpen() && store.nearestToken) {
            store.selectToken(store.nearestToken.token);
          }
          break;
        case 'Escape':
          // Close the topmost overlay first; only open the menu if nothing was open
          if (!store.closeTopOverlay()) {
            store.setMenuOpen(true);
          }
          break;
        case 'Slash':
          e.preventDefault();
          if (!store.selectedToken) {
            store.toggleSearch();
          }
          break;
        case 'KeyM':
          store.toggleMinimap();
          break;
        case 'KeyL':
          if (!store.selectedToken && !store.isSearchOpen) {
            store.toggleLeaderboard();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Track total angle traveled on spiral (accumulated, not normalized)
  // Initialized based on starting height
  const totalAngle = useRef(-1); // -1 means uninitialized

  // Movement update in animation frame
  useFrame((_, delta) => {
    // Initialize total angle from current position if needed.
    // Also re-sync after teleport (height vs angle mismatch).
    const startHeight = characterPosition.y - CHARACTER_CONFIG.height;
    const expectedAngle = (startHeight / SPIRAL_CONFIG.heightPerTurn) * Math.PI * 2;
    if (totalAngle.current < 0 || Math.abs(expectedAngle - totalAngle.current) > Math.PI) {
      totalAngle.current = expectedAngle;
    }

    // While an overlay is open, the character stands still
    if (isOverlayOpen()) {
      keys.current = { forward: false, backward: false, left: false, right: false };
      setIsMoving(false);
      return;
    }

    const { forward, backward, left, right } = keys.current;

    // Combine digital (keyboard) and analog (touch joystick) input
    const moveInput = Math.max(
      -1,
      Math.min(1, (forward ? 1 : 0) - (backward ? 1 : 0) + joystickState.y)
    );
    const turnInput = Math.max(
      -1,
      Math.min(1, (left ? 1 : 0) - (right ? 1 : 0) - joystickState.x)
    );

    const isMoving = Math.abs(moveInput) > 0.1 || Math.abs(turnInput) > 0.1;
    setIsMoving(isMoving);
    if (!isMoving) return;

    // Clamp delta
    const dt = Math.min(delta, 0.05);
    const moveSpeed = CHARACTER_CONFIG.moveSpeed * dt;
    const rotSpeed = CHARACTER_CONFIG.rotationSpeed * dt;

    // Rotation
    const newRotY = characterRotation.y + turnInput * rotSpeed;

    // Movement direction
    const moveDir = new THREE.Vector3(0, 0, -moveInput);

    if (moveDir.lengthSq() > 0.01) {
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), newRotY);
      moveDir.multiplyScalar(moveSpeed);

      // New XZ position
      const newPos = characterPosition.clone();
      newPos.x += moveDir.x;
      newPos.z += moveDir.z;

      // Constrain radius to ramp
      const radius = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
      const minR = SPIRAL_CONFIG.innerRadius + 1.5;
      const maxR = SPIRAL_CONFIG.outerRadius - 1.5;
      const clampedRadius = Math.max(minR, Math.min(maxR, radius));

      if (radius > 0.01) {
        const scale = clampedRadius / radius;
        newPos.x *= scale;
        newPos.z *= scale;
      }

      // Calculate angle change
      const newAngle = Math.atan2(newPos.z, newPos.x);
      const prevAngle = Math.atan2(characterPosition.z, characterPosition.x);

      // Handle wrap-around
      let angleDiff = newAngle - prevAngle;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Update total angle
      totalAngle.current += angleDiff;

      // Clamp to spiral bounds
      const maxAngle = SPIRAL_CONFIG.totalTurns * Math.PI * 2;
      totalAngle.current = Math.max(0, Math.min(maxAngle, totalAngle.current));

      // Calculate height from total angle
      const rampHeight = (totalAngle.current / (Math.PI * 2)) * SPIRAL_CONFIG.heightPerTurn;
      newPos.y = rampHeight + CHARACTER_CONFIG.height;

      setCharacterPosition(newPos);
    }

    // Update rotation
    if (newRotY !== characterRotation.y) {
      setCharacterRotation(new THREE.Euler(0, newRotY, 0));
    }

    // Update nearest token
    if (tokenPositions.length > 0) {
      const nearest = findNearestToken(characterPosition, tokenPositions, 5);
      setNearestToken(nearest);
    }
  });
};

// Component wrapper to use the hook inside Canvas
export const KeyboardController = () => {
  useKeyboardControls();
  return null;
};
