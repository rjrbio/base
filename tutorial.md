# Tutorial — Tu primera feature con este proyecto base

Guía paso a paso para arrancar un proyecto nuevo desde cero usando los agentes de IA configurados en este repositorio. Pensada para **GitHub Copilot CLI**, pero los prompts también funcionan en Claude Code, Cursor o cualquier herramienta que lea `AGENTS.md`.

> ⏱️ Tiempo estimado para tu primera feature simple (CRUD básico): 30-60 min de trabajo activo + tiempo de espera de los agentes.

---

## Índice

1. [Antes de empezar](#1-antes-de-empezar)
2. [Setup inicial (una sola vez)](#2-setup-inicial-una-sola-vez)
3. [Cómo invocar a los agentes](#3-cómo-invocar-a-los-agentes)
4. [Tu primera feature paso a paso](#4-tu-primera-feature-paso-a-paso)
5. [Sugerencias para que los agentes hagan mejor trabajo](#5-sugerencias-para-que-los-agentes-hagan-mejor-trabajo)
6. [Errores comunes y cómo evitarlos](#6-errores-comunes-y-cómo-evitarlos)
7. [Cuándo intervenir y cuándo no](#7-cuándo-intervenir-y-cuándo-no)
8. [Ejemplo completo: app de gestión de tareas](#8-ejemplo-completo-app-de-gestión-de-tareas)

---

## 1. Antes de empezar

### Mentalidad

Trabajar con agentes **no es como programar tradicionalmente** ni como usar Copilot autocompletando líneas. Aquí tu trabajo es:

- **Pensar** el problema antes de pedir código.
- **Especificar** qué quieres con precisión.
- **Revisar** cada output antes de avanzar al siguiente paso.
- **Dirigir**, no escribir.

La calidad de tu spec determina la calidad del código. Un prompt vago genera código que parece bueno pero no es lo que querías.

### Reglas básicas

- **Pipeline secuencial, no paralelo.** Cada agente necesita el output del anterior.
- **Una feature, un ciclo completo.** No empieces otra feature hasta cerrar la actual.
- **Lee cada output antes de aprobar.** Es tu única oportunidad de corregir el rumbo barato.

---

## 2. Setup inicial (una sola vez)

### Duplicar el repo base

Como pediste, este proyecto se mantiene **local sin commits**. Para arrancar uno nuevo:

```bash
# Copia el repo a un directorio nuevo (sin el .git para empezar limpio)
cp -R /ruta/a/cero /ruta/a/mi-proyecto-nuevo
cd /ruta/a/mi-proyecto-nuevo
rm -rf .git
git init
```

### Verificar Copilot CLI

```bash
# Si no lo tienes instalado:
npm install -g @github/copilot

# Verificar versión
copilot --version

# Login (la primera vez)
# Sigue el prompt que abre el navegador
```

> Si nunca has usado Copilot CLI, ten a mano [docs.github.com/copilot/cli](https://docs.github.com/copilot).

### Arrancar la sesión

```bash
cd /ruta/a/mi-proyecto-nuevo
copilot
```

Copilot CLI cargará automáticamente:

- `AGENTS.md` (instrucciones primarias).
- `.github/copilot-instructions.md`.
- Los custom agents de `.github/agents/*.agent.md`.

Verifica que Copilot reconoce los agentes:

```
/agent
```

Deberías ver la lista de los 6 agentes disponibles.

---

## 3. Cómo invocar a los agentes

Hay **cuatro formas** de invocar un custom agent en Copilot CLI. Te recomiendo conocer las cuatro y elegir según el momento.

### A) Slash command (más visual)

```
/agent
```

Te muestra un menú interactivo, eliges el agente y luego escribes tu prompt.

### B) Mención explícita (más control)

```
Use el product-analyst para crear la spec de una app de gestión de tareas con login.
```

Funciona también en español: "Usa el product-analyst…", "Lanza al architect…", "Pon a trabajar al backend-developer…".

### C) Por inferencia (más natural)

Si tu prompt suena como lo que describe un agente, Copilot delega solo:

```
Necesito una spec funcional detallada para un sistema de notificaciones push.
```

→ Copilot detectará que es trabajo del `product-analyst` por las palabras "spec funcional".

### D) Por flag al arrancar (más automatizable)

```bash
copilot --agent product-analyst --prompt "Crea spec para gestión de tareas con login"
```

Útil para scripts o cuando ya sabes exactamente qué quieres.

### Mi recomendación

- **Primera feature, primera vez**: usa **B (mención explícita)**. Te da control total y aprendes el flujo.
- **Una vez familiarizado**: usa **C (inferencia)** para prompts naturales y **A (slash)** cuando dudes qué agente toca.

---

## 4. Tu primera feature paso a paso

### Paso 0 — Define en tu cabeza qué vas a construir

Antes de tocar Copilot, ten claro:

- **Qué problema resuelve** la feature.
- **Quién la usa**.
- **Qué entradas y salidas** tiene.
- **Qué NO entra** en este alcance (importantísimo).

No tienes que tener todo cerrado — el product-analyst te hará preguntas. Pero llega con una idea en una frase.

### Paso 1 — Lanza al product-analyst

**Prompt sugerido:**

```
Use el product-analyst para generar la spec de la siguiente feature:

<descripción en 2-3 frases de lo que quieres>

Si te falta información, pregúntame antes de escribir nada.
```

**Qué va a pasar:**

1. El agente te preguntará si quieres rama nueva o trabajar en la actual.
   - **Recomendado**: rama nueva, `feature/<nombre-corto>`.
2. Te hará 3-8 preguntas sobre alcance, usuarios, edge cases.
3. Generará `specs/<feature>.md` y hará un commit `docs: add spec for <feature>`.

**Qué revisar antes de aprobar:**

- [ ] ¿El alcance es lo que querías? ¿Ni más ni menos?
- [ ] ¿Los criterios de aceptación son medibles (no "funciona bien")?
- [ ] ¿Cubre los casos borde importantes?
- [ ] ¿Está bien definido qué NO entra?

**Si algo no encaja, NO sigas adelante.** Pídeselo al product-analyst:

```
Ajusta la spec: el campo "categoría" debe ser opcional y limitarse a 50 caracteres.
También elimina la sección de "tags" — no entra en este alcance.
```

### Paso 2 — Lanza al architect

> ⚠️ **Si es la primera feature del proyecto** (repo sin código aún), el architect te preguntará qué stack usar. Tenlo decidido o pídele opciones.

**Prompt sugerido:**

```
Use el architect para diseñar la arquitectura de la spec en specs/<feature>.md.
Genera backend, frontend, API contract y plan de ejecución.
```

**Si es la primera feature, añade:**

```
Es la primera feature del proyecto. Antes de diseñar, propón 2-3 opciones de stack
adecuadas y espera mi decisión.
```

**Qué va a pasar:**

1. (Si primera feature) Te propondrá stacks y esperará tu decisión.
2. Diseñará schemas/modelos, endpoints, componentes, hooks.
3. Definirá el API contract endpoint por endpoint.
4. Generará un plan de ejecución con fases secuenciales.
5. Actualizará `specs/<feature>.md` y hará commit.

**Qué revisar:**

- [ ] ¿Los endpoints del backend coinciden con lo que el frontend va a consumir?
- [ ] ¿Los tipos/interfaces son coherentes entre backend y frontend?
- [ ] ¿La complejidad es apropiada? (Si parece sobreingeniería, pídele simplificar.)
- [ ] ¿Cada error del backend tiene su manejo en el frontend?
- [ ] ¿El plan de ejecución tiene fases claras y secuenciales?

### Paso 3 — Lanza al backend-developer

**Prompt sugerido:**

```
Use el backend-developer para implementar la Fase 1 (Backend Core) y Fase 2 (Backend API)
del plan de ejecución en specs/<feature>.md.
```

> 💡 Si la feature es grande, divide en fases. Si es pequeña, "implementa todas las fases del backend" en un solo prompt está bien.

**Qué va a pasar:**

1. Lee la spec y el contrato.
2. Crea archivos según el plan.
3. Ejecuta lint, build, tests.
4. Arranca el servidor y prueba endpoints con curl.
5. Hace commits granulares.

**Qué revisar:**

- [ ] ¿Lint, build y tests pasan? (Pídeselo si no lo reporta.)
- [ ] ¿Los endpoints responden lo que dice el contrato? (Prueba 1-2 con curl tú mismo.)
- [ ] ¿Hay tests para errores (400, 404, 401), no solo happy path?

### Paso 4 — Lanza al qa-tester en modo backend

**Prompt sugerido:**

```
Use el qa-tester en modo backend para verificar la implementación del backend
de specs/<feature>.md. Genera tests adicionales si falta cobertura, ejecuta
todos los tests, y reporta issues por severidad.
```

**Qué revisar en el reporte:**

- [ ] Cobertura ≥ mínimo definido (70% si no se especificó).
- [ ] No hay issues Critical ni High abiertos.
- [ ] Si hay issues Medium/Low, decide si los arreglas ahora o los pospones.

> 🛑 **Si hay un issue Critical, no avances.** Vuelve al backend-developer para arreglarlo.

### Paso 5 — Lanza al frontend-developer

**Prompt sugerido:**

```
Use el frontend-developer para implementar las fases de frontend del plan en
specs/<feature>.md. El backend está corriendo en <URL si aplica>.
Verifica en navegador antes de cerrar.
```

**Qué va a pasar:**

1. Lee spec, contrato y código backend real.
2. Implementa páginas, componentes, hooks.
3. Ejecuta lint, build, tests.
4. Abre el navegador y verifica funcionalidad.
5. Reporta resultado.

**Qué revisar:**

- [ ] ¿Hay reporte de verificación en navegador? (Si no, exígelo.)
- [ ] Abre tú la página y comprueba 2-3 flujos manualmente.
- [ ] F12 → consola limpia, network tab OK.

### Paso 6 — Lanza al qa-tester en modo frontend

**Prompt sugerido:**

```
Use el qa-tester en modo frontend para verificar la UI implementada de
specs/<feature>.md. Verifica responsive, accesibilidad básica y los
4 estados de UI en cada vista. Reporta issues por severidad.
```

### Paso 7 (opcional) — Lanza al qa-tester en modo integration

Si la feature tiene flujo end-to-end importante:

```
Use el qa-tester en modo integration para verificar el flujo completo
de <feature>: <flujo principal en una frase>.
```

### Paso 8 — Cierre

Cuando todo está verde:

1. Tú decides cuándo hacer push:
   ```bash
   git push -u origin feature/<nombre>
   ```
2. Tú decides cuándo abrir PR:
   ```bash
   gh pr create --base main
   ```

Ningún agente hace estas dos cosas sin tu permiso explícito (está en `rules/agent-rules.md`).

---

## 5. Sugerencias para que los agentes hagan mejor trabajo

### Da contexto en el primer mensaje

Mal:

```
Hazme un CRUD de productos.
```

Bien:

```
Use el product-analyst para crear la spec de un CRUD de productos.

Contexto: tienda online B2B. Los productos tienen nombre (max 100 chars),
precio (decimal positivo), descripción opcional (max 500 chars), y categoría
(referencia a otro módulo que ya existirá).

El alcance esta vez es solo CRUD básico — no me importa búsqueda, filtros
ni paginación todavía. Eso vendrá en otra feature.
```

### Cita archivos por ruta

Cuando referencies algo, da la ruta completa:

```
Mira specs/products.md sección "API Contract", endpoint POST /products.
El campo "discount" no debería ser opcional — corrígelo.
```

Es 10× más efectivo que "el campo del descuento que pusimos antes".

### Usa números/IDs cuando puedas

```
Implementa los criterios de aceptación 3, 5 y 7 de specs/products.md.
Deja el resto para una segunda iteración.
```

### Pide outputs estructurados

```
Cuando termines, dame un resumen con:
1. Archivos creados/modificados (rutas exactas)
2. Tests que añadiste y qué cubren
3. Comandos para probar manualmente
4. Cosas que dejas pendientes (si las hay)
```

### Si algo huele mal, pregunta antes de reescribir

```
¿Por qué decidiste poner la lógica de validación en el controller en lugar
de en un pipe / DTO / handler? ¿Hay alguna razón específica del stack?
```

A veces el agente tiene razón y aprendes algo. A veces estaba improvisando y
ahora lo corrige.

### Haz preguntas en metanivel

```
¿Qué riesgos ves en el diseño actual?
¿Qué partes del plan son las que más probabilidad tienen de dar problemas?
¿Hay alguna decisión que tomaste y de la que no estás seguro?
```

### Usa el qa-tester como crítico

Antes de cerrar una feature:

```
Use el qa-tester en modo backend para hacer una review crítica de la implementación.
Busca: bugs, edge cases sin cubrir, validaciones faltantes, riesgos de seguridad.
No arregles nada — solo reporta.
```

---

## 6. Errores comunes y cómo evitarlos

### Error 1: Lanzar dos agentes en paralelo

**Síntoma:** "Voy más rápido si arranco backend y frontend a la vez."

**Realidad:** El frontend asume endpoints que el backend aún no creó. Hay conflictos. Pierdes más tiempo arreglando que el que ahorraste.

**Solución:** Secuencial. Siempre.

### Error 2: Aprobar specs sin leerlas

**Síntoma:** El product-analyst genera 200 líneas y dices "ok" sin leer.

**Realidad:** La spec tiene asunciones que no querías. Todo lo que se construye encima hereda esos errores.

**Solución:** Lee cada output completo antes de avanzar. Especialmente la spec, porque es el cimiento.

### Error 3: Prompts vagos

**Síntoma:** "Hazme un dashboard chulo."

**Realidad:** El agente toma 50 decisiones por ti. Probablemente no las que querías.

**Solución:** Estructura: contexto + objetivo + restricciones + formato esperado.

### Error 4: Querer toda la app en un prompt

**Síntoma:** "Implementa todo el sistema de gestión de inventario con productos, categorías, proveedores, órdenes, reportes y dashboard."

**Realidad:** El agente se pierde, genera código incompleto e inconsistente.

**Solución:** Una feature pequeña a la vez. Cada una pasa por el pipeline completo. Empieza por la dependencia más simple (categorías antes que productos).

### Error 5: Interrumpir a media implementación

**Síntoma:** El backend-developer está creando archivos y lo paras porque "está tardando".

**Realidad:** Te quedan archivos incompletos, módulos sin registrar, builds rotos.

**Solución:** Solo interrumpe si claramente va en dirección equivocada o entra en bucle. "Tarda" no es razón.

### Error 6: No verificar resultados

**Síntoma:** El agente dice "todo listo" y confías sin comprobar.

**Realidad:** Errores silenciosos. La build falla 3 pasos después y no sabes dónde está el bug.

**Solución:** Después de cada agente, abre tú una terminal y comprueba `git status`, ejecuta lint/build/test, y abre la página en el navegador.

### Error 7: Saltar al architect sin spec

**Síntoma:** "Diseña la arquitectura para una app de citas."

**Realidad:** El architect inventa requisitos. Construyes algo que no es lo que querías.

**Solución:** Siempre product-analyst primero. Aunque la feature te parezca obvia.

---

## 7. Cuándo intervenir y cuándo no

### Cuándo SÍ intervenir

- El agente está claramente en un bucle (lleva 3 intentos haciendo lo mismo).
- Está modificando archivos fuera del alcance que le diste.
- Está cambiando configuración del proyecto sin permiso.
- Va en una dirección que se aleja de la spec.
- Te pide hacer push o crear PR (recuérdale que solo tú decides).

### Cuándo NO intervenir

- "Tarda mucho" — los agentes a veces piensan, es normal.
- "No entiendo qué hace" — déjalo terminar, lee el resultado, luego pregunta.
- "No me gusta la sintaxis" — ¿es funcionalmente correcto? Si sí, pásalo. Decisiones cosméticas las haces al final.
- Está revisando código existente — déjalo, está cogiendo contexto.

### Cómo intervenir bien

❌ Mal: "Para, eso está mal, hazlo de otra forma."

✅ Bien: "Para. Estás creando archivos en `src/utils/` pero el plan dice `src/core/`. Vuelve al plan y corrige antes de seguir."

Sé específico sobre qué está mal y qué debería hacer.

---

## 8. Ejemplo completo: app de gestión de tareas

Ejemplo end-to-end realista. Reemplaza con tu caso.

### Contexto inicial (en tu cabeza)

> Quiero una app simple para gestionar mis tareas. Login con email/password. Cada tarea tiene título, descripción opcional, estado (pendiente/hecha) y fecha de creación. Cada usuario solo ve sus tareas.

### Prompt 1 — product-analyst

```
Use el product-analyst para crear la spec de mi primera feature.

La feature es: módulo de gestión de tareas personales con autenticación.

Características clave:
- Cada usuario gestiona solo sus propias tareas (aislamiento por usuario).
- Tarea = título (requerido), descripción (opcional, max 1000 chars),
  estado (pendiente/hecha), fecha de creación (automática).
- Operaciones: crear, listar mis tareas, marcar como hecha, eliminar.
- Auth: registro y login con email + password.

Lo que NO quiero ahora: categorías, etiquetas, fechas de vencimiento,
recordatorios, compartir tareas, edición de descripción una vez creada.

Pregúntame lo que necesites. Crea rama nueva `feature/tasks-mvp`.
```

### Prompt 2 — architect (primera feature, sin stack)

```
Use el architect para diseñar la arquitectura de specs/tasks-mvp.md.

Es la primera feature del proyecto. Propón 2-3 stacks adecuados y espera mi decisión
antes de diseñar. Mis preferencias: prefiero TypeScript end-to-end, despliegue simple,
y que el frontend tenga buen DX.
```

(El architect te propondrá opciones — eliges una — luego diseña.)

### Prompt 3 — backend-developer

```
Use el backend-developer para implementar todas las fases del backend del plan en
specs/tasks-mvp.md. Verifica con curl los endpoints principales antes de cerrar.
```

### Prompt 4 — qa-tester (backend)

```
Use el qa-tester en modo backend para verificar la implementación del backend.
Busca específicamente:
- Aislamiento por usuario (un usuario no puede ver/modificar tareas de otro).
- Validación de inputs (título vacío, descripción muy larga).
- Manejo de errores de auth (token expirado, token inválido).
Reporta issues por severidad.
```

### Prompt 5 — frontend-developer

```
Use el frontend-developer para implementar el frontend del plan en specs/tasks-mvp.md.
Backend está corriendo. Verifica en navegador los flujos:
1. Registro -> redirección a la lista
2. Login -> redirección a la lista
3. Crear tarea, verla aparecer
4. Marcar como hecha
5. Eliminar
6. Logout
```

### Prompt 6 — qa-tester (frontend)

```
Use el qa-tester en modo frontend para verificar la UI.
Comprueba:
- Los 4 estados de UI en la lista (loading, error, empty, success).
- Responsive (mobile, tablet, desktop).
- Accesibilidad básica (tab navigation, labels en inputs).
Reporta issues por severidad.
```

### Prompt 7 — qa-tester (integration)

```
Use el qa-tester en modo integration para verificar el flujo completo:
registro de un usuario nuevo -> crear 3 tareas -> marcar 1 como hecha ->
eliminar otra -> logout -> volver a hacer login -> verificar que las
tareas se mantienen.
```

### Cierre

Cuando todo esté verde y tú lo hayas verificado a mano:

```bash
# Solo cuando tú decidas:
git push -u origin feature/tasks-mvp

# Y si quieres PR:
gh pr create --base main --title "feat: MVP de gestión de tareas"
```

---

## Resumen ejecutivo (chuleta)

```
1. product-analyst     → genera spec       → tú revisas
2. architect           → diseña + plan     → tú revisas
3. backend-developer   → implementa back   → tú verificas con curl
4. qa-tester (backend) → tests + reporte   → tú revisas issues
5. frontend-developer  → implementa front  → tú verificas en navegador
6. qa-tester (frontend)→ tests + reporte   → tú revisas issues
7. (opcional) qa-tester (integration) → flujos end-to-end
```

**Principios:**

- Secuencial, nunca paralelo.
- Lee cada output antes de aprobar.
- Una feature, un ciclo completo.
- Prompts estructurados: contexto + objetivo + restricciones.
- Push y PR los decides tú, nunca el agente.

¿Listo? `cp -R cero mi-proyecto && cd mi-proyecto && copilot`.
