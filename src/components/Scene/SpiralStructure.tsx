import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, MUSEUM_CONFIG, SPIRAL_CONFIG } from '../../utils/constants';
import {
  createSpiralRampGeometry,
  createInnerWallGeometry,
  createOuterWallGeometry,
  createRampStripGeometry,
  createSpiralBandGeometry,
  createWallBandGeometry,
  getWindowOpenings,
  getRoofRange,
  getSkylightOpening,
} from '../../utils/spiralGenerator';
import {
  getEmojiTexture,
  getFloorTexture,
  getWallPanelTexture,
} from '../../utils/proceduralTextures';
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
    float turns = vUv.y * float(${SPIRAL_CONFIG.totalTurns});
    float hue = fract(turns - uTime * 0.18);
    vec3 color = hsv2rgb(vec3(hue, 0.85, 1.0));

    // Hall-of-fame red carpet: the final turn trades the rainbow for
    // scrolling gold-red stripes announcing the top-10 gallery
    float stripe = 0.5 + 0.5 * sin((turns - uTime * 0.12) * 24.0);
    vec3 carpet = mix(vec3(1.0, 0.82, 0.1), vec3(0.85, 0.08, 0.12), stripe);
    float carpetMix = smoothstep(
      float(${SPIRAL_CONFIG.totalTurns}) - 1.05,
      float(${SPIRAL_CONFIG.totalTurns}) - 0.95,
      turns
    );
    color = mix(color, carpet, carpetMix);

    gl_FragColor = vec4(color, 0.9);
  }
`;

// Candlestick wall décor: green/red chart candles as architecture.
// Deterministic pseudo-random heights so the wall is stable across renders.
const pseudoRandom = (i: number) =>
  ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

// Candles form a continuous random-walk price chart wrapping the wall —
// each candle's body spans from the previous close to the next, with a
// slight upward bias (we ARE going to the moon). Random scattered candles
// read as floating debris; a walk reads as an actual chart.
const buildCandlesticks = () => {
  const { outerRadius, heightPerTurn, totalTurns } = SPIRAL_CONFIG;
  const perTurn = 48; // one candle every 7.5°
  const total = perTurn * totalTurns;
  const openings = getWindowOpenings();

  const green: THREE.Matrix4[] = [];
  const red: THREE.Matrix4[] = [];
  const wicks: THREE.Matrix4[] = [];

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);

  const clamp01 = (v: number) => Math.min(0.92, Math.max(0.08, v));
  let level = 0.4; // normalized price level within the chart band

  for (let i = 0; i < total; i++) {
    const angle = (i / perTurn) * Math.PI * 2;
    const r1 = pseudoRandom(i);

    // Advance the walk even when the candle itself is skipped, so the
    // chart stays continuous across window openings
    const next = clamp01(level + (r1 - 0.47) * 0.34);
    const open = level;
    level = next;

    if (openings.some((o) => angle > o.start - 0.06 && angle < o.end + 0.06)) {
      continue;
    }

    const baseHeight = (angle / (Math.PI * 2)) * heightPerTurn;
    const bandBottom = baseHeight + 1.3;
    const bandScale = 1.8; // chart band spans 1.3 → 3.1 above the ramp

    const isUp = next >= open;
    const bodyHeight = Math.max(Math.abs(next - open) * bandScale, 0.1);
    const y = bandBottom + ((open + next) / 2) * bandScale;
    const x = Math.cos(angle) * (outerRadius - 0.12);
    const z = Math.sin(angle) * (outerRadius - 0.12);

    quaternion.setFromAxisAngle(up, -angle);

    matrix.compose(
      new THREE.Vector3(x, y, z),
      quaternion,
      new THREE.Vector3(1, bodyHeight, 1)
    );
    (isUp ? green : red).push(matrix.clone());

    matrix.compose(
      new THREE.Vector3(x, y, z),
      quaternion,
      new THREE.Vector3(1, bodyHeight + 0.35, 1)
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

  // Roof over the top turn — the floor helix extended one extra turn, with
  // the skylight cut out of its last stretch right above the summit.
  // Lower turns are already covered by the next turn's floor (wallHeight ===
  // heightPerTurn makes the corridor self-sealing).
  const museum = useMemo(() => {
    const { innerRadius, outerRadius, heightPerTurn, totalTurns, wallHeight } =
      SPIRAL_CONFIG;
    const roof = getRoofRange();
    const sky = getSkylightOpening();

    const roofGeometries = [
      // Main roof run, up to the skylight
      createSpiralBandGeometry(innerRadius, outerRadius, 0, roof.start, sky.start),
      // Side bands flanking the skylight opening
      createSpiralBandGeometry(
        innerRadius, MUSEUM_CONFIG.skylightInnerRadius, 0, sky.start, sky.end
      ),
      createSpiralBandGeometry(
        MUSEUM_CONFIG.skylightOuterRadius, outerRadius, 0, sky.start, sky.end
      ),
    ];

    const skylightGlassGeometry = createSpiralBandGeometry(
      MUSEUM_CONFIG.skylightInnerRadius,
      MUSEUM_CONFIG.skylightOuterRadius,
      -0.02,
      sky.start,
      sky.end
    );
    const skylightRimGeometries = [
      createSpiralBandGeometry(
        MUSEUM_CONFIG.skylightInnerRadius - 0.3,
        MUSEUM_CONFIG.skylightInnerRadius,
        -0.05, sky.start, sky.end
      ),
      createSpiralBandGeometry(
        MUSEUM_CONFIG.skylightOuterRadius,
        MUSEUM_CONFIG.skylightOuterRadius + 0.3,
        -0.05, sky.start, sky.end
      ),
    ];

    // Gallery light strip running under every ceiling (the ceiling of turn k
    // is the floor of turn k+1, ending at the roof). Stops at the skylight.
    const ceilingStripGeometry = createSpiralBandGeometry(
      13.8, 14.2,
      heightPerTurn - 0.05,
      0,
      totalTurns * Math.PI * 2 - MUSEUM_CONFIG.skylightArc
    );

    // Windows on the outer wall: glass pane + neon frame per opening.
    // The last opening in the list is the Earth window (turn 0).
    const windows = getWindowOpenings().map((o, i, all) => {
      const isEarth = i === all.length - 1;
      const { windowSill: sill, windowTop: top } = MUSEUM_CONFIG;
      const r = outerRadius - 0.08;
      const rFrame = outerRadius - 0.14;
      const post = 0.025;
      return {
        isEarth,
        glass: createWallBandGeometry(r, o.start, o.end, sill, top),
        frame: [
          createWallBandGeometry(rFrame, o.start, o.end, sill - 0.1, sill + 0.04),
          createWallBandGeometry(rFrame, o.start, o.end, top - 0.04, top + 0.1),
          createWallBandGeometry(rFrame, o.start - post, o.start + post, sill - 0.1, top + 0.1),
          createWallBandGeometry(rFrame, o.end - post, o.end + post, sill - 0.1, top + 0.1),
        ],
      };
    });

    // End caps: the corridor cross-section at angle 0 — entrance at the
    // bottom (faces +z) and summit at the top (faces -z)
    const capWidth = outerRadius - innerRadius + 0.6;
    const capCenterX = (innerRadius + outerRadius) / 2;
    const caps = {
      width: capWidth,
      height: wallHeight + 0.6,
      x: capCenterX,
      bottomY: wallHeight / 2 - 0.2,
      topY: totalTurns * heightPerTurn + wallHeight / 2 - 0.2,
    };

    return {
      roofGeometries,
      skylightGlassGeometry,
      skylightRimGeometries,
      ceilingStripGeometry,
      windows,
      caps,
    };
  }, []);

  const roofMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#131a30',
        metalness: 0.3,
        roughness: 0.7,
        side: THREE.DoubleSide,
        emissive: COLORS.neonPurple,
        emissiveIntensity: 0.03,
      }),
    []
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#9fd8ff',
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  const goldFrameMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: COLORS.neonGold, side: THREE.DoubleSide }),
    []
  );
  const cyanFrameMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: COLORS.neonCyan, side: THREE.DoubleSide }),
    []
  );
  const ceilingLightMaterial = useMemo(
    // Kept dim — at glancing angles the strip fills a lot of screen and
    // anything brighter reads as a giant blown-out arc across the ceiling
    () => new THREE.MeshBasicMaterial({ color: '#6e6549', side: THREE.DoubleSide }),
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

  // Polished stone floor tiled along the spiral
  const rampMaterial = useMemo(() => {
    const floorTexture = getFloorTexture().clone();
    floorTexture.needsUpdate = true;
    floorTexture.repeat.set(4, 30); // uv.y spans totalTurns → ~3 m tiles
    return new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: '#c8d2ee',
      metalness: 0.35,
      roughness: 0.45,
      side: THREE.DoubleSide,
      emissive: COLORS.neonCyan,
      emissiveIntensity: 0.02,
    });
  }, []);

  // Wall uv.x = 1 per turn; clone the panel texture per wall so each gets
  // panels of roughly equal world width despite different circumferences
  const makeWallMaterial = (panelsPerTurn: number) => {
    const panelTexture = getWallPanelTexture().clone();
    panelTexture.needsUpdate = true;
    panelTexture.repeat.set(panelsPerTurn, 1);
    return new THREE.MeshStandardMaterial({
      map: panelTexture,
      color: '#d3dcf4',
      metalness: 0.15,
      roughness: 0.75,
      side: THREE.DoubleSide,
      emissive: '#46538a',
      emissiveIntensity: 0.07,
    });
  };
  const innerWallMaterial = useMemo(() => makeWallMaterial(20), []);
  const outerWallMaterial = useMemo(() => makeWallMaterial(48), []);

  // Baseboard + LED skirting line hugging the foot of both walls — strong
  // horizontal lines give the corridor scale and depth
  const skirting = useMemo(() => {
    const fullArc = SPIRAL_CONFIG.totalTurns * Math.PI * 2;
    const rIn = SPIRAL_CONFIG.innerRadius + 0.05;
    const rOut = SPIRAL_CONFIG.outerRadius - 0.05;
    return {
      boards: [
        createWallBandGeometry(rIn, 0, fullArc, 0, 0.3),
        createWallBandGeometry(rOut, 0, fullArc, 0, 0.3),
      ],
      leds: [
        createWallBandGeometry(rIn, 0, fullArc, 0.3, 0.37),
        createWallBandGeometry(rOut, 0, fullArc, 0.3, 0.37),
      ],
    };
  }, []);
  const baseboardMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0c1124',
        metalness: 0.5,
        roughness: 0.4,
        side: THREE.DoubleSide,
      }),
    []
  );
  const ledMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: '#1ec8c0', side: THREE.DoubleSide }),
    []
  );

  // Candlestick wall décor — skipped entirely on low quality
  const candles = useMemo(() => {
    if (quality === 'low') return null;

    const { green, red, wicks } = buildCandlesticks();
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.1);
    const wickGeometry = new THREE.BoxGeometry(0.06, 1, 0.06);

    const greenMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.pumpGreen,
      emissive: COLORS.pumpGreen,
      emissiveIntensity: 0.85,
    });
    const redMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.dumpRed,
      emissive: COLORS.dumpRed,
      emissiveIntensity: 0.85,
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
        material={innerWallMaterial}
        receiveShadow
        name="inner-wall"
      />

      {/* Outer Wall */}
      <mesh
        geometry={outerWallGeometry}
        material={outerWallMaterial}
        receiveShadow
        name="outer-wall"
      />

      {/* Baseboards + LED skirting along both walls */}
      {skirting.boards.map((g, i) => (
        <mesh key={`board-${i}`} geometry={g} material={baseboardMaterial} />
      ))}
      {skirting.leds.map((g, i) => (
        <mesh key={`led-${i}`} geometry={g} material={ledMaterial} />
      ))}

      {/* Rainbow road edge bands */}
      <mesh geometry={innerStripGeometry} material={rainbowMaterial} />
      <mesh geometry={outerStripGeometry} material={rainbowMaterial} />

      {/* Roof over the top turn (with skylight cutout) */}
      {museum.roofGeometries.map((g, i) => (
        <mesh key={`roof-${i}`} geometry={g} material={roofMaterial} />
      ))}
      <mesh geometry={museum.skylightGlassGeometry} material={glassMaterial} />
      {museum.skylightRimGeometries.map((g, i) => (
        <mesh key={`skyrim-${i}`} geometry={g} material={goldFrameMaterial} />
      ))}

      {/* Gallery light strip under every ceiling */}
      <mesh geometry={museum.ceilingStripGeometry} material={ceilingLightMaterial} />

      {/* Central atrium caps: the inner wall is a helix, so its downhill
          stretches sit below eye level and the r<8 atrium is visible from
          the corridor — close its top and bottom so no sky/void leaks in.
          (The DataColumn becomes the atrium's centerpiece installation.) */}
      <mesh
        position={[0, (SPIRAL_CONFIG.totalTurns + 1) * SPIRAL_CONFIG.heightPerTurn, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={roofMaterial}
      >
        <circleGeometry args={[SPIRAL_CONFIG.innerRadius + 0.3, 48]} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={roofMaterial}>
        <circleGeometry args={[SPIRAL_CONFIG.innerRadius + 0.3, 48]} />
      </mesh>
      {/* The helical inner wall only covers the r=8 cylinder between
          ramp(φ) and ramp(φ)+24 — drum bands close the spiral-shaped gaps
          left at the very top (below the cap) and the very bottom */}
      <mesh
        position={[0, SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn +
          SPIRAL_CONFIG.heightPerTurn / 2, 0]}
        material={roofMaterial}
      >
        <cylinderGeometry
          args={[
            SPIRAL_CONFIG.innerRadius + 0.05,
            SPIRAL_CONFIG.innerRadius + 0.05,
            SPIRAL_CONFIG.heightPerTurn,
            48, 1, true,
          ]}
        />
      </mesh>
      <mesh position={[0, SPIRAL_CONFIG.heightPerTurn / 2, 0]} material={roofMaterial}>
        <cylinderGeometry
          args={[
            SPIRAL_CONFIG.innerRadius + 0.05,
            SPIRAL_CONFIG.innerRadius + 0.05,
            SPIRAL_CONFIG.heightPerTurn,
            48, 1, true,
          ]}
        />
      </mesh>

      {/* Windows: frosted glass + neon frames (gold = Moon, cyan = Earth) */}
      {museum.windows.map((w, i) => (
        <group key={`window-${i}`}>
          <mesh geometry={w.glass} material={glassMaterial} />
          {w.frame.map((g, j) => (
            <mesh
              key={j}
              geometry={g}
              material={w.isEarth ? cyanFrameMaterial : goldFrameMaterial}
            />
          ))}
        </group>
      ))}

      {/* End caps sealing both ends of the spiral, with neon signs so the
          dead ends read as entrance/summit instead of glitches */}
      <mesh position={[museum.caps.x, museum.caps.bottomY, 0]}>
        <planeGeometry args={[museum.caps.width, museum.caps.height]} />
        <meshStandardMaterial
          color="#131a30"
          metalness={0.3}
          roughness={0.7}
          side={THREE.DoubleSide}
          emissive={COLORS.neonCyan}
          emissiveIntensity={0.03}
        />
      </mesh>
      <group position={[museum.caps.x, museum.caps.bottomY + 0.9, 0.02]}>
        {/* Portal rings turn the dead-end wall into a destination */}
        <mesh position={[0, -0.6, 0.03]}>
          <torusGeometry args={[1.85, 0.045, 10, 64]} />
          <meshBasicMaterial color={COLORS.neonCyan} />
        </mesh>
        <mesh position={[0, -0.6, 0.02]}>
          <torusGeometry args={[2.1, 0.02, 8, 64]} />
          <meshBasicMaterial color={COLORS.neonMagenta} transparent opacity={0.5} />
        </mesh>
        <Text
          fontSize={0.7}
          color={COLORS.neonCyan}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#003c3a"
        >
          ENTRANCE
        </Text>
        <sprite position={[0, -1.2, 0]} scale={[1.1, 1.1, 1]}>
          <spriteMaterial map={getEmojiTexture('🌀')} transparent depthWrite={false} />
        </sprite>
      </group>

      <mesh position={[museum.caps.x, museum.caps.topY, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[museum.caps.width, museum.caps.height]} />
        <meshStandardMaterial
          color="#131a30"
          metalness={0.3}
          roughness={0.7}
          side={THREE.DoubleSide}
          emissive={COLORS.neonGold}
          emissiveIntensity={0.04}
        />
      </mesh>
      <group
        position={[museum.caps.x, museum.caps.topY + 0.9, -0.02]}
        rotation={[0, Math.PI, 0]}
      >
        <mesh position={[0, -0.6, 0.03]}>
          <torusGeometry args={[1.85, 0.045, 10, 64]} />
          <meshBasicMaterial color={COLORS.neonGold} />
        </mesh>
        <mesh position={[0, -0.6, 0.02]}>
          <torusGeometry args={[2.1, 0.02, 8, 64]} />
          <meshBasicMaterial color="#ffae3d" transparent opacity={0.5} />
        </mesh>
        <Text
          fontSize={0.7}
          color={COLORS.neonGold}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#3a2c00"
        >
          SUMMIT
        </Text>
        <sprite position={[0, -1.2, 0]} scale={[1.1, 1.1, 1]}>
          <spriteMaterial map={getEmojiTexture('🌕')} transparent depthWrite={false} />
        </sprite>
      </group>

      {/* Candlestick chart décor on the outer wall */}
      {candles?.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
};
