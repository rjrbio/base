# Section Dialects — evolución visual del showcase

Fecha: 2026-07-03
Estado: aprobado (diseño validado en conversación)

## Problema

El fondo WebGL actual (grid fragmentado de ~2.560 piezas con rim carmesí y campana de intensidad global) funciona como pieza única, pero:

1. **No tiene identidad por proyecto.** La sección de Lore Master Assistant (acento azul `--p1`) vive sobre fondo carmesí; GonnaBe y Kintsugi comparten el mismo tratamiento. La spec original pedía firma visual propia por sección.
2. **El clímax global (45 % del scroll) quema el texto.** La tagline de Kintsugi queda al borde de la ilegibilidad, violando la regla de BRAND.md (`uIntensity` 0.3–0.5 detrás de texto; el shader es soporte, no protagonista).
3. **Los title reveals son fades genéricos** (opacity+y). La spec pedía kerning animado y un tratamiento cinematográfico de "fractura" para Kintsugi.
4. **No existe la capa de partículas** prevista en la spec, ni microinteracciones más allá del hover del CTA.

## Decisiones tomadas (con el usuario, 2026-07-03)

- **Evolución, no reemplazo:** el grid fragmentado se mantiene como lenguaje visual único del sitio; cada sección lo modula ("un lenguaje, cuatro dialectos"). Descartados: escenas independientes con crossfade (coste GPU y descarta identidad actual) y grading en post (superficial).
- **Alcance completo:** dialectos + partículas + tipografía cinematográfica + microinteracciones y pulido de contraste.

## Diseño

### 1. Fondo con consciencia de sección

**Orquestación.** Un `ScrollTrigger` por sección — hero, `lore-master-assistant`, `gonna-be`, `kintsugi-the-fall`, CTA — que reporta al `BackgroundManager` la sección activa y su progreso local (0–1). Al cruzar una frontera, GSAP interpola durante ~1 s un objeto de estado (paleta + comportamiento) que alimenta los uniforms. Sin saltos: el grid muta de dialecto de forma continua.

**Presets puros.** `src/lib/three/sectionPresets.ts` exporta, por sección: paleta (`base`, `rim`, `ember` como tripletas RGB) y comportamiento (`flow`, `pulse`, `crack`, `intensity`, amplitudes y velocidades). Módulo sin dependencias de Three/DOM → unit-testeable.

**Uniforms nuevos en el shader del grid** (`src/lib/shaders/background.ts`): `uPaletteBase`, `uPaletteRim`, `uPaletteEmber` (vec3), `uFlow`, `uPulse`, `uCrack`, `uIntensity` (float), `uLocalProgress` (float). Desaparecen la campana de intensidad global y el viaje de color hardcodeado (tintCool/tintWarm/tintCold): color e intensidad pasan a ser responsabilidad exclusiva de los presets. El `uProgress` global de página **se conserva** para lo espacial (parallax de cámara y desplazamiento por profundidad `aDepth`), que sigue siendo un viaje continuo de arriba a abajo.

**Dialectos:**

| Sección  | Paleta                                | Comportamiento                                                                                                                                     |
| -------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero     | Carmesí actual                        | Tensión/respiración existente, `uIntensity` baja (~0.15): el título manda                                                                          |
| Lore     | Azul-violeta `--p1`                   | `uFlow`: las piezas se alinean en carriles horizontales que se desplazan a velocidades distintas por fila (data stream estructural, no solo tinte) |
| GonnaBe  | Ámbar `--p2`                          | `uPulse`: olas de brillo ascendentes recorren el grid; las piezas se elevan sutilmente con cada pulso                                              |
| Kintsugi | Oro `--p3`                            | `uCrack`: la cascada de fractura existente, con bordes expuestos (rim) en oro — grietas doradas, no naranja quemado                                |
| CTA      | Fundido de los tres acentos → carmesí | Calma, cierre; `uIntensity` baja                                                                                                                   |

**Curva de intensidad.** Cada sección define su propio arco mediante `uLocalProgress`: pico breve durante el title reveal → retirada a soporte (≤0.5) durante los bloques de texto. Kintsugi conserva el pico global del sitio, siempre con techo 0.5 detrás de texto (regla BRAND.md).

### 2. Capa de partículas

Una única `THREE.Points` con shader propio (`src/lib/shaders/particles.ts`) que comparte los uniforms de sección:

- Densidad: ~600–900 desktop, ~250 mobile (`matchMedia ≤768px`), 0 con `prefers-reduced-motion`.
- Presets por dialecto: Lore = streaks azules horizontales rápidos; GonnaBe = brasas ámbar ascendentes lentas; Kintsugi = polvo dorado flotante con destellos intermitentes; Hero/CTA = cenizas carmesíes casi imperceptibles.
- Blending aditivo, `sizeAttenuation` por profundidad, repulsión local suave al puntero (reutiliza `uMouseWorld`).
- Mismo ciclo de vida que el grid: pausa con pestaña oculta, resize por `ResizeObserver`.

### 3. Tipografía cinematográfica

Con **SplitText** (incluido en GSAP ≥3.13, sin dependencias nuevas), implementado en `ScrollOrchestrator.ts`:

- **Hero:** entrada al cargar — caracteres emergen desde máscara con stagger y ligero `rotateX`; el punto final hace un pop sutil. Indicador "scroll" con fade pulsante (CSS animation).
- **Títulos de proyecto:** reveal por carácter con máscara y stagger; tagline con delay corto. Sustituye el fade+slide actual de `[data-reveal="title"]`.
- **Kintsugi:** título entra fracturado — jitter posicional + flicker de opacidad (2–3 pulsos), recomposición, y un único barrido dorado (`background-clip: text` con gradiente animado) al asentarse.
- `prefers-reduced-motion`: SplitText no se ejecuta; títulos estáticos con cross-fade simple (comportamiento actual reducido).
- Accesibilidad: SplitText con `aria-label` en el elemento padre para que el texto troceado no rompa lectores de pantalla.

### 4. Microinteracciones y pulido

- **CTA magnético:** "See more work" sigue al cursor en radio ~80 px, desplazamiento máx. ~12 px (`gsap.quickTo`); underline redibujado en hover. Desactivado en touch y reduced-motion.
- **Indicador de progreso:** componente nuevo (línea vertical 2 px, borde derecho, `position: fixed`) rellena con el acento de la sección activa — color interpolado en sincronía con el fondo. `aria-hidden="true"`.
- **Polaroids:** hover levanta la pieza — tilt hacia 0, escala 1.02, sombra más profunda. Solo en dispositivos con hover real (`@media (hover: hover)`).

### 5. Degradación y verificación

- **Reduced-motion:** frame estático del fondo (existente), 0 partículas, títulos con fade, sin magnetismo, progress estático.
- **Mobile:** partículas reducidas, dialectos activos con amplitudes suavizadas; layout intacto.
- **Fallback sin WebGL:** sin cambios (clase CSS existente).
- **Tests unit (Vitest):** `sectionPresets` — mapeo sección→preset, valores de intensidad dentro de rango [0, 0.5] en zonas de texto, interpolación de paletas (lerp correcto en extremos y punto medio).
- **Tests e2e (Playwright):** recorrido completo sin errores de consola; títulos visibles tras reveal; indicador de progreso presente y `aria-hidden`; con reduced-motion no se instancian partículas.
- **Verificación visual:** capturas en los mismos 7 puntos de scroll que el baseline del 2026-07-03 (`.playwright-mcp/scroll-*.png`) y comparación manual.
- Cada fase cierra con `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde.

## Archivos afectados

| Archivo                                        | Cambio                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/lib/three/sectionPresets.ts`              | Nuevo — presets puros por sección                                            |
| `src/lib/shaders/particles.ts`                 | Nuevo — shader de partículas                                                 |
| `src/lib/shaders/background.ts`                | Uniforms de sección, dialectos, retirada de campana global                   |
| `src/lib/three/BackgroundManager.ts`           | Section awareness, interpolación GSAP, capa Points                           |
| `src/lib/scroll/ScrollOrchestrator.ts`         | SplitText reveals, Kintsugi glitch, CTA magnético, emisión de sección activa |
| `src/components/progress/ScrollProgress.astro` | Nuevo — indicador de progreso                                                |
| `src/components/cta/PortfolioCTA.astro`        | Hook para magnetismo                                                         |
| `src/components/project/SubSection.astro`      | Hover de polaroids                                                           |
| `tests/unit/section-presets.test.ts`           | Nuevo                                                                        |
| `tests/e2e/showcase.spec.ts`                   | Casos nuevos                                                                 |

## Fuera de alcance

- Audio nuevo o microsonidos adicionales.
- Cambios de contenido (MDX), layout o estructura de secciones.
- Self-hosting de fuentes pendiente y Lighthouse (tareas previas independientes).
- Modo claro, i18n, analytics (excluidos por spec original).
