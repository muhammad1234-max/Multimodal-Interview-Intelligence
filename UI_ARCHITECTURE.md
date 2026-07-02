# UI Architecture Audit

## 1. Routing Overview & Page Hierarchy

The application utilizes `@tanstack/react-router` for type-safe routing. The routing tree is defined in `src/routeTree.gen.ts` and managed via `src/router.tsx` and `src/routes/__root.tsx`.

**Page Hierarchy:**
- `__root.tsx` (Global Layout Wrapper)
  - `/` (`index.tsx`) - Landing Page
  - `/analyze` (`analyze.tsx`) - Upload & Processing Page
  - `/results` (`results.tsx`) - Results Dashboard
  - `/tech` (`tech.tsx`) - Technical Stack Overview
  - `/architecture` (`architecture.tsx`) - Architecture Diagram

## 2. Shared Layouts

**`src/routes/__root.tsx`**
Provides the global application shell for all routes.
- Renders the `TopBar` component globally (except on mobile, where it hides specific nav links).
- Handles global layout structure (`min-h-screen`, `bg-background`).
- Renders the `<Outlet />` for child routes.
- Provides the global `Toaster` for notifications.

## 3. Reusable Component Map

All UI components are centralized in `src/components/`.

**Core Reusable Components:**
- **`GlowCard` (`glow-card.tsx`)**: The primary content container across the entire application. Features hover states, border highlights, and internal padding. Used heavily in `/results`, `/analyze`, and `/index`.
- **`TopBar` (`top-bar.tsx`)**: The global navigation header featuring the logo, desktop navigation links, and the primary "Sign In" CTA.
- **`ProcessingView` (`processing-view.tsx`)**: The stateful, animated loading screen used exclusively during the API fetch cycle in `/analyze`.
- **`FloatingOrb` (`floating-orb.tsx`)**: Background decorative element used on the landing page for ambient lighting.
- **`ParticlesBg` (`particles-bg.tsx`)**: Interactive particle background.

## 4. Shared Styles & Design Tokens

Styles are globally defined in `src/styles.css` using Tailwind v4 syntax and CSS variables.

**Design Tokens:**
- **Colors**:
  - `background`: `hsl(0 0% 0%)` (Pure Black)
  - `foreground`: `hsl(0 0% 100%)` (Pure White)
  - `card`: `hsl(0 0% 5%)`
  - `brand-blue`: `hsl(230 100% 59%)`
  - `hero-subtitle`: `hsl(210 17% 95%)`
- **Typography**:
  - `font-sans`: Inter
  - `font-serif`: Instrument Serif
- **Border Radius**: Multi-step scale (`sm` through `full`).
- **Shadows**:
  - `--shadow-liquid`
  - `--shadow-button-glow`

## 5. Animations

**Framer Motion Implementations:**
- **Staggered Page Load**: Elements fading in and floating up (`opacity: 0, y: 20` to `opacity: 1, y: 0`), prominently used in `index.tsx` and `results.tsx`.
- **Scroll Parallax**: Used via `useScroll` and `useTransform` on the Landing Page (`index.tsx`) to shift background elements as the user scrolls.
- **Indeterminate Progress**: Used in `ProcessingView` to create scanning laser lines (`x: "-100%"` to `"100%"`) and pulsating UI indicators.
- **Data Visualization**: Recharts SVG path animations triggered on component mount in the Dashboard (`results.tsx`).
- **SVG Path Drawing**: Animating `strokeDashoffset` to draw circular progress rings for the Vocal Confidence gauge.
