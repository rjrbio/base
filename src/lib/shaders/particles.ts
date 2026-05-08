export const particlesVert = /* glsl */ `
  attribute float aSize;
  attribute float aOffset;

  uniform float uTime;
  uniform float uScrollGlobal;
  uniform float uReducedMotion;

  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Scroll-driven parallax: particles drift upward as the user scrolls down,
    // and reverse if they scroll back up. Each particle gets its own depth based
    // on aOffset so the field feels layered.
    float depth = 0.4 + aOffset * 1.2;
    float parallax = (uScrollGlobal - 0.5) * depth;
    pos.y += parallax;

    // Tiny organic shimmer (disabled in reduced motion).
    float shimmer = sin(uTime * 0.0006 + aOffset * 6.28) * 0.015;
    pos.x += shimmer * (1.0 - uReducedMotion);

    // Wrap so particles don't disappear off the canvas at the extremes.
    pos.y = mod(pos.y + 1.0, 2.0) - 1.0;

    gl_Position = vec4(pos, 1.0);
    gl_PointSize = aSize;

    // Visibility fades in/out gently with scroll progress per-particle.
    float visibility = smoothstep(0.0, 0.1, fract(aOffset + uScrollGlobal * 0.6));
    vAlpha = mix(0.35, 1.0, visibility);
  }
`;

export const particlesFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float alpha = smoothstep(0.5, 0.0, r) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha * 0.6);
  }
`;
