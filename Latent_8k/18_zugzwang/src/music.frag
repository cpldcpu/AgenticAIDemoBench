#version 300 es
precision highp float;
out vec4 O;
const int BAR = 96000;
const int TH[64] = int[64](
  62, 0, 65, 69, 74, 1, 73, 74, 76, 1, 74, 70, 69, 1, 65, 0,
  67, 0, 70, 74, 79, 1, 77, 74, 73, 1, 69, 73, 76, 1, 1, 0,
  74, 0, 77, 81, 82, 1, 79, 77, 76, 0, 74, 73, 74, 1, 69, 0,
  70, 0, 67, 70, 69, 1, 65, 64, 62, 1, 1, 1, 0, 0, 0, 0
);
const int RT[8] = int[8](38, 37, 36, 34, 34, 31, 33, 41);

int N, B;
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
int hb(int b) {
  return b < 4 ? (b == 3 ? 6 : 0) :
         b >= 34 && b < 44 ? int[4](4, 7, 3, 6)[(b - 34) & 3] :
         b >= 56 ? (b < 62 ? int[4](0, 4, 5, 6)[(b - 56) & 3] : 0) :
         min((b - 4) & 7, 6);
}
ivec3 ch(int h) {
  return ivec3(h == 1 || h == 6 ? 64 : h == 7 ? 60 : 62,
               h == 1 || h == 3 || h == 5 || h == 6 ? 67 : B >= 60 ? 66 : 65,
               h == 3 || h == 5 ? 70 : h == 6 ? 73 : 69);
}
vec3 th(int n, int u) {
  int e = (n / u) & 63, s = e, f = e + 1;
  for (int i = 0; i < 8; i++) {
    if (TH[s] == 1 && s > 0) s--;
    if (f < 64 && TH[f] == 1) f++;
  }
  return vec3(TH[s], float(n % u + (e - s) * u) / 48e3, float((f - e) * u - n % u) / 48e3);
}
float hp(float t, float m) {
  float p = w(m) * t, r = 0.;
  for (float k = 1.; k < 7.; k++) r += sin(p * k + .3 * sin(p * k * 2.) * exp(-t * 18.)) / k * exp(-t * (3. + 2. * k));
  return r * sat(t * 1200.);
}
vec2 st(float t, float m) {
  vec2 p = w(m) * t * vec2(.998, 1.002), r = vec2(0);
  for (float k = 1.; k < 7.; k++) r += sin(p * k + k) / k;
  return r;
}
float gl(float t, float m) {
  float p = w(m) * t;
  return sin(p + (m < 50. ? 4.5 * exp(-t * 26.) : .7 * exp(-t * 11.) * sin(p * 3.))) * exp(-t * 4.) * sat(t * 900.);
}
vec2 pd(int b, float t) {
  int h = hb(b), pl = b < 10 ? 4 : b < 44 ? 7 : b < 56 ? 9 : max(0, 5 - (b - 56) / 2);
  ivec3 c = ch(h);
  vec2 r = st(t, float(RT[h] + 12)) * .9;
  for (int i = 0; i < 3; i++) r += st(t, float(c[i]));
  if (b >= 22 && b < 34 || b >= 42 && b < 44) r *= .58 + .42 * sin(t * 75.4);
  return r * sat(t * 4.5) * sat((2.3 - t) * 3.2) * float(pl) * .006;
}

void main() {
  N = int(gl_FragCoord.x) + int(gl_FragCoord.y) * 4096;
  int b = B = min(N / BAR, 65), nb = N - b * BAR, e = nb / 12000, q = nb / 24000, x = nb / 6000, h = hb(b), sx = x & 15;
  ivec3 c = ch(h);
  float tb = float(nb) / 48e3, t8 = mod(tb, .25), tq = mod(tb, .5), tx = mod(tb, .125), bf = float(b) + tb / 2., wn = hs(N) - hs(N - 1);
  vec2 o = pd(b, tb) + (b > 0 ? pd(b - 1, tb + 2.) : vec2(0));

  if (b < 62 && (b < 56 || (x & 3) == 0)) {
    int ap = (x & 1) > 0 ? 1 : (x >> 1) & 3;
    float an = float(ap < 3 ? c[ap] : c[0] + 12), pn = .5 + .3 * sin(float(x) * 1.1);
    o += hp(b >= 56 ? tq : tx, an + (b >= 44 && (x & 1) == 1 ? 12. : 0.)) * ((b > 33 && b < 44 || b > 55) ? .09 : .14) * vec2(1. - pn, pn);
  }

  if (b >= 2 && b < 60) {
    vec3 nt = th(N - 2 * BAR, (b < 4 || b >= 34 && b < 40 || b >= 56) ? 24000 : 12000);
    if (nt.x > 1.) {
      float tr = (b >= 22 && b < 34 || b >= 44 && b < 56) ? 12. : 0.;
      o += st(nt.y + 1.4e-3 * sin(nt.y * 34.) * sat(nt.y * 3.5 - .4), nt.x + tr) * sat(nt.y * 28.) * sat(nt.z * 22.) * (b > 33 && b < 44 ? .16 : .22);
      if (b >= 14 && b < 34 || b >= 44 && b < 56) o += hp(nt.y, nt.x + 12.) * .08;
    }
  }

  if (b >= 34 && b < 44) {
    o += gl(t8, float(c[e % 3] + 12 + (e & 3) * 3)) * .14;
    if (b >= 40) for (int i = 0; i < 3; i++) o += gl(tb, float(c[i] + 24)) * .12;
  }

  if (b >= 4 && b < 58) {
    float bn = float(RT[h]);
    if (b < 10 || b >= 56) o += hp(tb, bn) * .22;
    else if (b < 34 || b >= 42) o += (hp(t8, bn + float((e & 1) * 12)) + hp(t8, bn - 12.)) * .22;
    else if ((q & 1) == 0) o += hp(tq, bn) * .24;
  }

  if (b >= 1 && b < 34 && (b > 9 || (q & 1) == 0)) {
    int ix = b < 10 ? q : b < 22 ? e : x;
    float ct = b < 10 ? tq : b < 22 ? t8 : tx, cf = (b < 10 ? 350. : 900.) * ((ix & 1) > 0 ? 1. : 1.25);
    o += (sin(6.283 * cf * ct) * exp(-ct * 45.) + .6 * vn(6) * exp(-ct * 160.)) * sat(ct * 4e3) * (b < 10 ? .22 : b < 22 ? .07 : .16) * ((ix & 1) == 0 ? vec2(.9, .3) : vec2(.3, .9));
  }

  if (b == 16 || b == 19 || b == 60 || b == 62) o += gl(tb, 88.) * .2;
  if (b == 9 || b == 21 || b == 33 || b == 43 || b == 51) o += gl(tx, float(RT[h])) * .08 * tb * tb;
  if (b == 10 || b == 22 || b == 40 || b == 44 || b == 52 || b == 56) o += gl(tb, float(RT[h])) * .42 + wn * exp(-tb * 2.5) * .13;

  if (b >= 10 && b < 34 || b >= 44 && b < 56) {
    float dg = b > 21 ? .9 : .65;
    if (sx == 0 || sx == 6 || b >= 22 && sx == 10) o += sin(6.283 * (46. + 110. * exp(-tx * 38.)) * tx) * exp(-tx * 14.) * sat(tx * 800.) * .32 * dg;
    if (sx == 4 || sx == 12 || b >= 22 && sx == 15) o += (sin(6.283 * 195. * tx) * exp(-tx * 24.) + (vn(3) + wn) * exp(-tx * 19.)) * (sx == 15 ? .06 : .16) * dg;
    o += wn * exp(-tx * ((x & 1) == 0 ? 45. : 70.)) * .055 * dg * vec2(.8, 1.2);
  }

  o *= sat((65.2 - bf) * .6);
  O = vec4(tanh(o * .78), 0, 1);
}
