#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;
float sat(float x) { return clamp(x, 0., 1.); }
float h1(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 f = gl_FragCoord.xy, q = f / R.xy, u = q - .5, o;
  float T = R.z, br = T / 2., a = texture(A, q).a * .65 + .012, w = 0., r, k;
  vec3 c = vec3(0), b = c;
  for (float i = 0.; i < 28.; i++) {
    r = sqrt(i / 28.) * a * .008;
    o = r * vec2(cos(i * 2.4), sin(i * 2.4));
    vec4 x = textureLod(A, clamp(q + o * vec2(R.y / R.x, 1), .001, .999), a * 1.5);
    k = step(r, x.a * .008 + 1e-4) + .06;
    c += x.rgb * k; w += k;
  }
  c /= w;
  for (float l = 2.; l < 6.; l++) {
    o = exp2(l) / R.xy * vec2(cos(l * 2.), sin(l * 2.));
    b += max(textureLod(A, q + o, l).rgb - 1.1, 0.) + max(textureLod(A, q - o, l).rgb - 1.1, 0.);
  }
  c = (c + b * .005) * (1. - dot(u, u) * .8) * (1. + exp(-fract(br / 4.) * 35.) * .09);
  c = c * (2.51 * c + .03) / (c * (2.43 * c + .59) + .14);
  c = pow(clamp(c, 0., 1.), vec3(.4545)) * smoothstep(0., .65, br) * smoothstep(64.2, 62.8, br);
  for (int i = 0; i < 8; i++) {
    float n = float(i), x = br - float[8](1.2, .7, 7.7, 15.7, 23.7, 47.7, 55.7, 59.7)[i],
          L = i < 1 ? 3.2 : i < 7 ? 2.6 : 4.2, s = i < 1 ? 1.1 : .7;
    vec2 p = vec2(u.x / s + .5, (u.y - (i < 1 ? .08 : i > 6 ? -.08 : -.37)) * 8. / s + .5);
    if (x > 0. && x < L && p.y > 0. && p.y < 1. && p.x > 0. && p.x < 1.) {
      p.y = (n + 1. - p.y) / 8.;
      a = sat(min(x, L - x) * 4.);
      r = sat(textureLod(B, p, 2.8).r * 2.4);
      c = mix(c * (1. - .8 * r * a), vec3(.91, .82, .66), sat(texture(B, p).r * 1.6) * a);
    }
  }
  c *= 1. - .16 * smoothstep(.44, .475, abs(u.y));
  O = vec4(c + (h1(f + T * 83.) - .5) * .009, 1);
}