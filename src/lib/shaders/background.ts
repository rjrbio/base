export const backgroundVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const backgroundFrag = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uTimeScale;
  uniform float uPhaseOffset;
  uniform float uOpacity;
  uniform float uIsOverlay;
  uniform float uReducedMotion;

  varying vec2 vUv;

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

  // 6-octave fractal Brownian motion
  float fbm6(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p = p * 2.02 + vec2(31.7, 17.3);
      a *= 0.5;
    }
    return v;
  }

  // Domain warping (after Inigo Quilez): fbm of fbm coordinates so the field
  // folds in on itself and feels organic instead of merely turbulent.
  vec2 warp(vec2 p, float t) {
    vec2 q = vec2(
      fbm6(p + vec2(t * 0.10, 0.0)),
      fbm6(p + vec2(5.2, 1.3) + t * 0.05)
    );
    vec2 r = vec2(
      fbm6(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.15),
      fbm6(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.126)
    );
    return r;
  }

  // Cyclic 4-color palette using cosine weights (~10s period when uTimeScale = 1).
  // The four anchors: navy, electric violet, cyan, magenta.
  vec3 palette4(float t) {
    vec3 c0 = vec3(0.05, 0.08, 0.30);
    vec3 c1 = vec3(0.55, 0.20, 0.95);
    vec3 c2 = vec3(0.10, 0.78, 1.00);
    vec3 c3 = vec3(0.95, 0.20, 0.75);

    float phase = t / 10.0;
    float w0 = 0.5 + 0.5 * cos(6.28318 * phase);
    float w1 = 0.5 + 0.5 * cos(6.28318 * (phase + 0.25));
    float w2 = 0.5 + 0.5 * cos(6.28318 * (phase + 0.50));
    float w3 = 0.5 + 0.5 * cos(6.28318 * (phase + 0.75));
    float sum = w0 + w1 + w2 + w3;
    return (c0 * w0 + c1 * w1 + c2 * w2 + c3 * w3) / sum;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * uTimeScale * (1.0 - uReducedMotion);

    // Aspect-corrected coordinates so the warping doesn't squash on wide screens.
    vec2 p = uv;
    p.x *= uResolution.x / max(uResolution.y, 1.0);
    p *= 2.0;

    // Mouse displacement with smooth radial falloff (felt like local pressure).
    vec2 mouseUv = uv - vec2(0.5) - uMouse * 0.3;
    float mouseDist = length(mouseUv);
    float mouseInfluence = exp(-mouseDist * 4.0);
    p += uMouse * mouseInfluence * 0.4;

    // Domain warp + final fbm sample.
    vec2 warped = warp(p, t * 0.3);
    float n = fbm6(p + warped * 1.5);

    // Procedural palette cycling; shift by uPhaseOffset so the second layer
    // never paints the same hue as the first at a given moment.
    vec3 color = palette4(t + uPhaseOffset + n * 1.5);

    // Push tones with the noise field.
    color *= 0.55 + 0.55 * n;

    // Subtle vignette only on the base layer; the overlay rides additively
    // and would otherwise multiply darkening at the edges.
    if (uIsOverlay < 0.5) {
      float vignette = smoothstep(0.95, 0.30, distance(uv, vec2(0.5)));
      color *= mix(0.55, 1.0, vignette);
    }

    gl_FragColor = vec4(color, uOpacity);
  }
`;
