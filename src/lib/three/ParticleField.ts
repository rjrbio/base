import * as THREE from 'three';

import { particlesFrag, particlesVert } from '../shaders/particles';

/**
 * Dust/stream layer sharing the section uniforms of the background grid.
 * The shaders declare only the uniforms they use; Three ignores the rest.
 */
export function buildParticleField(
  uniforms: Record<string, THREE.IUniform>,
  count: number,
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  // Same LCG family as the grid so layouts are deterministic across reloads.
  let s = 0xd15ea5e >>> 0;
  const rng = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rng() - 0.5) * 18;
    positions[i * 3 + 1] = (rng() - 0.5) * 12;
    positions[i * 3 + 2] = -1.0 + rng() * 3.5;
    seeds[i] = rng();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: particlesVert,
    fragmentShader: particlesFrag,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
