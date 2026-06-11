import { useRef, useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { joystickState, resetJoystick, isTouchDevice } from '../../utils/inputState';

const SIZE = 112; // outer ring px
const KNOB = 48; // knob px
const RADIUS = (SIZE - KNOB) / 2; // max knob travel from center

// Virtual joystick for touch devices. Writes analog input into joystickState,
// which the movement frame-loop reads alongside the keyboard.
export const TouchControls = () => {
  const [isTouch] = useState(isTouchDevice);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const selectedToken = useGalleryStore((s) => s.selectedToken);
  const isMenuOpen = useGalleryStore((s) => s.isMenuOpen);
  const isSearchOpen = useGalleryStore((s) => s.isSearchOpen);
  const isListViewOpen = useGalleryStore((s) => s.isListViewOpen);
  const isLoading = useGalleryStore((s) => s.isLoading);

  if (!isTouch) return null;

  const overlayOpen = !!(selectedToken || isMenuOpen || isSearchOpen || isListViewOpen || isLoading);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }

    setKnob({ x: dx, y: dy });
    joystickState.x = dx / RADIUS;
    joystickState.y = -dy / RADIUS; // screen up = move forward
    joystickState.active = true;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    activePointer.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointer.current !== e.pointerId) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    setKnob({ x: 0, y: 0 });
    resetJoystick();
  };

  return (
    <div
      className={`fixed left-6 bottom-28 sm:bottom-8 z-30 select-none transition-opacity ${
        overlayOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative rounded-full bg-cyber-primary/60 border border-neon-cyan/40 backdrop-blur-sm"
        style={{ width: SIZE, height: SIZE, touchAction: 'none' }}
      >
        {/* Direction hints */}
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-neon-cyan/50 text-xs">▲</span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-neon-cyan/50 text-xs">▼</span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neon-cyan/50 text-xs">◀</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neon-cyan/50 text-xs">▶</span>

        {/* Knob */}
        <div
          className="absolute rounded-full bg-neon-cyan/30 border border-neon-cyan shadow-[0_0_12px_rgba(0,255,245,0.4)]"
          style={{
            width: KNOB,
            height: KNOB,
            left: SIZE / 2 - KNOB / 2 + knob.x,
            top: SIZE / 2 - KNOB / 2 + knob.y,
          }}
        />
      </div>
    </div>
  );
};
