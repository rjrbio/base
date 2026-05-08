import * as THREE from 'three';

import { backgroundFrag, backgroundVert } from '../shaders/background';
import { particlesFrag, particlesVert } from '../shaders/particles';
import { HERO_PRESET, PRESETS, type BackgroundPreset } from './presets';

let initialized = false;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpVec3 = (
  out: THREE.Vector3,
  target: readonly [number, number, number],
  t: number,
): void => {
  out.x = lerp(out.x, target[0], t);
  out.y = lerp(out.y, target[1], t);
  out.z = lerp(out.z, target[2], t);
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

  let targetPreset: BackgroundPreset = HERO_PRESET;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-bg-section]'));
  if (sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            const key = entry.target.getAttribute('data-bg-section') ?? 'hero';
            const preset = PRESETS[key];
            if (preset) targetPreset = preset;
          }
        }
      },
      { threshold: [0, 0.4, 0.8] },
    );
    for (const sec of sections) observer.observe(sec);
  }

  const onResize = (): void => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener('resize', onResize);

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
  });

  const tick = (time: number): void => {
    if (running) {
      const t = 0.04;
      bgUniforms.uTime.value = time * 0.001;
      bgUniforms.uPattern.value = lerp(bgUniforms.uPattern.value, targetPreset.pattern, t);
      bgUniforms.uIntensity.value = lerp(bgUniforms.uIntensity.value, targetPreset.intensity, t);
      lerpVec3(bgUniforms.uColor1.value, targetPreset.color1, t);
      lerpVec3(bgUniforms.uColor2.value, targetPreset.color2, t);

      if (particleUniforms) {
        particleUniforms.uTime.value = time;
        lerpVec3(particleUniforms.uColor.value, targetPreset.particleColor, t);
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
