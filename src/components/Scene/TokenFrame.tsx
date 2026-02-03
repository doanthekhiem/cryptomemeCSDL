import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TokenPosition } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatPrice, formatMarketCap, getTokenStatus } from '../../utils/formatters';
import { Spring, oscillation } from '../../utils/animation';

interface TokenFrameProps {
  tokenPosition: TokenPosition;
  isNearest: boolean;
  onClick?: () => void;
}

export const TokenFrame = ({ tokenPosition, isNearest, onClick }: TokenFrameProps) => {
  const { token, position, rotation } = tokenPosition;
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  // Springs for smooth animations
  const hoverSpring = useRef(new Spring(150, 15, 1));
  const glowSpring = useRef(new Spring(100, 12, 0.2));

  // Safe access to price change (can be null from API)
  const priceChange = token.price_change_percentage_24h ?? 0;
  const status = getTokenStatus(priceChange);

  // Improved animation with springs and oscillation
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const elapsed = state.clock.elapsedTime;

    if (groupRef.current) {
      // Update hover spring
      hoverSpring.current.target = (isNearest || hovered) ? 1.08 : 1.0;
      const hoverScale = hoverSpring.current.update(dt);

      // Update glow spring
      glowSpring.current.target = (isNearest || hovered) ? 0.8 : 0.2;
      glowSpring.current.update(dt);

      // Pump/dump pulse effect
      let pulseScale = 1;
      if (status === 'pump') {
        pulseScale = oscillation.breathing(elapsed, 1.5, 0.98, 1.05);
      } else if (status === 'dump') {
        pulseScale = oscillation.breathing(elapsed, 2, 0.95, 1.02);
      }

      groupRef.current.scale.setScalar(hoverScale * pulseScale);

      // Subtle floating animation when nearest
      if (isNearest) {
        const floatY = oscillation.sine(elapsed, 0.5, 0.02);
        groupRef.current.position.y = position[1] + floatY;
      } else {
        groupRef.current.position.y = position[1];
      }
    }

    // Animate light
    if (lightRef.current) {
      const baseIntensity = (isNearest || hovered) ? 1.2 : 0.4;
      const pulse = status !== 'neutral'
        ? oscillation.pulse(elapsed, 2, 3) * 0.4
        : 0;
      lightRef.current.intensity = baseIntensity + pulse;
    }
  });

  // Determine frame color based on state
  const getFrameColor = () => {
    if (isNearest || hovered) return COLORS.neonCyan;
    if (status === 'pump') return COLORS.pumpGreen;
    if (status === 'dump') return COLORS.dumpRed;
    return '#3a4a6a'; // Brighter default color
  };

  const getGlowIntensity = () => {
    if (isNearest || hovered) return 0.8;
    if (status === 'pump' || status === 'dump') return 0.5;
    return 0.2;
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Frame border - outer glow */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[2.4, 3.2, 0.05]} />
        <meshBasicMaterial
          color={getFrameColor()}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Frame background - main */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 3, 0.1]} />
        <meshStandardMaterial
          color={getFrameColor()}
          emissive={getFrameColor()}
          emissiveIntensity={getGlowIntensity()}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Token image background - white for contrast */}
      <mesh position={[0, 0.5, 0]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Outer ring around token image */}
      <mesh position={[0, 0.5, 0.005]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.72, 0.8, 32]} />
        <meshBasicMaterial color={getFrameColor()} />
      </mesh>

      {/* Token image */}
      <TokenImage url={token.image} position={[0, 0.5, 0.01]} />

      {/* Token name */}
      <Text
        position={[0, -0.7, 0.01]}
        fontSize={0.18}
        color={COLORS.white}
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {token.symbol.toUpperCase()}
      </Text>

      {/* Price */}
      <Text
        position={[0, -1, 0.01]}
        fontSize={0.14}
        color={COLORS.neonCyan}
        anchorX="center"
        anchorY="middle"
      >
        {formatPrice(token.current_price)}
      </Text>

      {/* Market cap */}
      <Text
        position={[0, -1.25, 0.01]}
        fontSize={0.1}
        color={COLORS.gray}
        anchorX="center"
        anchorY="middle"
      >
        MCap: {formatMarketCap(token.market_cap)}
      </Text>

      {/* 24h change */}
      <Text
        position={[0, -1.45, 0.01]}
        fontSize={0.12}
        color={priceChange >= 0 ? COLORS.pumpGreen : COLORS.dumpRed}
        anchorX="center"
        anchorY="middle"
      >
        {priceChange >= 0 ? '+' : ''}
        {priceChange.toFixed(2)}%
      </Text>

      {/* Local point light for each frame */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 1.5]}
        intensity={isNearest || hovered ? 1 : 0.3}
        color={getFrameColor()}
        distance={5}
        decay={1.5}
      />
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
