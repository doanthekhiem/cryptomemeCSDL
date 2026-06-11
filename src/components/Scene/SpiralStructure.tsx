import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, SPIRAL_CONFIG } from '../../utils/constants';
import {
  createSpiralRampGeometry,
  createInnerWallGeometry,
  createOuterWallGeometry,
  createRampStripGeometry,
} from '../../utils/spiralGenerator';
import { getGridTexture } from '../../utils/proceduralTextures';
import { useGalleryStore } from '../../stores/galleryStore';

// Scrolling rainbow shader for the ramp edge bands (nyan-cat road).
// uv.y = progress along the whole spiral, so the hue wraps once per turn.
const RAINBOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RAINBOW_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    float hue = fract(vUv.y * float(${SPIRAL_CONFIG.totalTurns}) - uTime * 0.18);
    vec3 color = hsv2rgb(vec3(hue, 0.85, 1.0));
    gl_FragColor = vec4(color, 0.9);
  }
`;

// Candlestick wall décor: green/red chart candles as architecture.
// Deterministic pseudo-random heights so the wall is stable across renders.
const pseudoRandom = (i: number) =>
  ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

const buildCandlesticks = () => {
  const { outerRadius, heightPerTurn, totalTurns } = SPIRAL_CONFIG;
  const perTurn = 36; // one candle every 10°
  const total = perTurn * totalTurns;

  const green: THREE.Matrix4[] = [];
  const red: THREE.Matrix4[] = [];
  const wicks: THREE.Matrix4[] = [];

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < total; i++) {
    const angle = (i / perTurn) * Math.PI * 2;
    const baseHeight = (angle / (Math.PI * 2)) * heightPerTurn;
    const r1 = pseudoRandom(i);
    const r2 = pseudoRandom(i + 1000);

    const bodyHeight = 0.6 + r1 * 1.4;
    const y = baseHeight + 1.2 + r2 * 1.2;
    const x = Math.cos(angle) * (outerRadius - 0.12);
    const z = Math.sin(angle) * (outerRadius - 0.12);

    quaternion.setFromAxisAngle(up, -angle);

    matrix.compose(
      new THREE.Vector3(x, y, z),
      quaternion,
      new THREE.Vector3(1, bodyHeight, 1)
    );
    (r1 > 0.5 ? green : red).push(matrix.clone());

    matrix.compose(
      new THREE.Vector3(x, y, z),
      quaternion,
      new THREE.Vector3(1, bodyHeight + 0.8, 1)
    );
    wicks.push(matrix.clone());
  }

  return { green, red, wicks };
};

const makeInstanced = (
  matrices: THREE.Matrix4[],
  geometry: THREE.BufferGeometry,
  material: THREE.Material
) => {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
};

export const SpiralStructure = () => {
  const quality = useGalleryStore((s) => s.effectiveQuality);

  // Memoize geometries to avoid recreating on every render
  const rampGeometry = useMemo(() => createSpiralRampGeometry(), []);
  const innerWallGeometry = useMemo(() => createInnerWallGeometry(), []);
  const outerWallGeometry = useMemo(() => createOuterWallGeometry(), []);

  // Rainbow road bands hugging both edges of the ramp
  const innerStripGeometry = useMemo(
    () => createRampStripGeometry(
      SPIRAL_CONFIG.innerRadius + 0.1,
      SPIRAL_CONFIG.innerRadius + 0.55
    ),
    []
  );
  const outerStripGeometry = useMemo(
    () => createRampStripGeometry(
      SPIRAL_CONFIG.outerRadius - 0.55,
      SPIRAL_CONFIG.outerRadius - 0.1
    ),
    []
  );

  const rainbowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: RAINBOW_VERTEX,
        fragmentShader: RAINBOW_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += delta;
    rainbowMaterial.uniforms.uTime.value = timeRef.current;
  });

  // Floor with a faint procedural grid (tiled along the spiral)
  const rampMaterial = useMemo(() => {
    const gridTexture = getGridTexture();
    gridTexture.repeat.set(3, SPIRAL_CONFIG.segments / 6);
    return new THREE.MeshStandardMaterial({
      map: gridTexture,
      color: '#9fb4e8',
      metalness: 0.4,
      roughness: 0.5,
      side: THREE.DoubleSide,
      emissive: COLORS.neonCyan,
      emissiveIntensity: 0.04,
    });
  }, []);

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e2d4a',
        metalness: 0.3,
        roughness: 0.6,
        side: THREE.DoubleSide,
        emissive: COLORS.neonPurple,
        emissiveIntensity: 0.02,
      }),
    []
  );

  // Candlestick wall décor — skipped entirely on low quality
  const candles = useMemo(() => {
    if (quality === 'low') return null;

    const { green, red, wicks } = buildCandlesticks();
    const bodyGeometry = new THREE.BoxGeometry(0.34, 1, 0.07);
    const wickGeometry = new THREE.BoxGeometry(0.05, 1, 0.05);

    const greenMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.pumpGreen,
      emissive: COLORS.pumpGreen,
      emissiveIntensity: 0.55,
    });
    const redMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.dumpRed,
      emissive: COLORS.dumpRed,
      emissiveIntensity: 0.55,
    });
    const wickMaterial = new THREE.MeshBasicMaterial({
      color: '#cfd8ea',
      transparent: true,
      opacity: 0.45,
    });

    return [
      makeInstanced(green, bodyGeometry, greenMaterial),
      makeInstanced(red, bodyGeometry, redMaterial),
      makeInstanced(wicks, wickGeometry, wickMaterial),
    ];
  }, [quality]);

  return (
    <group name="spiral-structure">
      {/* Ramp/Floor */}
      <mesh
        geometry={rampGeometry}
        material={rampMaterial}
        receiveShadow
        name="spiral-ramp"
      />

      {/* Inner Wall */}
      <mesh
        geometry={innerWallGeometry}
        material={wallMaterial}
        receiveShadow
        name="inner-wall"
      />

      {/* Outer Wall */}
      <mesh
        geometry={outerWallGeometry}
        material={wallMaterial}
        receiveShadow
        name="outer-wall"
      />

      {/* Rainbow road edge bands */}
      <mesh geometry={innerStripGeometry} material={rainbowMaterial} />
      <mesh geometry={outerStripGeometry} material={rainbowMaterial} />

      {/* Candlestick chart décor on the outer wall */}
      {candles?.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
};
