# Cero

Proyecto base **vacío** preparado para construir software con un flujo de trabajo asistido por agentes de IA. Compatible con GitHub Copilot CLI, Claude Code, Cursor, Codex, Aider y cualquier herramienta que entienda el [estándar AGENTS.md](https://agents.md).

## ¿Qué es esto?

Un punto de partida limpio que **no impone stack**: ni lenguaje, ni framework, ni base de datos. Solo aporta:

- Un sistema de **roles/agentes** con responsabilidades claras (`agents/`).
- **Reglas globales** del proyecto (`rules/`).
- Un **pipeline de trabajo** definido para que cualquier herramienta de IA lo siga.

El stack y la estructura los decides tú al empezar el primer feature.

## Estructura

```
.
├── AGENTS.md                       Instrucciones primarias (estándar abierto)
├── README.md                       Este archivo
├── tutorial.md                     Walkthrough con prompts paso a paso
├── .gitignore
├── .github/
│   ├── copilot-instructions.md     Apunta a AGENTS.md (Copilot CLI/IDE)
│   └── agents/                     Wrappers nativos para Copilot CLI
│       ├── product-analyst.agent.md
│       ├── architect.agent.md
│       ├── backend-developer.agent.md
│       ├── frontend-developer.agent.md
│       ├── qa-tester.agent.md
│       └── styles-designer.agent.md
├── agents/                         Prompts de cada rol (fuente única)
│   ├── product-analyst.md
│   ├── architect.md
│   ├── backend-developer.md
│   ├── frontend-developer.md
│   ├── qa-tester.md
│   └── styles-designer.md
└── rules/                          Reglas globales
    ├── agent-rules.md
    └── git-workflow.md
```

Los wrappers en `.github/agents/*.agent.md` son cortos y delegan a los archivos de `agents/` — la fuente única es `agents/`. Editar ahí actualiza todas las herramientas a la vez.

## Cómo arrancar un proyecto nuevo

> 🎯 **Si es tu primera vez, abre [`tutorial.md`](tutorial.md)** — tiene los prompts paso a paso, sugerencias para mejor calidad, errores comunes y un ejemplo completo end-to-end.

Abre tu CLI de IA en este directorio y dile:

> "Quiero construir <una app que…>. Sigue el pipeline definido en AGENTS.md."

El **product-analyst** te hará preguntas; el **architect** propondrá stack; los developers implementan; el qa-tester verifica.

## Pipeline resumido

```
product-analyst → architect → backend-dev → qa-tester (backend) → frontend-dev → qa-tester (frontend)
```

Secuencial, no paralelo. El usuario aprueba cada paso antes de avanzar.

## Personalización por herramienta

| Herramienta | Estado |
|-------------|--------|
| GitHub Copilot CLI | ✅ Configurado de fábrica en `.github/agents/*.agent.md` |
| Claude Code | Crea `.claude/agents/<nombre>.md` con frontmatter Claude (no incluido por defecto) |
| Cursor | Configura modos que apunten a `agents/<nombre>.md` |
| Codex / Aider / Zed / otros | Leen `AGENTS.md` automáticamente |

Los archivos de `agents/` son la **fuente única**: los wrappers nativos solo apuntan a ellos.

## Idioma

Documentación, specs y commits en español. Código (identificadores, comentarios técnicos) en inglés.

## Licencia

Define la licencia del proyecto cuando arranques uno real (este repo base no fija ninguna).
