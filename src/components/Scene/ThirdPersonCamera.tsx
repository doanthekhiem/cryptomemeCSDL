import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { CAMERA_CONFIG } from '../../utils/constants';

const BASE_FOV = CAMERA_CONFIG.fov;
const MOVING_FOV = BASE_FOV + 6; // slight widening = sense of speed
const TELEPORT_SNAP_DISTANCE = 15;

export const ThirdPersonCamera = () => {
  const { camera } = useThree();
  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const cameraZoom = useGalleryStore((s) => s.cameraZoom);
  const isMoving = useGalleryStore((s) => s.isMoving);

  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const prevCharacterPos = useRef<THREE.Vector3 | null>(null);

  useFrame((_, delta) => {
    // Calculate desired camera position behind and above character
    const offset = new THREE.Vector3(...CAMERA_CONFIG.offset);
    offset.multiplyScalar(cameraZoom);

    // Apply character rotation to offset
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterRotation.y);

    // Target position
    targetPosition.current.copy(characterPosition).add(offset);

    // Look at position (slightly above character)
    targetLookAt.current.copy(characterPosition);
    targetLookAt.current.y += CAMERA_CONFIG.lookAtOffset[1];

    // Teleport detection: when the character jumps a large distance, cut the
    // camera instead of lerping it through walls
    const jumped =
      prevCharacterPos.current !== null &&
      prevCharacterPos.current.distanceTo(characterPosition) > TELEPORT_SNAP_DISTANCE;
    prevCharacterPos.current = (prevCharacterPos.current ?? new THREE.Vector3()).copy(
      characterPosition
    );

    if (jumped) {
      camera.position.copy(targetPosition.current);
    } else {
      // Frame-rate-independent smoothing: snappy while walking, drifty idle
      const stiffness = isMoving ? 10 : 4;
      const alpha = 1 - Math.exp(-stiffness * delta);
      camera.position.lerp(targetPosition.current, alpha);
    }
    camera.lookAt(targetLookAt.current);

    // FOV breathing: widen slightly while moving for a sense of speed
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = isMoving ? MOVING_FOV : BASE_FOV;
      const nextFov = THREE.MathUtils.damp(camera.fov, targetFov, 3, delta);
      if (Math.abs(nextFov - camera.fov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
};
