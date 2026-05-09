# Projects Showcase

Sitio web animado de presentación de proyectos. Single-page con scroll storytelling, fondos WebGL (shaders + sistema de partículas) y tipografía display protagonista. Finaliza con un CTA al portfolio principal en [jdev.alwaysdata.net](https://jdev.alwaysdata.net).

## Proyectos

Tres proyectos, cada uno con su propio acento cromático y narrativa:

| # | Proyecto | Qué es |
|---|---|---|
| 1 | **Lore Master Assistant** | RAG fullstack de propósito general sobre MongoDB Atlas Vector Search. Ingiere URLs y archivos (TXT/MD/PDF/DOCX); responde con cita. |
| 2 | **Rule The Mando** | Plataforma de descubrimiento, clasificación y comunidad sobre videojuegos. Autenticación con Supabase. |
| 3 | **Kintsugi: The Fall** | Videojuego JRPG por turnos con timing activo, en desarrollo. |

## Stack

- **Astro 6** (output 100 % estático) + TypeScript estricto
- **Three.js** — shader unificado y sistema de partículas en un único contexto WebGL
- **GSAP / ScrollTrigger** — scroll-pinning y title reveals
- **Lenis** — smooth scroll
- **CSS nativo** con variables y tokens, sin framework de estilos

## Correrlo

Requiere Node ≥ 20 y pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build && pnpm preview
```
