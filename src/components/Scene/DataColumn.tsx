import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, SPIRAL_CONFIG } from '../../utils/constants';
import { useGalleryStore } from '../../stores/galleryStore';

const TOTAL_HEIGHT = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn;
const COLUMN_HEIGHT = TOTAL_HEIGHT + 8;

// Degen phrases on the rotating hologram ticker. Emoji are not in the SDF
// font drei ships, so the ticker sticks to plain words.
const MEME_PHRASES = ['HODL', 'WAGMI', 'WEN LAMBO', 'DIAMOND HANDS', 'GM', 'TO THE MOON'];
const PHRASE_COLORS = [
  COLORS.neonCyan,
  COLORS.neonMagenta,
  COLORS.neonGold,
  COLORS.pumpGreen,
];

const RISING_PARTICLES = 160;

// Center "data column": slowly rotating torus rings, a stream of particles
// rising like data packets, and a meme ticker with live prices around it.
export const DataColumn = () => {
  const quality = useGalleryStore((s) => s.effectiveQuality);
  const tokens = useGalleryStore((s) => s.tokens);

  const ringsRef = useRef<THREE.Group>(null);
  const tickerRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Live ticker lines: meme phrases interleaved with real top-token prices
  const tickerLines = useMemo(() => {
    const lines: { text: string; color: string }[] = MEME_PHRASES.map((p, i) => ({
      text: p,
      color: PHRASE_COLORS[i % PHRASE_COLORS.length],
    }));
    tokens.slice(0, 3).forEach((t) => {
      const change = t.price_change_percentage_24h ?? 0;
      lines.push({
        text: `${t.symbol.toUpperCase()} ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        color: change >= 0 ? COLORS.pumpGreen : COLORS.dumpRed,
      });
    });
    return lines;
  }, [tokens]);

  // Rising particle stream around the column shell
  const particleData = useMemo(() => {
    const positions = new Float32Array(RISING_PARTICLES * 3);
    const colors = new Float32Array(RISING_PARTICLES * 3);
    const speeds = new Float32Array(RISING_PARTICLES);

    const cyan = new THREE.Color(COLORS.neonCyan);
    const magenta = new THREE.Color(COLORS.neonMagenta);

    for (let i = 0; i < RISING_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.2 + Math.random() * 0.6;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * COLUMN_HEIGHT;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 1.5 + Math.random() * 2.5;

      const color = cyan.clone().lerp(magenta, Math.random());
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, speeds };
  }, []);

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.25;
    }
    if (tickerRef.current) {
      tickerRef.current.rotation.y -= delta * 0.12;
    }

    const points = particlesRef.current;
    if (points) {
      const positionAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const array = positionAttr.array as Float32Array;
      for (let i = 0; i < RISING_PARTICLES; i++) {
        array[i * 3 + 1] += particleData.speeds[i] * delta;
        if (array[i * 3 + 1] > COLUMN_HEIGHT) array[i * 3 + 1] = 0;
      }
      positionAttr.needsUpdate = true;
    }
  });

  return (
    <group name="data-column">
      {/* Column body */}
      <mesh position={[0, COLUMN_HEIGHT / 2 - 2, 0]}>
        <cylinderGeometry args={[2, 2, COLUMN_HEIGHT, 16]} />
        <meshStandardMaterial
          color="#1a2a4a"
          emissive={COLORS.neonCyan}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Slow-spinning data rings — decorative, off on low quality */}
      {quality === 'high' && (
        <group ref={ringsRef}>
          {[0.25, 0.5, 0.75].map((t, i) => (
            <mesh
              key={i}
              position={[0, t * COLUMN_HEIGHT - 2, 0]}
              rotation={[Math.PI / 2 + (i - 1) * 0.18, 0, 0]}
            >
              <torusGeometry args={[2.7, 0.06, 8, 48]} />
              <meshStandardMaterial
                color={i === 1 ? COLORS.neonMagenta : COLORS.neonCyan}
                emissive={i === 1 ? COLORS.neonMagenta : COLORS.neonCyan}
                emissiveIntensity={1.2}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Rising data particles — off on low quality */}
      {quality === 'high' && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={RISING_PARTICLES}
              array={particleData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={RISING_PARTICLES}
              array={particleData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.12}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Meme ticker billboards orbiting the column */}
      <group ref={tickerRef}>
        {tickerLines.map((line, i) => {
          const angle = (i / tickerLines.length) * Math.PI * 2;
          const radius = 3.4;
          const y = 4 + (i % 5) * (TOTAL_HEIGHT / 5);
          return (
            <Text
              key={`${line.text}-${i}`}
              position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
              rotation={[0, -angle - Math.PI / 2, 0]}
              fontSize={0.55}
              color={line.color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {line.text}
            </Text>
          );
        })}
      </group>
    </group>
  );
};
