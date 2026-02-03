import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../stores/galleryStore';
import { CHARACTER_CONFIG, SPIRAL_CONFIG } from '../utils/constants';
import { findNearestToken } from '../utils/tokenPositioning';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
}

export const useKeyboardControls = () => {
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
  });

  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const setCharacterPosition = useGalleryStore((s) => s.setCharacterPosition);
  const setCharacterRotation = useGalleryStore((s) => s.setCharacterRotation);
  const setIsMoving = useGalleryStore((s) => s.setIsMoving);
  const tokenPositions = useGalleryStore((s) => s.tokenPositions);
  const setNearestToken = useGalleryStore((s) => s.setNearestToken);
  const selectToken = useGalleryStore((s) => s.selectToken);
  const nearestToken = useGalleryStore((s) => s.nearestToken);
  const toggleMenu = useGalleryStore((s) => s.toggleMenu);
  const toggleSearch = useGalleryStore((s) => s.toggleSearch);
  const toggleLeaderboard = useGalleryStore((s) => s.toggleLeaderboard);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          if (nearestToken) {
            selectToken(nearestToken.token);
          }
          break;
        case 'Escape':
          selectToken(null);
          toggleMenu();
          break;
        case 'Slash':
          e.preventDefault();
          toggleSearch();
          break;
        case 'KeyL':
          toggleLeaderboard();
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
  }, [nearestToken, selectToken, toggleMenu, toggleSearch, toggleLeaderboard]);

  // Track total angle traveled on spiral (accumulated, not normalized)
  // Initialized based on starting height
  const totalAngle = useRef(-1); // -1 means uninitialized

  // Movement update in animation frame
  useFrame((_, delta) => {
    const { forward, backward, left, right } = keys.current;
    const isMoving = forward || backward || left || right;
    setIsMoving(isMoving);

    // Initialize total angle from current position if needed
    if (totalAngle.current < 0) {
      // Calculate initial angle from starting position height
      // height = (totalAngle / 2π) * heightPerTurn
      // totalAngle = (height / heightPerTurn) * 2π
      const startHeight = characterPosition.y - CHARACTER_CONFIG.height;
      totalAngle.current = (startHeight / SPIRAL_CONFIG.heightPerTurn) * Math.PI * 2;
    }

    if (!isMoving) return;

    // Clamp delta
    const dt = Math.min(delta, 0.05);
    const moveSpeed = CHARACTER_CONFIG.moveSpeed * dt;
    const rotSpeed = CHARACTER_CONFIG.rotationSpeed * dt;

    // Rotation
    let newRotY = characterRotation.y;
    if (left) newRotY += rotSpeed;
    if (right) newRotY -= rotSpeed;

    // Movement direction
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (forward) moveDir.z -= 1;
    if (backward) moveDir.z += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
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
