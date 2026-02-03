import { useRef, useState, useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TokenPosition } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatPrice, getTokenStatus } from '../../utils/formatters';

interface TokenFrameProps {
  tokenPosition: TokenPosition;
  isNearest: boolean;
  onClick?: () => void;
}

export const TokenFrame = ({ tokenPosition, isNearest, onClick }: TokenFrameProps) => {
  const { token, position, rotation } = tokenPosition;
  const [hovered, setHovered] = useState(false);

  // Safe access to price change (can be null from API)
  const priceChange = token.price_change_percentage_24h ?? 0;
  const status = getTokenStatus(priceChange);

  // Compute scale based on state - no animation, instant
  const scale = (isNearest || hovered) ? 1.1 : 1.0;

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
      position={position}
      rotation={rotation}
      scale={scale}
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

      {/* Token image */}
      <TokenImage url={token.image} position={[0, 0.5, 0.01]} />

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
    </group>
  );
};

// Separate component for token image with error handling
const TokenImage = ({ url, position }: { url: string; position: [number, number, number] }) => {
  const [hasError, setHasError] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const loadingRef = useRef(false);

  // Load texture once
  useEffect(() => {
    if (!url || loadingRef.current) return;

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
  }, [url]);

  // Fallback - glowing coin icon
  if (hasError || !texture) {
    return (
      <group position={position}>
        {/* Outer glow ring */}
        <mesh>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial color={COLORS.neonCyan} transparent opacity={0.5} />
        </mesh>
        {/* Inner circle */}
        <mesh>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color={COLORS.neonCyan} transparent opacity={0.8} />
        </mesh>
        {/* Dollar sign or coin symbol */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          $
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
