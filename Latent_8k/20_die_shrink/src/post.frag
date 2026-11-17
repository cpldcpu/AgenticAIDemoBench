#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;
// DIE SHRINK - post: depth of field, glow, captions, glitches, and the process node:
// big pixels and few colours with an ordered dither, finer every two bars.
float sat(float x) { return clamp(x, 0., 1.); }
float h1(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 f = gl_FragCoord.xy, d;
  float T = R.z, br = T / 1.706667, k = br < 16. ? floor(br / 2.) : br > 72. ? floor(80. - br) : 8.,
        px = max(1., floor(24. * exp2(-.66 * k))), a, l, sq = floor(br * 4.),
        g = step(56., br) * step(br, 72.) * step(.75, h1(vec2(sq, 1))), y = floor(f.y / R.y * 18.);
  // second drop: bands of the picture slip sideways on some 16ths
  f.x += g * (h1(vec2(y, sq)) - .5) * R.x * .1 * step(.5, h1(vec2(y, sq + .5)));
  f = (floor(f / px) + .5) * px;
  vec2 q = f / R.xy, u = q - .5;
  float co = texture(A, q).a * R.y / 1080., lb = log2(px);
  vec3 c = vec3(0), b = c;
  for (l = 0.; l < 16.; l++) {
    d = q + co * sqrt(l / 16.) * vec2(cos(l * 2.4), sin(l * 2.4)) / R.xy;
    a = max(log2(max(co, 1.)) - .5, lb);
    c += vec3(textureLod(A, d + u * g * .02, a).r, textureLod(A, d, a).g, textureLod(A, d - u * g * .02, a).b) / 16.;
  }
  for (l = 0.; l < 12.; l++) {
    a = 1.5 + l * .3;
    b += textureLod(A, q + exp2(a) / R.xy * vec2(cos(l * 2.4), sin(l * 2.4)), a).rgb;
  }
  c += b * .02;
  c *= 1. - dot(u, u) * .8;
  c = pow(1. - exp(-1.8 * c), vec3(.45));
  // captions: title, credit, the process node of the moment
  u.x *= R.x / R.y;
  for (int i = 0; i < 3; i++) {
    float t0 = float[3](1., 74., 0.)[i], t1 = float[3](7.6, 79.5, 80.)[i], hg = float[3](.16, .06, .06)[i],
          ln = float[3](0., 1., 6.)[i], uw = i < 2 ? 1. : .125, us = i < 2 ? 0. : k / 8.;
    vec2 ce = i < 2 ? vec2(0, i > 0 ? -.3 : 0.) : vec2(-.72, -.4), p = (u - ce) / hg;
    p.x /= uw * 16.;
    if (br > t0 && br < t1 && abs(p.x) < .5 && abs(p.y) < .5 && (i < 2 || k < 8.))
      c = mix(c, vec3(1), texture(B, vec2(us + uw * (p.x + .5), (ln + .5 - p.y) / 9.)).r * sat(min(br - t0, t1 - br) * 2.));
  }
  if (k < 8.) {
    vec2 p = floor(f / px);
    float by = 0., lv = exp2(k + 1.) - 1.;
    for (int i = 0; i < 3; i++) {
      vec2 m = mod(floor(p / exp2(float(i))), 2.);
      by += (2. * abs(m.x - m.y) + m.y) / exp2(float(2 * i + 2));
    }
    if (k < 1.) c = vec3(dot(c, vec3(.3, .6, .1)));
    c = floor(c * lv + by) / lv;
  }
  O = vec4(c + (h1(f + T) - .5) * .01, 1);
}
