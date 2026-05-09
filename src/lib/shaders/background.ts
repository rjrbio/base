export const backgroundVert = /* glsl */ `
  attribute float aSeed;
  attribute vec2 aGridPos;
  attribute vec2 aScale;
  attribute vec3 aAxis;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouseWorld;
  uniform float uReducedMotion;

  varying vec3 vColor;
  varying float vBrightness1;
  varying float vBrightness2;
  varying float vRim;
  varying float vEmber;
  varying float vDrift;
  varying float vFalling;

  // ---------- noise & fbm ----------
  float hash11(float n) {
    return fract(sin(n * 53.123) * 43758.5453);
  }

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i + vec2(0.0, 0.0));
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm7(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 7; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(31.7, 17.3);
      a *= 0.5;
    }
    return v;
  }

  // Double-level domain warping (Quilez): fbm fed back into itself twice
  // so the field folds and bruises like wet silk under tension.
  vec2 warp(vec2 p, float t) {
    vec2 q = vec2(
      fbm7(p + vec2(t * 0.10, 0.0)),
      fbm7(p + vec2(5.2, 1.3) + t * 0.07)
    );
    vec2 r = vec2(
      fbm7(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.13),
      fbm7(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.11)
    );
    return r;
  }

  // Rotation around an arbitrary axis (Rodrigues).
  mat3 rotateAxis(vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    float t = 1.0 - c;
    vec3 a = normalize(axis);
    return mat3(
      t * a.x * a.x + c,         t * a.x * a.y - s * a.z,  t * a.x * a.z + s * a.y,
      t * a.x * a.y + s * a.z,   t * a.y * a.y + c,        t * a.y * a.z - s * a.x,
      t * a.x * a.z - s * a.y,   t * a.y * a.z + s * a.x,  t * a.z * a.z + c
    );
  }

  void main() {
    // Per-instance pseudo-random scalars distilled from aSeed.
    float r1 = hash11(aSeed * 1.7);
    float r2 = hash11(aSeed * 3.1 + 1.3);
    float r3 = hash11(aSeed * 5.9 + 2.7);
    float r4 = hash11(aSeed * 11.3 + 4.1);

    // Apply the per-instance non-uniform scale to the unit box BEFORE rotating
    // so rectangles stay rectangles when they tumble.
    vec3 pos = position * vec3(aScale.x, aScale.y, 1.0);
    vec3 nrm = normal;

    float t = uTime * (1.0 - uReducedMotion);

    // ---- Phase 0..0.3 — tension: the plane breathes, then strains ----
    vec2 q = warp(aGridPos * 0.30 + vec2(t * 0.04, 0.0), t);
    float breath = fbm7(aGridPos * 0.45 + q * 1.6 + t * 0.07);
    float tension = smoothstep(0.0, 0.3, uProgress);
    float waveAmp = 0.18 + tension * 1.10;
    float zOffset = (breath - 0.5) * waveAmp;

    // Push selected pieces further as tension peaks (looks like local pressure).
    float pressureMask = smoothstep(0.55, 0.85, breath);
    zOffset += pressureMask * tension * 0.55 * (0.5 + r1 * 0.5);

    // ---- Phase 0.3..0.6 — fragmentation: cascade from the mouse focal ----
    float distFromMouse = length(aGridPos - uMouseWorld);
    float maxDist = 11.0;
    float distNorm = clamp(distFromMouse / maxDist, 0.0, 1.0);

    float rawFall = smoothstep(0.3, 0.6, uProgress);
    // Each piece reaches the cascade with a delay proportional to its distance,
    // plus a small per-instance jitter so it doesn't feel mechanical.
    float jitter = (r2 - 0.5) * 0.18;
    float delayedFall = clamp(rawFall * 1.7 - distNorm * 0.95 + jitter, 0.0, 1.0);
    delayedFall = smoothstep(0.0, 1.0, delayedFall);

    // Random rotation axis biased toward Y so the domino feel survives the chaos.
    vec3 axis = normalize(aAxis);
    float maxAngle = 2.6 + r3 * 1.2; // ~150-220 deg
    float angle = delayedFall * maxAngle;
    pos = rotateAxis(axis, angle) * pos;
    nrm = rotateAxis(axis, angle) * nrm;

    // ---- Phase 0.6..1.0 — drift: scattered, slowly reattracted ----
    float drift = smoothstep(0.6, 1.0, uProgress);
    vec3 driftOffset = vec3(
      cos(t * 0.55 + aSeed * 6.28) * (0.9 + r1 * 1.1),
      sin(t * 0.65 + aSeed * 7.00) * (0.5 + r2 * 0.6),
      sin(t * 0.45 + aSeed * 4.50) * (0.9 + r3 * 1.0)
    ) * drift;
    vec3 reattract = -vec3(aGridPos, 0.0) * drift * 0.18 * (0.4 + r4 * 0.6);

    // ---- Compose final world position ----
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    worldPos.z += zOffset;
    worldPos.xyz += driftOffset + reattract;

    gl_Position = projectionMatrix * modelViewMatrix * worldPos;

    // ---- Lighting (two directional lights) ----
    vec3 worldNormal = normalize((instanceMatrix * vec4(nrm, 0.0)).xyz);
    vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.9));
    vec3 lightDir2 = normalize(vec3(-0.8, -0.2, 0.6));
    vBrightness1 = max(0.0, dot(worldNormal, lightDir1));
    vBrightness2 = max(0.0, dot(worldNormal, lightDir2));

    // Rim term — drives the red bloom around silhouettes.
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vRim = pow(1.0 - max(0.0, dot(worldNormal, viewDir)), 2.2);

    // ---- Color ----
    vec3 colorVoid = vec3(0.005, 0.005, 0.018);
    vec3 colorDeep = vec3(0.04, 0.018, 0.06);
    vec3 colorMid = vec3(0.18, 0.05, 0.10);
    vec3 colorBlood = vec3(0.55, 0.05, 0.10);
    vec3 colorEmber = vec3(1.20, 0.30, 0.10);

    vec3 c = mix(colorVoid, colorDeep, breath);
    c = mix(c, colorMid, tension * 0.65);
    c = mix(c, colorBlood, tension * pressureMask * 0.55);
    c = mix(c, colorVoid * 1.4, drift * 0.7);

    // Mid-rotation ember flash (peaks near 90 deg) — feeds the bloom hard.
    float midFlash = max(0.0, sin(angle * 2.0));
    float flashStrength = midFlash * delayedFall * (1.0 - drift);
    c = mix(c, colorEmber, flashStrength * 0.85);

    vColor = c;
    vEmber = flashStrength;
    vDrift = drift;
    vFalling = delayedFall;
  }
`;

export const backgroundFrag = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;
  varying float vBrightness1;
  varying float vBrightness2;
  varying float vRim;
  varying float vEmber;
  varying float vDrift;
  varying float vFalling;

  void main() {
    vec3 color = vColor;

    // Two-light Lambertian: cool key + warm crimson fill.
    float ambient = 0.06;
    vec3 lit =
      color * (ambient + 0.55 * vBrightness1) +
      vec3(0.50, 0.06, 0.08) * vBrightness2 * 0.40;

    // Hot red rim: scales with how exposed the edge is to the camera.
    // Goes super-bright (>1.0) so UnrealBloom paints luminous edges.
    vec3 rimColor = vec3(1.40, 0.18, 0.08);
    lit += rimColor * vRim * (0.55 + 0.55 * (1.0 - vDrift));

    // Ember spike on mid-rotation pieces — pure HDR, blooms intensely.
    lit += vec3(1.80, 0.45, 0.10) * vEmber * 0.80;

    gl_FragColor = vec4(lit, 1.0);
  }
`;
