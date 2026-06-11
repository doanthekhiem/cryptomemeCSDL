import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPIRAL_CONFIG } from '../../utils/constants';
import {
  getMoonTexture,
  getEarthTexture,
  getGlowTexture,
} from '../../utils/proceduralTextures';

const TOTAL_HEIGHT = SPIRAL_CONFIG.totalTurns * SPIRAL_CONFIG.heightPerTurn;

// Nebula gradient: purple horizon fading to near-black overhead, with a
// faint magenta cloud band. ShaderMaterial ignores scene fog by default,
// which is what we want — the sky must not be fogged out.
const NEBULA_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float h = vDir.y * 0.5 + 0.5; // 0 bottom → 1 top
    vec3 horizon = vec3(0.16, 0.04, 0.30); // deep purple
    vec3 zenith = vec3(0.02, 0.02, 0.06); // near black
    vec3 color = mix(horizon, zenith, smoothstep(0.25, 0.85, h));

    // soft magenta nebula band
    float band = exp(-pow((vDir.y - 0.15) * 4.0, 2.0));
    float swirl = 0.5 + 0.5 * sin(vDir.x * 6.0 + vDir.z * 4.0);
    color += vec3(0.35, 0.05, 0.45) * band * swirl * 0.35;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// "To The Moon" sky: the spiral is a literal climb from Earth (far below)
// to the glowing Moon hovering above the top of the spiral.
export const MoonAndSky = () => {
  const moonRef = useRef<THREE.Mesh>(null);
  const earthRef = useRef<THREE.Mesh>(null);

  const nebulaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERTEX,
        fragmentShader: NEBULA_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, delta) => {
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.02;
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group name="moon-and-sky">
      {/* Nebula backdrop, behind the Stars */}
      <mesh material={nebulaMaterial} renderOrder={-2}>
        <sphereGeometry args={[220, 24, 16]} />
      </mesh>

      {/* The Moon — destination of the climb. Placed off-axis on the
          horizon (not straight overhead): the third-person camera pitches
          slightly down, so anything above ~13° elevation is never seen.
          On the horizon it grows closer to eye level as the player climbs. */}
      <group position={[90, TOTAL_HEIGHT + 8, -70]}>
        <mesh ref={moonRef}>
          <sphereGeometry args={[12, 32, 24]} />
          <meshStandardMaterial
            map={getMoonTexture()}
            emissive="#fff8e0"
            emissiveMap={getMoonTexture()}
            emissiveIntensity={0.55}
            fog={false}
          />
        </mesh>
        {/* Halo */}
        <sprite scale={[55, 55, 1]}>
          <spriteMaterial
            map={getGlowTexture()}
            color="#fff3c8"
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      </group>

      {/* Moonlight bathing the top of the spiral */}
      <pointLight
        position={[10, TOTAL_HEIGHT + 12, -8]}
        color="#fff3c8"
        intensity={1.5}
        distance={60}
      />

      {/* Tiny Earth far below on the opposite horizon — where the journey
          started. Visible over the outer wall when looking downhill. */}
      <group position={[-65, -24, 60]}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[6, 24, 18]} />
          <meshStandardMaterial
            map={getEarthTexture()}
            emissive="#3a78d4"
            emissiveIntensity={0.25}
            fog={false}
          />
        </mesh>
        <sprite scale={[20, 20, 1]}>
          <spriteMaterial
            map={getGlowTexture()}
            color="#6fa8ff"
            transparent
            opacity={0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      </group>
    </group>
  );
};
