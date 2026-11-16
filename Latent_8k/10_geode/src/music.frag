#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

// GEODE, 120 BPM (2 s per bar), A minor, 128 s.
// Bars: 0-8 intro pad + bells, 8-20 arpeggio, 20-36 melody, 36-48 drop, 48-60 release, 60-64 final chord.
const float TAU = 6.2831853;
const float MEL[8] = float[8](0.0, 3.0, 7.0, 10.0, 7.0, 3.0, 0.0, -2.0);

float nt(float m) { return 440.0 * exp2((m - 69.0) / 12.0); }

// Integer hash noise (no periodicity at audio rates)
float hs(float x) {
  uint h = uint(x) * 747796405u + 2891336453u;
  h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
  h = (h >> 22u) ^ h;
  return float(h) / 4294967295.0;
}

float pad(float t, float f) {
  return sin(TAU * f * t) + 0.6 * sin(TAU * f * 1.004 * t) + 0.3 * sin(TAU * f * 2.0 * t) + 0.2 * sin(TAU * f * 3.0 * t);
}

// FM bell struck at x seconds
float bell(float x, float f) {
  if (x < 0.0) return 0.0;
  float p = TAU * f * x;
  return exp(-x * 2.2) * sin(p + 2.5 * exp(-x * 3.0) * sin(p * 1.4));
}

// Kick: pitch drops from about 195 Hz to 45 Hz
float kick(float x) {
  return sin(TAU * (45.0 * x + 5.0 * (1.0 - exp(-30.0 * x)))) * exp(-7.0 * x);
}

void main() {
  float i = floor(gl_FragCoord.y) * 4096.0 + floor(gl_FragCoord.x);
  float t = i / 48000.0;
  float b = floor(t * 0.5);
  float c = mod(b, 4.0);
  float rt = c < 0.5 ? 57.0 : c < 1.5 ? 53.0 : c < 2.5 ? 48.0 : 55.0;  // Am F C G
  float th = c < 0.5 ? 3.0 : 4.0;

  float s2 = step(8.0, b), s3 = step(20.0, b), s4 = step(36.0, b), s5 = step(48.0, b), s6 = step(60.0, b);
  float drop = s4 * (1.0 - s5);
  float env = 1.0 - smoothstep(122.0, 127.5, t);
  float sw = 1.0 - exp(-mod(t, 2.0) * 2.0);

  // Pad
  float P = (pad(t, nt(rt)) + pad(t, nt(rt + th)) + pad(t, nt(rt + 7.0))) * 0.05 * sw;

  // Intro: sparse bells, and a low drone under everything
  float pk = floor(t * 2.0), hp = hs(pk * 3.1);
  float pf = nt(69.0 + floor(hp * 5.0) * 2.0 + rt - 57.0);
  float IB = bell(mod(t, 0.5), pf) * 0.12 * step(0.45, hp) * (1.0 - s2);
  float DR = sin(TAU * nt(rt - 24.0) * t) * 0.12 * (1.0 - s2 + s6);

  // Bass pulses in the drop
  float B = sin(TAU * nt(rt - 12.0) * t) * exp(-mod(t, 0.25) * 5.0) * 0.3 * drop;

  // Drums
  float K = kick(mod(t, 0.5)) * drop * 0.8 + kick(mod(t, 2.0)) * s5 * (1.0 - s6) * 0.5;
  float nb = mod(floor(t * 2.0), 2.0);
  float SN = (hs(i) * 2.0 - 1.0) * exp(-mod(t, 0.5) * 16.0) * 0.25 * drop * nb;
  float HT = (hs(i + 3.0) * 2.0 - 1.0) * exp(-mod(t, 0.125) * 90.0) * 0.08 * (drop + 0.4 * s2 * (1.0 - s4));

  // Arpeggio on 8th notes (chord tones, octave up)
  float ak = mod(floor(t * 4.0), 4.0);
  float aoff = ak < 0.5 ? 0.0 : ak < 1.5 ? th : ak < 2.5 ? 7.0 : 12.0;
  float AR = bell(mod(t, 0.25), nt(rt + 24.0 + aoff)) * 0.12 * s2 * (1.0 - s6);

  // Melody on quarter notes, act III
  float mk = floor(t * 2.0);
  float mofs = MEL[int(mod(mk, 8.0))];
  float mf = nt(69.0 + rt - 57.0 + mofs);
  float mt = mod(t, 0.5);
  float LD = sin(TAU * mf * t + 0.4 * sin(TAU * 5.0 * t)) * exp(-mt * 3.0) * 0.12 * s3 * (1.0 - s4);

  float M = P + IB + DR + B + K + SN + HT + AR + LD;
  M *= env;
  float wob = 0.08 * sin(TAU * 0.11 * t);
  O = vec4(tanh(M * (1.0 + wob)), tanh(M * (1.0 - wob)), 0.0, 1.0);
}
