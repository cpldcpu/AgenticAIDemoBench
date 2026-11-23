#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

uint hs(uint x){ x = x * 747796405u + 2891336453u; x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u; return (x >> 22u) ^ x; }
float mf(float m){ return 440. * exp2((m - 69.) / 12.); }
float ss(float a, float b, float x){ return smoothstep(a, b, x); }
float ex(float x){ return exp(clamp(x, -80., 0.)); }
float ph(float f, int s, float u){ return fract(fract(f) * float(s) + f * u); }
float sn(float p){ return sin(6.28318 * fract(p)); }

float rsaw(float fp, float f, float cut, float q){
  float y = 0., x;
  for(int h = 1; h <= 24; h++){
    float fh = float(h) * f; if(fh > 16000. || fh > cut * 5.) break;
    x = fh / max(cut, 20.);
    y += sn(float(h) * fp) / (float(h) * sqrt((1. - x*x)*(1. - x*x) + x*x*q));
  }
  return y * .55;
}

const int CH[16] = int[16](135091878,130930471,137271595,141515309,135091878,126736167,130930084,130964013,135158438,130964142,130964400,141498925,145660203,135157801,130930471,135158317);
const int MA[11] = int[11](47761457,451980620,49284427,521753169,46171185,763418624,53004340,382778964,521749551,34646381,33);
const int MB[11] = int[11](49721386,39889293,46137386,418432493,42283053,516990981,49858609,10532237,40118315,34640997,1066);

int chN(int i, int k){ return (CH[i] >> (k * 7)) & 127; }
int mel(int i, bool b){ int v = ((b ? MB[i / 6] : MA[i / 6]) >> ((i % 6) * 5)) & 31; return v < 2 ? v : v + 52; }

void main(){
  int idx = int(gl_FragCoord.y) * 4096 + int(gl_FragCoord.x), sec = idx / 48000;
  float ts = float(idx - sec * 48000) / 48000., t = float(sec) + ts, BL = 1.92, B = t / BL;
  vec2 dry = vec2(0), wet = vec2(0);
  if(B >= 64.){ O = vec4(0); return; }
  float n0 = float(hs(uint(idx) + 977u)) * 4.6566128e-10 - 1.;
  float n1 = float(hs(uint(max(0, idx - 1)) + 977u)) * 4.6566128e-10 - 1.;
  float n2 = float(hs(uint(idx) + 2931u)) * 4.6566128e-10 - 1.;

  int barI = int(floor(B)), abs16 = int(floor(B * 16.));
  float gF = ss(0., .15, t) * (1. - ss(62.2, 63.6, B)), br = 1. - ss(43.7, 43.76, B) * (1. - ss(43.98, 44.01, B));
  float duck = 1. - ((barI >= 16 && barI < 32) || (barI >= 44 && barI < 56) ? .45 : 0.) * ex(-fract(B * 4.) * 4.56);

  // 1. PAD
  vec2 pad = vec2(0);
  float uwM = ss(31.5, 34., B) * (1. - ss(42., 44.5, B));
  float padLv = ss(0., 3., B) * (.22 + .34 * ss(14., 24., B) + .18 * ss(44., 48., B)) * (1. - .35 * uwM);
  float pCut = mix(420., 2000., ss(14., 26., B)) * (1. - .6 * uwM) * (1. - .72 * ss(55.5, 59., B));
  for(int k = 0; k < 2; k++){
    int b0 = barI - k;
    if(b0 >= 0){
      int ci = ((b0 >= 24 && b0 < 56) ? 8 : 0) + (b0 & 7);
      float age = t - float(b0) * BL, env = ss(0., .35, age) * (1. - ss(BL * .88, BL * 1.18, age));
      if(env > .001){
        vec2 pv = vec2(0);
        for(int v = 0; v < 4; v++){
          float fv = mf(float(chN(ci, v)) + 12.), dt = (float(v) - 1.5) * .0035;
          pv += vec2(rsaw(ph(fv * (1. + dt), sec, ts), fv, pCut, .65), rsaw(ph(fv * (1. - dt), sec, ts), fv, pCut, .65));
        }
        pad += (pv + vec2(sn(ph(220., sec, ts) + .03 * sn(ph(2.1, sec, ts))), sn(ph(220.44, sec, ts))) * .11) * env * .11;
      }
    }
  }
  wet += pad * padLv * duck * br; dry += pad * padLv * .28 * duck * br;

  // 2. UNIFIED 16th-STEP ENGINE: BASS + SANTOOR ARP + PERCUSSION
  float bOn = ss(7.8, 8.2, B) * (1. - ss(55.5, 56.2, B)) * mix(.62, 1., ss(15.5, 16.5, B));
  float bCut = mix(240., 850., ss(15., 20., B)) * (1. - .6 * uwM) + 380. * ss(44., 46., B);
  float aOn = ss(0., 1.2, B) * (1. - ss(61.5, 63., B));
  vec2 bs = vec2(0), arp = vec2(0), pD = vec2(0), pW = vec2(0);

  for(int k = 0; k < 3; k++){
    int st = abs16 - k, sb = st >> 4, si = st & 15; if(st < 0) continue;
    float age = t - float(st) * .12, tp = 1. - ss(.28, .35, age);
    int ci = ((sb >= 24 && sb < 56) ? 8 : 0) + (sb & 7);
    bool drp = (sb >= 16 && sb < 32) || (sb >= 44 && sb < 56);

    if(k < 2 && bOn > .001 && st >= 128 && (((drp ? 19801 : 4441) >> si) & 1) == 1){
      float fb = mf(float(chN(ci, 0)) + ((si & 7) == 6 ? 12. : 0.) + ((si == 11 && (sb & 3) == 3) ? 7. : 0.));
      bs += (sn(ph(fb, sec, ts)) * .58 + rsaw(ph(fb, sec, ts), fb, bCut * (1. + 1.4 * ex(-age * 16.)), 1.3) * .45) * ss(0., .008, age) * ex(-age * 11.) * (1. - ss(.19, .24, age));
    }

    if(aOn > .001 && ((((sb < 4 ? 2113 : sb < 8 ? 21065 : sb >= 56 ? 4369 : 60381) >> si) & 1) == 1)){
      int iT = ((si < 8 ? 607261472 : 893588016) >> ((si & 7) * 4)) & 7;
      float fs = mf(float(chN(ci, iT & 3)) + 12. * float(1 + (iT >> 2))), tone = 0., pf1 = ph(fs, sec, ts), pf2 = ph(fs + 1.1, sec, ts);
      for(int h = 1; h <= 6; h++){ if(float(h) * fs > 1e4) break; tone += (sn(float(h) * pf1) + .3 * sn(float(h) * pf2)) * ex(-age * float(h) * 2.6) / pow(float(h), 1.3); }
      float pan = .5 + .38 * sin(float(si) * 1.35);
      arp += vec2(1. - pan, pan) * tone * ss(0., .003, age) * ex(-age * (sb < 8 ? 5.2 : 8.)) * (1. - ss(.3, .36, age)) * (sb < 8 ? .2 : sb < 16 ? .24 : .19) * (sb >= 32 && sb < 44 ? .75 : 1.);
    }

    if(drp && (si & 3) == 0)
      pD += vec2(sn(44. * age + 3. * (1. - ex(-age * 38.))) * ss(0., .002, age) * ex(-age * 11.5) * tp + n0 * ex(-age * 280.) * .15) * .58;

    if(((sb >= 8 && sb < 32) || (sb >= 40 && sb < 56)) && (((18761 >> si) & 1) == 1)){
      float phB = 73.4 * ((si == 3 || si == 11) ? 1.25 : 1.) * (age + .024 * (1. - ex(-age * 22.)));
      pD += vec2((sn(phB) + .32 * sn(phB * 1.58) * ex(-age * 22.)) * ss(0., .003, age) * ex(-age * 15.) * tp + n2 * ex(-age * 180.) * .16) * (sb >= 16 ? .22 : .18);
    }

    bool snH = (drp || (sb >= 8 && sb < 16)) && (si == 4 || si == 12), rlH = (sb >= 40 && sb < 44) && ((((sb < 42 ? 4369 : sb == 42 ? 21845 : 16383) >> si) & 1) == 1);
    if(snH || rlH){
      bool rmH = snH && sb < 16;
      float sE = ss(0., .0015, age) * ex(-age * (rmH ? 32. : 16.)) * tp, nH = (n0 - .55 * n1) * sE, sc = rmH ? .26 : rlH ? .16 + .22 * ss(40., 43.5, B) : .36;
      pD += vec2(sn(195. * age * (1. + .3 * ex(-age * 40.))) * ex(-age * 26.) * .48 + nH * .68) * sc;
      pW += vec2(nH * .75, n0 * sE * .55) * sc;
    }

    if(drp || (sb >= 8 && sb < 16)){
      bool oH = (si & 3) == 2; float hE = ss(0., .001, age) * ex(-age * (oH ? 26. : 70.)) * tp, pan = .5 + .3 * ((si & 1) == 0 ? 1. : -1.);
      vec2 hS = vec2(1. - pan, pan) * ((n0 - .45 * n1) * .45 + sn(ph(3810., sec, ts)) * sn(ph(5170., sec, ts)) * .15) * hE * (oH ? .4 : .22) * (sb < 16 ? .45 : 1.);
      pD += hS * .65; pW += hS * .55;
    }
  }
  dry += (bs * bOn * .48 * duck + arp * aOn * .52 + pD) * br;
  wet += (arp * aOn * .95 + pW) * br;

  // 3. EXPRESSIVE BANSURI LEAD
  float leadG = B < 16. || B >= 62. || (B >= 42. && B < 44.) ? 0. : B < 32. ? 1. : B < 42. ? .5 : B < 56. ? 1.15 : .58;
  if(leadG > .001){
    int abs8 = int(floor(B * 8.)), actN = 0, stS = abs8, prvN = 0; bool useB = (B >= 24. && B < 56.);
    for(int j = 0; j < 8; j++){ int sI = abs8 - j; if(sI < 0) break; int v = mel(sI & 63, useB); if(v >= 2){ if(actN == 0){ actN = v; stS = sI; } else { prvN = v; break; } } else if(v == 0 && actN == 0) break; }
    if(actN >= 2){
      float age = t - float(stS) * .24, oct = useB ? 12. : 0., mC = float(actN) + oct, fc = mf(mC), fp = mf(prvN >= 2 ? float(prvN) + oct : mC);
      float pInt = fc * age + ((fp - fc) / 42.) * (1. - ex(-age * 42.)), vib = (fc * .00028) * (1. - cos(33.929 * age)) * ss(.14, .4, age), pfl = fract(pInt + vib);
      float env = ss(0., .03, age) * (mel((abs8 + 1) & 63, useB) == 0 ? (1. - ss(.67, 1., fract(B * 8.))) : 1.), uw = (B >= 32. && B < 44.) ? .55 : 1.;
      float fSig = (sn(pfl) * .72 + sn(2. * pfl) * (.18 + .06 * ss(44., 48., B)) + sn(3. * pfl) * .05) * uw * env * leadG;
      if(prvN >= 2 && age < .03) fSig += sn(fp * (age + .24)) * .75 * uw * (1. - ss(0., .03, age)) * leadG;
      float harm = 0., brass = 0.;
      if(useB && uw > .8){
        int pc = int(mC) % 12; float pfh = mf(mC - ((pc == 0 || pc == 5 || pc == 7 || pc == 10) ? 3. : 4.)) * age + vib * .75;
        harm = (sn(pfh) * .48 + sn(2. * pfh) * .12) * env * leadG * .62;
      }
      if(B >= 44. && B < 56.) brass = rsaw(fract(pInt * .5), fc * .5, 1300., .75) * env * .32;
      vec2 lLR = vec2(fSig + harm * .6 + brass * .8, fSig * .92 + harm * 1.1 + brass * 1.1);
      wet += lLR * .3 * br; dry += lLR * .21 * br;
    }
  }

  float rE = ss(13.5, 17., B) * (1. - ss(43.5, 47., B)) * (1. - .6 * uwM);
  if(rE > .001) wet += vec2(n0 + .45 * n1, n2 + .45 * n0) * .026 * rE * (.7 + .3 * sin(t * .9));
  O = vec4(dry * gF, wet * gF);
}
