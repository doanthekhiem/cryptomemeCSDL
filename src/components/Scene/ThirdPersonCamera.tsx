import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { CAMERA_CONFIG } from '../../utils/constants';
import { smoothDamp, Spring3D } from '../../utils/animation';

export const ThirdPersonCamera = () => {
  const { camera } = useThree();
  const characterPosition = useGalleryStore((s) => s.characterPosition);
  const characterRotation = useGalleryStore((s) => s.characterRotation);
  const cameraMode = useGalleryStore((s) => s.cameraMode);
  const cameraZoom = useGalleryStore((s) => s.cameraZoom);
  const selectedToken = useGalleryStore((s) => s.selectedToken);
  const nearestToken = useGalleryStore((s) => s.nearestToken);

  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const positionVelocity = useRef(new THREE.Vector3());
  const lookAtVelocity = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  // Spring for camera shake/impact effects
  const cameraShake = useRef(new Spring3D(200, 15));

  useFrame((_, delta) => {
    // Clamp delta to prevent jumps after tab switch
    const dt = Math.min(delta, 0.1);

    if (cameraMode === 'follow') {
      // Calculate desired camera position behind and above character
      const offset = new THREE.Vector3(...CAMERA_CONFIG.offset);
      offset.multiplyScalar(cameraZoom);

      // Apply character rotation to offset
      offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        characterRotation.y
      );

      // Target position
      targetPosition.current.copy(characterPosition).add(offset);

      // Look at position (slightly above character)
      targetLookAt.current.copy(characterPosition);
      targetLookAt.current.y += CAMERA_CONFIG.lookAtOffset[1];

      // Use smooth damp for cinematic camera movement
      const newPosition = smoothDamp(
        camera.position,
        targetPosition.current,
        positionVelocity.current,
        0.15, // smoothTime - lower = faster
        dt,
        50 // maxSpeed
      );

      // Apply camera shake
      const shake = cameraShake.current.update(dt);
      camera.position.copy(newPosition).add(shake);

      // Smooth look at with damping
      if (currentLookAt.current.lengthSq() === 0) {
        currentLookAt.current.copy(targetLookAt.current);
      }

      const newLookAt = smoothDamp(
        currentLookAt.current,
        targetLookAt.current,
        lookAtVelocity.current,
        0.1,
        dt,
        30
      );
      currentLookAt.current.copy(newLookAt);
      camera.lookAt(currentLookAt.current);

    } else if (cameraMode === 'detail' && selectedToken) {
      // Detail view - zoom into the selected token
      if (nearestToken) {
        const tokenPos = new THREE.Vector3(...nearestToken.position);
        const viewOffset = new THREE.Vector3(0, 0.5, 3);

        // Apply token rotation to offset
        viewOffset.applyEuler(new THREE.Euler(...nearestToken.rotation));
        targetPosition.current.copy(tokenPos).add(viewOffset);
        targetLookAt.current.copy(tokenPos);
        targetLookAt.current.y += 0.3;

        // Smooth transition to detail view
        const newPosition = smoothDamp(
          camera.position,
          targetPosition.current,
          positionVelocity.current,
          0.3,
          dt,
          20
        );
        camera.position.copy(newPosition);

        const newLookAt = smoothDamp(
          currentLookAt.current,
          targetLookAt.current,
          lookAtVelocity.current,
          0.2,
          dt,
          15
        );
        currentLookAt.current.copy(newLookAt);
        camera.lookAt(currentLookAt.current);
      }
    }
  });

  return null;
};
