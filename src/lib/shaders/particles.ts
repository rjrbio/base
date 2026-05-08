export const particlesVert = /* glsl */ `
  attribute float aSize;
  attribute float aOffset;

  uniform float uTime;
  uniform float uReducedMotion;

  varying float vAlpha;

  void main() {
    vec3 pos = position;
    float wave = sin(uTime * 0.0008 + aOffset * 6.28) * 0.05;
    pos.y += wave * (1.0 - uReducedMotion);

    gl_Position = vec4(pos, 1.0);
    gl_PointSize = aSize;
    vAlpha = 0.5 + 0.5 * sin(uTime * 0.0006 + aOffset * 3.14);
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
