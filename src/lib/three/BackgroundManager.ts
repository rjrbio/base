import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { backgroundFrag, backgroundVert } from '../shaders/background';
import { buildParticleField } from './ParticleField';
import { computeTargetState, createInitialState, smoothState } from './sectionPresets';
import type { BackgroundState } from './sectionPresets';

let initialized = false;

const COLS = 64;
const ROWS = 40;
const COUNT = COLS * ROWS;
const PLANE_W = 16;
const PLANE_H = 11;
const CELL_W = PLANE_W / COLS;
const CELL_H = PLANE_H / ROWS;
const THICKNESS = 0.05;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// Linear-congruential PRNG so the chaotic grid is deterministic across reloads.
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

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
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;

  const scene = new THREE.Scene();
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Geometry is the unit box; per-instance scale rectangulises it.
  const geometry = new THREE.BoxGeometry(1, 1, THICKNESS);

  // Per-instance attributes
  const seeds = new Float32Array(COUNT);
  const gridPositions = new Float32Array(COUNT * 2);
  const scales = new Float32Array(COUNT * 2);
  const axes = new Float32Array(COUNT * 3);
  const depths = new Float32Array(COUNT);
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.setAttribute('aGridPos', new THREE.InstancedBufferAttribute(gridPositions, 2));
  geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 2));
  geometry.setAttribute('aAxis', new THREE.InstancedBufferAttribute(axes, 3));
  geometry.setAttribute('aDepth', new THREE.InstancedBufferAttribute(depths, 1));

  const uMouse = new THREE.Vector2(0, 0);
  const uMouseWorld = new THREE.Vector2(0, 0);

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

  const material = new THREE.ShaderMaterial({
    vertexShader: backgroundVert,
    fragmentShader: backgroundFrag,
    uniforms,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.frustumCulled = false;

  const rng = makeRng(0xc0ffee);
  const tmp = new THREE.Matrix4();
  const tmpPos = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpEuler = new THREE.Euler();
  const tmpScale = new THREE.Vector3(1, 1, 1);

  let i = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = (col + 0.5 - COLS / 2) * CELL_W;
      const cy = (row + 0.5 - ROWS / 2) * CELL_H;

      // Chaos: irregular rectangles, off-grid offsets, micro-rotation, micro-depth.
      const sx = (0.45 + rng() * 1.55) * CELL_W; // [0.45, 2.0]
      const sy = (0.45 + rng() * 1.55) * CELL_H;
      const ox = (rng() - 0.5) * CELL_W * 0.55;
      const oy = (rng() - 0.5) * CELL_H * 0.55;
      const oz = (rng() - 0.5) * 0.16;
      const rotZ = (rng() - 0.5) * 0.7;

      tmpPos.set(cx + ox, cy + oy, oz);
      tmpEuler.set(0, 0, rotZ);
      tmpQ.setFromEuler(tmpEuler);
      tmp.compose(tmpPos, tmpQ, tmpScale);
      mesh.setMatrixAt(i, tmp);

      seeds[i] = rng();
      gridPositions[i * 2] = cx;
      gridPositions[i * 2 + 1] = cy;
      scales[i * 2] = sx;
      scales[i * 2 + 1] = sy;

      // Random rotation axis biased to Y so the cascade still reads as toppling
      // (instead of spinning random nonsense).
      const ax = rng() * 2 - 1;
      const ay = 1.2 + rng() * 0.6;
      const az = rng() * 0.7 - 0.35;
      const len = Math.hypot(ax, ay, az);
      axes[i * 3] = ax / len;
      axes[i * 3 + 1] = ay / len;
      axes[i * 3 + 2] = az / len;

      // Per-instance depth in [0..1]. Drives parallax: closer pieces (depth ~1)
      // displace further with scroll, far pieces barely move.
      depths[i] = rng();

      i++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  // ---- Particle layer (skipped entirely under reduced motion) ----
  if (!reducedMotion) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const particleCount = isMobile ? 250 : 800;
    scene.add(buildParticleField(uniforms, particleCount));
    canvas.dataset.particles = String(particleCount);
  }

  // ---- EffectComposer: render -> bloom -> output ----
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.85, // strength
    0.55, // radius
    0.42, // threshold (raised — only the rim/ember pass through)
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

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
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
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

  // ---- Reduced motion: render a single static frame at uProgress=0.5 ----
  if (reducedMotion) {
    uniforms.uTime.value = 0;
    uniforms.uProgress.value = 0.5;
    const staticState = computeTargetState('hero', 0.5);
    applyStateToUniforms(staticState);
    bloomPass.strength = staticState.bloom;
    composer.render();
    return;
  }

  // ---- Scroll → uProgress + camera parallax via GSAP ScrollTrigger ----
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const p = self.progress;
      uniforms.uProgress.value = p;
      // Camera now moves visibly: descends 1.5 world units and pulls back
      // 1.0. Combined with the per-instance depth parallax, the viewport
      // genuinely travels through the field as you scroll.
      camera.position.y = -p * 1.5;
      camera.position.z = 5 + p * 1.0;
      camera.updateProjectionMatrix();
    },
  });
  // Refresh after layout settles (images, fonts) so start/end use the final
  // document height instead of a half-loaded snapshot.
  const refresh = (): void => {
    ScrollTrigger.refresh();
  };
  if (document.readyState === 'complete') {
    setTimeout(refresh, 100);
  } else {
    window.addEventListener('load', () => setTimeout(refresh, 100), { once: true });
  }

  // ---- Section awareness: contiguous triggers hand over at viewport centre ----
  let activeSectionId = 'hero';
  let activeLocalProgress = 0;
  document.querySelectorAll<HTMLElement>('[data-bg-section]').forEach((el, idx) => {
    ScrollTrigger.create({
      trigger: el,
      start: idx === 0 ? 'top top' : 'top 50%',
      end: 'bottom 50%',
      onUpdate: (self) => {
        if (!self.isActive) return;
        activeSectionId = el.dataset.bgSection ?? 'hero';
        activeLocalProgress = self.progress;
      },
    });
  });

  // ---- Render loop ----
  const tick = (time: number): void => {
    if (running) {
      // Inertial pursuit of the mouse target (~1s settle).
      uMouse.x = lerp(uMouse.x, mouseTargetX, 0.08);
      uMouse.y = lerp(uMouse.y, mouseTargetY, 0.08);

      // Convert NDC mouse to grid-world coordinates so the cascade origin
      // matches what the user sees on screen.
      uMouseWorld.set(uMouse.x * (PLANE_W / 2) * 0.65, uMouse.y * (PLANE_H / 2) * 0.65);

      uniforms.uTime.value = time * 0.001;

      smoothState(state, computeTargetState(activeSectionId, activeLocalProgress), 0.06);
      applyStateToUniforms(state);
      bloomPass.strength = state.bloom;

      composer.render();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
