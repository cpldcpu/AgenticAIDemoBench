#version 300 es
precision highp float;
out vec4 O;
const int BAR = 96000;
const int MT[16] = int[16](74, 0, 77, 79, 81, 79, 77, 74, 72, 74, 77, 0, 76, 74, 72, 69);
const int RT[8] = int[8](38, 38, 36, 41, 43, 41, 36, 33);
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
float flute(float t, float m) {
  float p = w(m) * t, v = .12 * sin(t * 31.) * sat(t * 3. - .3), br = (hs(N) - hs(N - 7)) * .07;
  return (sin(p + v) + .24 * sin(p * 2.002 + .3) + .08 * sin(p * 3.01) + br) * sat(t * 24.) * sat((.92 - t) * 7.);
}
float pluck(float t, float m) {
  float p = w(m) * t, r = 0.;
  for (float k = 1.; k < 7.; k++) r += sin(p * k + .16 * sin(p * 2.) * exp(-t * 20.)) * exp(-t * (3. + k * 2.2)) / k;
  return r * sat(t * 1400.);
}
float stone(float t, float k) {
  return (sin(6.283 * (1120. + 270. * k) * t) * .45 + sin(6.283 * (1739. - 190. * k) * t) * .25) * exp(-t * 65.) * sat(t * 3e3);
}
float drum(float t, float k) {
  return sin(6.283 * ((52. + k * 9.) * t + 3.5 * (1. - exp(-t * 19.)))) * exp(-t * 10.) * sat(t * 900.);
}
void main() {
  N = int(gl_FragCoord.x) + int(gl_FragCoord.y) * 4096;
  int b = B = min(N / BAR, 63), nb = N - b * BAR, q = nb / 48000, e = nb / 24000, x = nb / 12000;
  float tb = float(nb) / 48e3, tq = mod(tb, 1.), te = mod(tb, .5), tx = mod(tb, .25), bf = float(b) + tb / 2., gt = float(N) / 48e3;
  vec2 o = vec2(vn(1900) * .012, vn(1973) * .012);
  // Water falls somewhere out of sight. The delays make the cave's dimensions audible.
  if ((b & 1) == 0) {
    float u = tb - hs(b * 7) * 1.6;
    if (u > 0.) o += sin(6.283 * (1700. * u - 420. * u * u)) * exp(-u * 32.) * sat(u * 5e3) * .09 * vec2(hs(b + 4), 1. - hs(b + 4));
  }
  // Breath flute: a four-bar pentatonic call, answered an octave higher by the herd.
  if (b >= 2 && b < 16 || b >= 24 && b < 40 || b >= 44) {
    int mn = MT[(b & 3) * 4 + q];
    if (mn > 0) {
      float v = b >= 24 && b < 40 ? .19 : b >= 44 ? .16 : .22;
      vec2 pan = vec2(.8 + .2 * sin(float(b)), .9 - .2 * sin(float(b)));
      o += flute(tq, float(mn)) * v * pan;
      if (b >= 24 && b < 32) o += flute(tq, float(mn + 7)) * .065 * pan.yx;
      if (b >= 32 && b < 40) o += flute(te, float(mn + 12)) * .065 * pan.yx;
    }
  }
  // A rising knap roll leads each cut; the last bar of the herd answers in octaves.
  if (b == 15 || b == 23 || b == 31 || b == 39 || b == 47 || b == 55) {
    float v = float(x) / 16.;
    o += stone(tx, v) * v * .09 * vec2(.5 + v * .3, .8 - v * .3);
  }
  // Knapped stones: an asymmetric 3+3+2 rhythm, never a conventional snare.
  if (b >= 8 && b < 48 || b >= 56) {
    int k = e & 7;
    if (k == 0 || k == 3 || k == 4 || k == 6) {
      float v = b >= 24 && b < 40 ? .16 : .1;
      o += stone(te, float(k & 1)) * v * ((k & 1) == 0 ? vec2(.9, .35) : vec2(.35, .9));
      o += (hs(N) - hs(N - 1)) * exp(-te * 210.) * .035;
    }
  }
  // A wooden-string pulse enters as the painting gains depth.
  if (b >= 16 && b < 48) {
    int rt = RT[b & 7];
    o += pluck(tb, float(rt)) * .24;
    if (b >= 24 && b < 40) {
      o += pluck(te, float(rt + ((e & 3) == 3 ? 7 : 0))) * .2;
      o += pluck(tq, float(rt - 12)) * .16;
    }
  }
  // Frame drum and actual gallop figures. Every impact is on the shared 120 BPM clock.
  if (b >= 16 && b < 48) {
    if (b < 24 || b >= 40) {
      if ((q & 1) == 0) o += drum(tq, float(q)) * .27;
    } else {
      int k = e & 7;
      if (k == 0 || k == 3 || k == 4 || k == 6) o += drum(te, float(k & 1)) * (b >= 32 ? .34 : .27);
      if ((x & 1) == 0) o += (sin(6.283 * 410. * tx) * exp(-tx * 75.) + (hs(N) - hs(N - 2)) * exp(-tx * 95.) * .5) * .1;
    }
  }
  // A low bone resonance at the bookends; seed pods ride the herd's sixteenths.
  if (b < 8 || b >= 48) o += (sin(w(38.) * gt) + .35 * sin(w(38.) * gt * 1.007)) * .022 * sat(gt * .4) * sat((64. - bf) * .5);
  if (b >= 24 && b < 40) {
    float t16 = mod(tb, .125), sh = (hs(N) - hs(N - 2)) * exp(-t16 * 105.) * sat(t16 * 5e3);
    o += sh * .038 * ((x & 1) == 0 ? vec2(.9, .25) : vec2(.25, .9));
  }
  // The chamber answers the stampede; then only air, pigment and the first call remain.
  if (b >= 24 && b < 40) o += vn(700) * .025 * sat((bf - 24.) * .5) * sat((40. - bf) * .5);
  if (b == 16 || b == 24 || b == 32 || b == 40) o += drum(tb, 0.) * .4 + vn(400) * exp(-tb * 2.) * .08;
  if (b == 56) o += flute(tb * 3., 50.) * .12;
  o *= sat((64. - bf) * .7);
  O = vec4(tanh(o * .82), 0, 1);
}