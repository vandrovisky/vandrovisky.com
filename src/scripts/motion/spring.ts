export type Vec = { x: number; y: number };
export type SpringState = { x: number; y: number; vx: number; vy: number };
export type SpringConfig = { stiffness: number; damping: number };

export const DEFAULT_SPRING: SpringConfig = { stiffness: 0.09, damping: 0.74 };

/** One frame of a damped spring pulling `s` towards `target`. Pure. */
export function stepSpring(s: SpringState, target: Vec, c: SpringConfig = DEFAULT_SPRING): SpringState {
  const vx = (s.vx + (target.x - s.x) * c.stiffness) * c.damping;
  const vy = (s.vy + (target.y - s.y) * c.stiffness) * c.damping;
  return { x: s.x + vx, y: s.y + vy, vx, vy };
}

export function isSettled(s: SpringState, target: Vec, eps = 0.6): boolean {
  return Math.hypot(target.x - s.x, target.y - s.y) < eps && Math.hypot(s.vx, s.vy) < eps / 2;
}

/** Squash & stretch along the direction of travel. */
export function stretch(vx: number, vy: number): { angle: number; scaleX: number; scaleY: number } {
  const amount = Math.min(Math.hypot(vx, vy) / 90, 0.4);
  return { angle: Math.atan2(vy, vx), scaleX: 1 + amount, scaleY: 1 - amount * 0.5 };
}
