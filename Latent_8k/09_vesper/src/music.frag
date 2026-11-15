#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

const float TAU = 6.2831853;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

float ntof(float m) { return 440.0 * exp2((m - 69.0) / 12.0); }

// Warm multi-rank pipe organ voice (16' + 8' + 4' + chorus)
float organ(float t, float f) {
  float p = TAU * f * t;
  return 0.48 * sin(p)
       + 0.25 * sin(p * 2.0 + 0.08 * sin(t * 2.1))
       + 0.14 * sin(p * 3.0)
       + 0.08 * sin(p * 4.0)
       + 0.18 * sin(p * 1.0023)
       + 0.18 * sin(p * 0.9977);
}

// Plucked harp / dulcimer (FM harmonic decay)
float pluck(float lt, float f) {
  if (lt < 0.0 || lt > 2.5) return 0.0;
  float env = smoothstep(0.0, 0.004, lt) * exp(-max(lt * 3.4, 0.0));
  float idx = 2.6 * exp(-min(lt * 11.0, 40.0));
  float p = TAU * f * lt;
  return env * sin(p + idx * sin(p * 2.0) + 0.35 * sin(p * 3.0));
}

// Tubular / cathedral bell
float bell(float lt, float f) {
  if (lt < 0.0 || lt > 5.0) return 0.0;
  float env = smoothstep(0.0, 0.003, lt) * exp(-min(lt * 1.35, 40.0));
  float p = TAU * f * lt;
  return env * (0.62 * sin(p) + 0.25 * sin(p * 2.756) * exp(-min(lt * 2.2, 40.0)) + 0.13 * sin(p * 5.404) * exp(-min(lt * 4.0, 40.0)));
}

// Singing lead with vibrato
float leadVoice(float t, float lt, float f) {
  float vib = 1.0 + 0.0035 * sin(TAU * 5.4 * t) * smoothstep(0.12, 0.45, lt);
  float p = TAU * f * vib * t;
  return 0.55 * sin(p) + 0.28 * sin(p * 2.0) + 0.12 * sin(p * 3.0);
}

void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  int idx = px.y * 4096 + px.x;
  float t = float(idx) / 48000.0;

  if (t > 127.5) { O = vec4(0.0); return; }

  // 120 BPM: 1 beat = 0.5s, 1 bar = 2.0s
  float beat = t * 2.0;
  float bar = floor(beat * 0.25);
  float bInBar = mod(beat, 4.0);
  float sixteenth = floor(beat * 4.0);
  float l16 = (beat * 4.0 - sixteenth) * 0.125;

  // Section weights
  float s1 = smoothstep(0.0, 2.0, t) * (1.0 - smoothstep(14.0, 18.0, t));
  float s2 = smoothstep(7.5, 8.5, bar) * (1.0 - smoothstep(19.5, 20.5, bar));
  float s3 = smoothstep(19.5, 20.5, bar) * (1.0 - smoothstep(35.5, 36.5, bar));
  float s4 = smoothstep(35.5, 36.5, bar) * (1.0 - smoothstep(47.5, 48.5, bar));
  float s5 = smoothstep(47.5, 48.5, bar) * (1.0 - smoothstep(57.5, 58.5, bar));
  float s6 = smoothstep(57.5, 58.5, bar);

  // Chord progression (MIDI root, 3rd, 5th, 9th)
  // Default Dm: 38(D2), 50(D3), 53(F3), 57(A3), 64(E4)
  float root = 38.0, n1 = 50.0, n2 = 53.0, n3 = 57.0, n4 = 64.0;
  int ib = int(bar);
  if (ib >= 8 && ib < 20) {
    int c = ((ib - 8) / 2) % 4;
    if (c == 1) { root = 34.0; n1 = 46.0; n2 = 50.0; n3 = 53.0; n4 = 60.0; } // Bb
    if (c == 2) { root = 36.0; n1 = 48.0; n2 = 52.0; n3 = 55.0; n4 = 62.0; } // C
    if (c == 3) { root = 33.0; n1 = 45.0; n2 = 48.0; n3 = 52.0; n4 = 59.0; } // Am
  } else if (ib >= 20 && ib < 36) {
    int c = ((ib - 20) / 2) % 4;
    if (c == 1) { root = 34.0; n1 = 46.0; n2 = 50.0; n3 = 53.0; n4 = 60.0; } // Bb
    if (c == 2) { root = 31.0; n1 = 43.0; n2 = 46.0; n3 = 50.0; n4 = 57.0; } // Gm
    if (c == 3) { root = 33.0; n1 = 45.0; n2 = 49.0; n3 = 52.0; n4 = 57.0; } // A
  } else if (ib >= 36 && ib < 48) {
    int c = ((ib - 36) / 2) % 6;
    if (c == 0) { root = 41.0; n1 = 53.0; n2 = 57.0; n3 = 60.0; n4 = 67.0; } // F
    if (c == 1) { root = 36.0; n1 = 48.0; n2 = 52.0; n3 = 55.0; n4 = 62.0; } // C
    if (c == 2) { root = 38.0; n1 = 50.0; n2 = 53.0; n3 = 57.0; n4 = 64.0; } // Dm
    if (c == 3) { root = 34.0; n1 = 46.0; n2 = 50.0; n3 = 53.0; n4 = 60.0; } // Bb
    if (c == 4) { root = 31.0; n1 = 43.0; n2 = 46.0; n3 = 50.0; n4 = 57.0; } // Gm
    if (c == 5) { root = 36.0; n1 = 48.0; n2 = 52.0; n3 = 55.0; n4 = 60.0; } // C
  } else if (ib >= 48 && ib < 58) {
    int c = (ib - 48) % 8;
    if (c == 1) { root = 34.0; n1 = 46.0; n2 = 50.0; n3 = 53.0; n4 = 60.0; } // Bb
    if (c == 2) { root = 36.0; n1 = 48.0; n2 = 52.0; n3 = 55.0; n4 = 62.0; } // C
    if (c == 4) { root = 31.0; n1 = 43.0; n2 = 46.0; n3 = 50.0; n4 = 57.0; } // Gm
    if (c == 5) { root = 34.0; n1 = 46.0; n2 = 50.0; n3 = 53.0; n4 = 60.0; } // Bb
    if (c == 6 || c == 7) { root = 33.0; n1 = 45.0; n2 = 49.0; n3 = 52.0; n4 = 57.0; } // A
  } else if (ib >= 58) {
    if (ib == 60 || ib == 61) { root = 34.0; n1 = 46.0; n2 = 50.0; n3 = 53.0; n4 = 60.0; }
  }

  float L = 0.0, R_ch = 0.0;

  // 1. Sub Pedal & Pipe Organ Chords
  float orgEnv = smoothstep(0.0, 1.8, t) * (1.0 - smoothstep(123.0, 127.0, t));
  float chordGain = 0.14 + 0.14 * (s3 + s5) + 0.08 * s4;
  float ped = 0.55 * sin(TAU * ntof(root - 12.0) * t) + 0.45 * organ(t, ntof(root));
  float chd = organ(t, ntof(n1)) + 0.85 * organ(t, ntof(n2)) + 0.85 * organ(t, ntof(n3)) + 0.55 * organ(t, ntof(n4));
  // Subtle organ swell on bar boundaries
  float swell = 0.82 + 0.18 * sin(TAU * beat * 0.125);
  float orgMix = (ped * 0.45 + chd * 0.24) * chordGain * swell * orgEnv;
  L += orgMix * 0.96;
  R_ch += orgMix * 1.04;

  // 2. Driving 8th-note bass in Acts III & V
  float bassActive = s3 + s5;
  if (bassActive > 0.01) {
    float eighth = floor(beat * 2.0);
    float l8 = (beat * 2.0 - eighth) * 0.25;
    float bOct = mod(eighth, 2.0) > 0.5 ? 12.0 : 0.0;
    float bf = ntof(root + bOct);
    float bEnv = smoothstep(0.0, 0.008, l8) * exp(-min(l8 * 9.0, 40.0));
    float bSnd = (0.7 * sin(TAU * bf * l8) + 0.3 * sin(TAU * bf * 2.0 * l8)) * bEnv * 0.24 * bassActive;
    L += bSnd; R_ch += bSnd;
  }

  // 3. Plucked Harp / Dulcimer Arpeggio (Acts II, III, IV, V)
  float arpActive = (s2 * 0.85 + s3 * 0.75 + s4 * 1.0 + s5 * 0.9) * (1.0 - smoothstep(60.0, 62.0, bar));
  if (arpActive > 0.01) {
    int step = int(sixteenth) % 8;
    float arpNote = n1 + 12.0;
    if (step == 1 || step == 7) arpNote = n2 + 12.0;
    else if (step == 2 || step == 6) arpNote = n3 + 12.0;
    else if (step == 3 || step == 5) arpNote = n4 + 12.0;
    else if (step == 4) arpNote = n1 + 24.0;
    float aSnd = pluck(l16, ntof(arpNote)) * 0.15 * arpActive;
    float pan = 0.5 + 0.32 * sin(sixteenth * 0.85);
    L += aSnd * (1.0 - pan);
    R_ch += aSnd * pan;
  }

  // 4. Cathedral Bells (Act I sparse, Act IV choir, Act V ostinato)
  float bellTrig = mod(beat, 8.0);
  float bellLt = bellTrig * 0.5;
  int bellIdx = int(floor(beat / 8.0)) % 4;
  float bNote = (bellIdx == 0) ? 74.0 : (bellIdx == 1 ? 81.0 : (bellIdx == 2 ? 77.0 : 76.0));
  if (s4 > 0.01) {
    bellLt = mod(beat, 2.0) * 0.5;
    int bi4 = int(floor(beat / 2.0)) % 4;
    bNote = (bi4 == 0) ? n3 + 24.0 : (bi4 == 1 ? n4 + 12.0 : (bi4 == 2 ? n2 + 24.0 : n1 + 24.0));
  }
  float bellGain = s1 * 0.14 + s2 * 0.08 + s4 * 0.16 + s5 * 0.14 + s6 * 0.10;
  float bSnd = bell(bellLt, ntof(bNote)) * bellGain;
  L += bSnd * 0.42;
  R_ch += bSnd * 0.58;

  // 5. Soaring Lead Melody (Acts III & V)
  float leadActive = s3 * smoothstep(23.5, 24.5, bar) + s5;
  if (leadActive > 0.01) {
    int mStep = int(floor(beat * 0.5)) % 8; // half-bar phrases
    float mLt = mod(beat, 2.0) * 0.5;
    float mNotes[8] = float[8](69.0, 72.0, 74.0, 72.0, 69.0, 67.0, 65.0, 64.0);
    float lf = ntof(mNotes[mStep]);
    float lEnv = smoothstep(0.0, 0.08, mLt) * exp(-min(mLt * 0.9, 40.0));
    float lSnd = leadVoice(t, mLt, lf) * lEnv * 0.16 * leadActive;
    L += lSnd * 0.54;
    R_ch += lSnd * 0.46;
  }

  // 6. Cathedral Percussion (Kick, Stone Snare, Hat)
  float dGain = s2 * 0.35 + s3 * 0.9 + s4 * 0.4 + s5 * 1.0;
  if (dGain > 0.01 && bar < 58.0) {
    // Kick on 0 and 2 (and syncopated in s3/s5)
    float kb = mod(beat, 2.0);
    float kLt = kb * 0.5;
    float kEnv = exp(-min(kLt * 12.0, 40.0));
    float kFreq = 44.0 + 95.0 * exp(-min(kLt * 32.0, 40.0));
    float kick = sin(TAU * kFreq * kLt) * kEnv * 0.38 * (s3 + s5 + s4 * 0.6);

    // Snare on beats 1 and 3
    float sb = mod(beat - 1.0, 2.0);
    float sLt = sb * 0.5;
    float sNoise = (hash(floor(t * 24000.0)) * 2.0 - 1.0) * exp(-min(sLt * 18.0, 40.0));
    float sBody = sin(TAU * 185.0 * sLt) * exp(-min(sLt * 22.0, 40.0));
    float snare = (sNoise * 0.22 + sBody * 0.14) * (s3 + s5 + s2 * 0.4);

    // 16th hat
    float hNoise = (hash(floor(t * 48000.0)) * 2.0 - 1.0) - (hash(floor(t * 48000.0) - 1.0) * 2.0 - 1.0);
    float hat = hNoise * exp(-min(l16 * 38.0, 40.0)) * 0.045 * (s2 * 0.5 + s3 + s4 * 0.7 + s5);

    L += (kick + snare * 0.9 + hat * 0.8) * dGain;
    R_ch += (kick + snare * 1.1 + hat * 1.2) * dGain;
  }

  O = vec4(clamp(L, -0.95, 0.95), clamp(R_ch, -0.95, 0.95), 0.0, 1.0);
}
