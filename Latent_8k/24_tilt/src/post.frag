#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;

float sat(float x) { return clamp(x, 0., 1.); }

void main() {
  vec2 f = gl_FragCoord.xy, q = f / R.xy, u = q - .5, o;
  float T = R.z, b = T / 1.70667, s = b >= 46. && b < 50.2 ? sin(T * 75.) * exp(-fract(b) * 3.5) * .02 : 0.;
  q.x = clamp(q.x + s, .001, .999);
  float a = texture(A, q).a * .85 + .02, w = 0., r, k;
  vec3 c = vec3(0), d = c;

  for (float i = 0.; i < 24.; i++) {
    r = sqrt(i / 24.) * a * .009;
    o = r * vec2(cos(i * 2.4), sin(i * 2.4));
    vec4 x = textureLod(A, clamp(q + o * vec2(R.y / R.x, 1), .001, .999), a * 1.4);
    k = step(r, x.a * .009 + 1e-4) + .08;
    c += x.rgb * k; w += k;
  }
  c /= w;

  for (float l = 2.; l < 6.; l++) {
    o = exp2(l) / R.xy * vec2(cos(l * 2.), sin(l * 2.));
    d += max(textureLod(A, clamp(q + o, .001, .999), l).rgb - .85, 0.) + max(textureLod(A, clamp(q - o, .001, .999), l).rgb - .85, 0.);
  }
  c = (c + d * .016) * (1. - dot(u, u) * .55) * .94;
  c = c * (2.51 * c + .03) / (c * (2.43 * c + .59) + .14);
  c = pow(clamp(c, 0., 1.), vec3(.4545)) * smoothstep(0., .6, b) * smoothstep(59.8, 58.2, b);

  for (int i = 0; i < 9; i++) {
    float n = float(i == 7 ? 0 : i > 7 ? 7 : i),
          x = b - float[9](.3, 2.2, 8.2, 20.2, 32.2, 46.2, 52.2, 53.2, 53.2)[i],
          L = i < 1 ? 2.2 : i < 7 ? 2.8 : 6.2,
          z = n < .5 ? 1.15 : .68;
    if (i > 1 && i < 7 && x > 0.) c += exp(-min(x * 12., 30.)) * (i == 6 ? vec3(.25, .02, .02) : vec3(.08));
    vec2 p = vec2(u.x / z + .5, (u.y - (n < .5 ? .09 : i > 7 ? -.08 : -.37)) * 9. / z + .5);
    if (x > 0. && x < L && p.y > 0. && p.y < 1. && p.x > 0. && p.x < 1.) {
      p.y = (n + 1. - p.y) / 9.;
      a = sat(min(x, L - x) * 4.);
      r = sat(texture(B, p + vec2(.003, -.005)).r * 1.8 + textureLod(B, p, 2.5).r * 3.5);
      c = mix(c * (1. - .92 * r * a), i > 5 && b > 50. ? vec3(1, .22, .18) : vec3(1, .95, .82), sat(texture(B, p).r * 1.5) * a);
    }
  }

  O = vec4(c + (fract(sin(dot(f + T, vec2(12.9898, 78.233))) * 43758.5) - .5) * .008, 1);
}
