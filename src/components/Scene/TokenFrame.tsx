import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TokenPosition } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatPrice, getTokenStatus } from '../../utils/formatters';
import { useGalleryStore } from '../../stores/galleryStore';
import { getEmojiTexture, getGlowTexture } from '../../utils/proceduralTextures';

interface TokenFrameProps {
  tokenPosition: TokenPosition;
  isNearest: boolean;
  onClick?: () => void;
}

// LOD thresholds (world units from the character)
const TEXTURE_DISTANCE = 35; // start loading the token image
const DETAIL_DISTANCE = 18; // render text labels (symbol/price/change)
const CHECK_INTERVAL = 0.25; // seconds between distance checks

// Status-effect thresholds (Phase 6.2 / M2)
const PUMP_THRESHOLD = 10; // % 24h — rocket orbits the frame
const DUMP_THRESHOLD = -10; // % 24h — red drip + falling-chart emoji

const DRIP_COUNT = 14;
const CONFETTI_COUNT = 24;
const CONFETTI_COLORS = ['#ffd700', '#00fff5', '#ff00ff', '#00ff88', '#ff7847'];

export const TokenFrame = ({ tokenPosition, isNearest, onClick }: TokenFrameProps) => {
  const { token, position, rotation } = tokenPosition;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const quality = useGalleryStore((s) => s.effectiveQuality);

  // LOD state — flips rarely, so the re-renders are cheap
  const [textureInRange, setTextureInRange] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const worldPos = useMemo(() => new THREE.Vector3(...position), [position]);
  // Random phase so 100 frames don't all run their check on the same frame
  const checkTimer = useRef(Math.random() * CHECK_INTERVAL);
  const time = useRef(Math.random() * 100);

  // Animated décor refs (only animated while in detail range)
  const holoRingRef = useRef<THREE.Mesh>(null);
  const imageFloatRef = useRef<THREE.Group>(null);
  const rocketOrbitRef = useRef<THREE.Group>(null);
  const dripRef = useRef<THREE.Points>(null);
  const fallEmojiRef = useRef<THREE.Sprite>(null);
  const confettiRef = useRef<THREE.Points>(null);
  const crownRef = useRef<THREE.Sprite>(null);

  // Safe access to price change (can be null from API)
  const priceChange = token.price_change_percentage_24h ?? 0;
  const status = getTokenStatus(priceChange);

  // Museum hierarchy: top 10 = hall of fame, rank #1 wears the crown
  const rank = token.market_cap_rank ?? 999;
  const isTop10 = rank <= 10;
  const isKing = rank === 1;
  const isPumping = priceChange > PUMP_THRESHOLD;
  const isDumping = priceChange < DUMP_THRESHOLD;
  const showStatusFx = showDetail && quality === 'high';

  // Red drip particles for dumping tokens
  const dripData = useMemo(() => {
    if (!isDumping) return null;
    const positions = new Float32Array(DRIP_COUNT * 3);
    const speeds = new Float32Array(DRIP_COUNT);
    for (let i = 0; i < DRIP_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = -1.4 - Math.random() * 1.2;
      positions[i * 3 + 2] = 0.15;
      speeds[i] = 0.5 + Math.random() * 0.8;
    }
    return { positions, speeds };
  }, [isDumping]);

  // Gentle confetti rain for the #1 token
  const confettiData = useMemo(() => {
    if (!isKing) return null;
    const positions = new Float32Array(CONFETTI_COUNT * 3);
    const colors = new Float32Array(CONFETTI_COUNT * 3);
    const speeds = new Float32Array(CONFETTI_COUNT);
    const color = new THREE.Color();
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = -2 + Math.random() * 4.5;
      positions[i * 3 + 2] = 0.2 + Math.random() * 0.4;
      speeds[i] = 0.4 + Math.random() * 0.7;
      color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, speeds };
  }, [isKing]);

  // Smoothly ease scale toward target instead of snapping
  const targetScale = (isNearest || hovered ? 1.1 : 1.0) * (isTop10 ? 1.2 : 1.0);
  useFrame((_, delta) => {
    time.current += delta;
    const group = groupRef.current;
    if (group) {
      const next = THREE.MathUtils.damp(group.scale.x, targetScale, 10, delta);
      group.scale.setScalar(next);
    }

    // Animate décor only while in detail range
    if (showDetail) {
      const t = time.current;
      if (holoRingRef.current) holoRingRef.current.rotation.z += delta * 0.9;
      if (imageFloatRef.current) {
        imageFloatRef.current.position.y = Math.sin(t * 1.5) * 0.05;
      }
      if (crownRef.current) {
        crownRef.current.position.y = 2.15 + Math.sin(t * 2) * 0.06;
      }
      if (rocketOrbitRef.current) {
        rocketOrbitRef.current.rotation.y += delta * 1.6;
      }
      if (fallEmojiRef.current) {
        const phase = (t * 0.4) % 1;
        fallEmojiRef.current.position.y = -0.4 + phase * 1.6;
        (fallEmojiRef.current.material as THREE.SpriteMaterial).opacity = 1 - phase;
      }
      const drip = dripRef.current;
      if (drip && dripData) {
        const attr = drip.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = 0; i < DRIP_COUNT; i++) {
          arr[i * 3 + 1] -= dripData.speeds[i] * delta;
          if (arr[i * 3 + 1] < -2.8) arr[i * 3 + 1] = -1.3;
        }
        attr.needsUpdate = true;
      }
      const confetti = confettiRef.current;
      if (confetti && confettiData) {
        const attr = confetti.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = 0; i < CONFETTI_COUNT; i++) {
          arr[i * 3 + 1] -= confettiData.speeds[i] * delta;
          arr[i * 3] += Math.sin(t * 2 + i) * delta * 0.2;
          if (arr[i * 3 + 1] < -2.2) arr[i * 3 + 1] = 2.4;
        }
        attr.needsUpdate = true;
      }
    }

    // Throttled distance check for LOD / lazy texture loading
    checkTimer.current += delta;
    if (checkTimer.current < CHECK_INTERVAL) return;
    checkTimer.current = 0;

    const charPos = useGalleryStore.getState().characterPosition;
    const distance = worldPos.distanceTo(charPos);

    // Textures stay loaded once fetched (three caches them); only the
    // initial fetch is deferred until the player gets close enough
    if (!textureInRange && distance < TEXTURE_DISTANCE) setTextureInRange(true);

    const detail = distance < DETAIL_DISTANCE;
    if (detail !== showDetail) setShowDetail(detail);
  });

  // Memoize frame color to avoid recalculation
  const frameColor = useMemo(() => {
    if (isNearest || hovered) return COLORS.neonCyan;
    if (isTop10) return COLORS.neonGold;
    if (status === 'pump') return COLORS.pumpGreen;
    if (status === 'dump') return COLORS.dumpRed;
    return '#3a4a6a';
  }, [isNearest, hovered, isTop10, status]);

  const glowIntensity = (isNearest || hovered) ? 0.6 : isTop10 ? 0.35 : 0.2;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Warm wall-wash behind the frame — always on, so the corridor reads
          as a row of lit exhibits even from across the atrium */}
      <mesh position={[0, 0.3, -0.18]}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial
          map={getGlowTexture()}
          color={isTop10 ? '#7a6224' : '#4d4430'}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Frame: dark mat board + thin status-colored border. Coloring the
          whole 2.2×3 slab made every frame read as a bare glowing box from
          any oblique angle — the status color belongs on the rim only */}
      <mesh position={[0, 0, -0.09]}>
        <boxGeometry args={[2.36, 3.16, 0.06]} />
        <meshStandardMaterial
          color={frameColor}
          emissive={frameColor}
          emissiveIntensity={glowIntensity}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      {/* Back cover: seen from behind (over a wall top, or past the last
          frame near the end caps) the border box is a full glowing slab —
          cap it with a dark museum-grade backing board */}
      <mesh position={[0, 0, -0.135]}>
        <boxGeometry args={[2.4, 3.2, 0.03]} />
        <meshStandardMaterial color="#101830" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 3, 0.1]} />
        <meshStandardMaterial
          color="#101830"
          emissive={frameColor}
          emissiveIntensity={0.04}
          metalness={0.4}
          roughness={0.55}
        />
      </mesh>

      {/* Exhibition light bar above the frame — cheap box, always visible */}
      <mesh position={[0, 1.7, 0.1]}>
        <boxGeometry args={[1.9, 0.08, 0.15]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff3dd"
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Pedestal — every artifact gets a base; hall of fame gets two tiers.
          Near-black stone: anything lighter shifts sage-green under the warm
          hemisphere light and reads as a bare placeholder box */}
      <mesh position={[0, -1.7, 0.1]}>
        <boxGeometry args={[1.7, 0.8, 0.7]} />
        <meshStandardMaterial
          color="#0d1326"
          metalness={0.6}
          roughness={0.35}
          emissive={isTop10 ? COLORS.neonGold : COLORS.neonCyan}
          emissiveIntensity={0.05}
        />
      </mesh>
      {/* Pedestal cap — a thin lighter lip so the base still has a silhouette */}
      <mesh position={[0, -1.34, 0.1]}>
        <boxGeometry args={[1.8, 0.06, 0.8]} />
        <meshStandardMaterial color="#2a3558" metalness={0.7} roughness={0.3} />
      </mesh>
      {isTop10 && (
        <mesh position={[0, -2.05, 0.1]}>
          <boxGeometry args={[2.3, 0.3, 1.0]} />
          <meshStandardMaterial
            color="#2a2410"
            metalness={0.6}
            roughness={0.35}
            emissive={COLORS.neonGold}
            emissiveIntensity={0.25}
          />
        </mesh>
      )}

      {/* Token image background */}
      <mesh position={[0, 0.5, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Token image — floats gently; texture fetch deferred until in range */}
      <group ref={imageFloatRef}>
        <TokenImage
          url={token.image}
          symbol={token.symbol}
          position={[0, 0.5, 0.01]}
          shouldLoad={textureInRange}
        />
      </group>

      {/* Close-range décor: hologram ring */}
      {showDetail && (
        <>
          {/* Hologram ring slowly spinning around the token image */}
          <mesh ref={holoRingRef} position={[0, 0.5, 0.06]}>
            <torusGeometry args={[0.95, 0.015, 8, 48]} />
            <meshBasicMaterial
              color={isTop10 ? COLORS.neonGold : COLORS.neonCyan}
              transparent
              opacity={0.7}
            />
          </mesh>

        </>
      )}

      {/* 👑 Rank #1 — crown + confetti */}
      {isKing && showDetail && (
        <sprite ref={crownRef} position={[0, 2.15, 0.2]} scale={[0.8, 0.8, 1]}>
          <spriteMaterial map={getEmojiTexture('👑')} transparent depthWrite={false} />
        </sprite>
      )}
      {isKing && showStatusFx && confettiData && (
        <points ref={confettiRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={CONFETTI_COUNT}
              array={confettiData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={CONFETTI_COUNT}
              array={confettiData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.09}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}

      {/* 🚀 Pumping hard — mini rocket orbits the frame */}
      {isPumping && showDetail && (
        <group ref={rocketOrbitRef} position={[0, 0.3, 0]}>
          <sprite position={[1.5, 0.1, 0]} scale={[0.55, 0.55, 1]}>
            <spriteMaterial map={getEmojiTexture('🚀')} transparent depthWrite={false} />
          </sprite>
          <sprite position={[1.41, 0.05, 0.51]} scale={[0.3, 0.3, 1]}>
            <spriteMaterial
              map={getEmojiTexture('🔥')}
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </sprite>
        </group>
      )}

      {/* 📉 Dumping hard — red drip + rising loss emoji */}
      {isDumping && showStatusFx && dripData && (
        <points ref={dripRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={DRIP_COUNT}
              array={dripData.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.08}
            color={COLORS.dumpRed}
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
      {isDumping && showDetail && (
        <sprite ref={fallEmojiRef} position={[0.9, 0, 0.2]} scale={[0.4, 0.4, 1]}>
          <spriteMaterial
            map={getEmojiTexture(token.id.length % 2 === 0 ? '📉' : '💀')}
            transparent
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Text labels only render at close range (full LOD) */}
      {showDetail && (
        <>
          {/* Token name */}
          <Text
            position={[0, -0.7, 0.01]}
            fontSize={0.2}
            color={COLORS.white}
            anchorX="center"
            anchorY="middle"
          >
            {token.symbol.toUpperCase()}
          </Text>

          {/* Price */}
          <Text
            position={[0, -1, 0.01]}
            fontSize={0.15}
            color={COLORS.neonCyan}
            anchorX="center"
            anchorY="middle"
          >
            {formatPrice(token.current_price)}
          </Text>

          {/* 24h change */}
          <Text
            position={[0, -1.3, 0.01]}
            fontSize={0.14}
            color={priceChange >= 0 ? COLORS.pumpGreen : COLORS.dumpRed}
            anchorX="center"
            anchorY="middle"
          >
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </Text>

          {/* Hall-of-fame rank plaque */}
          {isTop10 && (
            <Text
              position={[0, 1.35, 0.06]}
              fontSize={0.22}
              color={COLORS.neonGold}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              {`#${rank}`}
            </Text>
          )}
        </>
      )}
    </group>
  );
};

// Token image with lazy loading and a branded fallback
const TokenImage = ({
  url,
  symbol,
  position,
  shouldLoad,
}: {
  url: string;
  symbol: string;
  position: [number, number, number];
  shouldLoad: boolean;
}) => {
  const [hasError, setHasError] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const loadingRef = useRef(false);

  // Load texture once, only when the player is close enough
  useEffect(() => {
    if (!url || !shouldLoad || loadingRef.current) return;

    loadingRef.current = true;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      url,
      (loadedTexture) => {
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        setHasError(true);
      }
    );
  }, [url, shouldLoad]);

  // Placeholder (not loaded yet or failed): neon ring with the token's initials
  if (hasError || !texture) {
    return (
      <group position={position}>
        <mesh>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial color={COLORS.neonCyan} transparent opacity={0.5} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#16213e" transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.35}
          color={COLORS.neonCyan}
          anchorX="center"
          anchorY="middle"
        >
          {symbol.slice(0, 3).toUpperCase()}
        </Text>
      </group>
    );
  }

  return (
    <mesh position={position}>
      <circleGeometry args={[0.7, 32]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};
