#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;
// DIE SHRINK - the picture. 140.625 BPM, a bar is 1.70667 s, a cut every 2 bars.
// Kinds of shot: 0 wafer orbit, 1 wafer approach, 2 metal stack, 3 bond wires,
// 4 clock tree over the metal stack, 5 SRAM array, 6 FinFETs, 7 wafer pull-out.
float T, BF, LT, U, G, E, M, PH, KK;
int K, SL;
vec3 RD, EC;
float sat(float x) { return clamp(x, 0., 1.); }
float h1(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float bx(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
// thin-film interference colour of an oxide of thickness t seen at cosine c
vec3 film(float t, float c) { return .5 + .5 * cos(6.283 * (t * (1.6 - .6 * c) + vec3(.1, .25, .4))); }

// interconnect layers: (height, pitch, half width, half thickness) and segment length.
// even layers run along x, odd along z. city / FinFET / SRAM
const vec4 LA[18] = vec4[18](
  vec4(.12, .25, .05, .04), vec4(.32, .25, .05, .04), vec4(.58, .5, .1, .07),
  vec4(.95, .5, .1, .07), vec4(1.5, 1.2, .26, .14), vec4(2.4, 2.4, .6, .22),
  vec4(.3, .42, .045, .3), vec4(.42, 1.6, .14, .42), vec4(-9),
  vec4(-9), vec4(-9), vec4(-9),
  vec4(.08, .3, .12, .06), vec4(.17, .3, .015, .015), vec4(.21, .6, .02, .015),
  vec4(-9), vec4(-9), vec4(-9));
const float LS[18] = float[18](1.5, 2., 3., 4., 7., 15., 1e3, 1e3, 2., 3., 6., 14., .3, 1e3, 1e3, 1e3, 1e3, 1e3);

// the die as seen from far: IO ring, SRAM blocks, logic, analog. returns oxide thickness, .w = grating
vec4 die(vec2 u) {
  vec2 f = fract(u), i = floor(u), b = floor(f * 4.);
  float r = max(abs(f.x - .5), abs(f.y - .5)), h = h1(i * 7. + b), w = 0.;
  float t = .4 + .5 * h;
  if (h < .35) w = 1., t = .7 + .3 * step(.5, fract(f.x * 64.)) * step(.5, fract(f.y * 48.));
  else if (h < .7) t += .15 * h1(floor(f * 90.) + i);
  if (fract(f.x * 4.) < .04 || fract(f.y * 4.) < .04) t = .25;
  if (r > .42) t = .3 + .4 * step(.5, fract((f.x + f.y) * 40.)) * step(r, .47);
  if (r > .485) t = 0.;
  return vec4(t, r, h, w);
}

// gold bond wires from pads on the die edge (x<0) down to fingers on the package (y=-1)
float bond(vec3 p) {
  float d = min(p.y + 1., max(p.y, p.x)), c = floor(p.z / .4), z = p.z - (c + .5) * .4,
        tr = step(.5, h1(vec2(c, 3))), x1 = 2.2 + 1.3 * tr, H = 1. + .8 * tr, w, u, f, g;
  M = p.y < -.99 ? 9. : 8.;
  u = sat((p.x + .3) / (x1 + .3));
  f = -u + H * 2.6 * sqrt(u) * (1. - u);
  g = (-(u + .01) + H * 2.6 * sqrt(u + .01) * (.99 - u) - f) / (.01 * (x1 + .3));
  w = abs(p.y - f) / sqrt(1. + min(g * g, 80.));
  if (p.x < -.3) w = length(vec2(p.x + .3, max(p.y - .05, 0.)));
  if (p.x > x1) w = length(vec2(p.x - x1, p.y + 1.));
  w = min(length(vec3(w, 0, z)) - .045, length(vec3(p.x + .3, p.y, z * .8)) - .09);
  G = (sign(RD.z) * .2 - z) / RD.z + .01;
  if (w < d) d = w, M = 10., E = exp(-abs(fract(u - T * .7 + tr * .5) - .5) * 30.) * PH, EC = vec3(1, .6, .2);
  return d;
}

float map(vec3 p) {
  M = 0.; E = 0.; G = 1e3;
  if (K == 3) return bond(p);
  float d = p.y, b, c, x, cx, lx, h, o, S, ln, s = 1., F;
  vec3 q;
  vec4 a;
  for (int L = 0; L < 6; L++) {
    int i = L + (K == 6 ? 6 : K == 5 ? 12 : 0);
    a = LA[i]; S = LS[i];
    q = p;
    if ((L & 1) > 0) q.xz = q.zx;
    c = floor(q.z / a.y); q.z -= (c + .5) * a.y;
    o = h1(vec2(c, L)) * S; x = q.x + o; cx = floor(x / S); lx = x - (cx + .5) * S;
    h = h1(vec2(c * 7.1 + cx, L + 9));
    ln = S > 1. && S < 99. ? S * (.2 + .28 * h) : S * (S < 1. ? .38 : .6);
    b = bx(vec3(lx, q.y - a.x, q.z), vec3(ln, a.w, a.z));
    if (S > 1. && S < 99. && h < .15) b = 1e3;
    // never step past the edge of this cell: the neighbours may hold a wire
    vec3 r = (L & 1) > 0 ? RD.zyx : RD;
    G = min(G, max(abs(q.y - a.x) - a.w, min((sign(r.x) * S * .5 - lx) / r.x, (sign(r.z) * a.y * .5 - q.z) / r.z)) + .01);
    if (b < d) {
      d = b; M = float(L + 1);
      // signals: comets running along a third of the wires
      E = L < 4 && h1(vec2(cx, c + float(L) * 13.)) > .7 - .2 * PH ? exp(-fract((T * 2.5 - x) / (S * 1.6) + h) * S * 6.) * PH * 5. : 0.;
      EC = vec3(.2, .7, 1);
      if (K == 5 && L == 0) {
        // SRAM: bits. a band of 16 rows shows the scroller, the rest flips at random on the beat
        float X = (cx + floor(T / .10667)) * 7., row = c + 2.;
        E = row >= 0. && row < 16. ? step(.45, textureLod(B, vec2(mod(X, 2048.) / 2048., ((2. + floor(X / 2048.)) * 128. + 116. - row * 6.) / 1152.), 1.5).r)
          : .15 * step(.9, h1(vec2(cx, c) + floor(BF * 4.)));
        E *= 3.;
        EC = vec3(.3, 1, .7);
      }
      if (K == 6 && L == 0) E = PH * 4. * pow(.5 + .5 * sin(q.x * 1.5 - T * 6. + c * 2.), 30.), EC = vec3(.6, .25, 1);
      if (K == 6 && L == 1) E = KK * .6, EC = vec3(1, .5, .1);
    }
  }
  if (K == 4) {
    // the clock tree: an H fractal of thick top metal, one pulse from the root to the leaves per beat
    vec2 v = p.xz, w;
    float dh, dv, PL = 0., pl, a = 24., e = 1e3, t = 1.;
    F = fract(BF * (BF < 32. ? 1. : 4.)) * 80. - 4.;
    for (int i = 0; i < 6; i++) {
      w = abs(v);
      dh = length(vec2(max(w.x - a, 0.), w.y));
      dv = length(vec2(w.x - a, max(w.y - a * .5, 0.)));
      b = min(dh, dv) / s;
      pl = PL + (dh < dv ? w.x : a + w.y) / s;
      b = length(vec2(max(b - .5 * pow(.63, float(i)), 0.), max(abs(p.y - 3.4) - .12, 0.)));
      if (b < e) e = b, t = pl;
      PL += 1.5 * a / s;
      v = (w - vec2(a, a * .5)) * 2.; s *= 2.;
    }
    // a via from every leaf down into the logic
    b = length(vec2(max(length(v) / s - .12, 0.), max(p.y - 3.4, 0.)));
    if (b < e) e = b, t = PL + 3.4 - p.y;
    if (e < d) d = e, M = 7., E = exp(-abs(t - F) * 2.) * 5. * PH, EC = vec3(1, .55, .15);
  }
  return d;
}

vec3 env(vec3 r) {
  return vec3(.004, .003, .01) * (1. + r.y) + vec3(1, .95, .9) * (exp(-pow((r.y - .55) * 14., 2.)) + exp((r.y - 1.) * 40.) * .3) * (K == 2 || K > 3 && K < 7 ? .05 : .8);
}

void main() {
  vec2 f = gl_FragCoord.xy, uv = (f - R.xy * .5) / R.y;
  T = R.z; BF = T / 1.706667;
  SL = min(int(BF / 2.), 39);
  const int SH[40] = int[40](0, 0, 1, 1, 3, 3, 2, 2, 5, 5, 2, 2, 4, 4, 4, 4, 2, 3, 5, 4, 2, 3, 5, 4, 6, 6, 6, 6, 4, 2, 3, 5, 6, 2, 4, 3, 7, 7, 7, 7);
  K = SH[SL];
  int s0 = SL;
  for (int i = 0; i < 4; i++) if (s0 > 0 && SH[s0 - 1] == K) s0--;
  LT = T - float(s0) * 3.41333;
  float sd = h1(vec2(SL, 7)), dr = step(32., BF) * step(BF, 48.) + step(56., BF) * step(BF, 72.), fl = 1.;
  KK = exp(-fract(BF * 4.) * 5.);
  int n = 0;
  for (int i = 0; i < 4; i++) if (s0 + n < 40 && SH[min(s0 + n, 39)] == K) n++;
  U = LT / (3.41333 * float(n));
  PH = BF < 16. ? BF / 32. : BF < 32. ? .6 : BF < 48. ? 1. : BF < 56. ? .5 : BF < 72. ? 1.2 : .6;
  PH *= 1. + dr * KK * .8;

  // cameras
  vec3 ro, ta;
  float fo = .8, fc = 3.;
  if (K == 0) { float a = .4 + LT * .1; ro = vec3(sin(a) * 22., 12. - LT * .4, cos(a) * 22.); ta = vec3(0, -2, 0); }
  if (K == 1 || K == 7) {
    float e = K == 1 ? pow(1. - U, 2.6) : U * U;
    ta = vec3(2, 0, 1);
    ro = ta + vec3(.02 + e * 3., .5 + e * 11., .02 + e * 7.);
    if (K == 7) ta *= 1. - e;
  }
  if (K == 2) {
    float y = sd < .4 ? 1.48 : sd < .7 ? 1.9 : 6.;
    if (SL == 6) y = mix(9., 1.48, sat(LT / 6.));
    ro = vec3(LT * (2. + dr * 2.) + sd * 60., y, 0);
    ta = ro + vec3(1, (y < 2. ? .05 : -.9) + .1 * sin(LT), .15 * sin(LT * .7 + sd * 9.));
  }
  if (K == 3) { ro = vec3(.9 + .4 * sd, -.75 + .2 * sd, LT * (.8 + dr) + sd * 40.); ta = ro + vec3(-.3, .35 + sd * .2, 1); fc = 1.5; }
  if (K == 4) {
    float a = LT * .08 + sd * 6., y = SL < 16 ? mix(60., 6., pow(U, .7)) : 6. + sd * 4.;
    ro = vec3(sin(a) * (2. + y * .3), y, cos(a) * (2. + y * .3)); fo = 2.; fc = y;
    ta = vec3(sin(a + 1.) * 8., 0, cos(a + 1.) * 8.) * sat(1.2 - y / 40.);
  }
  if (K == 5) { ro = vec3(LT * .6 + 30. * sd, 7. + sd, -9.); ta = ro + vec3(1.5, -7., 11.); fc = 13.; }
  if (K == 6) {
    float y = SL < 28 ? mix(4., .72, sat(U * 1.5)) : .72;
    ro = vec3(1.6 * floor(sd * 9.), y, LT * .6 + sd * 30.);
    ta = ro + vec3(.15 * sin(LT * .5), -.4 * (y - .5), 1);
  }
  vec3 cw = normalize(ta - ro), cu = normalize(cross(vec3(0, 1, 0), cw)), rd = normalize(uv.x * cu + uv.y * cross(cw, cu) + (1.6 - KK * dr * .15) * cw);
  RD = rd;

  vec3 col = vec3(0), wt = vec3(1), p, nr, gl = vec3(0), lc = normalize(vec3(.8, .35, .5));
  float t, dd, ao, sh, cz = 0.;
  if (K == 0 || K == 1 || K == 7) {
    // the wafer: a mirror-polished disc of 300 dies under a ring light
    t = -ro.y / rd.y;
    p = ro + rd * t;
    vec2 w = p.xz;
    col = vec3(.004, .004, .008) * (1. - uv.y);
    if (t > 0. && length(w) < 10. && w.y > -9.7) {
      vec4 m = die(w + .5);
      vec3 r = reflect(rd, vec3(0, 1, 0));
      float c = -rd.y, lit = h1(floor(w + .5)) < (K == 7 ? U * 1.4 - .2 : 0.) ? 1. : 0.;
      vec3 fc3 = film(m.x + m.w * (dot(rd.xz, vec2(.8, .6)) * 3. + length(w) * .1), c);
      fc3 *= fc3;
      if (length(w) > 9.6 || m.y > .485) fc3 = vec3(.3, .33, .4);
      col = env(r) * fc3 * 1.4 + fc3 * .01 + lit * vec3(.2, .7, 1) * m.x * m.x * (.6 - m.y);
      cz = t;
    }
    fc = length(ro - vec3(2, 0, 1)) * (K == 0 ? .9 : 1.);
  } else
  for (int bn = 0; bn < 2; bn++) {
    t = .02;
    for (int i = 0; i < 160; i++) {
      p = ro + rd * t;
      dd = map(p);
      gl += E * EC * wt * .02 / (1. + dd * dd * 400.);
      if (dd < .0015 * t || t > fo * 50.) break;
      t += min(dd, G) * .9;
    }
    if (bn == 0) cz = t;
    if (t > fo * 50.) break;
    float m = M, e = E;
    vec3 ec = EC;
    vec2 k = vec2(1, -1) * .001;
    nr = vec3(0);
    for (int i = 0; i < 4; i++) { vec3 z = vec3((i + 3) >> 1 & 1, i >> 1 & 1, i & 1) * 2. - 1.; nr += z * map(p + z * .0007); }
    nr = normalize(nr);
    ao = 1.; sh = 1.;
    for (int i = 1; i < 6; i++) {
      float h = float(i) * .06;
      ao -= (h - map(p + nr * h)) * .9 / float(i);
      sh = min(sh, 8. * map(p + lc * h * 2.5) / (h * 2.5));
    }
    ao = sat(ao); sh = sat(sh);
    // materials: copper wires, aluminium straps, silicon, gold wire, package, clock tree
    vec3 al = vec3(.9, .36, .16), sp = al;
    float mt = .8;
    if (m < 1.) {
      al = film(.5 + .3 * h1(floor(p.xz * 4.)), dot(-rd, nr)) * .06; sp = vec3(.1); mt = .2;
      if (K == 6) al = vec3(.08, .09, .14);
    }
        if (K == 6 && m == 1.) al = vec3(.1, .1, .15), sp = vec3(.3), mt = .3;
    if (K == 6 && m == 2.) al = sp = vec3(.9, .65, .3) * .15;
    if (K == 5 && m == 1.) al = vec3(.15, .12, .2), sp = vec3(.4);
    if (m == 7. || m == 10.) al = sp = vec3(1, .72, .3) * (m > 9. ? 1. : .5), mt = .95;
    if (m == 8.) {
      vec4 dm = die(p.zx * .4 + vec2(0, .52));
      al = film(dm.x, dot(-rd, nr)) * .35; sp = vec3(.2); mt = .4;
      if (p.x > -.45 && p.x < -.15 && abs(fract(p.z / .4) - .5) < .32) al = sp = vec3(.8), mt = .7;
      if (p.x > -.02) al *= .3;
    }
    if (m == 9.) {
      al = vec3(.03, .06, .04); sp = vec3(.08); mt = .2;
      float x1 = 2.2 + 1.3 * step(.5, h1(vec2(floor(p.z / .4), 3)));
      if (abs(fract(p.z / .4) - .5) < .3 && p.x > x1 - .2 && p.x < x1 + .5) al = sp = vec3(1, .75, .35), mt = .9;
    }
    float dif = max(dot(nr, lc), 0.), fr = pow(1. - max(dot(-rd, nr), 0.), 5.);
    vec3 c = al * (1. - mt * .5) * (dif * sh * vec3(1, .85, .7) * .25 + .05 * vec3(.3, .5, 1) * max(dot(nr, -lc), 0.)) * ao
           + sp * mt * env(reflect(rd, nr)) * ao
           + sp * pow(max(dot(reflect(rd, nr), lc), 0.), 40.) * sh * 3.
           + ec * e * 2.;
    float fg = exp(-t * (K == 4 ? .02 : .06));
    col += wt * c * fg;
    wt *= sp * mt * (.4 + .6 * fr) * fg;
    ro = p + nr * .01; rd = reflect(rd, nr); RD = rd;
    if (mt < .5) break;
  }
  col += gl;
  // fade in and out of each cut, a flash on the drops
  col *= sat(BF * .6) * sat((80. - BF) * .5);
  col += vec3(.6, .8, 1) * exp(-LT * 6.) * dr * .5 * step(fract(BF / 2.), .5);
  O = vec4(clamp(col, 0., 50.), clamp(abs(cz - fc) / cz * 9., 0., 16.));
}
