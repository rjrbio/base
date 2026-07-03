export const particlesVert = /* glsl */ `
  precision mediump float;

  attribute float aSeed;

  uniform float uTime;
  uniform float uFlow;
  uniform float uPulse;
  uniform float uReducedMotion;
  uniform vec2 uMouseWorld;

  varying float vSeed;

  float hash11(float n) {
    return fract(sin(n * 53.123) * 43758.5453);
  }

  void main() {
    vSeed = aSeed;
    float t = uTime * (1.0 - uReducedMotion);

    vec3 pos = position;

    // Organic wander, always on.
    float r1 = hash11(aSeed * 3.7);
    float r2 = hash11(aSeed * 7.9 + 1.3);
    pos.x += sin(t * (0.15 + r1 * 0.2) + aSeed * 6.28) * 0.6;
    pos.y += cos(t * (0.12 + r2 * 0.25) + aSeed * 4.7) * 0.45;

    // Flow: fast horizontal streaming. Pulse: slow ascent.
    pos.x += uFlow * t * (0.8 + r1 * 1.6);
    pos.y += uPulse * t * (0.25 + r2 * 0.5);

    // Wrap inside the field box.
    pos.x = mod(pos.x + 9.0, 18.0) - 9.0;
    pos.y = mod(pos.y + 6.0, 12.0) - 6.0;

    // Gentle pointer repulsion.
    vec2 fromMouse = pos.xy - uMouseWorld;
    float d = length(fromMouse);
    pos.xy += normalize(fromMouse + 0.0001) * smoothstep(2.2, 0.0, d) * 0.5;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min((0.6 + hash11(aSeed * 11.1) * 1.6) * (30.0 / -mv.z), 22.0);
  }
`;

export const particlesFrag = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform float uFlow;
  uniform float uIntensity;
  uniform vec3 uPaletteEmber;

  varying float vSeed;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    // Flow elongates sprites into horizontal streaks.
    pc.x *= mix(1.0, 0.35, uFlow);
    float d = length(pc);
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
    float alpha = smoothstep(0.5, 0.1, d) * twinkle * clamp(uIntensity * 1.4, 0.0, 0.85);
    if (alpha < 0.01) discard;
    vec3 color = mix(uPaletteEmber, vec3(1.0), 0.25);
    gl_FragColor = vec4(color * 0.8, alpha);
  }
`;
