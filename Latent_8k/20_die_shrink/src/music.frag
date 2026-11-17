#version 300 es
precision highp float;
out vec4 O;
// DIE SHRINK - the soundtrack. One pixel = one stereo sample at 48 kHz.
// 140.625 BPM: a 16th is 5120 samples, a bar 81920 (1.70667 s), 80 bars.
// Bars 0-16 grow from a 1-bit beeper at 6 kHz to full resolution, one "process node" every two bars;
// bars 72-80 shrink back, one node per bar.
const int BAR = 81920;
int N, b, st;
float hs(int n) { uint x = uint(n) * 747796405u + 2891336453u; x = ((x >> ((x >> 28) + 4u)) ^ x) * 277803737u; return float((x >> 22) ^ x) / 4294967296.; }
float sat(float x) { return clamp(x, 0., 1.); }
float w(float m) { return 8.1758 * exp2(m / 12.); }
// the tune, in 8ths over 8 bars; -1 holds, 0 rests
const int ML[64] = int[64](76, -1, 79, 78, 76, -1, 71, 74, 76, -1, -1, 72, 71, -1, 67, -1,
  74, -1, 78, 81, 79, 78, 74, -1, 75, -1, 78, -1, 83, -1, 81, 78,
  76, -1, 79, 83, 81, 79, 78, 76, 79, -1, 76, -1, 72, -1, 76, 79,
  81, -1, 78, -1, 74, 78, 81, 86, 83, -1, -1, -1, -1, -1, 0, -1);
// chords: E minor, C, D, B
const int RT[4] = int[4](64, 60, 62, 59);
float pu(float p, float d) { return (fract(p) < d ? 2. : 0.) - 2. * d; }
// band-limited saw by polyBLEP
float saw(float p, float dt) {
  float t = fract(p), s = 2. * t - 1.;
  if (t < dt) t /= dt, s -= t + t - t * t - 1.;
  else if (t > 1. - dt) t = (t - 1.) / dt, s -= t * t + t + t + 1.;
  return s;
}
// the lead at sample n: a pulse with vibrato on the chip parts, plus two detuned saws in the drops
float lead(int n) {
  int e = (n / BAR % 8) * 8 + n % BAR / 10240, j = e;
  for (int i = 0; i < 7; i++) if (ML[j] < 0) j--;
  float m = float(ML[j]), t = float((e - j) * 10240 + n % 10240) / 48e3, br = float(n / BAR),
        f = w(m + (br > 55. && br < 72. ? 12. : 0.)) * (1. + .007 * sin(t * 37.) * sat(t * 4. - .6)),
        p = f * float(n) / 48e3, v = m > 0. ? sat(t * 200.) * (.75 + .25 * exp(-t * 6.)) : 0.;
  float s = pu(p, .3 + .15 * sin(t * 3.)) * .5;
  if (br > 31. && br < 48. || br > 55. && br < 72.) s = s * .4 + (saw(p * 1.005, f / 48e3) + saw(p * .995, f / 48e3)) * .45;
  return s * v;
}
void main() {
  N = int(gl_FragCoord.x) + int(gl_FragCoord.y) * 4096;
  b = N / BAR;
  int k = b < 16 ? b / 2 : b > 71 ? 79 - b : 8;
  if (b > 79) k = 0;
  N -= N % int[9](8, 6, 4, 3, 2, 2, 1, 1, 1)[k];
  b = N / BAR;
  int nb = N - b * BAR, c = b % 4, s32 = (b & 1) * 16 + nb / 5120;
  st = nb / 5120;
  float tb = float(nb) / 48e3, bf = float(b) + tb / 1.706667, ts = float(nb % 5120) / 48e3, t8 = float(nb % 10240) / 48e3,
        tq = float(nb % 20480) / 48e3, T = float(N) / 48e3, z = hs(N) - .5, hz = hs(N) - hs(N - 1), p, v, kk = 0., e;
  bool dr = b > 31 && b < 48 || b > 55 && b < 72, ch = b > 7 && b < 32, bd = b > 47 && b < 56, ou = b > 71;
  vec2 o = vec2(0);
  float s = 0.;
  int r = RT[c];
  // the clock: a tick on every beat while the chip is small
  if (b < 16 || ou) s += sin(19000. * tq) * exp(-tq * 300.) * .25;
  // arpeggio: chord tones cycled at 50 Hz like a tracker, 25 % pulse
  {
    int i = N / 960 % 3;
    float f = w(float(r + int[3](0, c > 0 ? 4 : 3, 7)[i] + 12)) * (b > 77 ? exp2(-(bf - 78.) * 2.) : 1.);
    v = (k < 8 ? .3 : dr ? .1 : .11) * (.6 + .4 * exp(-t8 * 9.)) * (b < 80 ? 1. : 0.);
    o += pu(f * T, .25) * v * vec2(1, .7) + pu(f * T * 1.003, .125) * v * vec2(.5, .9);
  }
  // triangle bass, octave bounce on the 8ths
  if (b > 3 && b < 32 || bd || b > 71 && b < 76) {
    p = fract(w(float(r - 24 + (st / 2 % 2) * 12)) * T);
    p = floor(p * 32.);
    o += (abs(p - 15.5) / 7.75 - 1.) * .2 * (bd ? .5 : 1.);
  }
  // chip drums: square kick, 8-bit noise snare, hats
  if (ch || b > 71 && b < 74) {
    if (st % 4 == 0) s += pu(45. * tq + 8. * (1. - exp(-tq * 25.)), .5) * exp(-tq * 14.) * .35;
    if (b > 9 && b < 72 && st % 8 == 4) s += (hs(N / 6) - .5) * exp(-tq * 16.) * .7;
    if (b > 11) s += (hs(N / 2) - .5) * exp(-ts * 70.) * ((st & 1) > 0 ? .18 : .1);
  }
  if (b == 31 || b == 55) s += (hs(N / 6) - .5) * exp(-mod(tb, st < 8 ? .2133 : .10667) * 20.) * .5 * tb;
  // breakbeat in the drops: two-bar pattern
  if (dr) {
    if (((1 | 1 << 7 | 1 << 10 | 1 << 16 | 1 << 18 | 1 << 23 | 1 << 26) >> s32 & 1) > 0) {
      kk = exp(-ts * 4.);
      s += tanh(sin(6.283 * (45. * ts + 6. * (1. - exp(-ts * 25.)))) * 2.) * exp(-ts * 6.) * .45;
    }
    e = ((1 << 4 | 1 << 12 | 1 << 20 | 1 << 28) >> s32 & 1) > 0 ? 1. : ((1 << 9 | 1 << 15 | 1 << 25 | 1 << 30) >> s32 & 1) > 0 ? .3 : 0.;
    s += e * (sin(6.283 * 185. * ts + 2. * exp(-ts * 30.)) * exp(-ts * 22.) * .5 + z * exp(-ts * 13.) * .9);
    s += hz * exp(-ts * (st == 14 ? 9. : 60.)) * ((st & 1) > 0 ? .4 : .55);
    if (b == 32 || b == 56 || b == 64 || b == 40) s += hz * exp(-tb * 1.6) * .4;
  }
  // bass in the drops: a sub and a filtered saw that snaps shut after each note
  if (dr) {
    int m = (1 | 1 << 3 | 1 << 6 | 1 << 8 | 1 << 11 | 1 << 14) >> st & 1;
    float f = w(float(r - 24)), fc = 150. + 2200. * exp(-ts * 18.) * float(m) * (b > 59 ? 1.5 : 1.), a = 0.;
    p = f * T;
    for (int h = 1; h < 25; h++) {
      float x = f * float(h) / fc;
      a += sin(6.283 * p * float(h)) / float(h) / (1. + x * x * x * x) * (1. + 2. * exp(-(x - 1.) * (x - 1.) * 20.));
    }
    o += (sin(6.283 * p) * .2 + tanh(a * 1.5) * .2) * (1. - .7 * kk);
  }
  // pad: the chord on soft saws, wide; in the drops it pumps with the kick
  if (dr || bd) {
    v = (bd ? .12 : .13) * sat(tb * 2.) * (1. - .8 * kk);
    for (int i = 0; i < 3; i++) {
      float f = w(float(r + int[3](0, c > 0 ? 4 : 3, 7)[i]));
      for (int h = 1; h < 7; h++)
        o += v * sin(6.283 * f * float(h) * T * vec2(1.002, .998) + vec2(i, h)) / float(h * h + 1) * 2.;
    }
  }
  // the lead, with a dotted-8th echo on the right
  if (b > 11 && b < 32 || bd || dr) {
    v = bd ? .2 : dr ? .42 : .22;
    o += vec2(lead(N), lead(N - 15360) * .45 + lead(N) * .55) * v;
  }
  // risers before the drops, and a sweep down into the outro
  if (b > 27 && b < 32 || b > 53 && b < 56) {
    v = b > 50 ? (bf - 54.) / 2. : (bf - 28.) / 4.;
    s += hz * v * v * .4 + sin(6.283 * T * (300. + 1500. * v * v)) * v * .05;
  }
  o += s;
  o = tanh(o * .8) * sat((80. - bf) * 4.);
  if (k < 8) { float q = exp2(float(k) + 1.); o = floor(o * q + .5) / q; }
  O = vec4(o, 0, 1);
}
