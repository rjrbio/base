export const backgroundVert = /* glsl */ `
  attribute float aSeed;
  attribute vec2 aGridPos;
  attribute vec2 aScale;
  attribute vec3 aAxis;
  attribute float aDepth;

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
  varying float vDepth;

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
    float r1 = hash11(aSeed * 1.7);
    float r2 = hash11(aSeed * 3.1 + 1.3);
    float r3 = hash11(aSeed * 5.9 + 2.7);
    float r4 = hash11(aSeed * 11.3 + 4.1);

    vec3 pos = position * vec3(aScale.x, aScale.y, 1.0);
    vec3 nrm = normal;

    float t = uTime * (1.0 - uReducedMotion);

    // ---- Phase 0..0.3 — tension: the plane breathes, then strains ----
    vec2 q = warp(aGridPos * 0.30 + vec2(t * 0.04, 0.0), t);
    float breath = fbm7(aGridPos * 0.45 + q * 1.6 + t * 0.07);
    float tension = smoothstep(0.0, 0.3, uProgress);
    float waveAmp = 0.18 + tension * 1.10;
    float zOffset = (breath - 0.5) * waveAmp;

    float pressureMask = smoothstep(0.55, 0.85, breath);
    zOffset += pressureMask * tension * 0.55 * (0.5 + r1 * 0.5);

    // ---- Phase 0.3..0.6 — fragmentation: cascade from the mouse focal ----
    float distFromMouse = length(aGridPos - uMouseWorld);
    float maxDist = 11.0;
    float distNorm = clamp(distFromMouse / maxDist, 0.0, 1.0);

    float rawFall = smoothstep(0.3, 0.6, uProgress);
    float jitter = (r2 - 0.5) * 0.18;
    float delayedFall = clamp(rawFall * 1.7 - distNorm * 0.95 + jitter, 0.0, 1.0);
    delayedFall = smoothstep(0.0, 1.0, delayedFall);

    vec3 axis = normalize(aAxis);
    float maxAngle = 2.6 + r3 * 1.2;
    float angle = delayedFall * maxAngle;
    pos = rotateAxis(axis, angle) * pos;
    nrm = rotateAxis(axis, angle) * nrm;

    // ---- Phase 0.6..1.0 — drift ----
    float drift = smoothstep(0.6, 1.0, uProgress);
    vec3 driftOffset = vec3(
      cos(t * 0.55 + aSeed * 6.28) * (0.9 + r1 * 1.1),
      sin(t * 0.65 + aSeed * 7.00) * (0.5 + r2 * 0.6),
      sin(t * 0.45 + aSeed * 4.50) * (0.9 + r3 * 1.0)
    ) * drift;
    vec3 reattract = -vec3(aGridPos, 0.0) * drift * 0.18 * (0.4 + r4 * 0.6);

    // ---- DEPTH PARALLAX (the new bit) ----
    // Each instance has its own aDepth in [0..1]. Closer (depth=1) pieces
    // displace further with scroll than far (depth=0) pieces, so the field
    // reads like a multi-layered space the camera flies through. Because the
    // displacement is a pure function of uProgress, scrolling back returns
    // every piece to exactly where it was.
    float parY = mix(0.6, 4.8, aDepth) * uProgress;
    float parZ = mix(0.0, 1.6, aDepth) * uProgress;
    float parX = (r4 - 0.5) * 0.6 * aDepth * uProgress;

    // ---- Compose ----
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    worldPos.z += zOffset + parZ;
    worldPos.y -= parY; // scroll down = pieces move down (we're flying forward)
    worldPos.x += parX;
    worldPos.xyz += driftOffset + reattract;

    gl_Position = projectionMatrix * modelViewMatrix * worldPos;

    // ---- Lighting ----
    vec3 worldNormal = normalize((instanceMatrix * vec4(nrm, 0.0)).xyz);
    vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.9));
    vec3 lightDir2 = normalize(vec3(-0.8, -0.2, 0.6));
    vBrightness1 = max(0.0, dot(worldNormal, lightDir1));
    vBrightness2 = max(0.0, dot(worldNormal, lightDir2));

    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vRim = pow(1.0 - max(0.0, dot(worldNormal, viewDir)), 2.2);

    // ---- Color (kept very dark; the rim does the talking) ----
    vec3 colorVoid = vec3(0.001, 0.001, 0.006);
    vec3 colorDeep = vec3(0.010, 0.004, 0.014);
    vec3 colorMid = vec3(0.045, 0.015, 0.025);
    vec3 colorBlood = vec3(0.40, 0.04, 0.08);
    vec3 colorEmber = vec3(1.20, 0.30, 0.10);

    vec3 c = mix(colorVoid, colorDeep, breath);
    c = mix(c, colorMid, tension * 0.55);
    c = mix(c, colorBlood, tension * pressureMask * 0.45);
    c = mix(c, colorVoid * 1.2, drift * 0.7);

    float midFlash = max(0.0, sin(angle * 2.0));
    float flashStrength = midFlash * delayedFall * (1.0 - drift);
    c = mix(c, colorEmber, flashStrength * 0.85);

    vColor = c;
    vEmber = flashStrength;
    vDrift = drift;
    vFalling = delayedFall;
    vDepth = aDepth;
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
  varying float vDepth;

  void main() {
    vec3 color = vColor;

    // Very low ambient + soft cool key + faint crimson fill.
    // Everything that isn't a rim/ember stays close to black.
    float ambient = 0.025;
    vec3 lit =
      color * (ambient + 0.40 * vBrightness1) +
      vec3(0.45, 0.05, 0.07) * vBrightness2 * 0.28;

    // Hot crimson rim — HDR (>1.0) so it survives the dark base and glows
    // through the bloom pass. Slightly dimmed by depth so far pieces don't
    // yell as loud.
    vec3 rimColor = vec3(1.30, 0.18, 0.08);
    float rimAtten = mix(0.6, 1.0, vDepth);
    lit += rimColor * vRim * (0.50 + 0.55 * (1.0 - vDrift)) * rimAtten;

    // Mid-rotation ember: pure HDR, blooms intensely.
    lit += vec3(1.80, 0.45, 0.10) * vEmber * 0.85;

    gl_FragColor = vec4(lit, 1.0);
  }
`;
