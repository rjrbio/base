# Brand

Sistema visual del Projects Showcase. Esta es la fuente de verdad de paleta, tipografía y reglas de uso. Cualquier componente nuevo debe respetarlo.

## Tono

Oscuro, contemporáneo, editorial. Tipografía protagonista. Animación sutil pero presente. Cada proyecto recibe su propio acento cromático sin romper la unidad oscura del lienzo.

## Tipografía

| Rol           | Familia                            | Licencia | Uso                                                             |
| ------------- | ---------------------------------- | -------- | --------------------------------------------------------------- |
| Display       | **Bricolage Grotesque** (700, 800) | OFL      | Hero, títulos de proyecto, CTA, cualquier texto display masivo. |
| Body          | **Inter** (400, 500, 600)          | OFL      | Texto corrido, taglines, navegación, labels, footer.            |
| Mono fallback | system mono stack                  | —        | (Reservado: code/CLI demos en proyectos futuros.)               |

Servidas desde Google Fonts (CSS2 API) con `display=swap`. Migrable a self-hosted en `public/fonts/` cuando convenga; la API (variables CSS `--font-display` y `--font-body`) no cambia.

## Paleta

### Base oscura

| Token        | Hex       | Uso                                        |
| ------------ | --------- | ------------------------------------------ |
| `--bg`       | `#07060a` | Fondo absoluto del documento.              |
| `--fg`       | `#f4f1ea` | Texto principal y elementos foreground.    |
| `--fg-muted` | `#aaa3a0` | Texto secundario, labels, taglines suaves. |

### Acentos por proyecto

Cada proyecto tiene un acento que viaja a través de la sub-sección, los reveals y el shader de fondo.

| Token  | Hex       | Proyecto              | Tono                                    |
| ------ | --------- | --------------------- | --------------------------------------- |
| `--p1` | `#5b6cff` | Lore Master Assistant | Frío, eléctrico — flujo de información. |
| `--p2` | `#ff7a3d` | Rule The Mando        | Cálido, retrogaming-but-modern.         |
| `--p3` | `#d4a64a` | Kintsugi: The Fall    | Dorado kintsugi sobre lo roto.          |

Reglas:

- Los acentos **nunca** se usan en texto largo (legibilidad).
- Los acentos **sí** en taglines, hovers, links activos, focus visible y en el shader de fondo de su sección.
- Mezclar acentos solo en el CTA final (transición coherente al portfolio).

## Espaciado

Escala de 8 px (variables `--sp-1` … `--sp-12`). Cualquier valor que se use más de una vez vive en una variable.

## Tipos de movimiento

| Token        | Valor  | Uso                                           |
| ------------ | ------ | --------------------------------------------- |
| `--dur-fast` | 200ms  | Hovers, focus, micro-interacciones.           |
| `--dur-mid`  | 500ms  | Transiciones cortas dentro de la misma vista. |
| `--dur-slow` | 1200ms | Title reveals, transiciones de fondo.         |

Easing por defecto: `--ease-out` (`cubic-bezier(0.2, 0.6, 0.2, 1)`).

## Reglas de uso del shader de fondo

- El shader es **soporte**, no protagonista. Si un texto compite con el fondo, baja la intensidad — no oscurezcas el texto.
- `uIntensity` en presets se mantiene en el rango 0.3–0.5 para preservar contraste WCAG AA.
- Las partículas son cosméticas; se desactivan en `prefers-reduced-motion` y en mobile reducido.

## Anti-patrones

- ❌ Hardcodear hex en componentes. Usar siempre tokens.
- ❌ Acentos cromáticos en texto corrido.
- ❌ Animaciones que ignoren `prefers-reduced-motion`.
- ❌ Mezclar tipografías fuera de la pareja Display/Body.
- ❌ Subir el `uIntensity` por encima de `0.5` sin verificar contraste.
