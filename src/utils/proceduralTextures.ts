import * as THREE from 'three';

// All decorative textures are drawn on canvas at runtime — no external assets,
// no copyright-sensitive artwork (only Unicode emoji + simple shapes).
// Every texture is cached and reused across the scene.

const cache = new Map<string, THREE.Texture>();

const createCanvas = (size: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
};

const toTexture = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

// Deterministic pseudo-random so textures look identical every visit
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/** Unicode emoji rendered to a square sprite texture. */
export const getEmojiTexture = (emoji: string, size = 128): THREE.Texture => {
  const key = `emoji:${emoji}:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);
  ctx.font = `${size * 0.8}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);

  const texture = toTexture(canvas);
  cache.set(key, texture);
  return texture;
};

/** Soft radial glow sprite (white center → transparent edge). */
export const getGlowTexture = (size = 256): THREE.Texture => {
  const key = `glow:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = toTexture(canvas);
  cache.set(key, texture);
  return texture;
};

/** Faint cyan grid on dark blue — tiled across the spiral ramp. */
export const getGridTexture = (size = 256): THREE.Texture => {
  const key = `grid:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = '#222f4d';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(0,255,245,0.22)';
  ctx.lineWidth = 2;
  const cells = 4;
  for (let i = 0; i <= cells; i++) {
    const p = (i / cells) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cache.set(key, texture);
  return texture;
};

/** Cratered moon surface. */
export const getMoonTexture = (size = 512): THREE.Texture => {
  const key = `moon:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = '#e9e7da';
  ctx.fillRect(0, 0, size, size);

  const rand = seededRandom(42);
  for (let i = 0; i < 90; i++) {
    const r = 2 + rand() * size * 0.05;
    const x = rand() * size;
    const y = rand() * size;
    const shade = 190 + Math.floor(rand() * 40);
    ctx.fillStyle = `rgba(${shade},${shade},${shade - 12},${0.35 + rand() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // crater rim highlight
    ctx.strokeStyle = 'rgba(255,255,250,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();
  }

  const texture = toTexture(canvas);
  cache.set(key, texture);
  return texture;
};

/** Tiny stylized Earth (blue with green continents + cloud streaks). */
export const getEarthTexture = (size = 256): THREE.Texture => {
  const key = `earth:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = '#1a5fb4';
  ctx.fillRect(0, 0, size, size);

  const rand = seededRandom(7);
  ctx.fillStyle = '#2ea043';
  for (let i = 0; i < 14; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.beginPath();
    ctx.ellipse(
      x, y,
      8 + rand() * size * 0.12,
      6 + rand() * size * 0.08,
      rand() * Math.PI, 0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 10; i++) {
    const y = rand() * size;
    ctx.beginPath();
    ctx.ellipse(
      rand() * size, y,
      14 + rand() * 30, 3 + rand() * 4,
      0, 0, Math.PI * 2
    );
    ctx.fill();
  }

  const texture = toTexture(canvas);
  cache.set(key, texture);
  return texture;
};
