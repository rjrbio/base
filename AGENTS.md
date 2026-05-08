# AGENTS.md

Instrucciones para agentes de IA (GitHub Copilot CLI, Claude Code, Cursor, Codex, Aider, etc.) que trabajen en este repositorio.

> Este archivo es la **fuente de verdad** del proyecto. Cuando una herramienta de IA arranque en este repo debe leerlo entero antes de tocar nada.

---

## 1. Propósito del repositorio

Este es un **proyecto base vacío** preparado para construir software con un flujo de trabajo asistido por agentes de IA. No impone lenguaje, framework ni dominio: el stack lo decides al empezar el primer feature.

Lo que SÍ aporta el repo:

- Un sistema de agentes (roles) en `agents/` con responsabilidades claras.
- Reglas globales del proyecto en `rules/`.
- Un pipeline de trabajo definido (ver §3) que cualquier herramienta puede seguir.

Lo que NO aporta el repo:

- Código de aplicación.
- Configuración de stack (ni Node, ni Python, ni Docker, ni nada).
- Tests pre-escritos.

---

## 2. Sistema de agentes

Hay seis roles disponibles, cada uno con su prompt completo en `agents/`:

| Rol | Archivo | Responsabilidad |
|-----|---------|------------------|
| **product-analyst** | `agents/product-analyst.md` | Convierte ideas/tickets en specs funcionales detalladas |
| **architect** | `agents/architect.md` | Diseña la arquitectura técnica (backend + frontend + contrato) a partir de la spec |
| **backend-developer** | `agents/backend-developer.md` | Implementa el backend según la arquitectura |
| **frontend-developer** | `agents/frontend-developer.md` | Implementa el frontend según la arquitectura |
| **qa-tester** | `agents/qa-tester.md` | Tests unitarios, e2e y verificación en navegador |
| **styles-designer** | `agents/styles-designer.md` | Diseño visual, CSS/estilos, sistema de design |

### Cómo invocar a un agente

Los archivos en `agents/` son prompts/perfiles agnósticos a la herramienta. Hay dos formas de usarlos:

**a) Invocación manual (cualquier herramienta).** Pegas o referencias el archivo del agente en tu mensaje:
> "Lee `agents/architect.md` y actúa como ese rol. Tarea: …"

**b) Subagentes nativos (configurados de fábrica para Copilot CLI).**

- **GitHub Copilot CLI**: ya hay wrappers en `.github/agents/*.agent.md` que delegan a los archivos de `agents/`. Invocación: `/agent` (menú interactivo), "Use el <nombre> para …" en el prompt, o `copilot --agent <nombre> --prompt "…"`. Ver [docs oficiales](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli).
- **Claude Code**: copia o adapta los archivos de `agents/` a `.claude/agents/<nombre>.md` añadiéndoles el frontmatter de Claude. No incluido por defecto.
- **Cursor / Codex / Aider / Zed**: leen `AGENTS.md` automáticamente y usan los archivos de `agents/` como contexto.

`.github/agents/*.agent.md` no duplica el contenido — es un wrapper corto que dice "lee `agents/<nombre>.md` y síguelo". Editar la fuente única (`agents/<nombre>.md`) actualiza el comportamiento en todas las herramientas.

> Para un walkthrough con prompts copy-paste, ver [`tutorial.md`](tutorial.md).

---

## 3. Pipeline de trabajo

Cuando se pide implementar una feature, el flujo es **secuencial** (nunca en paralelo):

```
1. product-analyst     → Genera spec funcional (debe preguntar al usuario)
2. architect           → Diseña arquitectura (backend + frontend + contrato)
3. backend-developer   → Implementa backend según la arquitectura
4. qa-tester (backend) → Crea y ejecuta tests del backend
5. frontend-developer  → Implementa frontend según la arquitectura
6. qa-tester (frontend)→ Verifica UI en navegador
```

### Reglas del pipeline

- Cada paso debe terminar antes de empezar el siguiente.
- El **product-analyst** SIEMPRE hace preguntas antes de escribir la spec — no asume requerimientos.
- El usuario revisa y aprueba la spec antes de pasar a arquitectura.
- Las specs viven en `specs/` (se crea cuando aparece la primera).
- Si una feature no tiene backend o no tiene frontend, se saltan los pasos correspondientes (no se inventan).

---

## 4. Reglas globales

Las reglas que aplican a TODOS los agentes están en `rules/`:

- `rules/agent-rules.md` — Reglas obligatorias del flujo (qué hacer y qué nunca hacer).
- `rules/git-workflow.md` — Convenciones de ramas, commits, PRs.

Cualquier agente debe leer ambas antes de actuar.

---

## 5. Convenciones del proyecto

### Stack

El stack lo decide el usuario en el primer feature. Cuando no hay código aún, el **architect** propone stack y lo confirma con el usuario antes de escribir nada.

Una vez fijado el stack, las decisiones quedan documentadas en la primera spec o en una sección "Stack" añadida a este AGENTS.md.

### Estructura de carpetas

No hay estructura impuesta. El **architect** la propone en la primera arquitectura y se mantiene consistente a partir de ahí.

### Idioma

- Documentación, specs y commits: en **español**.
- Código (identificadores, comentarios técnicos): en **inglés**.

### Tests

Todo código entregado debe tener tests. La política de cobertura la decide el architect según el stack (mínimo razonable: cubrir happy path + casos de error + edge cases relevantes).

---

## 6. Cosas que un agente NO debe hacer

- Crear ramas sin permiso del usuario.
- Hacer push o crear PRs sin permiso explícito.
- Inventar requisitos en lugar de preguntar.
- Saltar pasos del pipeline.
- Modificar archivos de configuración (ni este AGENTS.md, ni `rules/`, ni `agents/`) sin instrucción explícita.
- Cambiar el stack del proyecto a mitad de feature.

Ver `rules/agent-rules.md` para la lista completa.

---

## 7. Para humanos: arrancar el proyecto

1. Decide qué vas a construir.
2. Pide a tu agente de IA: "Quiero implementar <feature>. Sigue el pipeline definido en AGENTS.md."
3. La primera ejecución tendrá una sección extra: **product-analyst** te preguntará el dominio, y **architect** propondrá el stack.
4. Aprueba o ajusta cada output antes de pasar al siguiente paso.

Si es tu primera vez con este proyecto base, abre [`tutorial.md`](tutorial.md) — tiene los prompts paso a paso, sugerencias para mejor calidad, errores comunes y un ejemplo end-to-end.

Para personalizar (cambiar idioma, añadir reglas específicas, modificar el pipeline), edita los archivos de `agents/` y `rules/`. Este AGENTS.md es la entrada — el resto son módulos.
