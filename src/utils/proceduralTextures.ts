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

/** Museum wall panels: vertical light-wash gradient + panel seams + noise.
 *  uv.y: 0 = floor, 1 = wall top (canvas y is flipped accordingly). */
export const getWallPanelTexture = (size = 256): THREE.Texture => {
  const key = `wallpanel:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);

  // Vertical gradient — brightest where the art hangs (≈60% up the wall),
  // falling off toward floor and ceiling like a wall-washer light
  const gradient = ctx.createLinearGradient(0, size, 0, 0);
  gradient.addColorStop(0.0, '#323e63');
  gradient.addColorStop(0.45, '#4d5e92');
  gradient.addColorStop(0.62, '#5868a4');
  gradient.addColorStop(1.0, '#2a3354');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Subtle plaster noise
  const rand = seededRandom(99);
  for (let i = 0; i < 700; i++) {
    const shade = rand();
    ctx.fillStyle =
      shade > 0.5
        ? `rgba(180,195,235,${0.02 + rand() * 0.04})`
        : `rgba(8,10,24,${0.03 + rand() * 0.05})`;
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2.5, 1 + rand() * 2.5);
  }

  // Panel seam on the tile edge + a faint mid seam
  ctx.strokeStyle = 'rgba(6,8,20,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1.5, 0);
  ctx.lineTo(1.5, size);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,170,220,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4.5, 0);
  ctx.lineTo(4.5, size);
  ctx.stroke();

  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(key, texture);
  return texture;
};

/** Polished gallery floor: dark stone with speckle and faint tile joints. */
export const getFloorTexture = (size = 256): THREE.Texture => {
  const key = `floor:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = '#252e4e';
  ctx.fillRect(0, 0, size, size);

  // Stone speckle
  const rand = seededRandom(1234);
  for (let i = 0; i < 1400; i++) {
    const bright = rand() > 0.45;
    ctx.fillStyle = bright
      ? `rgba(170,190,240,${0.03 + rand() * 0.07})`
      : `rgba(5,8,20,${0.04 + rand() * 0.08})`;
    const s = 0.5 + rand() * 2;
    ctx.fillRect(rand() * size, rand() * size, s, s);
  }

  // Soft polished sheen sweeping across the tile
  const sheen = ctx.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, 'rgba(190,205,250,0)');
  sheen.addColorStop(0.5, 'rgba(190,205,250,0.07)');
  sheen.addColorStop(1, 'rgba(190,205,250,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);

  // Tile joints
  ctx.strokeStyle = 'rgba(8,10,26,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

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
