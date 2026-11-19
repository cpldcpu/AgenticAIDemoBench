#version 300 es
precision highp float;
out vec4 O;
const int M[32] = int[32](
  64, 67, 76, 74, 69, 71, 71, 67,
  64, 67, 79, 76, 74, 74, 71, 0,
  76, 79, 84, 81, 78, 76, 76, 71,
  72, 71, 69, 67, 64, 64, 0, 0
);
const int K[8] = int[8](40, 36, 33, 35, 40, 38, 36, 35);

int N;
float hs(int n) {
  uint x = uint(n) * 747796405u + 2891336453u;
  x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u;
  return float((x >> 22u) ^ x) / 4294967296.;
}
float sat(float x) { return clamp(x, 0., 1.); }
float w(float m) { return 2764.6 * exp2((m - 69.) / 12.); }
float vn(int d) {
  int i = N / d;
  float f = float(N - i * d) / float(d);
  return mix(hs(i), hs(i + 1), f * f * (3. - 2. * f)) * 2. - 1.;
}
float cm(float t, float m) {
  float p = w(m) * t, e = exp(-max(0., t) * (m < 53. ? 12. : 8.5));
  return (sin(p + (m < 53. ? 2.4 * sin(p * 2.) : 1.6 * sin(p * 2.76)) * exp(-max(0., t) * 26.)) + .5 * sin(p * (m < 53. ? 3. : 5.4)) * exp(-max(0., t) * 32.)) * e * sat(t * 1300.);
}
vec2 sy(float t, float m) {
  vec2 p = w(m) * t * vec2(.997, 1.003), r = vec2(0);
  for (float k = 1.; k < 8.; k++) r += sin(p * k + k * 1.2) / pow(k, .72);
  return r;
}

void main() {
  N = int(gl_FragCoord.x) + int(gl_FragCoord.y) * 4096;
  int b = min(N / 81920, 59), n = N - b * 81920, x = n / 5120, e = x >> 1, q = x >> 2, s = x & 15, h = b & 7;
  ivec3 c = ivec3(
    h == 1 || h == 6 ? 60 : h == 2 ? 57 : h == 5 ? 62 : 59,
    h == 1 || h == 6 ? 64 : h == 2 ? 60 : 64,
    h == 3 || h == 7 ? 71 : h == 5 ? 69 : 67
  );
  float u = float(n) / 48e3, z = float(n % 5120) / 48e3, y = z + float(x & 1) * .10667, v = y + float(e & 1) * .21333,
        f = float(b) + u / 1.70667, d = hs(N) - hs(N - 1), r = float(K[h]), a, p;
  vec2 o = vec2(0);

  if (b < 6) {
    a = float(n % 6826) / 48e3; p = 380. + 75. * float(b) + 22. * float(n / 6826);
    o += (sin(6.283 * p * a) * exp(-a * 65.) + .6 * vn(4) * exp(-a * 170.)) * sat(a * 3e3) * .22 * vec2(.4, .9);
  } else if (b == 6) {
    o += sin(6.283 * (220. + 1100. * u * u) * u) * exp(-u * 3.) * .26 * vec2(.3, .95);
    if (q > 0) o += cm(v, float(c[q - 1] + 12)) * .32 * vec2(.8, .5);
  } else if (b == 7) o += cm(y, float(c[e % 3] + 12 + (e >> 1) * 5)) * .28;

  if (b >= 2 && b < 49 || b >= 52 && b < 59) {
    a = b >= 52 ? -5. : 0.; p = b < 8 ? .006 : b >= 52 ? .006 * sat((59. - f) * .25) : .009 * (.4 + .6 * sat(v * 6.));
    vec2 l = sy(u, r + 12. + a) * .6;
    for (int i = 0; i < 3; i++) l += sy(u, float(c[i]) + a);
    o += l * sat(u * 6.) * sat((1.7 - u) * 5.) * p;
  }

  if (b >= 8 && b < 46) {
    a = float(c[(x + (b & 3)) % 3] + (b >= 32 && (x & 1) == 1 ? 24 : 12));
    p = .5 + .35 * sin(float(x) * 1.7);
    if (b >= 32 || (x & 1) == 0 || s == 3 || s == 11) o += cm(z, a) * (b >= 32 ? .25 : .2) * vec2(1. - p, p);
    if (b < 20 && (s == 0 || s == 6 || s == 12) || b >= 32 && (s & 3) == 0)
      o += (sin(6.283 * (180. + 420. * exp(-z * 60.)) * z) * exp(-z * 32.) + .5 * vn(3) * exp(-z * 110.)) * .16 * vec2(p, 1. - p);
    if (b >= 22 && b <= 30 && (b & 1) == 0 && q == 0) o += cm(v, 76. + float(b - 22)) * .34 + vn(3) * exp(-v * 90.) * .22;
    if (b == 30 || b == 31) o += cm(z, 64. + float((b - 30) * 16 + s)) * .22 * vec2(.2 + .025 * float(s), .9);

    if (b >= 16) {
      int m = b >= 32 ? 10240 : 20480, k = M[(N / m) & 31];
      if (k > 0) {
        a = float(n % m) / 48e3;
        p = a + 1.5e-3 * sin(a * 38.) * sat(a * 4. - .3);
        vec2 l = sy(p, float(k) + (b >= 32 ? 12. : 0.)) + (b >= 32 ? sy(p, float(k) + 19.) * .6 : vec2(0));
        o += l * sat(a * 40.) * sat((float(m) / 48e3 - a) * 28.) * (b >= 32 ? .058 : .048);
      }
    }

    a = b >= 32 ? .95 : .82;
    if (s == 0 || s == 6 || s == 8 || b >= 32 && s == 14)
      o += sin(6.283 * (52. + 125. * exp(-z * 45.)) * z) * exp(-z * 16.) * sat(z * 900.) * .24 * a;
    if (s == 4 || s == 12 || (b & 7) == 7 && s >= 13)
      o += (sin(6.283 * 210. * z) * exp(-z * 28.) + (vn(3) * .5 + d * 1.1) * exp(-z * 16.)) * sat(z * 1200.) * .28 * a;
    o += (d * .95 + vn(2) * .45) * exp(-z * ((s & 3) == 2 ? 20. : (s & 1) == 0 ? 48. : 75.)) * .13 * a * vec2(.85, 1.15);
  }

  if (b >= 4 && b < 49) {
    if (b < 8 || b >= 46) { if ((q & 1) == 0) o += cm(v, r) * .2; }
    else if ((s & 1) == 0 || s == 3 || s == 11 || s == 15)
      o += cm(z, r + float(s == 3 || s == 7 || s == 11 || s == 14 ? 12 : s == 15 ? 7 : 0)) * .21;
  }

  if (b >= 46 && b < 49) o += cm(v, 83.) * .22 * vec2(q & 1, 1 - (q & 1));
  if (b == 49 || b == 50) {
    a = float(b - 49) * 1.70667 + u;
    o += (tanh(sin(6.283 * 180. * a + 3. * sin(6.283 * 90. * a)) * 3.) * exp(-max(0., a) * 1.8) * .24
          + sin(6.283 * max(35., 520. - 160. * a) * a) * exp(-max(0., a) * 1.2) * .22
          + d * exp(-max(0., a) * 3.5) * .28) * sat(a * 500.);
  }

  if (b >= 52 && b < 56) o += vn(8) * (.04 + .02 * sin(u * 18.)) * exp(-max(0., f - 52.) * .35);
  if (b == 56 && q == 0) o += (cm(v, 54.) * .25 + vn(4) * exp(-v * 70.) * .22) * sat(v * 1e3);

  o *= sat((59.5 - f) * .5);
  O = vec4(tanh(o * .9), 0, 1);
}
