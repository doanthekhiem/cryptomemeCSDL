import * as THREE from 'three';

/**
 * Spring physics for smooth animations
 * Based on Three.js animation skill patterns
 */
export class Spring {
  stiffness: number;
  damping: number;
  position: number;
  velocity: number;
  target: number;

  constructor(stiffness = 100, damping = 10, initialPosition = 0) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.position = initialPosition;
    this.velocity = 0;
    this.target = initialPosition;
  }

  setTarget(target: number) {
    this.target = target;
  }

  update(dt: number): number {
    const force = -this.stiffness * (this.position - this.target);
    const dampingForce = -this.damping * this.velocity;
    this.velocity += (force + dampingForce) * dt;
    this.position += this.velocity * dt;
    return this.position;
  }

  reset(position: number) {
    this.position = position;
    this.velocity = 0;
    this.target = position;
  }
}

/**
 * 3D Spring for Vector3 values
 */
export class Spring3D {
  stiffness: number;
  damping: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target: THREE.Vector3;

  constructor(stiffness = 100, damping = 10, initialPosition?: THREE.Vector3) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.position = initialPosition?.clone() || new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.target = this.position.clone();
  }

  setTarget(target: THREE.Vector3) {
    this.target.copy(target);
  }

  update(dt: number): THREE.Vector3 {
    const force = new THREE.Vector3()
      .subVectors(this.target, this.position)
      .multiplyScalar(this.stiffness);

    const dampingForce = this.velocity.clone().multiplyScalar(-this.damping);

    this.velocity.add(
      force.add(dampingForce).multiplyScalar(dt)
    );
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    return this.position;
  }

  reset(position: THREE.Vector3) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.target.copy(position);
  }
}

/**
 * Smooth damp for following targets
 */
export function smoothDamp(
  current: THREE.Vector3,
  target: THREE.Vector3,
  velocity: THREE.Vector3,
  smoothTime: number,
  deltaTime: number,
  maxSpeed = Infinity
): THREE.Vector3 {
  // Prevent division by zero
  smoothTime = Math.max(0.0001, smoothTime);

  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  const change = current.clone().sub(target);
  const originalTo = target.clone();

  // Clamp maximum speed
  const maxChange = maxSpeed * smoothTime;
  const changeMag = change.length();
  if (changeMag > maxChange) {
    change.multiplyScalar(maxChange / changeMag);
  }

  const targetClamped = current.clone().sub(change);

  const temp = velocity.clone()
    .add(change.clone().multiplyScalar(omega))
    .multiplyScalar(deltaTime);

  velocity.sub(temp.clone().multiplyScalar(omega)).multiplyScalar(exp);

  let output = targetClamped.clone().add(change.add(temp).multiplyScalar(exp));

  // Prevent overshooting
  const origMinusCurrent = originalTo.clone().sub(current);
  const outMinusOrig = output.clone().sub(originalTo);

  if (origMinusCurrent.dot(outMinusOrig) > 0) {
    output.copy(originalTo);
    velocity.copy(outMinusOrig.divideScalar(deltaTime));
  }

  return output;
}

/**
 * Easing functions
 */
export const easing = {
  // Sine
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Quad
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // Cubic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Elastic
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Bounce
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

/**
 * Oscillation patterns
 */
export const oscillation = {
  // Simple sine wave
  sine: (time: number, frequency = 1, amplitude = 1, phase = 0) =>
    Math.sin(time * frequency * Math.PI * 2 + phase) * amplitude,

  // Cosine wave
  cosine: (time: number, frequency = 1, amplitude = 1, phase = 0) =>
    Math.cos(time * frequency * Math.PI * 2 + phase) * amplitude,

  // Bounce (absolute sine)
  bounce: (time: number, frequency = 1, amplitude = 1) =>
    Math.abs(Math.sin(time * frequency * Math.PI)) * amplitude,

  // Pulse (sharp peaks)
  pulse: (time: number, frequency = 1, sharpness = 4) =>
    Math.pow((Math.sin(time * frequency * Math.PI * 2) + 1) / 2, sharpness),

  // Breathing (smooth in-out)
  breathing: (time: number, frequency = 0.5, minValue = 0.8, maxValue = 1.2) => {
    const t = (Math.sin(time * frequency * Math.PI * 2) + 1) / 2;
    return minValue + (maxValue - minValue) * t;
  },
};

/**
 * Interpolation helpers
 */
export const lerp = (start: number, end: number, t: number): number =>
  start + (end - start) * t;

export const lerpVector3 = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number
): THREE.Vector3 =>
  start.clone().lerp(end, t);

export const lerpColor = (
  start: THREE.Color,
  end: THREE.Color,
  t: number
): THREE.Color =>
  start.clone().lerp(end, t);
