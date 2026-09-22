// Uneven light caught in depth, like a briefly exposed piece of film.
// The edges are noise, not a geometric outline.
export const exposureVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const exposureFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
uniform vec3 uColor;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  float bend = noise(vec2(vUv.y * 3.0 + uSeed * 20.0, uTime * .13)) - .5;
  float x = vUv.x - .5 + bend * .38;
  float fibre = noise(vec2(vUv.x * 14.0 + uSeed * 10.0, vUv.y * 8.0 - uTime * .2));
  float grain = noise(vUv * vec2(180.0, 420.0) + uSeed);
  float light = exp(-x * x * 24.0) * smoothstep(.22, .82, fibre);
  light *= smoothstep(0.0, .2, vUv.y) * (1.0 - smoothstep(.6, 1.0, vUv.y));
  float alpha = light * (.65 + grain * .35) * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`;
