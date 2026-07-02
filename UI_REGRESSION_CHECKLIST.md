# UI Regression Checklist

During any future enhancement passes, the following core features and behaviors **MUST REMAIN UNCHANGED**:

## 1. Component Behavior
- **`GlowCard`**: Must maintain its `framer-motion` hover capabilities. Modifying global padding/border properties will break existing page layouts.
- **`ProcessingView`**: Must rely on indeterminate animations (no faked 0-100% timeouts) and must cleanly unmount when `isProcessing` flips to false.
- **Webcam UI**: The live `video` stream in `/analyze` must not have its `ref` logic disrupted.

## 2. Responsiveness
- **Grids**: Dashboard (`/results`) must degrade gracefully from `lg:grid-cols-3` down to 1 column on mobile.
- **Navigation**: The `TopBar` must hide text links (`hidden md:flex`) and retain a clean mobile footprint.
- **Padding**: Global layout padding (`px-6 lg:px-12`) must be maintained across all top-level route containers.

## 3. Accessibility
- Contrast ratios between text and background must remain compliant (e.g., pure white on pure black, or `text-muted-foreground` on dark gray).
- Semantic HTML (using `<h1>`, `<h2>`, `<main>`) must not be stripped in favor of flat `<div>` structures.

## 4. Routing
- The `@tanstack/react-router` configuration in `src/routeTree.gen.ts` must not be manually edited.
- Navigating from `/analyze` to `/results` relies on the `useNavigate` hook, which must not be broken.

## 5. Backend Integration & API Communication
- **The Fetch Call**: The `fetch("http://127.0.0.1:8000/api/analyze", ...)` block inside `src/routes/analyze.tsx` is the critical bridge to the backend. It must not be removed, modified to use WebSockets, or pointed to a different port unless explicitly instructed.
- **Form Data**: The FormData payload wrapping the video Blob and the text question must maintain exact key names expected by FastAPI.

## 6. State Management
- **Local State**: `useState` inside `analyze.tsx` manages the media recorder, blobs, and processing booleans. This complex orchestration must remain isolated to the component.
- **Global Data**: `getAnalysisResults()` and `setAnalysisResults()` in `src/hooks/use-analysis.ts` act as the global store bridging the `/analyze` route to the `/results` route. This contract must not be altered, and the TypeScript type definitions mapping to the API response must be strictly preserved.
