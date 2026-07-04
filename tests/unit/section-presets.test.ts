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
