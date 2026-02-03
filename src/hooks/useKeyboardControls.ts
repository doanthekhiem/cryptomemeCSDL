import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../stores/galleryStore';
import { CHARACTER_CONFIG, SPIRAL_CONFIG } from '../utils/constants';
import { constrainToSpiral } from '../utils/spiralGenerator';
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

  // Movement update in animation frame
  useFrame((_, delta) => {
    const { forward, backward, left, right } = keys.current;
    const isMoving = forward || backward || left || right;
    setIsMoving(isMoving);

    if (!isMoving) return;

    const moveSpeed = CHARACTER_CONFIG.moveSpeed * delta;
    const rotSpeed = CHARACTER_CONFIG.rotationSpeed * delta;

    // Rotation
    let newRotY = characterRotation.y;
    if (left) newRotY += rotSpeed;
    if (right) newRotY -= rotSpeed;

    // Movement direction
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (forward) moveDir.z -= 1;
    if (backward) moveDir.z += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), newRotY);
      moveDir.multiplyScalar(moveSpeed);

      // Calculate new position
      const newPos = characterPosition.clone().add(moveDir);

      // Handle spiral height - character follows the ramp
      const angle = Math.atan2(newPos.z, newPos.x);
      const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

      // Calculate which turn based on current height
      const currentTurn = Math.floor(
        characterPosition.y / SPIRAL_CONFIG.heightPerTurn
      );

      // Calculate expected height for this angle on current turn
      const heightInTurn =
        (normalizedAngle / (Math.PI * 2)) * SPIRAL_CONFIG.heightPerTurn;
      const expectedHeight = currentTurn * SPIRAL_CONFIG.heightPerTurn + heightInTurn;

      // Smooth height transition
      const heightDiff = expectedHeight - characterPosition.y;
      newPos.y = characterPosition.y + heightDiff * 0.1;

      // Constrain to spiral bounds
      const constrainedPos = constrainToSpiral(newPos);

      setCharacterPosition(constrainedPos);
    }

    // Update rotation
    if (newRotY !== characterRotation.y) {
      setCharacterRotation(new THREE.Euler(0, newRotY, 0));
    }

    // Update nearest token
    const nearest = findNearestToken(characterPosition, tokenPositions, 5);
    setNearestToken(nearest);
  });
};

// Component wrapper to use the hook inside Canvas
export const KeyboardController = () => {
  useKeyboardControls();
  return null;
};
