#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;

float sat(float x) { return clamp(x, 0., 1.); }
float h1(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

void main() {
  vec2 f = gl_FragCoord.xy, q = f / R.xy, u = q - .5, o;
  float T = R.z, br = T / 2., a = texture(A, q).a * .95 + .03, w = 0., r, k;
  vec3 c = vec3(0), b = c;

  for (float i = 0.; i < 32.; i++) {
    r = sqrt(i / 32.) * a * .01;
    o = r * vec2(cos(i * 2.4), sin(i * 2.4));
    vec4 x = textureLod(A, clamp(q + o * vec2(R.y / R.x, 1), .001, .999), a * 1.6);
    k = step(r, x.a * .01 + 1e-4) + .05;
    c += x.rgb * k; w += k;
  }
  c /= w;

  for (float l = 2.; l < 6.; l++) {
    o = exp2(l) / R.xy * vec2(cos(l * 2.), sin(l * 2.));
    b += max(textureLod(A, q + o, l).rgb - .9, 0.) + max(textureLod(A, q - o, l).rgb - .9, 0.);
  }
  c = (c + b * .014) * (1. - dot(u, u) * .6) * .92;
  c = c * (2.51 * c + .03) / (c * (2.43 * c + .59) + .14);
  c = pow(clamp(c, 0., 1.), vec3(.4545)) * smoothstep(0., .8, br) * smoothstep(64.2, 62.8, br);

  for (int i = 0; i < 9; i++) {
    float n = float(i == 7 ? 0 : i > 7 ? 7 : i),
          x = br - float[9](.4, 3., 10.2, 22.2, 34.2, 44.2, 56.2, 57.2, 57.2)[i],
          L = i < 1 ? 2.3 : i < 7 ? 3. : 5.5,
          s = n < .5 ? 1.05 : .68;
    if (i > 1 && i < 7 && x > 0.) c += exp(-x * 12.) * .08;
    vec2 p = vec2(u.x / s + .5, (u.y - (n < .5 ? .08 : i > 7 ? -.08 : -.36)) * 9. / s + .5);
    if (x > 0. && x < L && p.y > 0. && p.y < 1. && p.x > 0. && p.x < 1.) {
      p.y = (n + 1. - p.y) / 9.;
      a = sat(min(x, L - x) * 4.);
      r = sat(texture(B, p + vec2(.003, -.005)).r * 1.8 + textureLod(B, p, 2.6).r * 3.5);
      c = mix(c * (1. - .92 * r * a), vec3(1, .96, .86), sat(texture(B, p).r * 1.5) * a);
    }
  }

  O = vec4(c + (h1(f + T * 83.) - .5) * .008, 1);
}
