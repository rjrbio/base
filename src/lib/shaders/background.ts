export const backgroundVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const backgroundFrag = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uPattern;
  uniform float uIntensity;
  uniform float uReducedMotion;

  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float pattern_hero(vec2 uv, float t) {
    return noise(uv * 2.5 + vec2(t * 0.1, 0.0)) * 0.5;
  }

  float pattern_lore(vec2 uv, float t) {
    float lines = sin((uv.y * 80.0) + t * 1.2) * 0.5 + 0.5;
    return lines * (0.4 + 0.4 * noise(uv * 4.0 + t * 0.3));
  }

  float pattern_mando(vec2 uv, float t) {
    vec2 grid = abs(fract(uv * 28.0) - 0.5);
    float wobble = sin(uv.y * 12.0 + t) * 0.04;
    return smoothstep(0.46 + wobble, 0.5 + wobble, max(grid.x, grid.y));
  }

  float pattern_kintsugi(vec2 uv, float t) {
    float n = noise(uv * 3.5 + t * 0.05);
    float crack = smoothstep(0.50, 0.55, n) - smoothstep(0.55, 0.60, n);
    return crack * 1.5;
  }

  float pattern_cta(vec2 uv, float t) {
    return noise(uv * 5.0 + t * 0.4) * 0.5;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * (1.0 - uReducedMotion);

    float pIdx = floor(uPattern);
    float pFrac = fract(uPattern);

    float aV = 0.0;
    float bV = 0.0;
    if (pIdx < 0.5)      { aV = pattern_hero(uv, t);     bV = pattern_lore(uv, t); }
    else if (pIdx < 1.5) { aV = pattern_lore(uv, t);     bV = pattern_mando(uv, t); }
    else if (pIdx < 2.5) { aV = pattern_mando(uv, t);    bV = pattern_kintsugi(uv, t); }
    else if (pIdx < 3.5) { aV = pattern_kintsugi(uv, t); bV = pattern_cta(uv, t); }
    else                 { aV = pattern_cta(uv, t);      bV = pattern_cta(uv, t); }

    float p = mix(aV, bV, pFrac);

    vec3 color = mix(uColor1, uColor2, clamp(p * uIntensity, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
  }
`;
