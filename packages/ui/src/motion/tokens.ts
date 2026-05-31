/** Performance-first motion tokens — prefer transform/opacity only */

export const MOTION_DURATION = {
  instant: 150,
  fast: 200,
  normal: 250,
  max: 300,
} as const;

export const MOTION_EASE = "cubic-bezier(0.25, 0.1, 0.25, 1)";

export type MotionTier = "full" | "reduced" | "minimal";
