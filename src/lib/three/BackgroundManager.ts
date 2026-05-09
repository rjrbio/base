import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { backgroundFrag, backgroundVert } from '../shaders/background';

let initialized = false;

const COLS = 60;
const ROWS = 40;
const COUNT = COLS * ROWS;
const PLANE_W = 12;
const PLANE_H = 8;
const CELL_W = PLANE_W / COLS;
const CELL_H = PLANE_H / ROWS;
const THICKNESS = 0.04;

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

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x05060a, 1);

  const scene = new THREE.Scene();
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.set(0, 0, 5);

  const geometry = new THREE.BoxGeometry(CELL_W * 0.94, CELL_H * 0.94, THICKNESS);

  // Per-instance attributes
  const seeds = new Float32Array(COUNT);
  const gridPositions = new Float32Array(COUNT * 2);
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.setAttribute('aGridPos', new THREE.InstancedBufferAttribute(gridPositions, 2));

  const uMouse = new THREE.Vector2(0, 0);
  const uMouseWorld = new THREE.Vector2(0, 0);

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: reducedMotion ? 0.5 : 0 },
    uMouse: { value: uMouse },
    uMouseWorld: { value: uMouseWorld },
    uReducedMotion: { value: reducedMotion ? 1 : 0 },
    uLightDir: { value: new THREE.Vector3(0.4, 0.7, 0.9).normalize() },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: backgroundVert,
    fragmentShader: backgroundFrag,
    uniforms,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.frustumCulled = false;

  const tmp = new THREE.Matrix4();
  let i = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = (col + 0.5 - COLS / 2) * CELL_W;
      const y = (row + 0.5 - ROWS / 2) * CELL_H;
      tmp.makeTranslation(x, y, 0);
      mesh.setMatrixAt(i, tmp);
      seeds[i] = Math.random();
      gridPositions[i * 2] = x;
      gridPositions[i * 2 + 1] = y;
      i++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  // ---- Pointer / device orientation drives the focal point ----
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
          /* user denied; ignore silently */
        }
        window.removeEventListener('touchstart', onFirstTouch);
      };
      window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
    } else {
      window.addEventListener('deviceorientation', gyroHandler, { passive: true });
    }
  }

  // ---- Resize via ResizeObserver ----
  const handleResize = (width: number, height: number): void => {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      handleResize(cr.width, cr.height);
    });
    ro.observe(canvas);
  } else {
    window.addEventListener('resize', () => handleResize(window.innerWidth, window.innerHeight));
  }

  // ---- Visibility pause ----
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
  });

  // ---- Reduced motion: freeze at uProgress = 0.5 and stop the loop ----
  if (reducedMotion) {
    uniforms.uTime.value = 0;
    uniforms.uProgress.value = 0.5;
    renderer.render(scene, camera);
    return;
  }

  // ---- Scroll → uProgress via GSAP ScrollTrigger ----
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.3,
    onUpdate: (self) => {
      uniforms.uProgress.value = self.progress;
    },
  });

  // ---- Render loop ----
  const tick = (time: number): void => {
    if (running) {
      // Inertial pursuit of the mouse target (~1s settle).
      uMouse.x = lerp(uMouse.x, mouseTargetX, 0.08);
      uMouse.y = lerp(uMouse.y, mouseTargetY, 0.08);

      // Map mouse from NDC into world coordinates of the grid.
      uMouseWorld.set(uMouse.x * (PLANE_W / 2) * 0.6, uMouse.y * (PLANE_H / 2) * 0.6);

      uniforms.uTime.value = time * 0.001;

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
