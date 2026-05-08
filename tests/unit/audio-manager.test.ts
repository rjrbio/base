import { describe, expect, it } from 'vitest';

import { getAudioState } from '../../src/lib/audio/AudioManager';

describe('AudioManager (pre-init)', () => {
  it('returns a default unavailable state before initAudio runs', () => {
    const state = getAudioState();
    expect(state.available).toBe(false);
    expect(state.enabled).toBe(false);
    expect(typeof state.toggle).toBe('function');
  });

  it('exposes a toggle that is a no-op when audio is unavailable', () => {
    const before = getAudioState();
    before.toggle();
    const after = getAudioState();
    expect(after.available).toBe(false);
    expect(after.enabled).toBe(false);
  });
});
