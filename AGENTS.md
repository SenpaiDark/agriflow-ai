# AgriFlow AI — UI Animation & 3D Effects Guide

This document catalogs every technique that gives AgriFlow its 3D feel, smooth motion, and polished interface. Primarily driven by **Framer Motion** + **CSS keyframes** with no other animation libraries.

---

## 1. Signature 3D Tilt Card

**File:** `components/ui/card.tsx` (lines 7–44)

The most distinctive effect — cards physically lean toward the cursor using pointer tracking.

```
perspective(1000px) rotateX(springY deg) rotateY(springX deg)
```

| Piece | Code | What it does |
|-------|------|-------------|
| `ROTATION_RANGE = 8` | line 7 | Max rotation in degrees |
| `TILT_RANGE = 12` | line 8 | Max tilt in degrees |
| `useMotionValue(0.5)` | lines 18–19 | Raw mouse-position values |
| `useSpring(x, { stiffness: 200, damping: 18 })` | lines 20–21 | Smooths the raw values for a rubber-band feel |
| `useMotionTemplate(...)` | line 23 | Builds CSS `perspective()` + `rotateX/Y` as a single string |
| `onPointerMove` | lines 25–32 | Maps pointer position within the card to tilt using `TILT_RANGE` |
| `onPointerLeave` | lines 34–37 | Resets to 0 (card springs flat) |
| `hover:shadow-xl hover:shadow-gray-200/60` | line 46 | Shadow grows on hover, adding depth |

---

## 2. Framer Motion Layer

| Technique | File | Lines | Details |
|-----------|------|-------|---------|
| **Page transition** | `components/ui/page-transition.tsx` | 7–13 | `opacity: 0, y: 12` → `opacity: 1, y: 0` over 0.35s with cubic-bezier `[0.22, 1, 0.36, 1]` (subtle overshoot). Applied to every dashboard page via `layout.tsx:30`. |
| **Scroll-triggered reveal** | `components/landing/reveal.tsx` | 18–26 | `opacity: 0, y: 32` → `opacity: 1, y: 0` via `whileInView`, duration 0.55s. Respects `prefers-reduced-motion`. |
| **Staggered word entry** | `components/landing/hero.tsx` | 215–245 | Sequential `<motion.span>` for each word in the headline. Delays: `0.15 + i*0.08` for line 1, `0.5 + i*0.08` for line 2. Each word fades in + slides up 24px. |
| **Spring nav pill** | `components/layout/sidebar.tsx` | 104–108 | `layoutId="activeNav"` with `spring({ stiffness: 380, damping: 30 })`. The active-indicator pill animates smoothly between nav items. |
| **Stat counter** | `components/landing/stat-counter.tsx` | 17 | `useInView(ref, { once: true })` triggers `requestAnimationFrame` to count from 0 to target with cubic ease-out over 1400ms. |

---

## 3. CSS Animation Layer

All keyframes defined in `app/globals.css`.

### Welcome Splash (6 keyframes)

| Keyframe | Lines | Effect |
|----------|-------|--------|
| `wsFadeIn` | 169–176 | Backdrop opacity 0 → 1 |
| `wsFadeOut` | 178–185 | Backdrop opacity 1 → 0 |
| `wsPopIn` | 187–195 | Card: `scale(0.96) + translateY(14px)` → full size, bouncy cubic-bezier |
| `wsDrift` | 198–204 | Aurora blobs: `translate(0,0)` → `translate(26px,18px)` slow drift |
| `wsSpark` | 207–218 | Rising spark dots: opacity pulse + `translateY(-26px)` |
| `wsWave` | 221–234 | Waving hand: rotation 0° → 16° → -8° → 14° → 0° |

Welcome splash has 7 spark dots with staggered `animationDelay` (0s–1.7s), two aurora blobs drifting in opposite directions, and name glow via `text-shadow: 0 0 26px rgba(52, 211, 153, 0.5)`.

### Landing Page (4 keyframes)

| Keyframe | Lines | Assignment |
|----------|-------|-----------|
| `landFloat` | 448–455 | Glass cards float `translateY(0)` → `translateY(-14px)` over 6–8s |
| `landCloud` | 458–464 | Clouds drift `translateX(-15%)` → `translateX(115%)` over 70–95s |
| `landLeaf` | 467–481 | Falling leaves: translate top → bottom + rotate 0° → 300° over 16–36s |
| `landPulse` | 484–493 | Glow orbs: opacity + scale pulse over 7s |

### Card Shimmer (globals.css lines 32–48)

A diagonal gradient sweep `background-position 200% → -200%` over 4s, infinitely looping. Class `.card-shimmer` is ready for use on any card.

---

## 4. Glassmorphism & Depth

| Element | Styling | Files |
|---------|---------|-------|
| Floating cards | `bg-white/10`, `backdrop-blur-md`, `border-white/20`, `shadow-2xl` | `hero.tsx` lines 176–198 |
| Fixed header | `bg-brand-dark/60`, `backdrop-blur-md` | `page.tsx` line 144 |
| Hero badge | `bg-white/10`, `backdrop-blur` | `hero.tsx` line 206 |
| Auth logo badge | `bg-white/15`, `backdrop-blur` | `auth-shell.tsx` line 40 |
| Glow orbs (6 total) | `blur-3xl`, colored radial (green/harvest tones), some with `land-glow` animation | `hero.tsx`, `page.tsx` |
| Hero vignette | `bg-gradient-to-b from-brand-dark/80 via-brand-dark/55 to-brand-dark/85` | `hero.tsx` line 146 |

### Parallax on Mouse (hero.tsx lines 109–116, 181–183)

Four glass cards have different `depth` values (24, 36, 30, 20). Mouse position maps to `translate3d(mouse.x * depth, mouse.y * depth, 0)` with `transition: transform 0.3s ease-out`. Creates a layered parallax effect.

---

## 5. Interactive Feedback

| Pattern | Example | Effect |
|---------|---------|--------|
| `transition-colors hover:bg-emerald-700` | All buttons | Smooth background tint on hover |
| `hover:-translate-y-0.5` | Feature cards, stack tags, CTA buttons | Subtle 2px lift |
| `group-hover:[&>svg]:text-white` | Feature cards | Icon color swaps on card hover |
| `hover:shadow-xl hover:shadow-brand/10` | Feature cards | Shadow grows with brand tint |
| `transition-all duration-300` | Feature cards | Every property animates over 300ms |
| `transition-transform group-open:rotate-90` | FAQ chevrons | Arrow rotates on `<details>` open |
| `focus:border-emerald-500 focus:ring-1` | All inputs | Green focus ring on active input |
| `hover:scale-105` | Navbar avatar | Slight scale on profile icon |
| `group-hover:translate-x-1` | CTA button arrow | Arrow slides right on button hover |

---

## 6. Auto & Scroll Animation

| Effect | Implementation | Detail |
|--------|---------------|--------|
| Hero carousel | `setInterval` 4500ms + `transition-opacity duration-1000` | 6 background images cross-fade; dot indicators animate width `w-8`/`w-3` |
| Stat counters | `useInView` + `requestAnimationFrame` | Counts from 0 to target value with cubic ease-out over 1400ms |
| Chat auto-scroll | `scrollIntoView({ behavior: "smooth" })` | New assistant messages auto-scroll into view |
| Loading skeletons | Tailwind `animate-pulse` | `components/ui/skeleton.tsx` pulsing placeholders |

---

## 7. Reduced Motion Support

All animations gracefully degrade:

- **Welcome splash** (globals.css lines 237–246): Disables aurora, sparks, wave; card falls back to simple fade
- **Landing page** (globals.css lines 512–519): Disables float, cloud, leaf, glow animations
- **Reveal component** (`components/landing/reveal.tsx` line 15): `useReducedMotion()` skips the `y` slide if user prefers reduced motion

---

## Summary

| Category | Count | Primary Tech |
|----------|-------|-------------|
| Framer Motion `<motion.*>` instances | 19 | `framer-motion` |
| CSS `@keyframes` | 11 | CSS |
| Glassmorphism elements | 7 | `backdrop-blur` |
| Glow orbs | 6 | `blur-3xl` |
| Hover lift effects | 5+ | `hover:-translate-y-0.5` |
| Animation libraries used | **1** | `framer-motion` only |
