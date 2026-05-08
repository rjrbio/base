import * as THREE from 'three';

import { backgroundFrag, backgroundVert } from '../shaders/background';

let initialized = false;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function detectWebGL(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return Boolean(ctx);
  } catch {
    return false;
  }
}

type DeviceOrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
};

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

  // Shared uniforms across both layers.
  const uMouse = new THREE.Vector2(0, 0);
  const uResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

  const baseUniforms = {
    uTime: { value: 0 },
    uResolution: { value: uResolution },
    uMouse: { value: uMouse },
    uTimeScale: { value: 1.0 },
    uPhaseOffset: { value: 0.0 },
    uOpacity: { value: 1.0 },
    uIsOverlay: { value: 0.0 },
    uReducedMotion: { value: reducedMotion ? 1 : 0 },
  };
  const baseMaterial = new THREE.ShaderMaterial({
    vertexShader: backgroundVert,
    fragmentShader: backgroundFrag,
    uniforms: baseUniforms,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), baseMaterial));

  const overlayUniforms = {
    uTime: { value: 0 },
    uResolution: { value: uResolution },
    uMouse: { value: uMouse },
    uTimeScale: { value: 0.5 },
    uPhaseOffset: { value: 1.7 },
    uOpacity: { value: 0.35 },
    uIsOverlay: { value: 1.0 },
    uReducedMotion: { value: reducedMotion ? 1 : 0 },
  };
  const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: backgroundVert,
    fragmentShader: backgroundFrag,
    uniforms: overlayUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial));

  // Pointer / device-orientation drive the mouse target; inertia smooths it.
  let mouseTargetX = 0;
  let mouseTargetY = 0;

  window.addEventListener(
    'mousemove',
    (e) => {
      mouseTargetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTargetY = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );

  const gyroHandler = (e: DeviceOrientationEvent): void => {
    if (e.gamma === null || e.beta === null) return;
    mouseTargetX = Math.max(-1, Math.min(1, e.gamma / 30));
    mouseTargetY = Math.max(-1, Math.min(1, e.beta / 30));
  };

  // iOS 13+ requires an explicit permission grant after a user gesture.
  if ('DeviceOrientationEvent' in window) {
    const ctor = DeviceOrientationEvent as DeviceOrientationCtor;
    const requestPermission = ctor.requestPermission;
    if (typeof requestPermission === 'function') {
      const onFirstTouch = async (): Promise<void> => {
        try {
          const result = await requestPermission();
          if (result === 'granted') {
            window.addEventListener('deviceorientation', gyroHandler, { passive: true });
          }
        } catch {
          /* user denied or unavailable; ignore silently */
        }
        window.removeEventListener('touchstart', onFirstTouch);
      };
      window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
    } else {
      window.addEventListener('deviceorientation', gyroHandler, { passive: true });
    }
  }

  const resize = (width: number, height: number): void => {
    renderer.setSize(width, height, false);
    uResolution.set(width, height);
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      resize(cr.width, cr.height);
    });
    ro.observe(canvas);
  } else {
    window.addEventListener('resize', () => resize(window.innerWidth, window.innerHeight));
  }

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
  });

  // Reduced motion: paint a single static frame and stop.
  if (reducedMotion) {
    baseUniforms.uTime.value = 0;
    overlayUniforms.uTime.value = 0;
    renderer.render(scene, camera);
    return;
  }

  const tick = (time: number): void => {
    if (running) {
      // Inertial pursuit of the mouse/gyro target (~1s natural settle).
      uMouse.x = lerp(uMouse.x, mouseTargetX, 0.08);
      uMouse.y = lerp(uMouse.y, mouseTargetY, 0.08);

      const tSec = time * 0.001;
      baseUniforms.uTime.value = tSec;
      overlayUniforms.uTime.value = tSec;

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
