import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { CAMERA_CONFIG } from '../../utils/constants';

export const ThirdPersonCamera = () => {
  const { camera } = useThree();
  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const cameraZoom = useGalleryStore((s) => s.cameraZoom);

  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame(() => {
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

    // Simple lerp - fast and responsive
    camera.position.lerp(targetPosition.current, 0.15);
    camera.lookAt(targetLookAt.current);
  });

  return null;
};
