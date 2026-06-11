import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '../../stores/galleryStore';
import { COLORS } from '../../utils/constants';
import { getEmojiTexture } from '../../utils/proceduralTextures';

// Degen astronaut: glass helmet + glowing energy core + hologram rings,
// climbing the spiral to the Moon. All primitives, no external assets.

const ORBIT_COUNT = 40; // particles orbiting the body (high quality only)
const TRAIL_LENGTH = 90; // rainbow trail points (high quality only)
const TRAIL_EMIT_INTERVAL = 0.035;
const IDLE_EMOJI_DELAY = 10; // seconds standing still before 💤 shows
const CELEBRATE_DURATION = 0.7;
const PUMP_CELEBRATE_THRESHOLD = 10; // % 24h change that triggers the hop

export const PlayerCharacter = () => {
  const isMoving = useGalleryStore((s) => s.isMoving);
  const quality = useGalleryStore((s) => s.effectiveQuality);

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Points>(null);
  const sleepRef = useRef<THREE.Sprite>(null);
  const trailRef = useRef<THREE.Points>(null);

  const time = useRef(0);
  const moveBlend = useRef(0); // 0 idle → 1 walking, damped
  const bobPhase = useRef(0);
  const lean = useRef(0);
  const prevRotY = useRef<number | null>(null);
  const idleTime = useRef(0);
  const celebrateTime = useRef(CELEBRATE_DURATION + 1);
  const lastCelebratedId = useRef<string | null>(null);
  const trailHead = useRef(0);
  const trailEmitTimer = useRef(0);

  // Orbiting particle angles/inclinations, fixed per session
  const orbit = useMemo(() => {
    const positions = new Float32Array(ORBIT_COUNT * 3);
    const angles = new Float32Array(ORBIT_COUNT);
    const inclinations = new Float32Array(ORBIT_COUNT);
    const radii = new Float32Array(ORBIT_COUNT);
    for (let i = 0; i < ORBIT_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      inclinations[i] = (Math.random() - 0.5) * 1.2;
      radii[i] = 0.55 + Math.random() * 0.35;
    }
    return { positions, angles, inclinations, radii };
  }, []);

  // Rainbow trail buffers (world space — the points mesh is NOT parented
  // to the character group)
  const trail = useMemo(() => {
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    positions.fill(-1000); // park unused points far underground
    const colors = new Float32Array(TRAIL_LENGTH * 3);
    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    time.current += delta;
    const t = time.current;

    const store = useGalleryStore.getState();
    const characterPosition = store.characterPosition;
    const characterRotation = store.characterRotation;

    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    // --- Position: follow the store exactly (movement code is the truth)
    root.position.copy(characterPosition);

    // --- Rotation: damped toward the store target; snap on teleport jumps
    const targetY = characterRotation.y;
    if (prevRotY.current === null || Math.abs(targetY - root.rotation.y) > Math.PI) {
      root.rotation.y = targetY;
    } else {
      root.rotation.y = THREE.MathUtils.damp(root.rotation.y, targetY, 10, delta);
    }

    // Angular velocity drives the lean when turning
    const angularVel =
      prevRotY.current === null ? 0 : (root.rotation.y - prevRotY.current) / Math.max(delta, 1e-4);
    prevRotY.current = root.rotation.y;
    const targetLean = THREE.MathUtils.clamp(angularVel * 0.1, -0.22, 0.22);
    lean.current = THREE.MathUtils.damp(lean.current, targetLean, 8, delta);

    // --- Walk cycle: bob fades in/out with movement
    moveBlend.current = THREE.MathUtils.damp(moveBlend.current, isMoving ? 1 : 0, 6, delta);
    if (isMoving) bobPhase.current += delta * 9;
    const bob = Math.abs(Math.sin(bobPhase.current)) * 0.12 * moveBlend.current;

    // --- Celebration hop near a hard-pumping token
    const nearest = store.nearestToken;
    if (nearest) {
      const change = nearest.token.price_change_percentage_24h ?? 0;
      if (
        change > PUMP_CELEBRATE_THRESHOLD &&
        nearest.token.id !== lastCelebratedId.current &&
        celebrateTime.current > CELEBRATE_DURATION
      ) {
        lastCelebratedId.current = nearest.token.id;
        celebrateTime.current = 0;
      }
    }
    celebrateTime.current += delta;
    const hop =
      celebrateTime.current < CELEBRATE_DURATION
        ? Math.sin((Math.PI * celebrateTime.current) / CELEBRATE_DURATION) * 0.55
        : 0;

    body.position.y = bob + hop;
    body.rotation.z = lean.current;
    body.rotation.x = moveBlend.current * 0.06; // slight forward pitch while walking

    // --- Energy core pulse
    const core = coreRef.current;
    if (core) {
      const pulse = 1 + Math.sin(t * 4) * 0.1;
      core.scale.setScalar(pulse);
      (core.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.6 + Math.sin(t * 4) * 0.6 + moveBlend.current * 0.8;
    }

    // --- Hologram rings spin faster while moving
    const ringSpeed = 0.8 + moveBlend.current * 2.8;
    if (ringARef.current) ringARef.current.rotation.z += delta * ringSpeed;
    if (ringBRef.current) ringBRef.current.rotation.z -= delta * ringSpeed * 0.7;

    // --- Orbiting particles
    const orbitPoints = orbitRef.current;
    if (orbitPoints) {
      const attr = orbitPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < ORBIT_COUNT; i++) {
        const a = orbit.angles[i] + t * (0.8 + moveBlend.current);
        const r = orbit.radii[i];
        const inc = orbit.inclinations[i];
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = 1.0 + Math.sin(a) * r * Math.sin(inc);
        arr[i * 3 + 2] = Math.sin(a) * r * Math.cos(inc);
      }
      attr.needsUpdate = true;
    }

    // --- Idle 💤
    idleTime.current = isMoving ? 0 : idleTime.current + delta;
    const sleep = sleepRef.current;
    if (sleep) {
      const show = idleTime.current > IDLE_EMOJI_DELAY;
      sleep.visible = show;
      if (show) {
        const since = idleTime.current - IDLE_EMOJI_DELAY;
        sleep.position.y = 2.35 + Math.sin(since * 2) * 0.08;
        (sleep.material as THREE.SpriteMaterial).opacity =
          Math.min(1, since) * (0.7 + Math.sin(since * 2) * 0.2);
      }
    }

    // --- Rainbow trail (world space)
    const trailPoints = trailRef.current;
    if (trailPoints) {
      const posAttr = trailPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = trailPoints.geometry.getAttribute('color') as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;

      // Fade all existing points (additive blending → black = invisible)
      const fade = Math.exp(-delta * 1.8);
      for (let i = 0; i < colArr.length; i++) colArr[i] *= fade;

      trailEmitTimer.current += delta;
      if (isMoving && trailEmitTimer.current >= TRAIL_EMIT_INTERVAL) {
        trailEmitTimer.current = 0;
        const head = trailHead.current;
        posArr[head * 3] = characterPosition.x + (Math.random() - 0.5) * 0.15;
        posArr[head * 3 + 1] = characterPosition.y - 0.5 + Math.random() * 0.3;
        posArr[head * 3 + 2] = characterPosition.z + (Math.random() - 0.5) * 0.15;

        const color = new THREE.Color().setHSL((t * 0.5) % 1, 0.9, 0.55);
        colArr[head * 3] = color.r;
        colArr[head * 3 + 1] = color.g;
        colArr[head * 3 + 2] = color.b;

        trailHead.current = (head + 1) % TRAIL_LENGTH;
        posAttr.needsUpdate = true;
      }
      colAttr.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={rootRef}>
        <group ref={bodyRef}>
          {/* Suit silhouette */}
          <mesh position={[0, 0.9, 0]}>
            <capsuleGeometry args={[0.26, 0.6, 4, 12]} />
            <meshStandardMaterial
              color={COLORS.neonCyan}
              emissive={COLORS.neonCyan}
              emissiveIntensity={0.25}
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>

          {/* Energy core */}
          <mesh ref={coreRef} position={[0, 1.0, 0]}>
            <icosahedronGeometry args={[0.22, 1]} />
            <meshStandardMaterial
              color={COLORS.neonCyan}
              emissive={COLORS.neonCyan}
              emissiveIntensity={1.6}
            />
          </mesh>

          {/* Head inside the helmet */}
          <mesh position={[0, 1.68, 0]}>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial
              color="#ffe9c4"
              emissive="#ffd9a0"
              emissiveIntensity={0.7}
            />
          </mesh>

          {/* Astronaut glass helmet */}
          <mesh position={[0, 1.68, 0]}>
            <sphereGeometry args={[0.34, 20, 16]} />
            <meshStandardMaterial
              color="#bfe8ff"
              metalness={0.1}
              roughness={0.05}
              transparent
              opacity={0.16}
              depthWrite={false}
            />
          </mesh>

          {/* Hologram rings */}
          <mesh ref={ringARef} position={[0, 1.0, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[0.55, 0.018, 8, 40]} />
            <meshBasicMaterial color={COLORS.neonCyan} transparent opacity={0.85} />
          </mesh>
          <mesh ref={ringBRef} position={[0, 1.0, 0]} rotation={[-Math.PI / 2.8, 0.4, 0]}>
            <torusGeometry args={[0.68, 0.014, 8, 40]} />
            <meshBasicMaterial color={COLORS.neonMagenta} transparent opacity={0.7} />
          </mesh>

          {/* Orbiting particles — high quality only */}
          {quality === 'high' && (
            <points ref={orbitRef}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={ORBIT_COUNT}
                  array={orbit.positions}
                  itemSize={3}
                />
              </bufferGeometry>
              <pointsMaterial
                size={0.06}
                color={COLORS.neonCyan}
                transparent
                opacity={0.9}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </points>
          )}

          {/* Idle 💤 */}
          <sprite ref={sleepRef} position={[0.35, 2.35, 0]} scale={[0.5, 0.5, 1]} visible={false}>
            <spriteMaterial
              map={getEmojiTexture('💤')}
              transparent
              depthWrite={false}
            />
          </sprite>

          {/* Single glow light */}
          <pointLight
            position={[0, 1, 0]}
            intensity={0.6}
            color={COLORS.neonCyan}
            distance={5}
          />
        </group>
      </group>

      {/* Nyan-cat rainbow trail, world space — high quality only */}
      {quality === 'high' && (
        <points ref={trailRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={TRAIL_LENGTH}
              array={trail.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={TRAIL_LENGTH}
              array={trail.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.22}
            vertexColors
            transparent
            opacity={1}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </>
  );
};
