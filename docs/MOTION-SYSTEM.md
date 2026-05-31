# Performance-First Motion System

**Rule:** Performance always beats visual effects. If an effect hurts load time, FPS, accessibility, battery, or bandwidth — remove or downgrade it.

## Stack

| Layer | Tool |
|-------|------|
| Page enter | Framer Motion (lazy-loaded) or CSS `.sanson-enter` |
| Components | CSS `transform` + `opacity` only |
| Glass | `backdrop-blur-md` max — never `blur-3xl` |
| Reduced motion | `prefers-reduced-motion` + `data-motion-tier` |

## Durations

- Page / widgets: **150–250ms** (max **300ms**)
- Sidebar expand/collapse: **200ms**
- Notifications: **150ms**

## Motion tiers (`MotionProvider`)

| Tier | When |
|------|------|
| `full` | Fast device + good network |
| `reduced` | Slow 2G/3G, save-data, &lt;4GB RAM, ≤2 CPU cores |
| `minimal` | `prefers-reduced-motion: reduce` |

Effects disabled at `minimal`: animations, blur, hover lift/glow.

## Usage

```tsx
import { motionEnter, motionCard, StatCard } from "@sanson/ui";
import { useMotion } from "@/components/providers/motion-provider";

<StatCard staggerIndex={0} ... />
<Card interactive>...</Card>
```

Dashboard routes wrap content in `<PageTransition>` (see `apps/web/src/app/dashboard/layout.tsx`).

## Targets

- Dashboard first paint: **&lt; 1.5s**
- Interactive: **&lt; 2s**
- Navigation perceived load: **&lt; 500ms**

## Avoid

- Heavy blur, large scale, bounce/elastic, infinite loops
- WebGL, particles, large Lottie, video backgrounds
- Blocking full-page spinners (use `Skeleton` / `LoadingPage`)
