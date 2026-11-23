#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

float GT, GWL, GMAT;
float ss(float a, float b, float x){ return smoothstep(a, b, x); }
float ex(float x){ return exp(clamp(x, -80., 0.)); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f *= f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm2(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 3; i++){ v += a * n2(p); p = p * 2.1 + 13.; a *= .5; } return v; }
vec3 fd(vec3 p){ vec2 a = abs(p.xz), q = vec2(max(a.x, a.y), min(a.x, a.y)); return vec3(q, 5.6 + p.y * .44 - q.x); }

float map(vec3 p){
  vec3 g = fd(p); vec2 q = g.xy; float dx = g.z, TH = 2.4, BW = 3.2;
  float ti = floor(p.y / TH), ty = p.y - ti * TH, cy = q.y + mod(ti, 2.) * 1.6;
  cy -= (floor(cy / BW) + .5) * BW;
  float dBk = max(dx, -max(min(max(abs(cy) - .32, abs(ty - 1.42) - .46), length(vec2(cy, ty - 1.68)) - .32), dx + .38) * step(p.y, 14.4));
  float dLd = max(dx - 1.28, abs(mod(p.y + 1.2, TH) - 1.2) - .25), dSt = 1e4;
  for(int k = 0; k < 2; k++){
    float tK = ti + float(k) * (ty < 1.2 ? -1. : 1.), y0 = tK * TH, tY = clamp(p.y - y0, .18, 2.22), by = abs(mod(q.y + mod(tK, 2.) * 1.6, BW) - 1.6);
    dSt = min(dSt, max(dx - 1.05, max(((tY - by) * .7071 - .12 - .2 * abs(fract((by + tY) * 3.5355) - .5)) * .7071, abs(p.y - y0 - 1.2) - 1.02)));
  }
  float dPav = 1e4;
  if(p.y > 13.8){
    float pH = abs(p.y - 17.) - 2.6, ay = abs(mod(q.y, BW) - 1.6);
    dPav = min(min(max(max(abs(dx - .25) - .42, pH), -max(ay - .95, p.y - 16.7 + ay * .68)), max(abs(p.y - 19.5) - .42, dx - 1.35)), max(dx + 2.5, pH));
    vec2 ad = abs(abs(p.xz) - 14.2);
    if(max(ad.x, ad.y) < 3.)
      dPav = min(dPav, min(max(max(ad.x, ad.y) - 1.3, abs(p.y - 20.4) - .6), length(vec3(ad.x, (p.y - 22.2) * 1.15, ad.y)) - 1.25));
  }
  float dS = min(p.y + 4.2, min(max(min(min(dBk, dLd), dSt), p.y - 14.4), dPav));
  float dL = (ti >= 0. && ti <= 5.) ? length(vec3(q.x - (5.6 + (ti * TH + 1.2) * .44 + .06), p.y - (ti * TH + 1.2), cy)) - .08 : 1e4;
  float dD = 1e4; vec3 pc = p - vec3(0, GWL, 0);
  if(length(pc) < 1.3){
    float bw = max(abs(length(vec2(length(pc.xz), pc.y * 1.4)) - .4) - .05, pc.y - .12), fl = length((pc - vec3(0, .24, 0)) * vec3(1.5, .7, 1.5)) - .08;
    dD = min(bw, fl); if(fl < bw) dL = min(dL, fl);
  }
  float d = min(min(dS, dD), dL); GMAT = d == dL ? 2. : d == dD ? 1. : 0.; return d;
}

vec3 sky(vec3 rd, float T, float B, float fl){
  float y = sqrt(max(rd.y, .01)), dusk = 1. - ss(6., 14., B), storm = ss(13., 18., B) * (1. - ss(42., 46., B)), clr = ss(44., 47., B);
  vec3 col = mix(mix(vec3(.07, .1, .24), vec3(.01, .02, .06), y), mix(vec3(.95, .42, .14), vec3(.06, .09, .22), y), dusk);
  if(storm > .01){
    vec2 cuv = rd.xz / (max(rd.y, .01) + .3) * 1.5 + T * vec2(.09, .04); float cl = fbm2(cuv);
    col = mix(col, mix(vec3(.02, .03, .05), vec3(.14, .21, .32), ss(.3, .8, cl) * (.5 + .5 * fbm2(cuv * 2. - T * .05))) + vec3(.75, .9, 1) * fl * pow(cl, 1.4) * 3., storm * ss(.02, .22, rd.y));
  }
  float sV = clamp(ss(6., 14., B) * (1. - storm * .95) + clr, 0., 1.);
  if(sV > .01 && rd.y > 0.){
    vec2 uvS = rd.xz / (rd.y + .4) * 68.; float h = h21(floor(uvS) * vec2(17.3, 31.7));
    if(h > .92) col += mix(vec3(.9, .9, 1), vec3(1, .9, .7), fract(h * 37.)) * ss(.09, 0., length(fract(uvS) - .5 - (vec2(h, fract(h * 17.)) - .5) * .5)) * sV * (.75 + .25 * sin(T * 3. + h * 60.)) * (2.2 + 2.4 * clr);
    if(clr > .01){ float mw = fbm2(rd.xz / (rd.y + .45) * 3.); col += mix(vec3(.1, .2, .4), vec3(.3, .4, .6), mw) * exp(-pow((rd.x - rd.z) * 1.5, 2.)) * ss(.04, .32, rd.y) * (.5 + mw) * clr * 2.2; }
  }
  return col;
}

vec3 shade(vec3 p, vec3 rd, vec3 n, float mat, float B, float fl){
  float wet = ss(9., 18., B);
  if(mat > 1.5){
    float ti = clamp(floor(p.y / 2.4), 0., 5.), ig = 7.2 + ti * 1.15 + h21(floor(p.xz * .3)) * .7;
    return vec3(3.2, 1.55, .45) * (length(p.xz) < 1.3 ? 1. : ss(ig, ig + .45, B) * (.92 + .08 * sin(GT * 11. + p.x * 3.))) + .02;
  }
  if(mat > .5) return vec3(.8, .5, .2) * (.35 + .65 * max(n.y, 0.)) + vec3(1.3, .8, .3) * pow(1. - max(dot(-rd, n), 0.), 4.);

  vec3 g = fd(p); vec2 q = g.xy; float dx = g.z, dusk = 1. - ss(6., 14., B), py = p.y * 2.2;
  float blk = ss(.02, .07, min(abs(fract(py) - .5), abs(fract(q.y * 1.1 + floor(py) * .5) - .5)));
  vec3 alb = mix(vec3(.6, .33, .2), vec3(.8, .5, .28), n2(p.xz * 4. + p.y * 3.)) * (.76 + .24 * blk) * mix(1., .54, wet);
  vec3 lD = normalize(mix(vec3(.4, .9, .3), vec3(.9, .3, .2), dusk)), skyC = mix(vec3(.16, .24, .4), vec3(1.5, .7, .2), dusk) + vec3(1.1, 1.3, 1.7) * fl;
  float pAO = ss(-.15, 1.05, dx), ao = mix(.22, 1., pAO * (.45 + .55 * ss(.22, .65, mod(p.y, 2.4)))), sM = mix(1., ss(3.5, 12.5, p.y) * (.35 + .65 * pAO), dusk);
  vec3 col = alb * ao * (mix(vec3(.02, .04, .08), vec3(.03, .04, .08), dusk) + max(dot(n, lD), 0.) * skyC * (.58 + .42 * dusk) * sM);

  float ti = clamp(round((p.y - 1.2) / 2.4), 0., 5.), ly = ti * 2.4 + 1.2, sh = mod(ti, 2.) * 1.6;
  vec3 dv = vec3(q.x, p.y, q.y) - vec3(5.6 + ly * .44 + .06, ly, (floor((q.y + sh) / 3.2) + .5) * 3.2 - sh), dvC = p - vec3(0, GWL + .24, 0);
  col += alb * (vec3(2, .9, .24) * ss(7.2 + ti * 1.15, 8. + ti * 1.15, B) / (1. + (dot(dv, dv) + .06) * 1.45) * (.7 + .5 * max(-n.x, 0.)) + vec3(1.6, .7, .2) / (1. + dot(dvC, dvC) * .35));
  col += (skyC * .5 + vec3(.35, .2, .1)) * pow(max(dot(n, normalize(lD - rd)), 0.), mix(18., 72., wet)) * mix(.1, .55, wet) * sM + vec3(.1, .16, .24) * pow(1. - max(dot(-rd, n), 0.), 4.) * wet;

  float wF = ss(14.5, 18., B) * (1. - ss(33., 38., B));
  if(wF > .01 && p.y > GWL && p.y < 14.5){
    float flow = ss(.38, .82, n2(vec2(q.y * 4., p.y * .4 + GT * 6.))) * ss(.42, .05, abs(fract((q.y + mod(floor(p.y / 2.4), 2.) * 1.6) / 3.2) - .5));
    float tF = ss(.6, .92, n.y) * ss(.42, .85, n2(vec2(q.y * 6., p.y * 2. + GT * 9.)));
    col = mix(col, vec3(.2, .45, .6) + skyC * .3 + tF * .55, clamp(flow * .52 + tF * .45, 0., .68) * wF);
  }
  if(p.y < GWL){
    float dP = GWL - p.y, v = 0.; vec2 cq = (p.xz + p.y * .3) * .7;
    for(int i = 0; i < 3; i++){ cq = mat2(.6, -.8, .8, .6) * cq + vec2(sin(cq.y * 1.7 + GT * 1.5), cos(cq.x * 1.7 - GT * 1.3)) * .45; v += pow(abs(sin(cq.x) + cos(cq.y)) * .5, 3.2); }
    col = (col + vec3(.24, .7, .6) * clamp(v * .85, 0., 2.2) * ex(-dP * .12) * (.65 + fl * 1.6)) * exp(-dP * vec3(.14, .04, .05));
  }
  return col;
}

vec3 op(float a, float r, float y){ return vec3(cos(a) * r, y, sin(a) * r); }

void main(){
  float T = R.z, B = T / 1.92; GT = T;
  GWL = 2.4 * ss(16., 31.5, B) + 3.8 * ss(31.5, 33.2, B) - .8 * ss(43.5, 46., B);
  float fl = ss(14., 18., B) * (1. - ss(42., 46., B)) * step(.55, h21(vec2(floor(B * 2.), 7.))) * ex(-fract(B * 2.) * 13.) * (1. + .6 * sin(T * 45.));

  vec3 ro, ta; float u, a;
  if(B < 8.){ u = B / 8.; ro = mix(vec3(7.5, 16, 7.5), vec3(4.2, 6.2, 5.2), u); ta = mix(vec3(-1.5, 4.5, -1.5), vec3(0, 1.8, 0), u); }
  else if(B < 16.){ a = mix(.55, 2.25, u = (B - 8.) / 8.); ro = op(a, 4.4, mix(1.4, 3.8, u)); ta = op(a, -3.8, mix(3.2, 7.5, u)); }
  else if(B < 24.){ u = (B - 16.) / 8.; a = .5 + u * 1.2; ro = op(a, mix(5.5, 3.8, u), mix(11.2, 5., u)); ta = op(a, -4.5, mix(5., 8.5, u)); }
  else if(B < 28.){ u = (B - 24.) / 4.; a = 1.7 + u * 1.8; ro = op(a, 4.8, 8.4 + sin(u * 3.14) * 1.8); ta = op(a, -3.5, 5.2); }
  else if(B < 32.){ u = (B - 28.) / 4.; ro = mix(vec3(3.2, 11.5, 2.8), vec3(2.4, 3.4, 2.2), u); ta = mix(vec3(-2.5, 4, -2.5), vec3(-3.2, 4.8, -3.2), u); }
  else if(B < 44.){ u = (B - 32.) / 12.; a = .4 + u * 2.; float y = mix(2., 3.2, sin(u * 3.14)) + ss(.86, 1., u) * 4.; ro = op(a, 2.8, y); ta = op(a, -5.2, y + 2.2 + ss(.86, 1., u) * 3.); }
  else if(B < 50.){ u = (B - 44.) / 6.; a = -.4 + u * 1.5; ro = op(a, 4.6, 8. + u * 2.2); ta = op(a, -2., 6.2); }
  else if(B < 56.){ ro = vec3(mix(-6., 6., (B - 50.) / 6.), 16.2, -6.2); ta = vec3(0, 16.8, 8.5); }
  else { u = clamp((B - 56.) / 8., 0., 1.); ro = mix(vec3(0, 16.5, 9.5), vec3(0, 17.8, 10.8), u); ta = mix(vec3(0, 5.2, 0), vec3(0, 5.4, 0), u); }
  float foc = (B >= 50. && B < 56.) ? 28. : length(ro - ta);

  vec3 ww = normalize(ta - ro), uu = normalize(cross(vec3(0, 1, 0), ww)), vv = cross(ww, uu);
  vec2 uv = (gl_FragCoord.xy - .5 * R.xy) / R.y;
  vec3 rd = normalize(uu * uv.x + vv * uv.y + ww * 1.25), ro0 = ro, rd0 = rd;

  bool under = ro.y < GWL;
  vec3 col = vec3(0), wB = vec3(0), wF = vec3(1);
  float wBl = 0., fogD = 65., uwD = 32.;

  for(int p = min(0, int(R.x)); p < 2; p++){
    float mX = p == 0 ? 65. : 42., mat = 0., tH = .05;
    for(int i = min(0, int(R.x)); i < 96; i++){ float d = map(ro + rd * tH); mat = GMAT; if(abs(d) < .004 * (1. + tH * .25) || tH > mX) break; tH += d * .85; }
    float tW = (GWL - ro.y) / (abs(rd.y) < 1e-4 ? 1e-4 : rd.y);
    bool hW = p == 0 && tW > .02 && tW < tH && (under ? rd.y > 0. : rd.y < 0.);
    if(p == 0){ fogD = hW ? tW : tH; uwD = min(tH, hW ? tW : 32.); }
    if(hW){
      vec3 pw = ro + rd * tW; vec2 xz = pw.xz, g = xz * 1.6;
      float r = length(xz), amp = .006 + .02 * ss(15., 20., B) * (1. - ss(43., 48., B)), ring = sin(r * 6.5 - T * 5.2) * ex(-r * .25) * (.014 + .022 * ss(7.5, 9., B) * (1. - ss(16., 18., B))), rI = 0.;
      if(B > 8. && B < 44.){ float ph = fract(T * 1.8 + h21(floor(g)) * 7.), dr = length(fract(g) - .5); rI = sin((dr - ph * .6) * 34.) * ex(-abs(dr - ph * .6) * 14.) * (1. - ph) * .02 * ss(8., 15., B); }
      vec2 w = sin(xz * 2.1 + T * 1.7) * cos(xz.yx * 1.8 - T * 1.3) * amp + xz / max(r, .01) * ring + rI;
      vec3 nw = normalize(vec3(-w.x, 1, -w.y));
      if(under){
        vec3 rf = refract(rd, -nw, 1.333); wF = exp(-tW * vec3(.14, .04, .05));
        if(dot(rf, rf) > .01){ col = (sky(rf, T, B, fl) * 1.45 + vec3(.14, .4, .38) * .35) * wF; break; }
        rd = reflect(rd, -nw); ro = pw + rd * .05; wF *= .75; continue;
      }
      vec3 rl = reflect(rd, nw); float fB = mix(.08, .32, ss(43.5, 46.5, B));
      wBl = fB + (1. - fB) * pow(1. - max(dot(-rd, nw), 0.), 5.);
      wB = vec3(.01, .03, .03) + vec3(.16, .07, .02) * ex(-r * .75)
         + vec3(1.8, .9, .3) * pow(max(dot(rl, normalize(vec3(-xz.x, .24, -xz.y))), 0.), 42.) / (1. + r * r * .5) / max(1. - wBl, .2);
      ro = pw + rl * .04; rd = rl; continue;
    }
    vec3 c;
    if(tH < mX){
      vec3 hp = ro + rd * tH, n = vec3(0); vec2 e = vec2(1, -1) * .003;
      for(int i = min(0, int(R.x)); i < 4; i++){ vec3 v = i == 0 ? e.xyy : i == 1 ? e.yyx : i == 2 ? e.yxy : e.xxx; n += v * map(hp + v); }
      c = shade(hp, rd, normalize(n), mat, B, fl);
    } else c = sky(rd, T, B, fl);
    if(p == 0) col = c; else col = under ? c * wF : mix(wB, c, wBl);
    break;
  }

  if(under){
    col = mix(col, vec3(.02, .08, .09) * (.65 + fl), 1. - exp(-uwD * .055));
    for(int i = 0; i < 12; i++){
      float fi = float(i); vec3 bp = vec3(sin(fi * 2.1 + T * .4) * 3.4, mod(fi * .7 + T * 1.4, 6.2), cos(fi * 3.4 - T * .3) * 3.4) - ro0;
      float bt = dot(bp, rd0);
      if(bt > .3 && bt < uwD) col += vec3(.55, .95, .9) * ss(.065, .01, length(bp - rd0 * bt)) * .65;
    }
  }

  float vM = min(fogD, 32.), j = h21(gl_FragCoord.xy + fract(T) * 91.), sV = vM / 12., dusk = 1. - ss(6., 13., B);
  vec3 vA = vec3(0), sC = mix(vec3(.02, .04, .09), vec3(.32, .15, .05), dusk) + vec3(.32, .42, .62) * fl;
  for(int i = 0; i < 12; i++){
    vec3 pv = ro0 + rd0 * (float(i) + j) * sV, dp = pv - vec3(0, GWL + .24, 0);
    vA += sC * ss(2., -4., pv.x - pv.y * .45) * ss(-6., 0., pv.z) * ss(-2., 16., pv.y) * 1.2 + vec3(1, .5, .14) / (1. + dot(dp, dp) * 5.);
  }
  col += vA * sV * .02 * (under ? .55 : 1.);

  float rV = ss(13.5, 17., B) * (1. - ss(41., 44., B)) * (under ? 0. : 1.);
  if(rV > .01){
    vec2 ruv = uv * vec2(18, 3) + vec2(uv.y * 2., T * 8.), rf = fract(ruv) - .5;
    float rh = h21(floor(ruv) + floor(T * 12.) * 7.);
    if(rh > .8) col += vec3(.48, .64, .82) * ss(.08, 0., abs(rf.x - (rh - .9) * 2.)) * (1. - abs(rf.y) * 2.) * rV * (.26 + fl * .85);
  }
  if(!under && fogD < 64.) col = mix(col, vec3(.01, .02, .05) + vec3(.18, .08, .03) * dusk + vec3(.2, .3, .4) * fl, 1. - exp(-fogD * .012));
  O = vec4(clamp(col, 0., 10.), clamp(abs(fogD - foc) / max(foc * 1.5, 4.), 0., 1.));
}
