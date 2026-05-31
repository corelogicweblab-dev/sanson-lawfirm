import { cn } from "../lib/cn";

/** Page / section enter — fade + subtle slide up */
export function motionEnter(className?: string) {
  return cn("sanson-enter", className);
}

/** Interactive card — lift + soft glow on hover */
export function motionCard(className?: string) {
  return cn("sanson-card-interactive", className);
}

/** Primary button micro-interaction */
export function motionButton(className?: string) {
  return cn("sanson-btn-motion", className);
}

/** Stagger children (dashboard widgets) */
export function motionStaggerChild(className?: string) {
  return cn("sanson-stagger-item", className);
}

/** Notification slide-in */
export function motionNotification(className?: string) {
  return cn("sanson-notification-enter", className);
}

/** Lightweight glass surface */
export function glassSurface(className?: string) {
  return cn("sanson-glass", className);
}
