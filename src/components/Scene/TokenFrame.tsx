import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TokenPosition } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatPrice, getTokenStatus } from '../../utils/formatters';
import { useGalleryStore } from '../../stores/galleryStore';

interface TokenFrameProps {
  tokenPosition: TokenPosition;
  isNearest: boolean;
  onClick?: () => void;
}

// LOD thresholds (world units from the character)
const TEXTURE_DISTANCE = 35; // start loading the token image
const DETAIL_DISTANCE = 18; // render text labels (symbol/price/change)
const CHECK_INTERVAL = 0.25; // seconds between distance checks

export const TokenFrame = ({ tokenPosition, isNearest, onClick }: TokenFrameProps) => {
  const { token, position, rotation } = tokenPosition;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // LOD state — flips rarely, so the re-renders are cheap
  const [textureInRange, setTextureInRange] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const worldPos = useMemo(() => new THREE.Vector3(...position), [position]);
  // Random phase so 100 frames don't all run their check on the same frame
  const checkTimer = useRef(Math.random() * CHECK_INTERVAL);

  // Safe access to price change (can be null from API)
  const priceChange = token.price_change_percentage_24h ?? 0;
  const status = getTokenStatus(priceChange);

  // Smoothly ease scale toward target instead of snapping
  const targetScale = isNearest || hovered ? 1.1 : 1.0;
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (group) {
      const next = THREE.MathUtils.damp(group.scale.x, targetScale, 10, delta);
      group.scale.setScalar(next);
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
    if (status === 'pump') return COLORS.pumpGreen;
    if (status === 'dump') return COLORS.dumpRed;
    return '#3a4a6a';
  }, [isNearest, hovered, status]);

  const glowIntensity = (isNearest || hovered) ? 0.6 : 0.2;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Frame background - single mesh */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 3, 0.1]} />
        <meshStandardMaterial
          color={frameColor}
          emissive={frameColor}
          emissiveIntensity={glowIntensity}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Token image background */}
      <mesh position={[0, 0.5, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Token image — texture fetch deferred until the player is in range */}
      <TokenImage
        url={token.image}
        symbol={token.symbol}
        position={[0, 0.5, 0.01]}
        shouldLoad={textureInRange}
      />

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
