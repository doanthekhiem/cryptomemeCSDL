import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGalleryStore } from '../../stores/galleryStore';

const LOW_FPS = 40;
const HIGH_FPS = 55;
const LOW_STREAK = 2; // seconds below LOW_FPS before downgrading
const HIGH_STREAK = 5; // seconds above HIGH_FPS before upgrading (hysteresis)

// Samples FPS once per second and, in 'auto' mode, switches effectiveQuality
// between high/low with hysteresis so it doesn't flap.
export const PerformanceMonitor = () => {
  const frames = useRef(0);
  const elapsed = useRef(0);
  const lowStreak = useRef(0);
  const highStreak = useRef(0);

  useFrame((_, delta) => {
    frames.current++;
    elapsed.current += delta;
    if (elapsed.current < 1) return;

    const fps = frames.current / elapsed.current;
    frames.current = 0;
    elapsed.current = 0;

    const { performanceMode, effectiveQuality, setEffectiveQuality } =
      useGalleryStore.getState();

    // Manual override: just keep effectiveQuality in sync
    if (performanceMode !== 'auto') {
      if (effectiveQuality !== performanceMode) {
        setEffectiveQuality(performanceMode);
      }
      lowStreak.current = 0;
      highStreak.current = 0;
      return;
    }

    if (fps < LOW_FPS) {
      lowStreak.current++;
      highStreak.current = 0;
      if (lowStreak.current >= LOW_STREAK && effectiveQuality !== 'low') {
        setEffectiveQuality('low');
        lowStreak.current = 0;
      }
    } else if (fps > HIGH_FPS) {
      highStreak.current++;
      lowStreak.current = 0;
      if (highStreak.current >= HIGH_STREAK && effectiveQuality !== 'high') {
        setEffectiveQuality('high');
        highStreak.current = 0;
      }
    } else {
      lowStreak.current = 0;
      highStreak.current = 0;
    }
  });

  return null;
};
