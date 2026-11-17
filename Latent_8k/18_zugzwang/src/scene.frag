#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

// ZUGZWANG — Turned Staunton Chess Architecture & Choreography
float T, BR, L, M, GD, BP, SPLIT, MORPH, FALL, R2, Y2;
int S, IA;
vec3 RO, SD, SC, HZ, Q, HP[3], HS;
ivec3 HK;
vec2 LC, CID;

float sat(float x) { return clamp(x, 0., 1.); }
float Z(float a, float b, float x) { return smoothstep(a, b, x); }
float C(float a, float b, float c) { return max(R2 - a, abs(Y2 - b) - c); }
float D(float a, float b) { return length(vec2(R2, Y2 - a)) - b; }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sm(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float h1(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ns(vec2 p) { vec2 i = floor(p), f = p - i; f *= f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + 1.), f.x), f.y); }
float box(vec3 p, vec3 b) { return length(max(abs(p) - b, 0.)); }
float cap(vec3 p, vec2 a, vec2 b) { b -= a; p.yz -= a; return length(vec3(p.x, p.yz - b * sat(dot(p.yz, b) / dot(b, b)))); }

float tileH(vec2 u) {
  float r = length(u);
  return IA < 1 || IA > 4 ? 0. :
    IA == 1 ? .7 * sin(u.x * 1.3 + u.y * .9 + T * .45) * Z(.8, 2.2, r) :
    IA == 2 ? Z(1.1, 3.8, r) * 1.7 - .3 * exp(-r * r * .5) :
    IA == 3 ? abs(u.x) < .5 ? clamp(u.y + 1., 0., 4.) * .68 : -Z(.5, 2.5, abs(u.x)) :
    Z(1.8, 6.5, r) * 1.4 + .2 * sin(r * 2.4 - BR * 6.283) * exp(-r * .15);
}

float map(vec3 p) {
  float g = IA == 4 ? 6. : 4., th, ch, d = p.y + (IA == 5 ? .01 : 1.6), s = 1., sp = 0., mo = 0., db = 99., ds = 99., cs = 1., a, h, m;
  vec2 u = clamp(round(p.xz / 2.), -g, g), v = p.xz - u * 2., b = floor(p.xz / 2.), w;
  LC = v; CID = u;
  th = tileH(u);
  ch = mod(u.x + u.y + 16., 2.);
  M = 1.;
  for (int i = 0; i < 4; i++) {
    w = clamp(b + vec2(i & 1, i >> 1), -g, g);
    a = box(vec3(p.xz - w * 2., p.y - tileH(w) + 2.53).xzy, vec3(.96, 2.5, .96)) - .03;
    if (a < d) { d = a; M = mod(w.x + w.y + 16., 2.) < .5 ? 1. : 0.; CID = w; }
  }
  g = min(1.01 - abs(v.x), 1.01 - abs(v.y));

  if (IA == 2) {
    vec3 q = p - vec3(0, 3.5, -4.5), n = q + vec3(0, -1.1, .5);
    R2 = length(q.xy); Y2 = q.z; a = atan(q.y, q.x) + T * .4; h = .03 * cos(R2 * 18.);
    g = min(max(abs(R2 - 1.85) - .2 - .12 * step(.2, sin(a * 16.)), abs(Y2) - .13 + h),
            max(C(1.85, 0., .09 - h), abs(sin(a * 3.)) * R2 - .1));
    n.xy *= rot(.42 * sin(BR * 3.14));
    Y2 = length(n.xy + vec2(0, 3.6));
    g = min(g, sm(box(n + vec3(0, 1.8, 0), vec3(.08, 1.8, .06)), max(abs(Y2 - .42) - .34, abs(n.z) - .11 + .03 * cos(Y2 * 20.)), .04));
    if (g < d) { d = g; M = 4.; Q = n; }
  }

  vec3 q = vec3(0), n;
  int k = -1, ck = -1, ix = int(abs(u.x)), iy = int(abs(u.y));
  if (IA == 0) {
    if ((iy == 2 || iy == 3) && ix <= 3 && !(ix == 0 && u.y == -2.) && !(u.x == 2. && u.y == -3.) && !(u.x == -1. && u.y == 2.)) {
      cs = u.y < 0. ? 1. : -1.;
      ck = iy == 2 ? 0 : 4 - ix + int(u.x > -.5 && ix == 0);
    }
  } else if (IA < 5 && IA != 3 && (ix >= 2 || iy >= 2) && ix <= 3 && iy <= 3 && ch < .5) {
    cs = u.y < 0. && IA == 4 ? 1. : -1.;
    ck = (ix + iy * 2) % 3 + 1;
  }
  if (length(u * 2. - RO.xz) < 1.8) ck = -1;
  for (int i = 0; i < 3; i++) if (HK[i] >= 0 && length(u * 2. - HP[i].xz) < 1.5) ck = -1;

  for (int i = 0; i < 4; i++) {
    int ki = i < 3 ? HK[i] : ck;
    if (ki < 0) continue;
    n = i < 3 ? p - HP[i] : vec3(v.x, p.y - th, v.y);
    if (i == 0 && FALL > .01) {
      n.y -= .58 * sin(FALL);
      n.xy *= rot(-FALL);
    }
    R2 = length(n.xz); Y2 = n.y;
    g = C(i == 0 && (SPLIT > .01 || MORPH > .01) ? 1.2 : .72, 1.5, 1.7);
    if (g < db) {
      ds = db; db = g; q = n; k = ki; s = i < 3 ? HS[i] : cs;
      sp = i == 0 ? SPLIT : 0.; mo = i == 0 ? MORPH : 0.;
    } else if (g < ds) ds = g;
  }

  GD = max(abs(v.x), abs(v.y)) > 1.01 || p.y > th + 3.6 ? 9. : max(ds, .04);
  if (k < 0) return d;

  if (sp > .001) {
    g = floor(clamp(q.y, 0., 2.4) * 2.2); a = g * 2.3 + T * 2.2;
    q.xz -= sp * (.18 + .16 * g) * vec2(cos(a), sin(a));
    q.y -= sp * .14 * g;
    q.xy *= rot(sp * (g - 2.) * .14);
  }

  R2 = length(q.xz); Y2 = q.y; a = atan(q.x, q.z); m = s > 0. ? 2. : 3.;
  h = mo > 0. && mo < 1. ? mix(1.02, 1.66, mo) : k == 2 ? .68 : 1.02 + .16 * float(k);
  th = sat((Y2 - .14) / (h - .14));
  ch = mix(.5, .21, pow(th, .65));
  g = sm(sm(C(.56 - .08 * sat(Y2 * 3.5), .12, .12) - .03, C(ch, h * .5 + .07, h * .5 - .07), .06), C(.35, h, .025) - .025, .05);
  if (abs(Y2 - h) < .055 && R2 > .28 && k >= 3) m = 4.;

  th = D(1.34, .31);
  if (k >= 4) {
    ch = k > 4 ? 1.82 : 1.68;
    th = min(C(.26 + .21 * sat((Y2 - ch) / .7), ch + .35, .35), D(ch + .5, .32));
    if (k == 4) th = min(max(th, (Y2 - 2.3 - .11 * abs(cos(a * 4.))) * .75), D(2.52, .095));
    else {
      n = q - vec3(0, 2.88, 0);
      th = min(th, min(box(n, vec3(.07, .25, .07)), box(n, vec3(.21, .07, .07))));
    }
    if (Y2 > ch + .5) m = 4.;
  } else if (k == 1) {
    th = max(C(.38 + .06 * step(1.52, Y2), 1.58, .34), -min(max(R2 - .26, 1.72 - Y2), max(abs(sin(a * 3.)) - .45, 1.72 - Y2)));
  } else if (k == 2) {
    n = vec3(q.x, Y2, q.z * s);
    cs = max(max(sm(cap(n, vec2(.68, -.08), vec2(1.72, .1)) - .28,
                    cap(n, vec2(1.7, .08), vec2(1.42, .5)) - .18, .05),
                 abs(n.x) - .19), .13 - length(n.yz - vec2(1.32, .22)));
    th = min(cs, box(vec3(abs(n.x) - .11, Y2 - 1.92, n.z), vec3(.03, .14, .05))) - (n.z < 0. && Y2 > .75 && Y2 < 1.85 ? .02 * sin(Y2 * 30.) : 0.);
  } else if (k == 3) {
    ch = sat((Y2 - 1.36) / .88); cs = C(.36 * sin(ch * 2.82) + .04 * (1. - ch), 1.8, .44);
    if (Y2 > 1.65 && (q.x - q.z * s) > -.05) cs = max(cs, -(abs((Y2 - 1.92) * .72 - (q.x - q.z * s) * .52) - .058));
    th = min(cs, D(2.3, .08));
    if (Y2 > 2.2) m = 4.;
  }
  g = min(g, th);

  if (mo > .02 && mo < .98) for (float i = 0.; i < 2.; i++) {
    ch = sin(mo * 3.14); n = q - vec3(0, 1.65, 0);
    n.xy *= rot(T * (1.8 - 4. * i)); n.yz *= rot(.55 + .5 * i);
    cs = length(vec2(length(n.xz) - (.76 - .18 * i + .2 * ch), n.y)) - .036 * ch;
    if (cs < g) { g = cs; m = 4.; }
  }
  if (sp > .01) {
    ch = abs(fract(q.y * 2.2) - .5);
    g = max(g, .03 * sp - ch * .4);
    if (ch > .38) m = 4.;
  }
  g *= .8;
  if (g < d) { d = g; M = m; Q = q; }
  return d;
}

vec3 env(vec3 d) {
  float s = sat(dot(d, SD)), g = sat(d.y * 5. + .25);
  return mix(HZ * 1.15, HZ * .35, Z(-.12, .6, d.y)) + SC * (pow(s, 10.) * .2 + pow(s, 160.) * 1.2) * g;
}

void main() {
  vec2 u = (gl_FragCoord.xy * 2. - R.xy) / R.y, v, w;
  T = R.z; BR = T / 2.; BP = exp(-min(fract(BR * 4.) * 5., 30.));
  float a, b = 0., c;
  for (int i = 0; i < 6; i++) {
    c = float[6](0., 10., 22., 34., 44., 56.)[i];
    if (BR >= c) IA = i, b = c;
  }
  a = (BR - b) / (IA < 1 ? 2.5 : IA > 4 ? 8. : float(IA + 2));
  S = min((IA < 3 ? IA * 4 : IA * 2 + 5) + int(a), 15);
  L = fract(min(a, 7.99));
  int ms = R.x > 1200. ? 110 : 85;

  SD = normalize(vec3(IA == 1 ? -.48 : .42, .48, .76));
  HZ = IA == 0 ? vec3(.46, .34, .22) : IA == 2 ? vec3(.42, .08, .06) : IA == 3 ? vec3(.05, .1, .24) : vec3(.16, .26, .42);
  SC = IA == 1 ? vec3(1.4, 2., 2.7) : IA == 2 ? vec3(2.6, .75, .42) : vec3(2.3, 1.8, 1.15);

  SPLIT = IA == 1 ? Z(16., 21.5, BR) : 0.;
  MORPH = IA == 3 ? Z(39.4, 43., BR) : IA > 3 ? 1. : 0.;
  FALL = IA == 4 ? Z(48.2, 54.5, BR) * .74 : IA == 5 ? 1.44 : 0.;
  HK = ivec3(IA == 0 ? 0 : IA == 1 ? 2 : IA == 3 ? (BR > 40.2 ? 4 : 0) : 5,
             IA == 0 ? 2 : IA == 1 ? 3 : IA == 3 ? -1 : 4,
             IA == 0 ? 0 : IA == 2 ? 1 : IA == 3 ? -1 : IA == 5 ? 5 : 2);
  HS = vec3(IA == 0 || IA == 2 || IA == 3 ? 1 : -1, IA == 2 ? -1 : 1, IA == 0 || IA == 2 ? -1 : 1);
  HP[0] = vec3(0);

  if (IA == 0) {
    a = Z(2., 3.2, BR); b = Z(5.2, 6.6, BR); c = Z(3.8, 4.8, BR);
    HP[0] = vec3(0, sin(a * 3.14) * 1.1, mix(-4., 0., a));
    HP[1] = vec3(mix(4., 2., b), sin(b * 3.14) * 1.5, mix(-6., -2., b));
    HP[2] = vec3(-2, sin(c * 3.14) * .9, mix(4., 2., c));
  } else if (IA == 1 || IA == 4) {
    b = IA == 1 ? Z(13.2, 14.6, BR) : 0.;
    HP[1] = vec3(-2, 0, -2); HP[2] = vec3(2, sin(b * 3.14) * 1.1, -2);
  } else if (IA == 2 || IA == 5) {
    HP[0] = vec3(IA == 5 ? 2 : 0, 0, 0);
    HP[1] = vec3(-2, 0, 2); HP[2] = vec3(2, 0, IA == 5 ? 2 : 0);
  } else {
    a = clamp((BR - 34.) * .5, 0., 3.); c = Z(.2, .8, fract(a));
    HP[0] = vec3(0, sin(c * 3.14) * .7 + .3 * sin(MORPH * 3.14), (floor(a) + c) * 2.);
  }
  for (int i = 0; i < 3; i++) HP[i].y += tileH(round(HP[i].xz / 2.));

  vec3 ta = S == 0 ? vec3(0, 1.35, -4.) :
            S == 1 || S == 6 || IA == 3 ? HP[0] + vec3(0, 1.3, 0) :
            S == 2 || S == 4 ? HP[1] + vec3(0, 1.2, 0) :
            S == 5 ? HP[2] + vec3(0, 1.2, 0) :
            vec3(0, IA == 5 ? 1. : 1.45, IA == 2 ? -.2 : IA == 5 ? .6 : -.4);

  bool wd = S == 3 || S == 7 || S == 13 || S == 15;
  a = Z(0., 1., L);
  b = (S == 2 || S == 5 || S == 9 ? .68 : S == 11 ? -.9 : S == 8 || S == 12 ? -.34 : -.54);
  b -= sign(b) * (S == 12 ? .7 : .32) * a;
  c = wd ? .36 : S == 8 || S == 12 ? .14 : .2;
  float dist = (wd ? (S == 15 ? 5.1 : 5.9) : IA == 2 ? 5.1 : 4.3) * (1. - .12 * a), t = .05, d, m, coc = .25;
  vec3 ro = ta + dist * vec3(cos(c) * sin(b), sin(c), cos(c) * cos(b)),
       f = normalize(ta - ro), r = normalize(cross(vec3(0, 1, 0), f)),
       rd = normalize(f * 1.72 + u.x * r + u.y * cross(f, r));
  RO = ro;

  for (int i = 0; i < 110; i++) {
    if (i >= ms || t > 42.) break;
    d = map(ro + rd * t);
    if (d < .0012 + t * 7e-4) break;
    v = (sign(rd.xz) - LC) / rd.xz;
    t += min(d, GD > 8. ? 9. : min(GD, min(v.x, v.y) + .03)) * .9;
  }

  m = (t < 42. && d < .02) ? M : -1.;
  vec3 p = ro + rd * t, q = Q, col = env(rd);
  if (m < 0. && IA == 3 && rd.y > 0.) col += step(.996, h1(floor(rd.xy * 280.) + floor(rd.z * 280.) * vec2(17.3, 31.7))) * 2.2 * sat(rd.y * 4.);
  w = CID; v = p.xz - w * 2.;

  if (m >= 0.) {
    vec3 n = vec3(0), e, rf, re, al, ex = vec3(0);
    for (int i = 0; i < 4; i++) {
      e = .5773 * (2. * vec3((i + 3) >> 1 & 1, i >> 1 & 1, i & 1) - 1.);
      n += e * map(p + e * .002);
    }
    n = normalize(n); rf = reflect(rd, n); re = env(rf);
    float sh = 1., s = .04, ao = sat(.3 + map(p + n * .22) * 3.), dl = sat(dot(n, SD)), bk = sat(dot(n, -SD)), fr = pow(sat(1. + dot(n, rd)), 4.), sp = sat(dot(rf, SD)), rk = .35 * fr, sk = .45;
    if (dl > 0.) for (int i = 0; i < 20; i++) {
      a = map(p + n * .03 + SD * s);
      sh = min(sh, sat(6. * a / s));
      s += clamp(a, .035, .28);
    }
    vec3 am = HZ * (.62 + .38 * n.y + .25 * bk) * ao;

    if (m < 1.5) {
      a = mix(.5, ns(p.xz * 3.2 + ns(p.xz * 7.) * 1.5), exp(-t * .1));
      b = Z(.05, .0, abs(max(abs(v.x), abs(v.y)) - .92)) * step(.5, n.y);
      c = (IA > 0 && IA < 5 && max(abs(v.x), abs(v.y)) < .95) ? Z(.1, .0, min(abs(abs(p.x) - abs(p.z)), min(abs(p.x), abs(p.z)))) * .5 : 0.;
      if (IA == 3 && abs(w.x) < .5) c += Z(1.2, 4., w.y + 1.) * .6;
      al = mix((m < .5 ? vec3(.7, .64, .55) : vec3(.07, .08, .1)) * (.85 + .25 * a), vec3(.55, .42, .18), b * .4);
      rk = (.1 + .42 * fr) * (m < .5 ? .5 : .85); sk = .35;
      ex = SC * .38 * (c * (.35 + .2 * BP) + Z(.1, .0, abs(length(p.xz) - fract(BR) * 4.5)) * (1. - fract(BR)) * .4 + b * .15 * BP) * step(.5, n.y);
    } else if (m < 2.5) {
      al = vec3(.88, .81, .68);
    } else if (m < 3.5) {
      al = vec3(.06, .07, .095); rk = .2 + .75 * fr; sk = .85;
      ex = SC * .35 * fr * ao;
    } else {
      a = .55 + .45 * sin(rf.y * 9. + rf.x * 5. + q.y * 6.);
      al = mix(vec3(.26, .14, .03), vec3(1, .76, .28), a * (.35 + .65 * dl * sh) * ao);
      rk = 0.; sk = 1.4;
      ex = al * (.35 + re * (.45 + .55 * fr)) + SC * ((IA == 3 || IA == 4) ? .08 * BP * fr : 0.);
    }
    col = al * (SC * dl * sh * (m > 3.5 ? .35 : 1.05) + am) + re * rk + SC * dl * sh * pow(sp, 45.) * sk + ex;
    col = mix(col, env(rd), Z(10., 30., t));
    coc = sat(abs(t - dist) / 18.);
  }

  O = vec4(clamp(col, 0., 5.), coc);
}
