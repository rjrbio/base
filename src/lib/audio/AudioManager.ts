const STORAGE_KEY = 'audio-enabled';
const AMBIENT_URL = '/audio/ambient.mp3';

export interface AudioState {
  available: boolean;
  enabled: boolean;
  toggle: () => void;
}

const listeners = new Set<(state: AudioState) => void>();

let initialized = false;
let ambient: HTMLAudioElement | null = null;

let currentState: AudioState = {
  available: false,
  enabled: false,
  toggle: () => {},
};

function notify(): void {
  for (const l of listeners) l(currentState);
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writeEnabled(v: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, v ? 'on' : 'off');
  } catch {
    // ignore
  }
}

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

function play(): void {
  if (!ambient) return;
  const promise = ambient.play();
  if (promise instanceof Promise) {
    promise.catch(() => {
      currentState = { ...currentState, enabled: false };
      writeEnabled(false);
      notify();
    });
  }
}

function pause(): void {
  ambient?.pause();
}

function toggle(): void {
  if (!currentState.available) return;
  const enabled = !currentState.enabled;
  currentState = { ...currentState, enabled };
  writeEnabled(enabled);
  if (enabled) play();
  else pause();
  notify();
}

export function getAudioState(): AudioState {
  return currentState;
}

export function subscribeAudio(listener: (state: AudioState) => void): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export async function initAudio(): Promise<void> {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const available = await probe(AMBIENT_URL);
  if (!available) {
    notify();
    return;
  }

  ambient = new Audio(AMBIENT_URL);
  ambient.loop = true;
  ambient.volume = 0.4;
  ambient.preload = 'metadata';

  const persisted = readEnabled();
  currentState = { available: true, enabled: persisted, toggle };

  if (persisted) play();
  notify();
}
