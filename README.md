# Projects Showcase

Sitio web animado de presentación de proyectos. Single-page con scroll storytelling, fondos WebGL (shaders + sistema de partículas), tipografía display protagonista y un CTA final que dirige al portfolio principal en [`https://jdev.alwaysdata.net`](https://jdev.alwaysdata.net).

> Este sitio se construyó sobre la plantilla de agentes de IA descrita en [`AGENTS.md`](AGENTS.md). El pipeline `product-analyst → architect → frontend-developer → qa-tester → styles-designer` generó la spec, la arquitectura y la implementación a partir de una sola idea inicial.

## Qué muestra

Tres proyectos, cada uno con su propio acento cromático y narrativa:

| #   | Proyecto                  | Qué es                                                                                                                              |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Lore Master Assistant** | RAG fullstack de propósito general sobre MongoDB Atlas Vector Search. Ingiere URLs y archivos (TXT/MD/PDF/DOCX); responde con cita. |
| 2   | **Rule The Mando**        | Plataforma de descubrimiento, clasificación y comunidad sobre videojuegos. Autenticación con Supabase.                              |
| 3   | **Kintsugi: The Fall**    | Videojuego JRPG por turnos con timing activo, en desarrollo. Sección protagónica del scroll.                                        |

## Stack

- **Astro 6** (output 100 % estático) + TypeScript estricto.
- **Three.js** para el shader unificado y el sistema de partículas (un único contexto WebGL).
- **GSAP / ScrollTrigger** para scroll-pinning y title reveals.
- **Lenis** para smooth scroll.
- **MDX** para el contenido por proyecto.
- **CSS nativo** con variables y tokens (sin framework de estilos).
- **Vitest** + **Playwright** para tests.

Detalle completo y convenciones en [`STACK.md`](STACK.md).

## Cómo correrlo

Requisitos: Node ≥ 20 y pnpm.

```bash
pnpm install
pnpm dev               # http://localhost:4321
pnpm build && pnpm preview
```

Verificación:

```bash
pnpm lint
pnpm typecheck
pnpm test              # Vitest (unit)
pnpm test:e2e          # Playwright (la primera vez: pnpm exec playwright install chromium)
```

## Estructura

```
.
├── AGENTS.md                  Plantilla de agentes IA (pipeline)
├── BRAND.md                   Sistema visual (paleta, tipografía, reglas)
├── STACK.md                   Stack y convenciones
├── specs/
│   └── projects-showcase.md   Spec funcional + arquitectura técnica
├── agents/                    Prompts de cada rol (product-analyst, architect, …)
├── rules/                     Reglas globales del flujo
├── .claude/agents/            Wrappers nativos para Claude Code
├── src/
│   ├── components/{audio,background,cta,footer,hero,project}/
│   ├── content/               MDX por proyecto
│   ├── layouts/BaseLayout.astro
│   ├── lib/
│   │   ├── audio/AudioManager.ts
│   │   ├── scroll/ScrollOrchestrator.ts
│   │   ├── three/BackgroundManager.ts
│   │   └── shaders/           GLSL en strings TS
│   ├── pages/index.astro
│   └── styles/{tokens,reset,globals}.css
├── public/{audio,fonts,media}/
├── media/projects/<slug>/     Sources sin optimizar (capturas, GIFs, logos)
└── tests/{unit,e2e}/
```

## Características

- **Modo oscuro fijo**, mobile-first, responsive con `clamp()` para tipografía.
- **5 presets de fondo** (hero, lore, mando, kintsugi, cta) con interpolación suave entre secciones según `IntersectionObserver`.
- **Title reveals** con stagger (GSAP) sobre todo elemento `[data-reveal="title"]`.
- **12 anclas `data-pinning-id`** una por sub-sección — base para futuros pins más agresivos.
- **Pausa total** de la animación cuando la pestaña no es visible (`visibilitychange`).
- **Fallback CSS** con gradientes radiales si el navegador no soporta WebGL.
- **`prefers-reduced-motion`** desactiva animaciones, partículas y shader temporal.
- **Audio toggle** sticky bottom-right con persistencia en `localStorage`; disabled hasta que la pista exista.
- **Accesibilidad**: HTML semántico, focus visible, navegación por teclado, `alt` descriptivos, contraste WCAG AA.

## Tests

- **14 tests E2E** (Playwright) cubren render, semántica, accesibilidad, scope negativo (sin contact/forms/redes), navegación por teclado, scroll completo y `prefers-reduced-motion`.
- **2 tests unitarios** (Vitest) sobre el `AudioManager`.

```bash
pnpm test && pnpm test:e2e
```

## Assets pendientes

Para producción final hace falta aportar:

- **`media/projects/<slug>/`** — capturas, GIFs y logos por proyecto. Recomendaciones de formato en [`media/README.md`](media/README.md).
- **`public/audio/ambient.mp3`** — pista ambient (loop limpio, ≤ 500 KB). En cuanto exista, el toggle de audio se habilita automáticamente.

Mientras tanto, las sub-secciones muestran un `[ asset-placeholder ]` con texto descriptivo que se sustituye por la captura/GIF real cuando se incorpora.

## Sistema de agentes

El repositorio sigue siendo reutilizable como base: el sistema de roles en `agents/` y las reglas en `rules/` aplican a cualquier feature futura. Para añadir una pieza nueva, sigue el pipeline secuencial:

```
product-analyst → architect → backend-dev (si aplica) → qa-tester → frontend-dev → qa-tester
```

Cada paso requiere aprobación antes de avanzar. Detalle en [`AGENTS.md`](AGENTS.md). Con Claude Code, los wrappers en `.claude/agents/` invocan cada rol con `/agents`.

## Idioma

Documentación, specs y commits en **español**. Código (identificadores, comentarios técnicos) y contenido del sitio en **inglés**.

## Licencia

Pendiente de definir antes de publicar.
