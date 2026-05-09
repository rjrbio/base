export const backgroundVert = /* glsl */ `
  attribute float aSeed;
  attribute vec2 aGridPos;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouse;
  uniform float uReducedMotion;
  uniform vec3 uLightDir;
  uniform vec2 uMouseWorld;

  varying vec3 vColor;
  varying float vBrightness;
  varying float vRim;
  varying float vDrift;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // 5-octave fBm — enough density for the breathing plane, cheap enough
  // to run per-vertex on 2400 instances.
  float fbm5(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.02 + vec2(31.7, 17.3);
      a *= 0.5;
    }
    return v;
  }

  // Domain warp (Quilez) — fbm fed back into itself so the field folds
  // and feels like cloth or fluid instead of mere turbulence.
  vec2 warp(vec2 p, float t) {
    vec2 q = vec2(
      fbm5(p + vec2(t * 0.10, 0.0)),
      fbm5(p + vec2(5.2, 1.3) + t * 0.05)
    );
    return q;
  }

  mat3 rotateY(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
  }

  void main() {
    vec3 pos = position;
    vec3 nrm = normal;

    float t = uTime * (1.0 - uReducedMotion);

    // ---- Phase 0..0.3 — tension: the plane breathes, then strains ----
    vec2 q = warp(aGridPos * 0.3 + vec2(t * 0.05, 0.0), t);
    float breath = fbm5(aGridPos * 0.5 + q * 1.4 + t * 0.08);
    float tension = smoothstep(0.0, 0.3, uProgress);
    float waveAmp = 0.10 + tension * 0.45;
    float zOffset = (breath - 0.5) * waveAmp;

    // ---- Phase 0.3..0.6 — fragmentation: domino fall from mouse focal ----
    float distFromMouse = length(aGridPos - uMouseWorld);
    float maxDist = 9.0;
    float distNorm = clamp(distFromMouse / maxDist, 0.0, 1.0);

    float rawFall = smoothstep(0.3, 0.6, uProgress);
    // Each piece reaches its full angle only when the cascade arrives at it:
    // the wave starts at the focal point (distNorm=0) and travels outward.
    float delayedFall = clamp((rawFall * 1.6 - distNorm * 0.9), 0.0, 1.0);
    delayedFall = smoothstep(0.0, 1.0, delayedFall);

    float angle = delayedFall * 3.14159; // up to 180 deg
    pos = rotateY(angle) * pos;
    nrm = rotateY(angle) * nrm;

    // ---- Phase 0.6..1.0 — drift: pieces float with per-seed noise ----
    float drift = smoothstep(0.6, 1.0, uProgress);
    vec3 driftOffset = vec3(
      cos(t * 0.40 + aSeed * 6.28) * 0.55,
      sin(t * 0.50 + aSeed * 7.00) * 0.30,
      sin(t * 0.30 + aSeed * 4.50) * 0.55
    ) * drift;
    // Faint reattraction toward the centre, "as if a weak force pulled them"
    vec3 reattract = -vec3(aGridPos, 0.0) * drift * 0.05 * (0.5 + aSeed * 0.5);

    // ---- Compose final world position ----
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    worldPos.z += zOffset;
    worldPos.xyz += driftOffset + reattract;

    gl_Position = projectionMatrix * modelViewMatrix * worldPos;

    // ---- Lighting ----
    vec3 worldNormal = normalize((instanceMatrix * vec4(nrm, 0.0)).xyz);
    vec3 lightDir = normalize(uLightDir);
    vBrightness = max(0.0, dot(worldNormal, lightDir));

    // Rim: silhouette catching directional light when boxes rotate
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vRim = pow(1.0 - max(0.0, dot(worldNormal, viewDir)), 2.5);

    // ---- Color ----
    vec3 colorDeep = vec3(0.05, 0.07, 0.22);     // deep blue
    vec3 colorViolet = vec3(0.30, 0.10, 0.55);   // violet
    vec3 colorBlack = vec3(0.020, 0.020, 0.045); // near black
    vec3 colorCyan = vec3(0.20, 0.85, 1.00);     // cyan flash

    vec3 c = mix(colorDeep, colorViolet, breath);
    c = mix(c, colorBlack, drift * 0.55);

    // Cyan flash only on actively-falling pieces (mid-rotation)
    float flashWindow = sin(angle * 2.0); // peaks near 90 deg
    float flash = max(0.0, flashWindow) * delayedFall * (1.0 - drift);
    c = mix(c, colorCyan, flash * 0.50);

    // Tension hint: subtle cyan crackle on the breathing surface (phase 1 only)
    float crack = smoothstep(0.55, 0.85, breath) * (1.0 - rawFall) * tension;
    c = mix(c, colorCyan * 0.6, crack * 0.35);

    vColor = c;
    vDrift = drift;
  }
`;

export const backgroundFrag = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;
  varying float vBrightness;
  varying float vRim;
  varying float vDrift;

  void main() {
    vec3 color = vColor;

    // Lambertian shading (soft ambient + directional)
    float light = 0.35 + 0.7 * vBrightness;
    color *= light;

    // Rim accent — picks up edges as boxes rotate; eases off during drift
    color += vec3(0.10, 0.30, 0.55) * vRim * (0.45 + 0.55 * (1.0 - vDrift));

    gl_FragColor = vec4(color, 1.0);
  }
`;
