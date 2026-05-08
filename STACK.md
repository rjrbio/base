# Stack

Stack confirmado el 2026-05-08. Aplica a todas las features del proyecto salvo decisión explícita en contrario.

## Runtime y framework

- **Framework**: Astro 5 (output 100% estático, sin SSR).
- **Lenguaje**: TypeScript estricto (`strict: true`).
- **Package manager**: pnpm (sugerido por velocidad y disco; npm/bun aceptables).
- **Node**: ≥20 LTS.

## Librerías principales

| Área | Librería | Por qué |
|------|----------|---------|
| 3D / shaders WebGL | Three.js | Estándar industrial, ecosystem grande, agnóstica al framework. |
| Scroll & timeline | GSAP + ScrollTrigger | Estándar para scroll-pinning complejo y secuencias coordinadas. |
| Smooth scroll | Lenis | Suaviza el scroll nativo respetando inertia y mobile. |
| Contenido por proyecto | MDX (`@astrojs/mdx`) | Texto + componentes embebidos en archivos `.mdx`. |
| Estilos | CSS nativo + variables CSS | Sin framework de estilos. Tokens en `:root`. |
| Tests unitarios / componentes | Vitest + Testing Library | Integra natural con Vite (Astro). |
| Tests E2E | Playwright | Cubre flujos completos y accesibilidad. |

## Hosting

- **Cloudflare Pages** (recomendación inicial). Build de Astro estático → CDN global + free tier amplio.
- Alternativas equivalentes: Vercel, Netlify. Decisión definitiva al desplegar.

## Convenciones

### Tipografías
- Display: open-source con licencia **OFL/permisiva**. Candidatas iniciales: **Migra** (Velvetyne, OFL), **Bricolage Grotesque** (Google Fonts, OFL). Selección final por styles-designer.
- Body: sans neutra, OFL — Inter, Geist o IBM Plex Sans.
- Servidas desde `public/fonts/` con `@font-face` y `font-display: swap`.
- Preload del peso clave del display en `<head>`.

### Assets
- Imágenes: WebP/AVIF preferidos; PNG/JPG aceptados. Optimización en build.
- Vídeos cortos: MP4 (H.264) o WebM, sin audio, ≤6 s, ≤2 MB.
- Audio: MP3 (compatibilidad universal), <500 KB total combinado, lazy-loaded.

### Estilos
- CSS modules + variables CSS en `src/styles/tokens.css`.
- Sin framework de estilos (Tailwind, etc.) salvo decisión expresa.
- Sistema de tokens formal lo definirá styles-designer en `BRAND.md` cuando toque.

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`.
- Sin `any` salvo justificación documentada.

## Scripts esperados (`package.json`)

```
pnpm dev          arranca dev server (Astro)
pnpm build        genera /dist estático
pnpm preview      sirve /dist localmente
pnpm lint         ESLint + Prettier check
pnpm format       Prettier write
pnpm typecheck    tsc --noEmit
pnpm test         Vitest (cuando haya tests)
pnpm test:e2e     Playwright (cuando haya tests)
```

## Política de cobertura

- `src/lib/` (audio, scroll, three): **80% mínimo**.
- `src/components/` con lógica: **70% mínimo**.
- Componentes puramente estáticos no requieren cobertura unitaria; quedan cubiertos por E2E.
