# Projects Showcase

Sitio web animado de presentación de proyectos. Single-page con scroll storytelling, fondo WebGL con identidad propia por sección (shaders + partículas) y tipografía cinematográfica protagonista. Finaliza con un CTA al portfolio principal en [jdev.alwaysdata.net](https://jdev.alwaysdata.net).

## Proyectos

Tres proyectos, cada uno con su propio acento cromático, dialecto visual de fondo y narrativa:

| #   | Proyecto                  | Qué es                                                                                                                              |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Lore Master Assistant** | RAG fullstack de propósito general sobre MongoDB Atlas Vector Search. Ingiere URLs y archivos (TXT/MD/PDF/DOCX); responde con cita. |
| 2   | **GonnaBe**               | Proyección realista de tu vida a partir de un perfil profundo (trabajo, finanzas, salud, relaciones), con escenarios alternativos.  |
| 3   | **Kintsugi: The Fall**    | Videojuego JRPG por turnos con timing activo, en desarrollo.                                                                        |

## Stack

- **Astro 6** (output 100 % estático) + TypeScript estricto
- **Three.js** — shader unificado y sistema de partículas en un único contexto WebGL, con estado por sección (paleta, comportamiento, bloom) suavizado en cada frame
- **GSAP / ScrollTrigger + SplitText** — scroll-pinning, reveals cinematográficos por carácter y microinteracciones
- **Lenis** — smooth scroll
- **CSS nativo** con variables y tokens, sin framework de estilos

## Correrlo

Requiere Node ≥ 20 y pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build && pnpm preview
```
