#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

float GT, GB;
float ss(float a, float b, float x){ return smoothstep(a, b, x); }
float ex(float x){ return exp(clamp(x, -80., 0.)); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f *= f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 3; i++){ v += a * n2(p); p = p * 2.1 + 13.; a *= .5; } return v; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
float sdC(vec2 p, float r){ return length(p) - r; }
float sdB(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }
float sdCap(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
// carved perforations: fine round dots in a jittered grid
float perf(vec2 p, float sc){ vec2 c = floor(p * sc), f = fract(p * sc) - .5; float h = h21(c); f -= (vec2(h, fract(h * 17.)) - .5) * .3; return step(.87, h) * ss(.03, -.03, length(f) - .14); }

// ---- gunungan: leaf / mountain of life ----
float gunungan(vec2 p){
  float t = clamp((p.y + .56) / 1.12, 0., 1.);
  float w = .42 * pow(1. - t, .72) * (.55 + .45 * pow(t, .40));
  w *= 1. - .10 * ex(-pow((t - .46) * 5., 2.));
  float serr = .013 * sin(t * 100. + 1.) + .005 * sin(t * 213.);
  w += serr * ss(.05, .26, t) * (1. - ss(.86, 1., t));
  float d = abs(p.x) - w;
  d = max(d, max(-p.y - .56, p.y - .56));
  return d;
}
float gununganCut(vec2 p){
  float trunk = sdB(p - vec2(0., -.10), vec2(.018, .22));
  float br = sdCap(p, vec2(0., .02), vec2(-.13, .16), .012);
  br = min(br, sdCap(p, vec2(0., .02), vec2(.13, .16), .012));
  br = min(br, sdCap(p, vec2(0., .12), vec2(-.09, .25), .010));
  br = min(br, sdCap(p, vec2(0., .12), vec2(.09, .25), .010));
  br = min(br, sdCap(p, vec2(0., .18), vec2(0., .30), .009));
  float fol = sdC(p - vec2(-.14, .19), .050);
  fol = min(fol, sdC(p - vec2(.14, .19), .050));
  fol = min(fol, sdC(p - vec2(-.09, .27), .044));
  fol = min(fol, sdC(p - vec2(.09, .27), .044));
  fol = min(fol, sdC(p - vec2(0., .31), .048));
  fol = min(fol, sdC(p - vec2(-.045, .22), .038));
  fol = min(fol, sdC(p - vec2(.045, .22), .038));
  float tree = smin(trunk, smin(br, fol, .022), .022);
  // candi bentar split gate at base
  vec2 g = p - vec2(0., -.37);
  float gate = max(sdB(g, vec2(.068, .095)), -sdC(g - vec2(0., .01), .046));
  gate = max(gate, g.y - .095 + abs(g.x) * 1.3);
  gate = min(gate, sdB(g - vec2(0., -.02), vec2(.012, .07)));
  float kala = sdC(g - vec2(0., .115), .022);
  float cut = min(tree, min(gate, kala));
  // wing flares
  cut = min(cut, sdCap(p, vec2(-.22, -.16), vec2(-.34, .02), .014));
  cut = min(cut, sdCap(p, vec2(.22, -.16), vec2(.34, .02), .014));
  cut = min(cut, sdCap(p, vec2(-.26, -.06), vec2(-.33, .10), .010));
  cut = min(cut, sdCap(p, vec2(.26, -.06), vec2(.33, .10), .010));
  return cut;
}

// ---- wayang figure, profile facing +x. kind 0 hero, 1 demon ----
float figure(vec2 p, float kind, float armF, float armB, float lean, float gait){
  float dm = kind;
  p.x += lean * (p.y + .3);
  vec2 h = p - vec2(0., .36);
  float skull = length(h * vec2(1., .92)) - mix(.075, .10, dm);
  vec2 np = vec2(mix(.19, .15, dm), mix(-.03, -.02, dm));
  float nose = smin(sdCap(h, vec2(.05, 0.), np, mix(.014, .026, dm)), sdC(h - np, mix(.008, .016, dm)), .01);
  float jaw = sdCap(h, vec2(.03, -.05), vec2(.07, -.07), mix(.012, .02, dm));
  float head = smin(skull, smin(nose, jaw, .015), .02);
  float crown;
  if(dm < .5){
    vec2 cp = h - vec2(-.03, .15);
    crown = max(length(cp * vec2(1.5, .85)) - .11, cp.y - .13 + abs(cp.x) * 1.1);
    crown = smin(crown, sdC(h - vec2(.055, .09), .028), .012);
    crown = smin(crown, sdCap(h, vec2(-.06, .04), vec2(-.10, .12), .02), .012);
  } else {
    float a = atan(h.y, h.x);
    crown = length(h) - (.115 + .045 * abs(sin(a * 5. + .5)));
    head = smin(head, sdCap(h, vec2(.085, -.055), vec2(.115, -.13), .013), .006);
    head = smin(head, sdCap(h, vec2(.05, -.055), vec2(.065, -.12), .011), .006);
  }
  head = smin(head, crown, .015);
  float neck = sdCap(p, vec2(0., .28), vec2(-.01, .18), mix(.022, .035, dm));
  float torso = sdCap(p, vec2(-.01, .18), vec2(-.02, -.04), mix(.045, .075, dm));
  float belly = length((p - vec2(mix(-.02, .05, dm), -.02)) * vec2(1., .9)) - mix(.045, .10, dm);
  float body = smin(neck, smin(torso, belly, .035), .025);
  float sy = clamp((p.y + .06) / -.24, 0., 1.);
  float skW = mix(.085, .13, dm) + .07 * sy;
  float skirt = max(abs(p.x + .02) - skW, max(-.30 - p.y, p.y + .06));
  float legs = sdCap(p, vec2(-.05, -.30), vec2(-.06 + gait * .05, -.46), mix(.02, .03, dm));
  legs = min(legs, sdCap(p, vec2(.03, -.30), vec2(.05 - gait * .05, -.46), mix(.02, .03, dm)));
  legs = min(legs, sdB(p - vec2(-.06 + gait * .05, -.47), vec2(.035, .012)));
  legs = min(legs, sdB(p - vec2(.05 - gait * .05, -.47), vec2(.035, .012)));
  body = smin(body, smin(skirt, legs, .02), .02);
  vec2 sh = vec2(0., .16);
  vec2 eF = sh + vec2(cos(armF), sin(armF)) * .15;
  vec2 hF = eF + vec2(cos(armF - .6), sin(armF - .6)) * .14;
  float aF = smin(sdCap(p, sh, eF, mix(.016, .026, dm)), sdCap(p, eF, hF, mix(.012, .022, dm)), .01);
  aF = smin(aF, sdC(hF, mix(.016, .026, dm)), .008);
  vec2 eB = sh + vec2(cos(armB), sin(armB)) * .14;
  vec2 hB = eB + vec2(cos(armB + .7), sin(armB + .7)) * .13;
  float aB = smin(sdCap(p, sh - vec2(.025, 0.), eB - vec2(.025, 0.), mix(.014, .024, dm)), sdCap(p, eB - vec2(.025, 0.), hB - vec2(.025, 0.), mix(.011, .02, dm)), .01);
  float d = smin(body, smin(head, smin(aF, aB, .015), .02), .02);
  if(dm > .5){
    vec2 cb = hF + vec2(cos(armF + 1.3), sin(armF + 1.3)) * .30;
    d = smin(d, sdCap(p, hF, cb, .032), .012);
    d = smin(d, sdC(cb, .06), .012);
  }
  return d;
}
float eye(vec2 p, float kind){
  if(kind < .5) return sdB((p - vec2(.045, .375)) * rot(-.25), vec2(.020, .007));
  return sdC(p - vec2(.05, .385), .028);
}

// ---- shadow screen composite ----
vec3 shadowScene(vec2 uv, float B){
  float flick = .82 + .18 * fbm(vec2(GT * 3.1, GT * 1.7)) + .06 * sin(GT * 17.);
  float violent = ss(20., 24., B) * (1. - ss(46., 49., B));
  flick *= 1. + violent * .5 * (n2(vec2(GT * 9., 3.)) - .5);
  float lampDie = 1. - ss(58., 62., B);
  vec2 lampP = vec2(.0, .14) + vec2(.02 * sin(GT * 2.3), .015 * cos(GT * 1.9));
  float lampI = flick * lampDie;
  float ld = length((uv - lampP) * vec2(1., 1.15));
  float glow = lampI * (1.25 / (1. + 3.2 * ld * ld) + .55 * ex(-ld * 3.5) + .14 * ex(-ld * 1.1));
  vec3 cloth = vec3(1., .80, .52) * (.028 + glow);
  cloth *= .95 + .05 * n2(uv * vec2(260., 150.));
  cloth *= .96 + .04 * fbm(uv * 3. + 7.);
  float dawn = ss(56.5, 60.5, B);
  vec3 dawnCol = vec3(1., .86, .62) * (1.0 + .5 * ss(-.9, .9, uv.y));
  dawnCol += vec3(1., .55, .25) * 1.3 * ex(-length(uv - vec2(.2, .78)) * 1.7);
  dawnCol += vec3(1., .72, .5) * .35 * ex(-abs(uv.y - .72) * 3.);
  cloth = mix(cloth, dawnCol, dawn);

  float L = 1.0;
  // gunungan
  float gRise = ss(1., 4., B);
  float gSide = ss(8., 10.5, B) * (1. - ss(49., 52., B));
  float gBack = ss(49., 52., B);
  vec2 gPos = vec2(mix(0., -1.02, gSide), mix(-1.45, -.20, gRise));
  gPos.x = mix(gPos.x, 0., gBack);
  float gDist = .10;
  float gMag = L / (L - gDist);
  vec2 gp = (uv - gPos) / (gMag * 1.02);
  float gD = gunungan(gp);
  float gPen = .0012 + gDist * .012;
  float gSh = ss(gPen, -gPen, gD);
  float gLight = (ss(.006, -.006, gununganCut(gp)) * .85 + perf(gp, 64.) * .3) * ss(.01, -.02, gD);
  gSh *= 1. - gLight * .9;
  gSh *= 1. - .72 * ss(32., 34., B) * (1. - ss(46., 48., B));
  // hero
  float hIn = ss(9., 13., B);
  float hOut = 1. - ss(60., 63., B);
  float hBattle = ss(32., 35., B) * (1. - ss(45., 47., B));
  float hX = mix(-2.4, -.50, hIn) + .05 * hBattle - .45 * ss(49., 52., B);
  float hBow = ss(16., 17.5, B) * (1. - ss(18.5, 20., B)) + ss(50., 51.5, B) * (1. - ss(53., 54.5, B));
  float hLean = -.12 * hBow + .04 * sin(GT * 1.3) - .08 * hBattle;
  float hGait = sin(GT * 4.) * ss(9., 13., B) * (1. - ss(13., 14., B));
  float hArmF = -.5 + .3 * sin(GT * 1.1) - 1.3 * hBattle;
  float hArmB = 2.6 + .2 * sin(GT * 1.4);
  float hDist = .10 + .15 * hBattle;
  float hMag = L / (L - hDist);
  vec2 hp = (uv - vec2(hX, -.30 + .012 * sin(GT * 4.))) / (hMag * .98);
  hp *= rot(hLean * .3);
  float hD = figure(hp, 0., hArmF, hArmB, hLean, hGait);
  float hPen = .0014 + hDist * .014;
  float hSh = ss(hPen, -hPen, hD) * hIn * hOut;
  float hLight = (perf(hp, 70.) * .4 + ss(.004, -.004, eye(hp, 0.)) * .9) * ss(.01, -.02, hD);
  hSh *= 1. - hLight * .85;
  // demon
  float dIn = ss(21., 25., B);
  float dFall = ss(44., 47.5, B);
  float dBattle = ss(33., 36., B) * (1. - ss(44., 46., B));
  float dX = mix(2.5, .58, dIn);
  dX = mix(dX, .15, dBattle);
  dX = mix(dX, .25, dFall);
  float dY = mix(-.28, -.72, dFall);
  float dSwell = ss(26., 30., B) * (1. - ss(31., 34., B));
  float dDist = .10 + .5 * dSwell + .15 * dBattle;
  float dMag = L / (L - dDist);
  vec2 dp = (uv - vec2(dX, dY)) / (dMag * 1.02);
  dp *= rot(dFall * 1.4);
  float dArmF = -.3 + .5 * sin(GT * 2.) + (-1.8 + 1.6 * sin(GT * 5.)) * dBattle;
  float dArmB = 2.9 + .3 * sin(GT * 1.7);
  float dD = figure(dp, 1., dArmF, dArmB, .06 * sin(GT * 1.5) - .1 * dBattle, sin(GT * 3.) * dIn * (1. - dFall));
  float dPen = .0016 + dDist * .016;
  float dSh = ss(dPen, -dPen, dD) * dIn;
  float dLight = (perf(dp, 60.) * .35 + ss(.004, -.004, eye(dp, 1.)) * .9) * ss(.01, -.02, dD);
  dSh *= 1. - dLight * .85;
  // flying arrow (the hero's shot)
  float arrowOn = ss(36., 36.2, B) * (1. - ss(37.8, 38.2, B));
  float ap = clamp((B - 36.) / 1.6, 0., 1.);
  vec2 aPos = mix(vec2(hX + .30, -.05), vec2(dX - .12, -.05), ap);
  float arrow = min(sdCap(uv, aPos - vec2(.15, 0.), aPos, .011), sdCap(uv, aPos, aPos + vec2(.05, .02), .005));
  arrow = min(arrow, sdCap(uv, aPos - vec2(.13, 0.), aPos - vec2(.16, .02), .003));
  float aSh = ss(.004, -.004, arrow) * arrowOn;
  // control rods (tuding) silhouettes
  float rods = sdCap(uv, vec2(hX, -.55), vec2(hX - .03, -.92), .006);
  rods = min(rods, sdCap(uv, vec2(hX + .20, -.12), vec2(hX + .34, -.92), .005));
  float hRodSh = ss(.003, -.003, rods) * hIn * hOut;
  float drods = sdCap(uv, vec2(dX, -.55), vec2(dX + .03, -.92), .006);
  drods = min(drods, sdCap(uv, vec2(dX + .16, -.08), vec2(dX + .30, -.92), .005));
  float dRodSh = ss(.003, -.003, drods) * dIn * (1. - dFall);

  float sh = max(max(gSh, max(hSh, dSh)), max(aSh, max(hRodSh, dRodSh)));
  sh *= 1. - dawn * .62;
  vec3 shadowCol = mix(vec3(.018, .011, .007) * (.3 + .7 * glow), vec3(.30, .18, .09), dawn);
  vec3 col = mix(cloth, shadowCol, sh * .97);
  col += vec3(.55, .32, .12) * (gSh * (1. - gSh) + hSh * (1. - hSh) + dSh * (1. - dSh)) * .02 * lampI;

  // banana log (debog)
  float logD = abs(uv.y + .82) - .055;
  float logM = ss(.015, -.015, logD) * ss(-1.6, -1.48, uv.x) * ss(1.6, 1.48, uv.x);
  vec3 logCol = vec3(.15, .095, .05) * (.55 + .45 * n2(uv * vec2(50., 9.))) * (.4 + .6 * glow);
  col = mix(col, logCol, logM * .94);
  // carved wood frame
  float fr = max(abs(uv.x) - 1.56, abs(uv.y) - .87);
  vec3 wood = vec3(.11, .06, .032) * (.6 + .4 * n2(uv * 30.));
  col = mix(col, wood, ss(-.01, .05, fr));
  col = mix(col, vec3(.02, .012, .008), ss(.05, .22, fr));
  return col;
}

// ---- shared metal shading ----
vec3 metal(vec3 n, vec3 alb, vec3 L){
  float df = max(dot(n, L), 0.);
  float sp = pow(max(dot(n, normalize(L + vec3(0, 0, 1))), 0.), 48.);
  return alb * (.22 + .85 * df) + vec3(1., .92, .7) * sp * 1.1 + alb * pow(1. - max(n.z, 0.), 3.) * .4;
}
// ---- the blencong (oil lamp), close ----
vec3 lampScene(vec2 uv, float B){
  vec2 p = uv * (1. + .3 * ss(0., 4., B)); p.y += .10;
  vec3 L = normalize(vec3(0., .8, .6));
  float flick = .8 + .2 * fbm(vec2(GT * 4., GT * 2.)) + .08 * sin(GT * 23.);
  vec2 fp = vec2(0., .30);
  vec3 col = vec3(.012, .008, .005);
  col += vec3(.5, .27, .1) * flick * .4 / (1. + 3. * dot(p - fp, p - fp));
  vec2 bp = p - vec2(0., -.02);
  float bowl = length(bp * vec2(1., .62)) - .22;
  float lamp = min(min(bowl, sdB(p - vec2(0., -.30), vec2(.03, .16))), sdB(p - vec2(0., -.46), vec2(.14, .03)));
  lamp = min(lamp, sdCap(p, vec2(.18, -.02), vec2(.30, .07), .03));
  float lm = ss(.002, -.002, lamp);
  vec3 lc = metal(normalize(vec3(bp * vec2(1., .62) * 1.5, .4)), vec3(.48, .32, .13), L) * (.6 + .4 * flick);
  lc += vec3(1., .6, .25) * flick * .5 * ss(.1, -.05, bowl) * ss(0., .15, bp.y);
  col = mix(col, lc, lm);
  vec2 fq = p - fp; fq.x += .02 * sin(GT * 13. + p.y * 8.);
  float fl = length(fq * vec2(1.6, .75)) - .09 - .025 * fbm(p * 9. + vec2(0., -GT * 4.));
  float fm = ss(.003, -.003, fl);
  vec3 flameCol = mix(vec3(1., .45, .08), vec3(1., .95, .75), ss(.05, -.02, fl));
  flameCol = mix(vec3(.3, .5, 1.), flameCol, ss(-.07, -.02, fq.y));
  col += flameCol * fm * flick * 2.8;
  col += vec3(1., .6, .2) * flick * .5 * ex(-length(fq * vec2(1., .7)) * 3.);
  return col;
}

// ---- painted leather colour for the puppet side ----
float lace(vec2 p){ vec2 c = floor(p * 52.), f = fract(p * 52.) - .5; float h = h21(c); f -= (vec2(h, fract(h * 13.)) - .5) * .25; return step(.55, h) * ss(.03, -.03, length(f) - .18); }
vec3 leather(vec2 lp, float kind){
  vec3 gold = vec3(.92, .58, .10);
  float head = ss(.24, .30, lp.y);
  float skirt = ss(-.04, -.10, lp.y) * (1. - ss(-.28, -.32, lp.y));
  vec3 c = mix(gold, vec3(.95, .78, .30), head * .4);
  c = mix(c, kind < .5 ? vec3(.62, .08, .05) : vec3(.30, .08, .40), skirt);
  float kaw = ss(.30, .20, length(fract(lp * 40.) - .5));
  c = mix(c, c * .4 + vec3(.15, .10, .05), skirt * kaw * .8);
  c *= .30 + .95 * ss(-.5, .6, lp.x * .5 + lp.y * .85);
  c += vec3(1., .9, .55) * pow(max(0., .5 - length(lp - vec2(-.10, .32)) * 1.8), 3.) * .9;
  c += vec3(1., .55, .22) * .38;
  return c;
}
vec4 puppetColor(vec2 uv, vec2 pos, float sc, float kind, float armF, float armB, float lean, float gait){
  vec2 lp = (uv - pos) / sc;
  lp *= rot(lean * .3);
  float d = kind > 1.5 ? gunungan(lp) : figure(lp, kind, armF, armB, lean, gait);
  float cov = ss(.002, -.002, d);
  if(cov < .003) return vec4(0);
  vec3 c = leather(lp, kind);
  c = mix(c, vec3(1., .62, .22) * 1.7, lace(lp) * .9);
  if(kind > 1.5) c = mix(c, vec3(1., .85, .55) * 1.6, ss(.004, -.004, gununganCut(lp)) * .9);
  c = mix(c, vec3(1., .9, .6), ss(.003, -.003, eye(lp, kind)) * .85);
  c += vec3(1., .5, .18) * cov * (1. - cov) * 2.0;
  return vec4(c, cov);
}
// ---- the dalang's side: painted puppets in lamplight ----
vec3 puppetSide(vec2 uv, float B){
  float cam = ss(37.5, 45.5, B);
  vec2 p = uv + vec2(.12 * sin(cam * 2.5), .03 * cam);
  float flick = .8 + .2 * fbm(vec2(GT * 3., GT * 1.5));
  vec2 lampP = vec2(-1.15, .55);
  float ld = length(p - lampP);
  vec3 col = vec3(.10, .06, .028) * (.3 + .8 / (1. + 2. * ld * ld)) * flick;
  // visible lamp flame (teardrop) on a small bronze lamp
  vec2 fq = p - lampP; fq.x += .02 * sin(GT * 11.);
  float fl = length(fq * vec2(1.6, .75)) - .075 - .02 * fbm(p * 9. - GT * 4.);
  fl = max(fl, fq.y - .10 + abs(fq.x) * 1.3);
  vec3 fcol = mix(vec3(1., .45, .08), vec3(1., .95, .7), ss(.05, -.02, fl));
  col += fcol * ss(.003, -.003, fl) * flick * 2.6;
  col = mix(col, vec3(.4, .27, .12) * flick, ss(.002, -.002, length((p - lampP + vec2(0., .12)) * vec2(1., .6)) - .06));
  col += vec3(1., .6, .2) * flick * .8 * ex(-ld * 3.);
  col = mix(col, vec3(.18, .11, .06) * (.5 + .5 * n2(p * vec2(40., 8.))), ss(.002, -.002, abs(p.y + .82) - .06) * .9);
  float fight = ss(38., 40., B) * (1. - ss(44., 45.5, B));
  vec4 g = puppetColor(p, vec2(-1.25, -.28), 1.0, 2., 0., 0., 0., 0.);
  vec4 h = puppetColor(p, vec2(-.30 + .12 * fight, -.30), .95, 0., -.6 - 1.2 * fight, 2.6, -.12 * fight, 0.);
  vec4 d = puppetColor(p, vec2(.62 - .45 * fight, -.28), 1.05, 1., -1.6 + 1.5 * sin(GT * 5.) * fight, 2.9, .05 - .1 * fight, 0.);
  col = mix(col, g.rgb, g.a * .97);
  col = mix(col, h.rgb, h.a * .97);
  col = mix(col, d.rgb, d.a * .97);
  float aOn = ss(43., 43.2, B) * (1. - ss(44.2, 44.6, B));
  vec2 aP = mix(vec2(-.1, -.05), vec2(.5, -.05), clamp((B - 43.) / 1.1, 0., 1.));
  col = mix(col, vec3(.9, .7, .3), ss(.003, -.003, sdCap(p, aP - vec2(.12, 0.), aP, .008)) * aOn);
  col += vec3(1., .7, .3) * ex(-fract(B * 4.) * 5.) * ss(44., 44.3, B) * (1. - ss(44.6, 45., B)) * .6 * ex(-length(p - vec2(.5, -.1)) * 3.);
  float rod = min(sdCap(p, vec2(-.35, -.45), vec2(-.33, -.82), .012), sdCap(p, vec2(.65, -.45), vec2(.68, -.82), .012));
  col = mix(col, vec3(.3, .2, .1), ss(.002, -.002, rod) * .85);
  return col;
}

// ---- gong ageng struck on the beat ----
vec3 gongScene(vec2 uv, float B){
  vec2 p = uv * 1.05; p.y += .03;
  vec3 L = normalize(vec3(-.45, .55, .7));
  vec3 col = vec3(.03, .02, .012) * (1. + .5 * ex(-length(p - vec2(-.3, .3)) * 1.2));
  // carved red-and-gold rancakan frame
  float frame = min(min(sdB(p - vec2(-.78, -.05), vec2(.07, .85)), sdB(p - vec2(.78, -.05), vec2(.07, .85))), sdB(p - vec2(0., .84), vec2(.86, .08)));
  frame = min(frame, min(sdB(p - vec2(-.78, -.88), vec2(.16, .05)), sdB(p - vec2(.78, -.88), vec2(.16, .05))));
  float fm = ss(.002, -.002, frame);
  vec3 wood = vec3(.38, .10, .05) * (.6 + .4 * n2(p * 22.));
  wood += vec3(.8, .58, .18) * ss(.55, .75, fract(p.y * 6. + sin(p.x * 12.) * .4)) * .3;
  col = mix(col, wood, fm);
  float r = length(p);
  float gm = ss(.002, -.002, r - .60);
  float bossM = ss(.20, .12, r);
  vec3 n = normalize(vec3(p * (.15 + 1.8 * bossM), 1.));
  vec3 alb = vec3(.50, .34, .14) * (.9 + .1 * sin(r * 90.));
  vec3 gc = metal(n, alb, L);
  gc *= 1. - .3 * ss(.02, .0, abs(r - .20));
  gc += vec3(1., .85, .5) * bossM * .15;
  gc *= .7 + .3 * ss(.60, .45, r);
  float strike = ex(-fract(B * 4.) * 6.) * ss(39.5, 40.5, B) * (1. - ss(42.5, 43.5, B));
  gc += vec3(1., .8, .4) * strike * .5 * ss(.25, .0, abs(r - .18));
  col = mix(col, gc, gm);
  float cord = min(sdCap(p, vec2(-.15, .60), vec2(-.10, .84), .012), sdCap(p, vec2(.15, .60), vec2(.10, .84), .012));
  col = mix(col, vec3(.3, .2, .1), ss(.002, -.002, cord));
  vec2 mp = p - vec2(.05 + .30 * (1. - strike), -.05 - .25 * (1. - strike));
  col = mix(col, metal(normalize(vec3(mp * 1.5, 1.)), vec3(.55, .38, .18), L), ss(.002, -.002, sdC(mp, .085)));
  col = mix(col, vec3(.35, .22, .1), ss(.002, -.002, sdCap(mp, vec2(0., 0.), vec2(.35, -.30), .022)) * .9);
  col += vec3(1., .7, .3) * strike * .3 * ex(-r * 2.);
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * R.xy) / R.y * 1.8;
  GT = R.z; GB = GT / 2.;
  float B = GB;
  vec3 col = shadowScene(uv, B);
  float lampW = 1. - ss(2.0, 3.2, B);
  float pupW = ss(37.5, 38.5, B) * (1. - ss(39.5, 40.2, B)) + ss(42.8, 43.5, B) * (1. - ss(45.5, 46.5, B));
  float gongW = ss(39.5, 40.2, B) * (1. - ss(42.8, 43.5, B));
  if(lampW > .001) col = mix(col, lampScene(uv, B), lampW);
  if(pupW > .001) col = mix(col, puppetSide(uv, B), pupW);
  if(gongW > .001) col = mix(col, gongScene(uv, B), gongW);
  float wipe = ss(37.6, 38.1, B) * (1. - ss(38.1, 38.7, B)) + ss(45.6, 46.1, B) * (1. - ss(46.1, 46.7, B));
  col += vec3(1., .9, .7) * wipe * .22;
  col = 1. - exp(-col * 1.7);
  O = vec4(col, 0.);
}
