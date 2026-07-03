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
    current[key] = k === 1 ? target[key] : current[key] + (target[key] - current[key]) * k;
  }
  const rgbKeys = ['paletteBase', 'paletteRim', 'paletteEmber'] as const;
  // Literal indices keep tuple access sound under noUncheckedIndexedAccess.
  for (const key of rgbKeys) {
    for (const i of [0, 1, 2] as const) {
      current[key][i] =
        k === 1 ? target[key][i] : current[key][i] + (target[key][i] - current[key][i]) * k;
    }
  }
}
