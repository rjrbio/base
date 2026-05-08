import * as THREE from 'three';

import { backgroundFrag, backgroundVert } from '../shaders/background';
import { particlesFrag, particlesVert } from '../shaders/particles';
import { HERO_PRESET, SECTIONS, type BackgroundPreset } from './presets';

let initialized = false;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const setLerpVec3 = (
  out: THREE.Vector3,
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): void => {
  out.x = a[0] + (b[0] - a[0]) * t;
  out.y = a[1] + (b[1] - a[1]) * t;
  out.z = a[2] + (b[2] - a[2]) * t;
};

function detectWebGL(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    return Boolean(ctx);
  } catch {
    return false;
  }
}

interface SectionRange {
  preset: BackgroundPreset;
  top: number;
  bottom: number;
}

export function initBackground(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const canvas = document.querySelector<HTMLCanvasElement>('[data-background-canvas]');
  if (!canvas) return;

  if (!detectWebGL(canvas)) {
    canvas.classList.add('background-canvas--fallback');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x07060a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const bgUniforms = {
    uTime: { value: 0 },
    uScrollGlobal: { value: 0 },
    uColor1: { value: new THREE.Vector3(...HERO_PRESET.color1) },
    uColor2: { value: new THREE.Vector3(...HERO_PRESET.color2) },
    uPattern: { value: HERO_PRESET.pattern },
    uIntensity: { value: HERO_PRESET.intensity },
    uReducedMotion: { value: reducedMotion ? 1 : 0 },
  };

  const bgMaterial = new THREE.ShaderMaterial({
    vertexShader: backgroundVert,
    fragmentShader: backgroundFrag,
    uniforms: bgUniforms,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial));

  let particleUniforms: {
    uTime: { value: number };
    uScrollGlobal: { value: number };
    uColor: { value: THREE.Vector3 };
    uReducedMotion: { value: number };
  } | null = null;

  if (!reducedMotion) {
    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const offsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = Math.random() * 2 - 1;
      positions[i * 3 + 1] = Math.random() * 2 - 1;
      positions[i * 3 + 2] = 0;
      sizes[i] = (1 + Math.random() * 3) * Math.min(window.devicePixelRatio, 2);
      offsets[i] = Math.random();
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));

    particleUniforms = {
      uTime: { value: 0 },
      uScrollGlobal: { value: 0 },
      uColor: { value: new THREE.Vector3(...HERO_PRESET.particleColor) },
      uReducedMotion: { value: 0 },
    };

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particlesVert,
      fragmentShader: particlesFrag,
      uniforms: particleUniforms,
      transparent: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));
  }

  let ranges: SectionRange[] = [];

  const computeRanges = (): void => {
    const newRanges: SectionRange[] = [];
    for (const preset of SECTIONS) {
      const el = document.querySelector<HTMLElement>(`[data-bg-section="${preset.id}"]`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      newRanges.push({ preset, top, bottom: top + rect.height });
    }
    ranges = newRanges;
  };

  computeRanges();
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    computeRanges();
  });
  // Recompute after a tick: layout/fonts may shift positions slightly.
  window.addEventListener('load', computeRanges, { once: true });

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
  });

  const lookupActive = (): { current: BackgroundPreset; next: BackgroundPreset; t: number } => {
    const first = ranges[0];
    if (!first) {
      return { current: HERO_PRESET, next: HERO_PRESET, t: 0 };
    }
    const last = ranges[ranges.length - 1];
    if (!last) {
      return { current: first.preset, next: first.preset, t: 0 };
    }
    const center = window.scrollY + window.innerHeight / 2;
    if (center <= first.top) {
      return { current: first.preset, next: first.preset, t: 0 };
    }
    if (center >= last.bottom) {
      return { current: last.preset, next: last.preset, t: 1 };
    }
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!r) continue;
      if (center >= r.top && center < r.bottom) {
        const local = (center - r.top) / Math.max(r.bottom - r.top, 1);
        const next = ranges[i + 1]?.preset ?? r.preset;
        return { current: r.preset, next, t: local };
      }
    }
    return { current: first.preset, next: first.preset, t: 0 };
  };

  const tick = (time: number): void => {
    if (running) {
      const { current, next, t } = lookupActive();

      bgUniforms.uTime.value = time * 0.001;
      bgUniforms.uPattern.value = lerp(current.pattern, next.pattern, t);
      bgUniforms.uIntensity.value = lerp(current.intensity, next.intensity, t);
      setLerpVec3(bgUniforms.uColor1.value, current.color1, next.color1, t);
      setLerpVec3(bgUniforms.uColor2.value, current.color2, next.color2, t);

      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const globalScroll = Math.min(Math.max(window.scrollY / docHeight, 0), 1);
      bgUniforms.uScrollGlobal.value = globalScroll;

      if (particleUniforms) {
        particleUniforms.uTime.value = time;
        particleUniforms.uScrollGlobal.value = globalScroll;
        setLerpVec3(particleUniforms.uColor.value, current.particleColor, next.particleColor, t);
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
