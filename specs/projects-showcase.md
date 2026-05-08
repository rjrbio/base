# Projects Showcase

## Contexto

**Problema de negocio.** El usuario tiene tres proyectos a presentar (dos en producción y uno videojuego en desarrollo) y un portfolio personal ya publicado en `https://jdev.alwaysdata.net`. Hace falta una pieza diferenciadora que sirva de **escaparate visual con personalidad propia**, cuyo objetivo es impresionar y derivar tráfico al portfolio principal.

**Audiencia.** Visitantes desconocidos que llegan desde redes sociales, comunidades técnicas, comunidades de gaming, búsquedas o referencia directa. No es un portfolio: es un punto de entrada con identidad visual fuerte.

**Valor esperado.** Causar una primera impresión memorable que transmita oficio en diseño/animación web, mostrar los tres proyectos con narrativa propia, y guiar al portfolio externo donde reside el resto del trabajo.

**Naturaleza de la primera feature.** Esta es la primera feature del proyecto base; **no hay stack definido**. El architect debe proponer stack y estructura inicial antes de la implementación.

## Alcance

### Incluye

- Single page con scroll vertical y secciones con scroll-pinning.
- Hero a pantalla completa con tipografía display masiva y fondo animado.
- Animaciones de fondo combinando shaders WebGL + sistemas de partículas.
- Tres secciones de proyectos con sub-secciones propias (título → assets → texto).
- CTA final dirigiendo al portfolio externo.
- Footer mínimo.
- Contenido en inglés (idioma único).
- Modo color oscuro fijo.
- Tipografía display open-source.
- Toggle de audio (off por defecto) con pista ambient + microsonidos.
- Versión mobile digna (animaciones simplificadas, layout adaptado).
- Soporte completo de `prefers-reduced-motion`.
- Accesibilidad WCAG AA mínima.

### No incluye

- Sección de contacto, formularios o lista de perfiles sociales (el footer incluye únicamente atribución de autoría con enlace a GitHub).
- Sección "About me" con datos personales.
- Multilingüe.
- Modo claro / toggle de tema.
- Analytics, tracking, cookies de medición.
- CMS, panel admin, autenticación.
- Backend propio: el sitio es 100% estático.
- Comentarios o interacción social.

## Flujos de usuario

### Happy path (desktop)

1. El usuario carga `/` y ve un hero a pantalla completa: tipografía display + shader animado de fondo. El audio está apagado.
2. Hace scroll. La página entra en modo "scroll storytelling": cada sección se ancla al viewport mientras dura su animación principal y luego avanza.
3. Recorre los tres proyectos. Cada uno comparte estructura (title reveal → assets visuales con animación → texto explicativo) pero con paleta y efecto de fondo propio.
4. Llega al CTA: pantalla cuasi-completa con un texto display invitándole a ver más, y un enlace al portfolio externo (target `_blank`).
5. Ve el footer mínimo.

### Happy path (mobile)

- Misma estructura, scroll vertical y secciones.
- Animaciones de fondo simplificadas (gradientes animados o partículas con baja densidad) o estáticas elegantes según degradación.
- Layout en una columna; assets visuales a ancho completo.
- Toggle de audio sigue disponible.

### Casos borde

- **`prefers-reduced-motion: reduce`**: shaders y partículas se sustituyen por estados estáticos o cross-fades suaves; el scroll-pinning agresivo cae a transiciones simples.
- **WebGL no disponible** (raro en 2026): fallback a gradientes CSS animados; tipografía intacta.
- **Conexión lenta**: assets pesados (vídeos/GIFs) se cargan diferido; placeholder estático mientras tanto.
- **Pestaña en background**: animaciones se pausan; al volver el foco se reanudan sin glitch.
- **Asset faltante** (404 de imagen): fallback visual neutro con `alt`, sin romper el layout.
- **Audio bloqueado** por política del navegador: el toggle informa al usuario y permite reintentar tras interacción.

## Requisitos funcionales

### Backend

No aplica. Esta feature no tiene backend; el sitio es estático y los assets se sirven desde el propio repo o un CDN según defina el architect.

### Frontend

#### Layout y navegación

- Página única en `/`.
- Scroll vertical único; cada sección anclada al viewport durante su animación principal (técnica scroll-pinning).
- Toggle de audio fijo en una esquina inferior, accesible siempre.
- (Opcional, decisión del architect) Indicador de progreso del scroll sutil.

#### Hero

- Texto display masivo (frase a definir; sugerencias del frontend-developer en una iteración posterior, antes de implementación).
- Fondo full-bleed con shader WebGL.
- Indicador sutil de "scroll" tipográfico animado.

#### Estructura común por proyecto

Cada proyecto sigue la misma plantilla visual base, con paleta, efecto y narrativa propios:

1. *Title reveal* — el título emerge con tratamiento tipográfico/animado.
2. *Sub-secciones temáticas* (2–5 según proyecto) con scroll-pinning.
3. *Texto explicativo* (3–4 párrafos cortos en MD/MDX, redactados por el frontend-developer a partir de los datos de esta spec).

#### P1 — Lore Master Assistant

- **Título mostrado**: `Lore Master Assistant`.
- **Tagline sugerida**: `General-purpose RAG. Ingest URLs and files. Ask anything.` (afinable por frontend-developer).
- **Sub-secciones**:
  1. *Title reveal* (kerning animado, partículas reaccionando al texto).
  2. *Concept* — visualización del flujo RAG (ingest → embeddings → vector search → answer).
  3. *Sources & formats* — fuentes ingeribles (URL públicas, TXT, MD, PDF, DOCX).
  4. *In action* — capturas/GIFs de la app respondiendo preguntas reales.
- **Contenido textual a transmitir**:
  - Qué problema resuelve (acceso conversacional a conocimiento heterogéneo).
  - Cómo funciona (ingerir → indexar → preguntar).
  - Tecnologías clave: MongoDB Atlas Vector Search, embeddings, formatos soportados.
- **Animación de fondo**: tonalidad fría (azul/violeta). Shader sugerente de flujo de información (líneas, partículas tipo data stream).

#### P2 — Rule The Mando

- **Título mostrado**: `Rule The Mando`.
- **Tagline sugerida**: `Discover, classify and own your video game collection.`
- **Sub-secciones**:
  1. *Title reveal*.
  2. *The catalog* — visualización del catálogo masivo (miles de juegos de los últimos 30 años).
  3. *Make it yours* — favoritos, votos, comentarios.
  4. *Community* — hint de comunidad e interacción social.
- **Contenido textual a transmitir**:
  - Qué problema resuelve (descubrir + clasificar + comunidad en un solo sitio).
  - Funcionalidad principal: catálogo, próximos lanzamientos, lista personal, votos, comentarios.
  - Tecnologías clave: autenticación con Supabase, base de datos masiva.
- **Animación de fondo**: tonalidad cálida con guiño retrogaming-but-modern (rojo/ámbar o verde fósforo desaturado). Patrón de cuadrícula deformada o ondulación tipo CRT moderno.

#### P3 — Kintsugi: The Fall *(sección protagónica, mayor extensión)*

- **Título mostrado**: `Kintsugi: The Fall`.
- **Tagline sugerida**: `The battle was lost. The world is broken. You are what comes after.`
- **Sub-secciones**:
  1. *Title reveal* — tratamiento cinematográfico (slow build, glitch tipográfico evocando "fractura").
  2. *The fall* — la premisa: la batalla épica ya ocurrió y se perdió. Fondo evoca rotura.
  3. *The broken world* — media nación caída, capital convertida en fortaleza enemiga.
  4. *22 heroes* — visualización de los hasta 22 héroes, cada uno arraigado a su pueblo natal.
  5. *Your order* — liberar las ciudades en el orden que elijas.
  6. *Won't fully mend* — el mundo nunca se reparará por completo (eco del concepto kintsugi: las grietas doradas).
  7. *Status* — etiqueta `in development` (sin link a devlog/teaser; no existe público a la fecha de esta spec). Espacio reservado para texto extendido con detalles narrativos/mecánicos si se decide ampliar en implementación.
- **Contenido textual a transmitir**:
  - Premisa narrativa (derrota inicial, mundo roto).
  - Mecánica: JRPG por turnos con timing activo.
  - Estructura: hasta 22 héroes con vínculo geográfico, orden libre de liberación.
  - Estado: en desarrollo.
- **Animación de fondo**: la más cuidada del sitio. Concepto kintsugi (oro sobre cerámica rota): shader con líneas/grietas doradas + partículas tipo polvo dorado o pétalos cayendo. Paleta oscura con acentos cálidos (oro, granate, marfil).

#### CTA al portfolio

- Sección dedicada (cuasi-pantalla completa, no embebida en el footer).
- **Texto display sugerido**: `If you want to know more about me`.
- **Enlace**: `See more work` (afinable) → `https://jdev.alwaysdata.net`. `target="_blank"`, `rel="noopener noreferrer"`.
- **Animación de fondo**: cierre coherente; sugerencia inicial — fundido de los tres tonos previos (lore/mando/kintsugi).

#### Footer

- Mínimo: `© rjrbio` con enlace a `https://github.com/rjrbio` (atribución de autoría).
- Sin otros enlaces a redes sociales ni información de contacto.

#### Audio

- Una pista ambient en loop, volumen percibido bajo (~−12 a −18 dB).
- Microsonidos: hover sobre CTA y toggle de audio. Cambio de sección puede llevar un swoosh sutil (decisión del architect).
- Toggle persistente: estado guardado en `localStorage`.
- Off por defecto. **Nunca autoplay**. La primera reproducción siempre tras gesto del usuario.
- Respeta `prefers-reduced-motion` y políticas de autoplay del navegador.

#### Estados de UI

- **Loading inicial**: hero placeholder estático mientras se cargan shader y assets prioritarios. Tras eso, fade-in.
- **Error de carga de asset**: fallback visual neutro con `alt` descriptivo.
- **Empty**: no aplica (no hay datos dinámicos).
- **Success**: estado normal de navegación.

#### Accesibilidad

- HTML semántico (`<main>`, `<section>`, `<h1>`, `<h2>`, `<nav>` donde aplique).
- Cada sección con `aria-label` o encabezado claro.
- Focus visible en todos los elementos interactivos (CTA y toggle de audio).
- Navegación por teclado funcional.
- `prefers-reduced-motion: reduce` desactiva shaders, partículas y scroll-pinning agresivo. Mantener cross-fade sutil entre secciones.
- Contraste WCAG AA mínimo en todo el texto (incluido el display).
- Texto alternativo descriptivo (función, no estilo) en imágenes/GIFs.
- Audio: nunca autoplay; toggle accesible por teclado y screen reader.

#### Responsive

- Mobile-first en CSS, diseño desktop-first en intención.
- Breakpoints sugeridos (afinables por architect): `≤480px`, `≤768px`, `≤1024px`, `≤1440px`.
- En mobile (`≤768px`):
  - Tipografía display escalada manteniendo impacto relativo.
  - Animaciones de fondo simplificadas (partículas reducidas o gradiente animado en lugar de shader).
  - Layout 1 columna; assets a ancho completo.
  - Áreas táctiles mínimas 44×44 px.

## Datos esperados / contenido

- 3 proyectos, cada uno con: nombre, tagline, paleta sugerida, 3–4 párrafos de texto.
- 1 enlace externo principal (CTA al portfolio): `https://jdev.alwaysdata.net`.
- 1 enlace externo en el footer (atribución a GitHub): `https://github.com/rjrbio`.
- Pistas de audio (1 ambient + 2-3 microsonidos).

Los assets visuales se almacenan en `media/projects/<slug>/`. La estructura inicial está creada con un `media/README.md` que documenta qué meter en cada subcarpeta. El contenido textual final lo redacta el frontend-developer en MD/MDX a partir de los datos de esta spec; el architect decidirá si el contenido vive en código o en archivos separados según el stack que proponga.

## Criterios de aceptación

### Estructura y contenido

- **Given** un visitante carga `/` por primera vez en desktop, **When** la página termina de cargar, **Then** ve un hero a pantalla completa con shader animado de fondo y un texto display visible sin necesidad de scroll.
- **Given** un visitante hace scroll desde el hero, **When** llega a cada sección de proyecto, **Then** ve título → assets visuales → texto explicativo en ese orden, con la sección anclada al viewport durante su animación principal.
- **Given** un visitante recorre toda la página, **When** llega al final, **Then** ve un CTA que enlaza a `https://jdev.alwaysdata.net` y un footer con `© rjrbio` enlazando a `https://github.com/rjrbio`, sin formularios ni sección de contacto.

### Animaciones

- **Given** un visitante en desktop con WebGL disponible, **When** scrollea, **Then** las animaciones de fondo combinan shaders WebGL y partículas con transiciones coordinadas entre secciones.
- **Given** un visitante con `prefers-reduced-motion: reduce`, **When** carga la página, **Then** los shaders y partículas se sustituyen por estados estáticos o cross-fades simples; las transiciones nunca son bruscas.
- **Given** una pestaña inactiva durante una animación, **When** el visitante vuelve a la pestaña, **Then** las animaciones se reanudan sin glitches y sin frames acumulados.

### Audio

- **Given** un visitante carga la página por primera vez, **When** la página renderiza, **Then** no se reproduce audio sin acción del usuario y el toggle aparece en estado off.
- **Given** un visitante activa el toggle de audio, **When** recarga la página, **Then** el estado del toggle persiste (con autoplay reanudado si el navegador lo permite tras interacción).

### Mobile

- **Given** un visitante en mobile (≤768 px), **When** carga la página, **Then** ve el contenido con animaciones de fondo simplificadas, layout en 1 columna y sin scroll horizontal.

### Performance

- **Given** un visitante en desktop con conexión 4G simulada, **When** carga la página, **Then** el LCP es ≤3 s y la consola no muestra errores.
- **Given** un visitante en mobile con conexión 4G simulada, **When** carga la página, **Then** el LCP es ≤5 s.

### Accesibilidad

- **Given** un visitante navegando con teclado, **When** tabula, **Then** llega a todos los elementos interactivos (CTA, toggle de audio) con focus visible.
- **Given** un usuario de screen reader, **When** recorre la página, **Then** cada sección tiene un encabezado significativo y los assets visuales tienen texto alternativo descriptivo.
- **Given** la página completa, **When** se audita con axe-core o Lighthouse, **Then** no aparecen issues bloqueantes (críticos o serios) de accesibilidad.

## Riesgos y preguntas abiertas

### Riesgos

- **Performance vs espectáculo.** Cargar shaders + partículas + audio en una sola página puede ser pesado. *Mitigación*: lazy load por sección, presupuesto de bundle estricto, fallbacks claros, code-splitting agresivo.
- **Mobile degradation.** Simplificar demasiado las animaciones puede romper el efecto wow en móvil. *Mitigación*: tipografía y transiciones cuidadas en mobile pueden compensar la falta de shader.
- **Asset readiness.** El usuario aún no entregó los assets de cada proyecto. Bloqueante para la implementación final del frontend. *Mitigación*: la estructura `media/projects/<slug>/` ya está creada; el architect puede planificar implementación con placeholders.
- **Audio en navegadores estrictos.** Políticas de autoplay y reproducción cuando la pestaña no tiene foco. *Mitigación*: opt-in estricto y manejo explícito de errores de play.
- **Tipografías.** Si la display elegida es comercial, hay coste/licencia. *Mitigación*: candidatas open-source (Migra, PP Neue Montreal, Editorial New u otras con licencia OFL/permisiva).
- **Escalado del shader entre GPUs.** El efecto puede verse muy distinto en Apple Silicon vs Intel iGPU vs móviles. *Mitigación*: presupuesto de complejidad por shader, testing en hardware variado, perfilado en DevTools.

### Preguntas abiertas (no bloquean entrega de spec)

- Frase exacta del hero (a sugerir por frontend-developer en una iteración previa a implementación).
- Frase exacta del CTA (sugerencia inicial confirmada: `If you want to know more about me` → botón `See more work`).
- Selección final de display y de pista de audio ambient (a proponer por frontend-developer/styles-designer).

## Métricas de éxito

Como no hay analytics, las métricas son cualitativas:

- Recorrido completo del scroll (visitante llega al CTA).
- Click-through al portfolio (verificable solo si el portfolio mide tráfico entrante).
- Feedback cualitativo: percepción de "memorable", "diferenciado", "transmite oficio".
