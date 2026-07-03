# Section Dialects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El fondo WebGL gana identidad por sección (paleta + comportamiento propios por proyecto), capa de partículas, tipografía cinematográfica con SplitText y microinteracciones, según `docs/superpowers/specs/2026-07-03-section-dialects-design.md`.

**Architecture:** Un módulo puro `sectionPresets.ts` mapea (sección, progreso local) → estado de uniforms; `BackgroundManager` lo consume con suavizado exponencial por frame (sin saltos en fronteras). El shader del grid cambia sus fases globales por uniforms de dialecto (`uTension/uFall/uDrift/uFlow/uPulse`) y paletas (`uPaletteBase/Rim/Ember`). Una `THREE.Points` comparte esos uniforms. `ScrollOrchestrator` añade SplitText, glitch de Kintsugi, CTA magnético e indicador de progreso.

**Tech Stack:** Astro 6, Three.js 0.184, GSAP 3.15 (ScrollTrigger + SplitText, ya incluidos), Lenis, Vitest, Playwright.

## Global Constraints

- **Cero dependencias nuevas.** SplitText viene incluido en el paquete `gsap` instalado (≥3.13).
- **Tokens, no hex:** en JS los colores CSS se leen con `getComputedStyle(document.documentElement).getPropertyValue('--p3')`; en CSS siempre `var(--*)`. (Las tripletas RGB del shader viven en `sectionPresets.ts` — son espacio HDR del shader, no tokens CSS.)
- **BRAND.md:** intensidad del shader ≤ 0.5 detrás de texto corrido (se verifica por unit test).
- **`prefers-reduced-motion: reduce`:** sin partículas, sin SplitText, frame estático del fondo, indicador de progreso oculto, sin magnetismo.
- **Gates por tarea:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde antes del commit. E2E (`pnpm test:e2e`) en las tareas que lo indiquen.
- **Commits:** convención existente (`feat(frontend):`, `test(frontend):`…). **Nunca** añadir atribución de IA/co-author.
- Servidor dev para verificación visual: `pnpm dev --port 4321`.

**Refinamientos respecto al spec** (misma intención, mejor implementación — ya validados en diseño):

1. Los uniforms `uCrack`/`uLocalProgress` del spec se refinan en `uTension/uFall/uDrift/uIntensity` calculados en TS (`computeTargetState`): los arcos de animación viven en código puro unit-testeable y el suavizado exponencial garantiza continuidad en fronteras de sección.
2. El barrido dorado de Kintsugi se implementa como onda de color por carácter (stagger GSAP) en lugar de `background-clip: text` — ese enfoque es frágil con los spans transformados de SplitText.
3. En el hover de polaroids se omite "tilt hacia 0" (pelearía con la rotación scrubbed del parallax); quedan escala + sombra.
4. Con reduced-motion el indicador de progreso se oculta (`display: none`) en vez de mostrarse vacío estático.

---

### Task 1: Presets de sección (módulo puro, TDD)

**Files:**

- Create: `src/lib/three/sectionPresets.ts`
- Test: `tests/unit/section-presets.test.ts`

**Interfaces:**

- Consumes: nada (módulo puro, sin Three/DOM).
- Produces:
  - `type RGB = [number, number, number]`
  - `interface BackgroundState { paletteBase: RGB; paletteRim: RGB; paletteEmber: RGB; tension: number; fall: number; drift: number; flow: number; pulse: number; intensity: number }`
  - `SECTION_IDS: SectionId[]` — `['hero','lore-master-assistant','gonna-be','kintsugi-the-fall','cta']`
  - `computeTargetState(id: string, localProgress: number): BackgroundState`
  - `createInitialState(): BackgroundState`
  - `smoothState(current: BackgroundState, target: BackgroundState, alpha: number): void` (muta `current`)

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/unit/section-presets.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import {
  SECTION_IDS,
  computeTargetState,
  createInitialState,
  smoothState,
} from '../../src/lib/three/sectionPresets';

describe('computeTargetState', () => {
  it('maps each section to its own rim palette', () => {
    const rims = SECTION_IDS.map((id) => computeTargetState(id, 0.5).paletteRim.join(','));
    expect(new Set(rims).size).toBe(SECTION_IDS.length);
  });

  it('keeps intensity at or below 0.5 behind body text (BRAND.md rule)', () => {
    for (const id of SECTION_IDS) {
      for (const lp of [0.4, 0.6, 0.8, 1]) {
        expect(computeTargetState(id, lp).intensity).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('gives kintsugi the strongest title moment of the site', () => {
    const kintsugi = computeTargetState('kintsugi-the-fall', 0).intensity;
    for (const id of SECTION_IDS.filter((s) => s !== 'kintsugi-the-fall')) {
      expect(kintsugi).toBeGreaterThan(computeTargetState(id, 0).intensity);
    }
  });

  it('runs the kintsugi fracture arc: intact at title, fallen mid-section, drifting at end', () => {
    expect(computeTargetState('kintsugi-the-fall', 0).fall).toBe(0);
    expect(computeTargetState('kintsugi-the-fall', 0.6).fall).toBeCloseTo(1, 5);
    expect(computeTargetState('kintsugi-the-fall', 0).drift).toBe(0);
    expect(computeTargetState('kintsugi-the-fall', 1).drift).toBeCloseTo(1, 5);
  });

  it('leaves the field partially broken at the CTA (wont fully mend)', () => {
    const cta = computeTargetState('cta', 0.5);
    expect(cta.fall).toBeGreaterThan(0);
    expect(cta.fall).toBeLessThan(0.5);
  });

  it('only lore flows and only gonna-be pulses', () => {
    for (const id of SECTION_IDS) {
      const s = computeTargetState(id, 0.5);
      expect(s.flow).toBe(id === 'lore-master-assistant' ? 1 : 0);
      expect(s.pulse).toBe(id === 'gonna-be' ? 1 : 0);
    }
  });

  it('falls back to the hero preset for unknown ids', () => {
    expect(computeTargetState('unknown', 0.5).paletteRim).toEqual(
      computeTargetState('hero', 0.5).paletteRim,
    );
  });

  it('clamps localProgress outside [0, 1]', () => {
    expect(computeTargetState('hero', -1)).toEqual(computeTargetState('hero', 0));
    expect(computeTargetState('hero', 2)).toEqual(computeTargetState('hero', 1));
  });
});

describe('smoothState', () => {
  it('reaches the target with alpha 1 and stays put with alpha 0', () => {
    const target = computeTargetState('kintsugi-the-fall', 0.5);
    const a = createInitialState();
    smoothState(a, target, 1);
    expect(a).toEqual(target);

    const b = createInitialState();
    const before = structuredClone(b);
    smoothState(b, target, 0);
    expect(b).toEqual(before);
  });

  it('moves scalars and palettes proportionally at alpha 0.5', () => {
    const current = createInitialState();
    const start = structuredClone(current);
    const target = computeTargetState('lore-master-assistant', 0.5);
    smoothState(current, target, 0.5);
    expect(current.flow).toBeCloseTo((start.flow + target.flow) / 2, 5);
    expect(current.paletteRim[2]).toBeCloseTo((start.paletteRim[2] + target.paletteRim[2]) / 2, 5);
  });
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `pnpm vitest run tests/unit/section-presets.test.ts`
Expected: FAIL — `Cannot find module '../../src/lib/three/sectionPresets'`.

- [ ] **Step 3: Implementar el módulo**

Crear `src/lib/three/sectionPresets.ts`:

```ts
export type RGB = [number, number, number];

export type SectionId = 'hero' | 'lore-master-assistant' | 'gonna-be' | 'kintsugi-the-fall' | 'cta';

export interface BackgroundState {
  paletteBase: RGB;
  paletteRim: RGB;
  paletteEmber: RGB;
  tension: number;
  fall: number;
  drift: number;
  flow: number;
  pulse: number;
  intensity: number;
}

interface SectionPreset {
  paletteBase: RGB;
  paletteRim: RGB;
  paletteEmber: RGB;
  flow: number;
  pulse: number;
  /** Intensity while the title owns the viewport (localProgress ≲ 0.1). */
  intensityTitle: number;
  /** Intensity behind body text (localProgress ≳ 0.35). Must stay ≤ 0.5 (BRAND.md). */
  intensityBody: number;
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// HDR shader palettes (not CSS tokens): components may exceed 1.0 so the
// bloom pass picks them up, mirroring the previous hardcoded shader colours.
const PRESETS: Record<SectionId, SectionPreset> = {
  hero: {
    paletteBase: [0.045, 0.015, 0.025],
    paletteRim: [1.3, 0.18, 0.08],
    paletteEmber: [1.8, 0.45, 0.1],
    flow: 0,
    pulse: 0,
    intensityTitle: 0.15,
    intensityBody: 0.35,
  },
  'lore-master-assistant': {
    paletteBase: [0.02, 0.028, 0.075],
    paletteRim: [0.45, 0.55, 1.6],
    paletteEmber: [0.75, 0.85, 2.0],
    flow: 1,
    pulse: 0,
    intensityTitle: 0.6,
    intensityBody: 0.4,
  },
  'gonna-be': {
    paletteBase: [0.06, 0.03, 0.012],
    paletteRim: [1.55, 0.75, 0.28],
    paletteEmber: [1.9, 1.0, 0.4],
    flow: 0,
    pulse: 1,
    intensityTitle: 0.65,
    intensityBody: 0.45,
  },
  'kintsugi-the-fall': {
    paletteBase: [0.05, 0.038, 0.02],
    paletteRim: [1.65, 1.15, 0.45],
    paletteEmber: [2.0, 1.55, 0.7],
    flow: 0,
    pulse: 0,
    intensityTitle: 0.9,
    intensityBody: 0.42,
  },
  cta: {
    paletteBase: [0.04, 0.02, 0.03],
    paletteRim: [1.0, 0.45, 0.5],
    paletteEmber: [1.4, 0.8, 0.6],
    flow: 0,
    pulse: 0,
    intensityTitle: 0.5,
    intensityBody: 0.3,
  },
};

export const SECTION_IDS = Object.keys(PRESETS) as SectionId[];

function isSectionId(id: string): id is SectionId {
  return id in PRESETS;
}

/**
 * Pure mapping (sectionId, localProgress 0-1) -> target uniform state.
 * Every motion arc lives here so it stays unit-testable.
 */
export function computeTargetState(id: string, localProgress: number): BackgroundState {
  const preset = PRESETS[isSectionId(id) ? id : 'hero'];
  const lp = Math.min(1, Math.max(0, localProgress));

  const intensity = mix(preset.intensityTitle, preset.intensityBody, smoothstep(0.08, 0.35, lp));

  let tension: number;
  let fall = 0;
  let drift = 0;

  if (id === 'kintsugi-the-fall') {
    // Fracture arc: tension builds, the cascade breaks the field, shards drift.
    tension = mix(0.8, 0.2, smoothstep(0.0, 0.3, lp));
    fall = smoothstep(0.05, 0.55, lp);
    drift = smoothstep(0.55, 0.95, lp);
  } else if (id === 'cta') {
    // "Won't fully mend": the field stays partially broken at the close.
    tension = 0.2;
    fall = 0.3;
    drift = 0.25;
  } else if (id === 'hero') {
    // Quiet start that builds as the visitor commits to scrolling.
    tension = smoothstep(0.2, 1.0, lp) * 0.5;
  } else {
    tension = 0.3;
  }

  return {
    paletteBase: [...preset.paletteBase],
    paletteRim: [...preset.paletteRim],
    paletteEmber: [...preset.paletteEmber],
    tension,
    fall,
    drift,
    flow: preset.flow,
    pulse: preset.pulse,
    intensity,
  };
}

export function createInitialState(): BackgroundState {
  return computeTargetState('hero', 0);
}

/**
 * Exponential smoothing toward target; mutates `current`. Continuous by
 * construction, so section changes can never produce visual jumps.
 */
export function smoothState(
  current: BackgroundState,
  target: BackgroundState,
  alpha: number,
): void {
  const k = Math.min(1, Math.max(0, alpha));
  const scalarKeys = ['tension', 'fall', 'drift', 'flow', 'pulse', 'intensity'] as const;
  for (const key of scalarKeys) {
    current[key] += (target[key] - current[key]) * k;
  }
  const rgbKeys = ['paletteBase', 'paletteRim', 'paletteEmber'] as const;
  // Literal indices keep tuple access sound under noUncheckedIndexedAccess.
  for (const key of rgbKeys) {
    for (const i of [0, 1, 2] as const) {
      current[key][i] += (target[key][i] - current[key][i]) * k;
    }
  }
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `pnpm vitest run tests/unit/section-presets.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Gates y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add src/lib/three/sectionPresets.ts tests/unit/section-presets.test.ts
git commit -m "feat(frontend): add section presets module with motion arcs"
```

---

### Task 2: Shader con dialectos + cableado estático de uniforms

Reescribe los shaders para consumir el estado por sección y conecta los uniforms en `BackgroundManager` con valores fijos del hero. Al terminar, la página se ve como un hero carmesí continuo (sin campana global) — la variación por sección llega en la Task 3.

**Files:**

- Modify: `src/lib/shaders/background.ts` (reemplazo completo de ambos shaders)
- Modify: `src/lib/three/BackgroundManager.ts` (bloque de uniforms, reduced-motion, ScrollTrigger global)

**Interfaces:**

- Consumes: `computeTargetState`, `createInitialState`, `BackgroundState` de Task 1.
- Produces: shaders que esperan los uniforms `uTension`, `uFall`, `uDrift`, `uFlow`, `uPulse`, `uIntensity` (float), `uPaletteBase`, `uPaletteRim`, `uPaletteEmber` (vec3), además de los existentes `uTime`, `uProgress` (solo parallax), `uMouseWorld`, `uReducedMotion`. Función local `applyStateToUniforms(state)` en `initBackground`.

- [ ] **Step 1: Reemplazar `src/lib/shaders/background.ts` completo**

```ts
export const backgroundVert = /* glsl */ `
  precision mediump float;

  attribute float aSeed;
  attribute vec2 aGridPos;
  attribute vec2 aScale;
  attribute vec3 aAxis;
  attribute float aDepth;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouseWorld;
  uniform float uReducedMotion;
  uniform float uTension;
  uniform float uFall;
  uniform float uDrift;
  uniform float uFlow;
  uniform float uPulse;
  uniform vec3 uPaletteBase;
  uniform vec3 uPaletteEmber;

  varying vec3 vColor;
  varying float vBrightness1;
  varying float vBrightness2;
  varying float vRim;
  varying float vEmber;
  varying float vDrift;
  varying float vFalling;
  varying float vDepth;

  // ---------- noise & fbm ----------
  float hash11(float n) {
    return fract(sin(n * 53.123) * 43758.5453);
  }

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i + vec2(0.0, 0.0));
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm7(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 7; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(31.7, 17.3);
      a *= 0.5;
    }
    return v;
  }

  vec2 warp(vec2 p, float t) {
    vec2 q = vec2(
      fbm7(p + vec2(t * 0.10, 0.0)),
      fbm7(p + vec2(5.2, 1.3) + t * 0.07)
    );
    vec2 r = vec2(
      fbm7(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.13),
      fbm7(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.11)
    );
    return r;
  }

  mat3 rotateAxis(vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    float t = 1.0 - c;
    vec3 a = normalize(axis);
    return mat3(
      t * a.x * a.x + c,         t * a.x * a.y - s * a.z,  t * a.x * a.z + s * a.y,
      t * a.x * a.y + s * a.z,   t * a.y * a.y + c,        t * a.y * a.z - s * a.x,
      t * a.x * a.z - s * a.y,   t * a.y * a.z + s * a.x,  t * a.z * a.z + c
    );
  }

  void main() {
    float r1 = hash11(aSeed * 1.7);
    float r2 = hash11(aSeed * 3.1 + 1.3);
    float r3 = hash11(aSeed * 5.9 + 2.7);
    float r4 = hash11(aSeed * 11.3 + 4.1);

    float t_inner = uTime * (1.0 - uReducedMotion);

    // ---- Breathing (always on); tension amplitude comes from the section ----
    vec2 q = warp(aGridPos * 0.30 + vec2(t_inner * 0.04, 0.0), t_inner);
    float breath = fbm7(aGridPos * 0.45 + q * 1.6 + t_inner * 0.07);
    float tension = uTension;
    float waveAmp = 0.18 + tension * 1.10;
    float zOffset = (breath - 0.5) * waveAmp;
    float pressureMask = smoothstep(0.55, 0.85, breath);
    zOffset += pressureMask * tension * 0.55 * (0.5 + r1 * 0.5);

    float rawFall = uFall;

    // ---- Scale animation; flow stretches pieces into horizontal streaks ----
    float scaleAnim = 1.0 + tension * 0.30 - rawFall * 0.35;
    vec3 pos = position * vec3(
      aScale.x * scaleAnim * (1.0 + uFlow * 0.9),
      aScale.y * scaleAnim,
      1.0
    );
    vec3 nrm = normal;

    // ---- Fragmentation: cascade from mouse focal ----
    float distFromMouse = length(aGridPos - uMouseWorld);
    float maxDist = 11.0;
    float distNorm = clamp(distFromMouse / maxDist, 0.0, 1.0);

    float jitter = (r2 - 0.5) * 0.18;
    float delayedFall = clamp(rawFall * 1.7 - distNorm * 0.95 + jitter, 0.0, 1.0);
    delayedFall = smoothstep(0.0, 1.0, delayedFall);

    vec3 axis = normalize(aAxis);
    float maxAngle = 2.6 + r3 * 1.2;
    float baseAngle = delayedFall * maxAngle;

    // ---- Drift: scattered, slowly reattracted, slowly spinning ----
    float drift = uDrift;
    float continuousSpin = drift * t_inner * 0.45 * (0.5 + r3 * 0.5);
    float angle = baseAngle + continuousSpin;
    pos = rotateAxis(axis, angle) * pos;
    nrm = rotateAxis(axis, angle) * nrm;

    vec3 driftOffset = vec3(
      cos(t_inner * 0.55 + aSeed * 6.28) * (0.9 + r1 * 1.1),
      sin(t_inner * 0.65 + aSeed * 7.00) * (0.5 + r2 * 0.6),
      sin(t_inner * 0.45 + aSeed * 4.50) * (0.9 + r3 * 1.0)
    ) * drift;
    vec3 reattract = -vec3(aGridPos, 0.0) * drift * 0.18 * (0.4 + r4 * 0.6);

    // ---- Radial launch during fragmentation ----
    vec3 launchDir = normalize(vec3(
      hash11(aSeed * 13.7) * 2.0 - 1.0,
      hash11(aSeed * 19.1) * 2.0 - 1.0,
      hash11(aSeed * 23.3) * 2.0 - 1.0
    ));
    vec3 launchOffset = launchDir * delayedFall * (0.5 + aDepth * 1.4);

    // ---- Depth parallax: still driven by global page progress (spatial) ----
    float parY = mix(1.5, 12.0, aDepth) * uProgress;
    float parZ = mix(0.5, 4.0, aDepth) * uProgress;
    float parX = (r4 - 0.5) * 1.2 * aDepth * uProgress;

    // ---- Flow dialect: pieces align into lanes streaming horizontally ----
    float laneSeed = hash11(aGridPos.y * 7.31);
    float laneDir = laneSeed > 0.5 ? 1.0 : -1.0;
    float laneSpeed = (0.4 + laneSeed * 0.9) * laneDir;
    float wrappedX = mod(aGridPos.x + t_inner * laneSpeed + 8.0, 16.0) - 8.0;

    // ---- Pulse dialect: ascending brightness waves lift the pieces ----
    float pulseWave = sin(aGridPos.y * 0.55 - t_inner * 1.6 + aGridPos.x * 0.12) * 0.5 + 0.5;
    pulseWave = smoothstep(0.55, 0.95, pulseWave);

    // ---- Compose ----
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    worldPos.x = mix(worldPos.x, wrappedX, uFlow);
    worldPos.y = mix(worldPos.y, aGridPos.y, uFlow * 0.6);
    worldPos.y += uPulse * pulseWave * 0.22;
    worldPos.z += zOffset + parZ;
    worldPos.y -= parY;
    worldPos.x += parX;
    worldPos.xyz += driftOffset + reattract + launchOffset;

    gl_Position = projectionMatrix * modelViewMatrix * worldPos;

    // ---- Lighting ----
    vec3 worldNormal = normalize((instanceMatrix * vec4(nrm, 0.0)).xyz);
    vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.9));
    vec3 lightDir2 = normalize(vec3(-0.8, -0.2, 0.6));
    vBrightness1 = max(0.0, dot(worldNormal, lightDir1));
    vBrightness2 = max(0.0, dot(worldNormal, lightDir2));

    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vRim = pow(1.0 - max(0.0, dot(worldNormal, viewDir)), 2.2);

    // ---- Colour from the section palette ----
    vec3 colorVoid = vec3(0.001, 0.001, 0.006);
    vec3 c = mix(colorVoid, uPaletteBase * 0.35, breath);
    c = mix(c, uPaletteBase, tension * 0.55);
    c = mix(c, uPaletteBase * 1.8, tension * pressureMask * 0.45);
    c = mix(c, colorVoid * 1.2, drift * 0.7);

    float midFlash = max(0.0, sin(baseAngle * 2.0));
    float flashStrength = midFlash * delayedFall * (1.0 - drift);
    float pulseGlow = uPulse * pulseWave;
    c = mix(c, uPaletteEmber, max(flashStrength * 0.85, pulseGlow * 0.45));

    vColor = c;
    vEmber = max(flashStrength, pulseGlow * 0.5);
    vDrift = drift;
    vFalling = delayedFall;
    vDepth = aDepth;
  }
`;

export const backgroundFrag = /* glsl */ `
  precision mediump float;

  uniform vec3 uPaletteRim;
  uniform vec3 uPaletteEmber;
  uniform float uIntensity;

  varying vec3 vColor;
  varying float vBrightness1;
  varying float vBrightness2;
  varying float vRim;
  varying float vEmber;
  varying float vDrift;
  varying float vFalling;
  varying float vDepth;

  void main() {
    vec3 color = vColor;

    float ambient = 0.025;
    vec3 lit =
      color * (ambient + 0.40 * vBrightness1) +
      uPaletteRim * 0.35 * vBrightness2 * 0.28;

    float rimAtten = mix(0.6, 1.0, vDepth);
    lit += uPaletteRim * vRim * (0.50 + 0.55 * (1.0 - vDrift)) * rimAtten;

    lit += uPaletteEmber * vEmber * 0.85;

    // Section-driven intensity from presets (0-1); 2.0 restores the old
    // peak scale so kintsugi's 0.9 lands near the previous climax energy.
    lit *= uIntensity * 2.0;

    gl_FragColor = vec4(lit, 1.0);
  }
`;
```

- [ ] **Step 2: Cablear uniforms en `BackgroundManager.ts`**

Añadir import tras los existentes:

```ts
import { computeTargetState, createInitialState } from './sectionPresets';
import type { BackgroundState } from './sectionPresets';
```

Reemplazar el bloque `const uniforms = { ... }` actual por:

```ts
const state = createInitialState();

const uniforms = {
  uTime: { value: 0 },
  uProgress: { value: reducedMotion ? 0.5 : 0 },
  uMouse: { value: uMouse },
  uMouseWorld: { value: uMouseWorld },
  uReducedMotion: { value: reducedMotion ? 1 : 0 },
  uTension: { value: state.tension },
  uFall: { value: state.fall },
  uDrift: { value: state.drift },
  uFlow: { value: state.flow },
  uPulse: { value: state.pulse },
  uIntensity: { value: state.intensity },
  uPaletteBase: { value: new THREE.Vector3(...state.paletteBase) },
  uPaletteRim: { value: new THREE.Vector3(...state.paletteRim) },
  uPaletteEmber: { value: new THREE.Vector3(...state.paletteEmber) },
};

const applyStateToUniforms = (s: BackgroundState): void => {
  uniforms.uTension.value = s.tension;
  uniforms.uFall.value = s.fall;
  uniforms.uDrift.value = s.drift;
  uniforms.uFlow.value = s.flow;
  uniforms.uPulse.value = s.pulse;
  uniforms.uIntensity.value = s.intensity;
  uniforms.uPaletteBase.value.set(...s.paletteBase);
  uniforms.uPaletteRim.value.set(...s.paletteRim);
  uniforms.uPaletteEmber.value.set(...s.paletteEmber);
};
```

- [ ] **Step 3: Frame estático de reduced-motion con estado explícito**

Reemplazar el bloque `if (reducedMotion) { ... }` (el que hace `composer.render(); return;`) por:

```ts
if (reducedMotion) {
  uniforms.uTime.value = 0;
  uniforms.uProgress.value = 0.5;
  applyStateToUniforms(computeTargetState('hero', 0.5));
  composer.render();
  return;
}
```

- [ ] **Step 4: Verificar en navegador**

Run: `pnpm typecheck && pnpm dev --port 4321`
Expected: sin errores de compilación ni de consola en el navegador; la página entera se ve con la identidad carmesí del hero (sin campana de intensidad — uniforme y tenue). Verificar que el grid respira y el mouse sigue creando el foco de fragmentación… (nota: `uFall` es 0 en hero, así que no hay cascada — correcto).

- [ ] **Step 5: Gates y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add src/lib/shaders/background.ts src/lib/three/BackgroundManager.ts
git commit -m "feat(frontend): dialect uniforms in background shader, static hero wiring"
```

---

### Task 3: Consciencia de sección (triggers + suavizado por frame)

**Files:**

- Modify: `src/components/hero/Hero.astro:5` (atributo `data-bg-section`)
- Modify: `src/components/project/ProjectSection.astro:12-17` (atributo)
- Modify: `src/components/cta/PortfolioCTA.astro:7` (atributo)
- Modify: `src/lib/three/BackgroundManager.ts` (triggers por sección + smoothing en tick)

**Interfaces:**

- Consumes: `computeTargetState`, `smoothState`, `applyStateToUniforms` (Task 2), atributo `data-bg-section` en el DOM.
- Produces: convención DOM `data-bg-section="<id>"` con ids `hero | <slug de proyecto> | cta` (la consumen Task 6 para el color del progress y los e2e).

- [ ] **Step 1: Añadir atributos a las secciones**

En `Hero.astro`, la etiqueta de apertura pasa a:

```astro
<section class="hero" data-bg-section="hero" aria-labelledby="hero-headline"></section>
```

En `ProjectSection.astro`:

```astro
<section
  id={slug}
  class={`project project--${palette}`}
  aria-labelledby={`${slug}-title`}
  data-project={slug}
  data-bg-section={slug}
>
</section>
```

En `PortfolioCTA.astro`:

```astro
<section class="cta" data-bg-section="cta" aria-labelledby="cta-headline"></section>
```

- [ ] **Step 2: Triggers por sección en `BackgroundManager.ts`**

Añadir import de `smoothState`:

```ts
import { computeTargetState, createInitialState, smoothState } from './sectionPresets';
```

Justo después del bloque del ScrollTrigger global existente (el de `start: 0, end: 'max'`), añadir:

```ts
// ---- Section awareness: contiguous triggers hand over at viewport centre ----
let activeSectionId = 'hero';
let activeLocalProgress = 0;
document.querySelectorAll<HTMLElement>('[data-bg-section]').forEach((el, idx) => {
  ScrollTrigger.create({
    trigger: el,
    start: idx === 0 ? 'top top' : 'top 50%',
    end: 'bottom 50%',
    onUpdate: (self) => {
      activeSectionId = el.dataset.bgSection ?? 'hero';
      activeLocalProgress = self.progress;
    },
  });
});
```

- [ ] **Step 3: Suavizado por frame en el tick**

Dentro de `const tick = (time: number): void => { if (running) { ... } }`, después de `uniforms.uTime.value = time * 0.001;` y antes de `composer.render();`, añadir:

```ts
smoothState(state, computeTargetState(activeSectionId, activeLocalProgress), 0.06);
applyStateToUniforms(state);
```

- [ ] **Step 4: Verificación visual por sección**

Run: `pnpm dev --port 4321` y recorrer la página.
Expected: hero carmesí tenue → Lore azul-violeta con piezas alargadas fluyendo en carriles → GonnaBe ámbar con olas de brillo ascendentes → Kintsugi dorado con cascada de fractura dentro de su propia sección (y deriva de fragmentos al final) → CTA con campo parcialmente roto en tono mezclado. Transiciones sin saltos (~1 s de mutación). El texto de cada sección se lee sin esfuerzo (intensidad ≤ 0.5 tras el título).

- [ ] **Step 5: Gates, e2e del shader y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e -g "background pixels change"
git add src/components/hero/Hero.astro src/components/project/ProjectSection.astro src/components/cta/PortfolioCTA.astro src/lib/three/BackgroundManager.ts
git commit -m "feat(frontend): section-aware background with smoothed dialect transitions"
```

---

### Task 4: Capa de partículas

**Files:**

- Create: `src/lib/shaders/particles.ts`
- Create: `src/lib/three/ParticleField.ts`
- Modify: `src/lib/three/BackgroundManager.ts` (integración + flag `data-particles`)

**Interfaces:**

- Consumes: el objeto `uniforms` compartido de Task 2 (los shaders de partículas declaran solo los que usan; Three ignora el resto).
- Produces: `buildParticleField(uniforms: Record<string, THREE.IUniform>, count: number): THREE.Points`; el canvas expone `data-particles="<count>"` cuando hay partículas activas (lo consume el e2e de Task 7).

- [ ] **Step 1: Crear `src/lib/shaders/particles.ts`**

```ts
export const particlesVert = /* glsl */ `
  precision mediump float;

  attribute float aSeed;

  uniform float uTime;
  uniform float uFlow;
  uniform float uPulse;
  uniform float uReducedMotion;
  uniform vec2 uMouseWorld;

  varying float vSeed;

  float hash11(float n) {
    return fract(sin(n * 53.123) * 43758.5453);
  }

  void main() {
    vSeed = aSeed;
    float t = uTime * (1.0 - uReducedMotion);

    vec3 pos = position;

    // Organic wander, always on.
    float r1 = hash11(aSeed * 3.7);
    float r2 = hash11(aSeed * 7.9 + 1.3);
    pos.x += sin(t * (0.15 + r1 * 0.2) + aSeed * 6.28) * 0.6;
    pos.y += cos(t * (0.12 + r2 * 0.25) + aSeed * 4.7) * 0.45;

    // Flow: fast horizontal streaming. Pulse: slow ascent.
    pos.x += uFlow * t * (0.8 + r1 * 1.6);
    pos.y += uPulse * t * (0.25 + r2 * 0.5);

    // Wrap inside the field box.
    pos.x = mod(pos.x + 9.0, 18.0) - 9.0;
    pos.y = mod(pos.y + 6.0, 12.0) - 6.0;

    // Gentle pointer repulsion.
    vec2 fromMouse = pos.xy - uMouseWorld;
    float d = length(fromMouse);
    pos.xy += normalize(fromMouse + 0.0001) * smoothstep(2.2, 0.0, d) * 0.5;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min((0.6 + hash11(aSeed * 11.1) * 1.6) * (30.0 / -mv.z), 22.0);
  }
`;

export const particlesFrag = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform float uFlow;
  uniform float uIntensity;
  uniform vec3 uPaletteEmber;

  varying float vSeed;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    // Flow elongates sprites into horizontal streaks.
    pc.x *= mix(1.0, 0.35, uFlow);
    float d = length(pc);
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
    float alpha = smoothstep(0.5, 0.1, d) * twinkle * clamp(uIntensity * 1.4, 0.0, 0.85);
    if (alpha < 0.01) discard;
    vec3 color = mix(uPaletteEmber, vec3(1.0), 0.25);
    gl_FragColor = vec4(color * 0.8, alpha);
  }
`;
```

- [ ] **Step 2: Crear `src/lib/three/ParticleField.ts`**

```ts
import * as THREE from 'three';

import { particlesFrag, particlesVert } from '../shaders/particles';

/**
 * Dust/stream layer sharing the section uniforms of the background grid.
 * The shaders declare only the uniforms they use; Three ignores the rest.
 */
export function buildParticleField(
  uniforms: Record<string, THREE.IUniform>,
  count: number,
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  // Same LCG family as the grid so layouts are deterministic across reloads.
  let s = 0xd15ea5e >>> 0;
  const rng = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rng() - 0.5) * 18;
    positions[i * 3 + 1] = (rng() - 0.5) * 12;
    positions[i * 3 + 2] = -1.0 + rng() * 3.5;
    seeds[i] = rng();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: particlesVert,
    fragmentShader: particlesFrag,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
```

- [ ] **Step 3: Integrar en `BackgroundManager.ts`**

Añadir import:

```ts
import { buildParticleField } from './ParticleField';
```

Justo después de `scene.add(mesh);`, añadir:

```ts
// ---- Particle layer (skipped entirely under reduced motion) ----
if (!reducedMotion) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const particleCount = isMobile ? 250 : 800;
  scene.add(buildParticleField(uniforms, particleCount));
  canvas.dataset.particles = String(particleCount);
}
```

- [ ] **Step 4: Verificar en navegador**

Run: `pnpm dev --port 4321`
Expected: polvo/streaks visibles y coherentes por sección (streaks azules horizontales en Lore, brasas ascendiendo en GonnaBe, polvo dorado titilante en Kintsugi, cenizas casi imperceptibles en hero por su intensidad baja). Sin errores de consola. En DevTools, emular `prefers-reduced-motion: reduce` y recargar: el canvas NO tiene atributo `data-particles`.

- [ ] **Step 5: Gates y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add src/lib/shaders/particles.ts src/lib/three/ParticleField.ts src/lib/three/BackgroundManager.ts
git commit -m "feat(frontend): section-tinted particle layer over the grid"
```

---

### Task 5: Tipografía cinematográfica (SplitText)

**Files:**

- Modify: `src/lib/scroll/ScrollOrchestrator.ts`

**Interfaces:**

- Consumes: DOM existente — `.hero__headline`, `[data-reveal="title"]`, `.project__tagline`, sección `#kintsugi-the-fall`. SplitText de `gsap/SplitText`.
- Produces: nada nuevo para otras tareas. El early-return de reduced-motion existente cubre todo (los títulos quedan estáticos y visibles).

- [ ] **Step 1: Imports y registro**

En `ScrollOrchestrator.ts` añadir el import y ampliar el registro:

```ts
import { SplitText } from 'gsap/SplitText';
```

```ts
gsap.registerPlugin(ScrollTrigger, SplitText);
```

- [ ] **Step 2: Reemplazar el reveal genérico de títulos**

Eliminar el bloque actual `const titles = document.querySelectorAll... titles.forEach((el) => { gsap.from(el, { opacity: 0, y: 60, ... }) });` y sustituirlo por:

```ts
initHeroEntrance();
initTitleReveals();
```

Añadir al final del archivo (nivel de módulo):

```ts
function initHeroEntrance(): void {
  const headline = document.querySelector<HTMLElement>('.hero__headline');
  if (!headline) return;
  const split = new SplitText(headline, { type: 'chars', mask: 'chars' });
  gsap.from(split.chars, {
    yPercent: 110,
    rotateX: -35,
    duration: 1.05,
    ease: 'power4.out',
    stagger: 0.035,
    delay: 0.2,
  });
  const period = split.chars[split.chars.length - 1];
  if (period) {
    gsap.from(period, {
      scale: 0,
      duration: 0.5,
      delay: 0.2 + split.chars.length * 0.035 + 0.15,
      ease: 'back.out(3)',
    });
  }
}

function initTitleReveals(): void {
  const gold =
    getComputedStyle(document.documentElement).getPropertyValue('--p3').trim() || '#d4a64a';

  document
    .querySelectorAll<HTMLElement>('[data-reveal="title"]:not(.hero__headline)')
    .forEach((el) => {
      if (el.closest('#kintsugi-the-fall')) {
        initKintsugiReveal(el, gold);
        return;
      }
      const split = new SplitText(el, { type: 'chars', mask: 'chars' });
      gsap.from(split.chars, {
        yPercent: 115,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.03,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    });

  document.querySelectorAll<HTMLElement>('.project__tagline').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.9,
      delay: 0.35,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });
}

// Fracture glitch + one-shot golden sweep: the typographic kintsugi crack.
function initKintsugiReveal(el: HTMLElement, gold: string): void {
  const split = new SplitText(el, { type: 'chars' });
  const chars = split.chars;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top 78%', once: true },
  });
  tl.from(chars, {
    opacity: 0,
    duration: 0.05,
    stagger: { each: 0.028, from: 'random' },
  })
    .to(chars, {
      x: () => gsap.utils.random(-16, 16),
      y: () => gsap.utils.random(-12, 12),
      opacity: () => gsap.utils.random(0.15, 1),
      duration: 0.08,
      repeat: 3,
      repeatRefresh: true,
      stagger: { each: 0.01, from: 'random' },
    })
    .to(chars, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power3.out',
      stagger: { each: 0.012, from: 'random' },
    })
    .to(
      chars,
      {
        color: gold,
        textShadow: '0 0 24px rgba(212, 166, 74, 0.55)',
        duration: 0.16,
        stagger: 0.02,
        ease: 'none',
      },
      '+=0.1',
    )
    .to(
      chars,
      {
        color: 'var(--fg)',
        textShadow: '0 0 0px rgba(212, 166, 74, 0)',
        duration: 0.4,
        stagger: 0.02,
        ease: 'power2.out',
      },
      '<0.18',
    );
}
```

- [ ] **Step 3: Verificar en navegador**

Run: `pnpm dev --port 4321`
Expected:

- Hero: caracteres suben desde máscara con stagger; el punto final hace pop.
- Títulos de Lore/GonnaBe/CTA: reveal por carácter al entrar en viewport, reversible al scrollear arriba.
- Kintsugi: entra glitcheado (jitter+flicker), se recompone y una onda dorada recorre el título una sola vez.
- Los headings mantienen nombre accesible (SplitText aplica `aria-label` automáticamente): inspeccionar `aria-label="Kintsugi: The Fall"` en el h2.
- Con reduced-motion emulado: títulos estáticos visibles, sin split.

- [ ] **Step 4: E2E de regresión de headings**

Run: `pnpm test:e2e -g "hero with the headline"`
Expected: PASS (SplitText preserva textContent y nombre accesible).

- [ ] **Step 5: Gates y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add src/lib/scroll/ScrollOrchestrator.ts
git commit -m "feat(frontend): cinematic char reveals with kintsugi fracture glitch"
```

---

### Task 6: Indicador de progreso + CTA magnético + hover de polaroids

**Files:**

- Create: `src/components/progress/ScrollProgress.astro`
- Modify: `src/layouts/BaseLayout.astro` (montar componente)
- Modify: `src/components/cta/PortfolioCTA.astro` (underline redraw)
- Modify: `src/components/project/SubSection.astro` (sombra hover)
- Modify: `src/lib/scroll/ScrollOrchestrator.ts` (progress fill + magnetismo + hover)

**Interfaces:**

- Consumes: `data-bg-section` (Task 3) para el color del progreso; `.cta__link`, `.project-image` existentes.
- Produces: DOM `[data-scroll-progress]` y `[data-scroll-progress-fill]` (los consume el e2e de Task 7).

- [ ] **Step 1: Crear `src/components/progress/ScrollProgress.astro`**

```astro
<div class="scroll-progress" aria-hidden="true" data-scroll-progress>
  <div class="scroll-progress__fill" data-scroll-progress-fill></div>
</div>

<style>
  .scroll-progress {
    position: fixed;
    top: 0;
    right: 0;
    width: 2px;
    height: 100vh;
    z-index: 10;
    background: color-mix(in srgb, var(--fg) 8%, transparent);
    pointer-events: none;
  }

  .scroll-progress__fill {
    width: 100%;
    height: 100%;
    background: var(--fg-muted);
    transform: scaleY(0);
    transform-origin: top;
    will-change: transform;
    transition: background-color 1s var(--ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-progress {
      display: none;
    }
  }
</style>
```

- [ ] **Step 2: Montarlo en `BaseLayout.astro`**

Añadir import junto al de AudioToggle:

```astro
import ScrollProgress from '../components/progress/ScrollProgress.astro';
```

Y en el body, tras `<AudioToggle audioAvailable={audioAvailable} />`:

```astro
<ScrollProgress />
```

- [ ] **Step 3: Underline redraw en `PortfolioCTA.astro`**

En el `<style>`, sustituir las reglas `.cta__link { ... }` (solo las propiedades `padding-bottom` y `border-bottom`) para usar `::after`. La regla `.cta__link` queda:

```css
.cta__link {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  position: relative;
  margin-top: var(--sp-8);
  padding-bottom: var(--sp-1);
  color: var(--fg);
  font-size: var(--fs-h1);
  font-weight: 600;
  transition: color var(--dur-fast) var(--ease-out);
}

.cta__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: currentColor;
}

.cta__link:hover::after,
.cta__link:focus-visible::after {
  animation: underline-redraw 0.6s var(--ease-out);
}

@keyframes underline-redraw {
  0% {
    transform: scaleX(1);
    transform-origin: right;
  }
  45% {
    transform: scaleX(0);
    transform-origin: right;
  }
  50% {
    transform: scaleX(0);
    transform-origin: left;
  }
  100% {
    transform: scaleX(1);
    transform-origin: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cta__link:hover::after,
  .cta__link:focus-visible::after {
    animation: none;
  }
}
```

(La regla `.cta__link:hover, .cta__link:focus-visible { color/border-color }` pierde `border-color: var(--p3);` — el underline es `currentColor` y hereda el cambio.)

- [ ] **Step 4: Sombra hover en `SubSection.astro`**

Añadir al final del `<style>`:

```css
@media (hover: hover) {
  .subsection__content :global(.project-image) {
    transition: box-shadow var(--dur-mid) var(--ease-out);
  }

  .subsection__content :global(.project-image:hover) {
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.65),
      0 8px 20px rgba(0, 0, 0, 0.5);
  }
}
```

- [ ] **Step 5: JS en `ScrollOrchestrator.ts`**

En `initScroll()`, tras `initTitleReveals();`, añadir:

```ts
initScrollProgress();
initMagneticCta();
initPolaroidHover();
```

Y al final del archivo:

```ts
function initScrollProgress(): void {
  const fill = document.querySelector<HTMLElement>('[data-scroll-progress-fill]');
  if (!fill) return;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      fill.style.transform = `scaleY(${self.progress})`;
    },
  });

  const accents: Record<string, string> = {
    'lore-master-assistant': 'var(--p1)',
    'gonna-be': 'var(--p2)',
    'kintsugi-the-fall': 'var(--p3)',
  };
  document.querySelectorAll<HTMLElement>('[data-bg-section]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (self.isActive) {
          fill.style.background = accents[el.dataset.bgSection ?? ''] ?? 'var(--fg-muted)';
        }
      },
    });
  });
}

function initMagneticCta(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const link = document.querySelector<HTMLElement>('.cta__link');
  if (!link) return;
  const xTo = gsap.quickTo(link, 'x', { duration: 0.4, ease: 'power3.out' });
  const yTo = gsap.quickTo(link, 'y', { duration: 0.4, ease: 'power3.out' });
  window.addEventListener(
    'mousemove',
    (e) => {
      const r = link.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width, r.height) / 2 + 80;
      if (dist < radius && dist > 0) {
        const pull = (1 - dist / radius) * 12;
        xTo((dx / dist) * pull);
        yTo((dy / dist) * pull);
      } else {
        xTo(0);
        yTo(0);
      }
    },
    { passive: true },
  );
}

function initPolaroidHover(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('.project-image').forEach((img) => {
    img.addEventListener('mouseenter', () => {
      gsap.to(img, { scale: 1.03, duration: 0.35, ease: 'power2.out' });
    });
    img.addEventListener('mouseleave', () => {
      gsap.to(img, { scale: 1, duration: 0.45, ease: 'power2.out' });
    });
  });
}
```

- [ ] **Step 6: Verificar en navegador**

Run: `pnpm dev --port 4321`
Expected: línea de progreso en el borde derecho que se rellena al scrollear y cambia al acento de cada proyecto (~1 s de transición); "See more work" se desplaza sutilmente hacia el cursor y su subrayado se redibuja en hover; las polaroids se elevan (escala + sombra) con el ratón encima sin pelearse con el parallax; con reduced-motion la línea no existe.

- [ ] **Step 7: Gates y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add src/components/progress/ScrollProgress.astro src/layouts/BaseLayout.astro src/components/cta/PortfolioCTA.astro src/components/project/SubSection.astro src/lib/scroll/ScrollOrchestrator.ts
git commit -m "feat(frontend): scroll progress accent line, magnetic cta, polaroid hover"
```

---

### Task 7: E2E (incluye fix de test obsoleto) y verificación final

**Files:**

- Modify: `tests/e2e/showcase.spec.ts`

**Interfaces:**

- Consumes: `data-particles` (Task 4), `[data-scroll-progress]` (Task 6), heading `GonnaBe` (contenido ya en main).

- [ ] **Step 1: Arreglar el test obsoleto de headings**

En `tests/e2e/showcase.spec.ts:14`, el proyecto Rule The Mando fue sustituido por GonnaBe (commit `77f08b1`) y el test quedó obsoleto. Reemplazar:

```ts
await expect(page.getByRole('heading', { name: 'Rule The Mando' })).toBeVisible();
```

por:

```ts
await expect(page.getByRole('heading', { name: 'GonnaBe' })).toBeVisible();
```

- [ ] **Step 2: Añadir tests nuevos**

Al final del archivo (nivel superior, junto a los otros `test(...)` sueltos):

```ts
test('scroll progress indicator exists and is hidden from the a11y tree', async ({ page }) => {
  await page.goto('/');
  const progress = page.locator('[data-scroll-progress]');
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveAttribute('aria-hidden', 'true');
});

test('background canvas reports active particles on desktop', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const flag = await page.locator('[data-background-canvas]').getAttribute('data-particles');
  expect(Number(flag)).toBeGreaterThan(0);
});

test('reduced motion disables the particle layer', async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    baseURL: 'http://localhost:4321',
  });
  const page = await ctx.newPage();
  try {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const flag = await page.locator('[data-background-canvas]').getAttribute('data-particles');
    expect(flag).toBeNull();
  } finally {
    await ctx.close();
  }
});

test('kintsugi title settles fully readable after its glitch reveal', async ({ page }) => {
  await page.goto('/');
  await page.locator('#kintsugi-the-fall').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  const title = page.locator('#kintsugi-the-fall .project__title');
  await expect(title).toBeVisible();
  await expect(title).toHaveAttribute('aria-label', 'Kintsugi: The Fall');
});
```

- [ ] **Step 3: Ejecutar la suite e2e completa**

Run: `pnpm test:e2e`
Expected: PASS completo (incluidos los tests preexistentes de imágenes, audio, teclado, reduced-motion y el probe de píxeles del shader).

- [ ] **Step 4: Verificación visual final contra baseline**

Con `pnpm dev --port 4321` activo, capturar los mismos 7 puntos de scroll del baseline (0, 15, 30, 45, 60, 75, 92 %) y comparar contra `.playwright-mcp/scroll-*.png` del 2026-07-03:

- Cada proyecto muestra su acento (azul / ámbar / oro) en fondo y partículas.
- El texto es legible en todos los puntos (especialmente el antiguo clímax del 45 %).
- Sin regresiones de layout.

- [ ] **Step 5: Gates finales y commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add tests/e2e/showcase.spec.ts
git commit -m "test(frontend): cover section dialects, particles flag and progress indicator"
```
