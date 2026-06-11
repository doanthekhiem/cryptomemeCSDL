// Shared analog input state, written by TouchControls (DOM events)
// and read inside the R3F frame loop. Kept outside React/Zustand on purpose:
// it changes every frame and must not trigger re-renders.
export const joystickState = {
  /** -1 (left) .. 1 (right) */
  x: 0,
  /** -1 (backward) .. 1 (forward) */
  y: 0,
  active: false,
};

export const resetJoystick = () => {
  joystickState.x = 0;
  joystickState.y = 0;
  joystickState.active = false;
};

export const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);
