#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

// SOUNDING: a barcarolle in D minor, 90 BPM, 3/4. One bar = 3 beats = 2 s, so the
// 16-second beam revolution is exactly 8 bars and the score and the picture share a clock.
const float TAU = 6.28318530718;
const float SPB = 0.66666666667;   // one beat at 90 BPM, exactly 32000 samples

// Dm  Bb  F   C  | Dm  Gm  Bb  A   -- the 8-bar turn the whole piece is built on
const float RTS[8] = float[8](50.0, 46.0, 41.0, 48.0, 50.0, 43.0, 46.0, 45.0);
const float THS[8] = float[8](3.0, 4.0, 4.0, 4.0, 3.0, 3.0, 4.0, 4.0);

// The tune. One slot per beat, -1 means "keep the previous note".
const float MEL[48] = float[48](
  69.0, -1.0, -1.0,  65.0, -1.0, 67.0,  69.0, -1.0, -1.0,  64.0, -1.0, -1.0,
  62.0, -1.0, 65.0,  67.0, -1.0, 69.0,  70.0, -1.0, 69.0,  67.0, -1.0, -1.0,
  65.0, -1.0, -1.0,  62.0, -1.0, -1.0,  72.0, -1.0, -1.0,  70.0, -1.0, 69.0,
  69.0, -1.0, -1.0,  70.0, -1.0, -1.0,  69.0, -1.0, 67.0,  69.0, -1.0, -1.0);

// Integer hash, so nothing repeats at audio rates (see tools/devlog.md, intro 10).
float hs(float x) {
  uint h = uint(x) * 747796405u + 2891336453u;
  h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
  h = (h >> 22u) ^ h;
  return float(h) / 4294967295.0;
}
float nt(float m) { return 440.0 * exp2((m - 69.0) / 12.0); }
float nz(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hs(i), hs(i + 1.0), f) * 2.0 - 1.0; }

// Bowed string: a few harmonics, a slow bow attack and a touch of vibrato.
float bow(float x, float f, float vib) {
  if (x < 0.0) return 0.0;
  float p = TAU * f * x + vib * sin(TAU * 5.1 * x);
  return (sin(p) + 0.50 * sin(2.0 * p) + 0.28 * sin(3.0 * p) + 0.16 * sin(4.0 * p) + 0.10 * sin(5.0 * p))
       * smoothstep(0.0, 0.20, x) * (0.72 + 0.28 * exp(-x * 0.8));
}
// Harp: plucked, dies away.
float hpl(float x, float f, float dec) {
  if (x < 0.0) return 0.0;
  float p = TAU * f * x;
  return (sin(p) + 0.48 * sin(2.0 * p) + 0.22 * sin(3.0 * p) + 0.10 * sin(4.0 * p))
       * exp(-x * dec) * smoothstep(0.0, 0.004, x);
}
// Foghorn: a fifth-heavy blare with a slow swell.
float horn(float x, float f) {
  if (x < 0.0) return 0.0;
  float p = TAU * f * x;
  return (sin(p) + 0.45 * sin(2.0 * p) + 0.14 * sin(3.0 * p) + 0.09 * sin(4.0 * p))
       * smoothstep(0.0, 1.9, x) * (1.0 - smoothstep(4.0, 7.5, x));
}
// Bell-buoy: inharmonic partials.
float bell(float x, float f) {
  if (x < 0.0) return 0.0;
  float p = TAU * f * x;
  return (sin(p) + 0.55 * sin(2.76 * p) * exp(-x * 2.5) + 0.26 * sin(5.13 * p) * exp(-x * 4.5))
       * exp(-x * 1.1) * smoothstep(0.0, 0.01, x);
}

void main() {
  float i = floor(gl_FragCoord.y) * 4096.0 + floor(gl_FragCoord.x);
  float t = i / 48000.0;
  float b = t / SPB;
  float bar = floor(b / 3.0);
  float ci = mod(bar, 8.0);
  float rt = RTS[int(ci)], th = THS[int(ci)];
  float b3 = mod(b, 3.0), bt = fract(b);
  float xb = bt * SPB;                       // seconds since the beat

  // Where the beam is: one revolution every 16 s, and it points at us at 27 s.
  float rev = mod(t - 11.0, 16.0);

  // ---- how loud is each layer, over the whole piece -------------------------
  float waltz  = smoothstep(15.0, 25.0, t) * (1.0 - 0.70 * smoothstep(96.0, 112.0, t));
  float melody = smoothstep(29.0, 37.0, t) * (1.0 - 0.55 * smoothstep(100.0, 116.0, t));
  float full   = smoothstep(60.0, 69.0, t) * (1.0 - smoothstep(97.0, 107.0, t));
  float end    = smoothstep(119.0, 121.0, t);
  float fade   = 1.0 - smoothstep(124.0, 128.0, t);
  float intro  = smoothstep(0.0, 5.0, t) * (1.0 - 0.5 * smoothstep(20.0, 40.0, t));

  // ---- pad: the fog itself, a slow chord that never quite stops -------------
  float padA = 0.023 * (0.7 + 0.3 * smoothstep(24.0, 60.0, t)) * (1.0 - 0.45 * end);
  float P = 0.0;
  P += sin(TAU * nt(rt - 12.0) * t);
  P += sin(TAU * nt(rt - 12.0) * 1.003 * t + 1.1);
  P += 0.75 * sin(TAU * nt(rt + th - 12.0) * t + 0.4);
  P += 0.70 * sin(TAU * nt(rt + 7.0 - 12.0) * t * 1.002 + 2.0);
  P += 0.28 * sin(TAU * nt(rt + 12.0) * t + 0.9);
  P *= padA * (0.75 + 0.25 * sin(TAU * t * 0.045));

  // ---- drone: the low D that sits under everything -------------------------
  float D = (sin(TAU * nt(26.0) * t) + 0.5 * sin(TAU * nt(33.0) * t + 0.5)) * 0.055 * intro;

  // ---- the foghorn, once every revolution ---------------------------------
  float H = horn(rev, nt(38.0)) * 0.115 * (0.55 + 0.45 * smoothstep(0.0, 60.0, t));
  H += horn(rev, nt(45.0)) * 0.030;

  // ---- the bell-buoy, on the same clock, off the beat by design -----------
  float BG = bell(rev - 0.30, nt(69.0)) * 0.055 + bell(rev - 0.34, nt(76.0)) * 0.020;
  BG += bell(rev - 8.6, nt(72.0)) * 0.030 * smoothstep(20.0, 40.0, t);

  // ---- waltz: root on one, chord on two and three --------------------------
  float W = 0.0;
  float R1 = nt(rt - 12.0), R2 = nt(rt);
  W += hpl(b3 * SPB, R1, 3.4) * 0.20;                              // beat 1, the bass
  float strum = 1.0 - step(2.0, b3);
  float T3 = nt(rt + th), T5 = nt(rt + 7.0);
  for (int k = 0; k < 2; k++) {
    float kx = xb - float(k) * SPB;
    W += (hpl(kx, R2, 5.5) * 0.055 + hpl(kx, T3, 5.5) * 0.048 + hpl(kx, T5, 5.5) * 0.042) * strum;
  }
  W *= waltz;

  // ---- the tune, on the cello ---------------------------------------------
  float start = floor(b);
  for (int k = 1; k <= 8; k++) {                    // walk back to the last note-on
    float j = mod(start - float(k) + 48.0, 48.0);
    if (MEL[int(j)] > -1.0) { start -= float(k); break; }
  }
  float mo = MEL[int(mod(start, 48.0))];
  float mx = (b - start) * SPB;
  // The tune plays where an open cello string sits (D4 to C5), with the octave below as
  // body. Before, both voices were an octave low and the pad's A3 masked the melody: the
  // bars showed 94 % of the energy below 500 Hz and nothing audible above 2 kHz.
  float M = mo > -1.0 ? bow(mx, nt(mo), 0.09) * 0.12 + bow(mx, nt(mo - 12.0), 0.11) * 0.06 : 0.0;
  M *= melody + 0.30 * full;

  // ---- the fleet: a chime cluster when the beam finds the others ----------
  float fl = bell(t - 64.0, nt(81.0)) * 0.055 + bell(t - 64.03, nt(84.0)) * 0.045
           + bell(t - 64.06, nt(88.0)) * 0.035 + bell(t - 64.1, nt(74.0)) * 0.040;
  fl *= smoothstep(0.0, 0.5, t - 64.0);

  // ---- the sea: layered low-passed noise that breathes ---------------------
  // a little spray on top, or the fog has no air in it at all
  float S = (nz(t * 190.0) * 0.55 + nz(t * 470.0) * 0.30 + nz(t * 1100.0) * 0.20
           + nz(t * 4300.0) * 0.14);
  float breathe = 0.5 + 0.5 * sin(TAU * t / 7.3);
  float seaA = 0.020 * (0.35 + 0.65 * breathe) * smoothstep(0.0, 12.0, t);
  S *= seaA;
  // the swell into the reveal
  S += nz(t * 900.0) * smoothstep(56.0, 64.0, t) * exp(-max(t - 64.0, 0.0) * 3.0) * 0.055;

  // ---- final chord: a bare D and A, letting the fog close -----------------
  float fx = t - 120.5;
  float FIN = (horn(fx, nt(38.0)) * 0.10 + horn(fx, nt(45.0)) * 0.035
             + bell(fx, nt(74.0)) * 0.05 + bell(fx - 0.5, nt(81.0)) * 0.03) * end;

  float L = P + D + H + BG + W + M + fl + FIN;
  float Rr = L + fl * 0.22 * sin(TAU * 0.7 * t);
  L += S * 0.85;
  Rr += S;

  L *= fade;
  Rr *= fade;
  float wob = 0.05 * sin(TAU * 0.07 * t);
  O = vec4(tanh(L * (1.0 + wob)), tanh(Rr * (1.0 - wob)), 0.0, 1.0);
}
