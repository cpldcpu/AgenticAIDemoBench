#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

uint hs(uint x){ x = x * 747796405u + 2891336453u; x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u; return (x >> 22u) ^ x; }
float mf(float m){ return 440. * exp2((m - 69.) / 12.); }
float ss(float a, float b, float x){ return smoothstep(a, b, x); }
float ex(float x){ return exp(clamp(x, -80., 0.)); }
float sn(float p){ return sin(6.2831853 * fract(p)); }
float ph2(float f, float age){ return f * age; }

// pelog-like scale, base A3
const int PL[5] = int[5](0, 1, 3, 7, 8);
float pelog(int deg){ int o = deg / 5, d = deg - o * 5; if(d < 0){ d += 5; o--; } return mf(float(57 + PL[d] + 12 * o)); }

// struck bronze bar: inharmonic partials + ombak beating pair
float bronze(float f, float age, float dec, float beat){
  float v = sn(f * age) * ex(-age * dec);
  v += .5 * sn(f * 2.76 * age) * ex(-age * dec * 1.5);
  v += .3 * sn(f * 5.4 * age) * ex(-age * dec * 2.1);
  v += .2 * sn(f * 8.9 * age) * ex(-age * dec * 2.8);
  v += .6 * sn((f + beat) * age) * ex(-age * dec * .95);
  return v * ss(0., .003, age);
}
float gong(float age, float f){
  float v = sn(f * age) * ex(-age * .40);
  v += .85 * sn((f + 1.7) * age) * ex(-age * .38);
  v += .6 * sn(f * 1.5 * age) * ex(-age * .52);
  v += .45 * sn(f * 2.1 * age) * ex(-age * .68);
  v += .3 * sn(f * 2.9 * age) * ex(-age * .85);
  v += .18 * sn(f * 4.3 * age) * ex(-age * 1.1);
  return v * ss(0., .012, age);
}
float kendang(float age, float f, float bend, float slap){
  float p = f * (age + bend * (1. - ex(-age * 30.)));
  float v = (sn(p) + .4 * sn(p * 1.58) * ex(-age * 20.)) * ss(0., .003, age) * ex(-age * 13.);
  v += slap * (sn(p * 2.1) * .3 + .5) * ex(-age * 90.);
  return v;
}

void main(){
  int idx = int(gl_FragCoord.y) * 4096 + int(gl_FragCoord.x), sec = idx / 48000;
  float ts = float(idx - sec * 48000) / 48000., t = float(sec) + ts, BL = 2., B = t / BL;
  vec2 dry = vec2(0), wet = vec2(0);
  if(B >= 64.){ O = vec4(0); return; }
  float n0 = float(hs(uint(idx) + 977u)) * 4.6566128e-10 - 1.;
  float n1 = float(hs(uint(max(0, idx - 1)) + 977u)) * 4.6566128e-10 - 1.;
  int barI = int(floor(B)), abs16 = int(floor(B * 16.)), beatI = int(floor(B * 4.));
  float gF = ss(0., .08, t) * (1. - ss(62.8, 63.9, B));

  // act dynamics
  float battle = ss(32., 34., B) * (1. - ss(46., 48., B));
  float demon = ss(20., 23., B) * (1. - ss(32., 34., B));
  float quiet = (1. - ss(7., 9., B)) + ss(48., 51., B) * (1. - ss(58., 61., B));
  float dyn = .62 + .5 * battle + .22 * demon - .30 * clamp(quiet, 0., 1.);

  // ---- colotomic gong ageng ----
  for(int k = 0; k < 4; k++){
    int gb = barI - k; if(gb < 0) continue;
    float age = t - float(gb) * BL;
    int cyc = battle > .5 ? 2 : 4;
    if((gb % cyc) == 0 && age < 8.){
      float gv = gong(age, 61.) * (gb == 0 ? 1. : .8) * (.24 + .12 * battle);
      dry += vec2(gv * .8); wet += vec2(gv);
    }
  }
  // kenong (beat 3) / kempul (beat 4)
  float colOn = ss(4., 5., B) * (1. - ss(59., 61., B));
  for(int k = 0; k < 2; k++){
    int bb = beatI - k; if(bb < 0) continue;
    float age = t - float(bb) * .5;
    int bInBar = bb & 3;
    if(bInBar == 2 && age < 1.6){
      float kv = bronze(pelog(10), age, 3.2, 4.) * .24 * colOn;
      dry += vec2(kv * .8); wet += vec2(kv);
    }
    if(bInBar == 3 && age < 1.6){
      float kv = bronze(pelog(5), age, 3.8, 3.) * .20 * colOn;
      dry += vec2(kv * .8); wet += vec2(kv);
    }
  }

  // ---- balungan / kotekan / kendang step engine ----
  const int BAL[16] = int[16](2, 3, 5, 3, 2, 1, 2, -1, 3, 5, 6, 5, 3, 2, 1, 2);
  vec2 saron = vec2(0), kot = vec2(0), shim = vec2(0), drum = vec2(0), low = vec2(0);
  float sarOn = ss(4., 6., B) * (1. - ss(58., 60., B));
  float kotOn = ss(8., 10., B) * (1. - ss(56., 58., B)) * (.55 + .6 * battle + .3 * demon);
  float dOn = ss(10., 12., B) * (1. - ss(56., 58., B));
  for(int k = 0; k < 4; k++){
    int st = abs16 - k; if(st < 0) continue;
    int sb = st >> 4, si = st & 15;
    float age = t - float(st) * .125;
    int bi = (sb >> 1) & 15;
    int note = BAL[bi]; if(note < 0) note = 2;
    // saron balungan, every 2 beats
    if((si & 7) == 0 && age < 1.2){
      float f = pelog(note + 5);
      saron += vec2(bronze(f, age, 2.0, 3.) * .28 * sarOn);
    }
    // low saron ostinato in demon act
    if(demon > .1 && (si & 3) == 0 && age < .8){
      float f = pelog(note) * .5;
      low += vec2(bronze(f, age, 3., 2.) * .22 * demon);
    }
    // kotekan interlocking 16ths (polos / sangsih)
    if(kotOn > .01 && age < .28){
      int deg = note + 5 + ((si & 1) == 0 ? 0 : 2) + ((si & 3) == 2 ? 1 : 0);
      float f = pelog(deg + 5);
      float kv = bronze(f, age, 8., 6.) * .40 * kotOn;
      float pan = (si & 1) == 0 ? .38 : .62;
      kot += vec2(kv * (1. - pan), kv * pan);
      // bright gender shimmer octave up
      shim += vec2(bronze(f * 2., age, 11., 7.) * .16 * kotOn * (.4 + battle));
      // kecrek metallic tick on the beat
      if((si & 3) == 0) shim += vec2((n0 - .5 * n1) * ex(-age * 160.) * .05 * kotOn + sn(ph2(5200., age)) * ex(-age * 90.) * .03 * kotOn);
    }
    // kendang
    if(dOn > .01 && age < .4){
      int pat = battle > .5 ? 21845 : (demon > .5 ? 17476 : 4369);
      if(((pat >> si) & 1) == 1){
        bool hi = (si & 3) != 0;
        float f = hi ? 175. : 88.;
        float dv = kendang(age, f, hi ? .012 : .025, hi ? .5 : .12) * (.34 + .22 * battle) * dOn;
        float pan = hi ? .6 : .4;
        drum += vec2(dv * (1. - pan + .3), dv * (pan + .3));
        drum += vec2(n0 * ex(-age * 220.) * (hi ? .12 : .05) * dOn);
      }
    }
  }
  dry += (saron + low + kot * .9 + shim + drum) * dyn;
  wet += (saron * .5 + low * .4 + kot + shim * 1.2 + drum * .2) * dyn;

  // ---- suling (breathy flute) in quiet acts ----
  float sOn = (1. - ss(8., 10., B)) * ss(1., 2.5, B) + ss(49., 51., B) * (1. - ss(60., 62.5, B));
  if(sOn > .01){
    int abs8 = int(floor(B * 8.));
    int note = BAL[(abs8 >> 1) & 15]; if(note < 0) note = 2;
    float age = t - float(abs8) * .25;
    float f = pelog(note + 10);
    float vib = f * .005 * (1. - cos(31.4 * age)) * ss(.1, .4, age);
    float p = fract(f * age + vib);
    float env = ss(0., .06, age) * (1. - ss(.55, .95, fract(B * 8.)));
    float fv = (sn(p) * .6 + sn(2. * p) * .14 + n0 * .05) * env * sOn * .22;
    dry += vec2(fv * .8); wet += vec2(fv * 1.1);
  }

  O = vec4(dry * gF, wet * gF);
}
