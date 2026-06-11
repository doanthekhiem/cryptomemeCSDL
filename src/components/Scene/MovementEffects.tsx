import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { COLORS, SPIRAL_CONFIG } from '../../utils/constants';
import { getEmojiTexture } from '../../utils/proceduralTextures';

// ---------- Teleport burst ----------

const BURST_PARTICLES = 48;
const BURST_DURATION = 0.8;

export const TeleportEffect = () => {
  const teleportSignal = useGalleryStore((s) => s.teleportSignal);
  const quality = useGalleryStore((s) => s.effectiveQuality);

  const pointsRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const elapsed = useRef(BURST_DURATION + 1);
  const [activeSeq, setActiveSeq] = useState(0);

  // Random unit directions, reshuffled per burst via seq key
  const directions = useMemo(() => {
    const dirs = new Float32Array(BURST_PARTICLES * 3);
    for (let i = 0; i < BURST_PARTICLES; i++) {
      const v = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      dirs[i * 3] = v.x;
      dirs[i * 3 + 1] = v.y;
      dirs[i * 3 + 2] = v.z;
    }
    return dirs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeq]);

  const positions = useMemo(() => new Float32Array(BURST_PARTICLES * 3), []);

  // Start a new burst when the store signal changes
  if (teleportSignal && teleportSignal.seq !== activeSeq) {
    setActiveSeq(teleportSignal.seq);
    elapsed.current = 0;
  }

  useFrame((_, delta) => {
    if (!teleportSignal || elapsed.current > BURST_DURATION) {
      if (lightRef.current) lightRef.current.intensity = 0;
      if (pointsRef.current) pointsRef.current.visible = false;
      return;
    }

    elapsed.current += delta;
    const t = Math.min(elapsed.current / BURST_DURATION, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

    if (lightRef.current) {
      lightRef.current.intensity = (1 - t) * 6;
    }

    const points = pointsRef.current;
    if (points) {
      points.visible = true;
      const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const radius = eased * 3.5;
      for (let i = 0; i < BURST_PARTICLES; i++) {
        arr[i * 3] = directions[i * 3] * radius;
        arr[i * 3 + 1] = directions[i * 3 + 1] * radius + 1;
        arr[i * 3 + 2] = directions[i * 3 + 2] * radius;
      }
      attr.needsUpdate = true;
      (points.material as THREE.PointsMaterial).opacity = 1 - t;
    }
  });

  if (!teleportSignal) return null;

  return (
    <group position={teleportSignal.position}>
      {/* Flash — kept on low quality too, it is one light for <1s */}
      <pointLight ref={lightRef} color={COLORS.neonCyan} distance={12} intensity={0} />

      {quality === 'high' && (
        <points ref={pointsRef} visible={false} frustumCulled={false}>
          <bufferGeometry key={activeSeq}>
            <bufferAttribute
              attach="attributes-position"
              count={BURST_PARTICLES}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.18}
            color={COLORS.neonCyan}
            transparent
            opacity={1}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  );
};

// ---------- Ambient floating emoji ----------

const AMBIENT_EMOJI = ['🚀', '💎', '🐸', '🐕', '🔥', '📈'];
const PER_EMOJI = 7;
const MIN_Y = -2;
const MAX_Y = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn + 10;

// Emoji sprites drifting through the gallery instead of generic dust.
// One Points cloud per emoji texture = 6 draw calls. High quality only.
export const AmbientEmoji = () => {
  const quality = useGalleryStore((s) => s.effectiveQuality);

  const clouds = useMemo(
    () =>
      AMBIENT_EMOJI.map((emoji) => {
        const positions = new Float32Array(PER_EMOJI * 3);
        const speeds = new Float32Array(PER_EMOJI);
        const phases = new Float32Array(PER_EMOJI);
        for (let i = 0; i < PER_EMOJI; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 5 + Math.random() * 25;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = MIN_Y + Math.random() * (MAX_Y - MIN_Y);
          positions[i * 3 + 2] = Math.sin(angle) * radius;
          speeds[i] = 0.25 + Math.random() * 0.4;
          phases[i] = Math.random() * Math.PI * 2;
        }
        return { emoji, positions, speeds, phases };
      }),
    []
  );

  const refs = useRef<(THREE.Points | null)[]>([]);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    clouds.forEach((cloud, c) => {
      const points = refs.current[c];
      if (!points) return;
      const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < PER_EMOJI; i++) {
        arr[i * 3 + 1] += cloud.speeds[i] * delta;
        arr[i * 3] += Math.sin(time.current * 0.4 + cloud.phases[i]) * delta * 0.3;
        if (arr[i * 3 + 1] > MAX_Y) arr[i * 3 + 1] = MIN_Y;
      }
      attr.needsUpdate = true;
    });
  });

  if (quality !== 'high') return null;

  return (
    <group name="ambient-emoji">
      {clouds.map((cloud, c) => (
        <points
          key={cloud.emoji}
          ref={(el) => (refs.current[c] = el)}
          frustumCulled={false}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={PER_EMOJI}
              array={cloud.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            map={getEmojiTexture(cloud.emoji)}
            size={0.9}
            transparent
            opacity={0.85}
            alphaTest={0.05}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  );
};
