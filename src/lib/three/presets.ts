export interface BackgroundPreset {
  pattern: number;
  color1: readonly [number, number, number];
  color2: readonly [number, number, number];
  intensity: number;
  particleColor: readonly [number, number, number];
}

export const HERO_PRESET: BackgroundPreset = {
  pattern: 0,
  color1: [0.027, 0.024, 0.039],
  color2: [0.35, 0.35, 0.45],
  intensity: 0.35,
  particleColor: [0.55, 0.55, 0.7],
};

const LORE_PRESET: BackgroundPreset = {
  pattern: 1,
  color1: [0.027, 0.024, 0.039],
  color2: [0.357, 0.424, 1.0],
  intensity: 0.4,
  particleColor: [0.4, 0.5, 1.0],
};

const MANDO_PRESET: BackgroundPreset = {
  pattern: 2,
  color1: [0.027, 0.024, 0.039],
  color2: [1.0, 0.478, 0.239],
  intensity: 0.32,
  particleColor: [1.0, 0.6, 0.3],
};

const KINTSUGI_PRESET: BackgroundPreset = {
  pattern: 3,
  color1: [0.027, 0.024, 0.039],
  color2: [0.831, 0.651, 0.29],
  intensity: 0.45,
  particleColor: [0.831, 0.651, 0.29],
};

const CTA_PRESET: BackgroundPreset = {
  pattern: 4,
  color1: [0.027, 0.024, 0.039],
  color2: [0.7, 0.6, 0.4],
  intensity: 0.3,
  particleColor: [0.6, 0.5, 0.4],
};

export const PRESETS: Record<string, BackgroundPreset> = {
  hero: HERO_PRESET,
  'lore-master-assistant': LORE_PRESET,
  'rule-the-mando': MANDO_PRESET,
  'kintsugi-the-fall': KINTSUGI_PRESET,
  cta: CTA_PRESET,
};
