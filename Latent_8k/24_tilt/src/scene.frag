#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;

float T, BR, L, M, ZP;
int S, IA;
vec3 SD, SC, HZ, Q, BP[3], BK;
const vec2 BC[3] = vec2[3](vec2(-1.65, 3.2), vec2(1.35, 3.2), vec2(-.15, 1.3));

float sat(float x) { return clamp(x, 0., 1.); }
float Z(float a, float b, float x) { return smoothstep(a, b, x); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float box(vec3 p, vec3 b) { return length(max(abs(p) - b, 0.)); }
float tx(vec2 p) { return abs(p.x) > .48 || abs(p.y) > .45 ? 0. : textureLod(B, vec2(p.x + .5, (.55 - p.y) / 9.), 0.).r; }
vec3 bCol(int i) { return i == 0 ? vec3(.08, .9, 1) : i == 1 ? vec3(1, .16, .62) : vec3(1, .76, .12); }

vec3 pfCol(vec2 p, out float e) {
  e = 0.;
  if (length(vec2(p.x, max(0., p.y - 3.6))) > 4.55) return vec3(.01);
  bool x = IA == 5;
  float g = sin(p.y * 12. + sin(p.x * 4.) * .5) * .015, w = .72 + .28 * sin(p.x * 50.) * sin(p.y * 50.), r, a, d, k;
  vec3 c = vec3(.02, .03, .075) + g, v;

  if (p.x > 3.35 && p.y < 3.8) {
    g = step(.45, fract(p.y * 1.8)) * step(abs(p.x - 4.05), .38);
    c = mix(c, mix(bCol(2), vec3(1, .18, .08), sat((-p.y - 4.2) / 3.2)), g * .8);
    e = g * (x ? 0. : .35 + .65 * step(ZP, p.y));
    return c;
  }

  vec2 q = p - vec2(-.15, -.6);
  r = length(q); a = atan(q.y, q.x);
  c = mix(c, vec3(.96, .36, .08), step(.3, sin(a * 12.)) * Z(3.6, 1.2, r) * Z(.7, 1.1, r) * .55);
  c = mix(c, vec3(.96, .88, .7), (Z(.05, .0, abs(abs(r - 2.35) - .12)) + Z(.05, .0, abs(abs(p.x) - 3.15)) * step(abs(p.y), 4.2)) * .8);
  c = mix(c, bCol(0), Z(.05, .0, abs(r - 3.1)) * .75);

  k = clamp(round((p.x + 1.65) / 1.5), 0., 2.);
  d = Z(.03, -.02, length(p - vec2(k * 1.5 - 1.65, 4.9)) - .34);
  c = mix(c, bCol(int(k)) * w, d);
  e += d * (x ? 0. : IA == 0 ? Z(6.1 + k * .22, 6.2 + k * .22, BR) : .5 + .5 * sin(BR * 6.283 + k * 2.)) * 1.6;

  int i = p.y < 2.25 ? 2 : p.x < -.15 ? 0 : 1;
  v = bCol(i);
  d = length(p - BC[i]);
  c = mix(c, v, Z(.05, .0, abs(d - 1.05)) * .85);
  k = x ? 0. : Z(.12, .0, abs(d - .85 - (1. - BK[i]) * 1.5)) * BK[i];
  c += v * k * 1.5; e += k * 1.8;

  k = clamp(round(p.y / .72), -2., 2.);
  d = Z(.03, -.02, max(abs(p.y - k * .72) - .2, abs(p.x + 2.35) - .28));
  c = mix(c, mix(vec3(.1, .95, .45), bCol(2), (k + 2.) * .25) * w, d);
  e += d * (x ? .05 : IA > 2 || IA == 2 && BR > 26. + k * 2. ? 1. : .18) * 1.4;

  d = Z(.03, -.02, r - 1.25);
  v = x ? vec3(.9, .08, .06) : mix(bCol(1), bCol(0), .5 + .5 * sin(a * 4. - BR * 6.283));
  k = tx(vec2(q.x * .42, -q.y * .9));
  c = mix(mix(c, v * w * .65, d), vec3(1, .95, .8), d * k);
  e += d * (x ? .8 * k : .5 + .7 * k + (IA == 3 ? .9 : 0.));

  q = abs(p - vec2(-.15, -4.8));
  d = Z(.03, -.02, (q.x + q.y) * .707 - .48);
  c = mix(c, vec3(1, .22, .08) * w, d);
  e += d * (x ? 1.2 : .5 + .5 * sin(BR * 12.56)) * 1.3;

  if (x) {
    k = tx(vec2((p.x + .15) * .16, -p.y * .22));
    c += vec3(1.2, .08, .05) * k; e += k * 1.8;
  }
  return c;
}

float map(vec3 p) {
  float d = p.y, a, b, r, k;
  M = 0.; Q = p;
  if (IA == 4) {
    d = 6. - length(p.xz);
    a = min(length(vec2(length(p.xz) - 1.05, p.y)) - .09, box(p - vec3(-1.45, 0, 0), vec3(.4, .07, .14)) - .02);
    if (a < d) { d = a; M = 4.; }
    b = Z(48.8, 49.05, BR);
    a = mix((.42 + .52 * Z(46., 48.8, BR)) * sin(BR * 6.283), .56, b);
    vec3 q = p - vec3(a, .15 * a * a, (1. - b) * .28 * cos(BR * 6.283));
    q.xy *= rot(-a * .32);
    r = length(q.xz);
    a = max(r - .48 * sat((.95 - q.y) / 1.55) - .04, abs(q.y - .15) - .78) - .015 * cos(q.y * 35.);
    b = max(r - .055, abs(q.y - 2.1) - 1.3);
    if (a < d) { d = a; M = 4.; Q = q; }
    if (b < d) { d = b; M = 2.; Q = q; }
    if (BR >= 48.95) {
      q = p - vec3(.96, 0, 0);
      a = length(q) - .22 - .06 * sin(q.y * 40. + T * 90.);
      if (a < d) { d = a; M = 9.; }
    }
    return d;
  }

  r = length(p.xz - vec2(-.15, -.6));
  if (IA == 3) {
    a = min(max(abs(r - 2.35) - .14, p.y - .38), max((abs(p.x + .15) + abs(p.z + 4.8)) * .707 - .46, p.y - .45)) - .02;
    if (a < d) { d = a; M = 5.; }
  }

  a = max(abs(length(vec2(p.x, max(0., p.z - 3.6))) - 4.55) - .18, abs(p.y - .42) - .45) - .03;
  b = min(box(p - vec3(3.35, .36, -2.), vec3(.1, .38, 5.4)), box(vec3(abs(p.x + .15) - 2.8, p.y - .36, p.z + 5.8 + abs(p.x + .15) * .45), vec3(1.2, .38, .12))) - .03;
  a = min(a, b);
  if (a < d) { d = a; M = p.y > .68 ? 2. : 3.; }

  k = clamp(round((p.x + 2.4) / 1.5), 0., 3.) * 1.5 - 2.4;
  a = length(vec2(p.x - k, length(vec2(p.y - .25, (p.z - 4.9) * .7)) - .35)) - .04;
  if (a < d) { d = a; M = 2.; }

  vec2 v = p.xy - vec2(4.05, .38); r = length(v);
  a = max(r - .085, abs(p.z - ZP + 1.8) - 1.8);
  b = max(r - .22, abs(p.z - ZP) - .14) - .02;
  k = max(.4, ZP + 7.55);
  a = min(a, max(length(vec2(r - .21, (fract((p.z + 7.65) / k * 8. + atan(v.y, v.x) / 6.283) - .5) * k / 8.)) - .042, max(-7.65 - p.z, p.z - ZP + .12)));
  if (a < d) { d = a; M = 2.; }
  if (b < d) { d = b; M = 4.; }

  int i = p.z < 2.25 ? 2 : p.x < -.15 ? 0 : 1;
  vec3 q = p - vec3(BC[i].x, 0, BC[i].y);
  r = length(q.xz); k = BK[i] * .12; a = atan(q.x, q.z);
  b = min(max(r - .28, abs(q.y - .25) - .25), max(r - .56, abs(q.y - .22 + k) - .04));
  if (b < d) { d = b; M = 2.; }
  b = max(r - .22 - .06 * cos(a * 5.), abs(q.y - .76 + k * .5) - .05);
  if (b < d) { d = b; M = 4.; }
  b = (max(r - .82 - .035 * cos(a * 12.) + (q.y - .52) * .35, abs(q.y - .58 + k * .5) - .16) - .03) * .85;
  if (b < d) { d = b; M = 6. + float(i); Q = q; }

  q = vec3(1.3 - abs(p.x + .15), p.y, p.z + 5.8);
  q.xz *= rot((IA == 2 || IA == 3 ? .86 * exp(-fract(BR + (p.x < -.15 ? -.15 : .35)) * 8.) : 0.) - .38);
  k = sat(q.x / 1.22);
  a = max(length(q.xz - vec2(1.22 * k, 0)) - mix(.25, .13, k), abs(q.y - .24) - .2) - .02;
  if (a < d) { d = a; M = 1.; Q = q; }
  q = vec3(abs(p.x + .15) - 2.2, p.y - .24, p.z + 4.1);
  a = box(q, vec3(.25, .2, .65)) - .02;
  if (a < d) { d = a; M = 1.; Q = q; }

  k = clamp(round(p.z / .72), -2., 2.);
  a = IA > 2 ? .48 : IA == 2 ? Z(25.8 + k * 2., 26.1 + k * 2., BR) * .48 : 0.;
  q = p - vec3(-2.95, .32 - a, k * .72);
  a = box(q, vec3(.06, .28, .26)) - .015;
  if (a < d) { d = a; M = 6. + mod(k + 2., 3.); Q = q; }

  q = p - vec3(-.15, 0, .2);
  a = atan(q.z, q.x); r = length(q.xz);
  v = vec2(r - 2.35, q.y - 1.35 - .5 * sin(a));
  k = min(
    min(length(vec2(abs(v.x) - .14, v.y)), length(vec2(abs(v.x) - .07, v.y + .08))) - .032,
    max(abs(length(v) - .15) - .025, abs(sin(a * 5.)) * r - .04)
  ) * .85;
  if (k < d) { d = k; M = 2.; }

  for (int j = 0; j < 3; j++) {
    if (j > 0 && IA != 3) break;
    a = length(p - BP[j]) - .38;
    if (a < d) { d = a; M = 2.; Q = p - BP[j]; }
  }
  return d;
}

vec3 env(vec3 d) {
  float s = sat(dot(d, SD)), g = sat(d.y * 4. + .2);
  vec3 c = mix(HZ * 1.1, HZ * .3, Z(-.1, .7, d.y)) + SC * (pow(s, 12.) * .25 + pow(s, 120.) * 1.1) * g;
  if (IA != 4 && d.y > .05)
    c += (IA == 5 ? vec3(1.4, .08, .05) : vec3(.2, .8, 1.2)) * step(.65, sin(d.x * 18. + d.z * 6.)) * exp(-abs(d.y - .35) * 8.) * .45;
  return c;
}

void main() {
  vec2 u = (gl_FragCoord.xy * 2. - R.xy) / R.y;
  T = R.z; BR = T / 1.70667;
  float a, b = 0., c;
  for (int i = 0; i < 6; i++) {
    c = float[6](0., 8., 20., 32., 46., 52.)[i];
    if (BR >= c) IA = i, b = c;
  }
  a = (BR - b) / (IA == 0 ? 2.8 : IA == 3 ? 3.5 : IA == 4 ? 3. : IA == 5 ? 8. : 4.);
  S = (IA < 4 ? IA * 3 : IA == 4 ? 13 : 15) + int(a);
  L = fract(min(a, 3.99));

  SD = normalize(vec3(IA == 4 ? .55 : -.38, .72, .52));
  HZ = IA == 5 ? vec3(.28, .03, .04) : IA == 4 ? vec3(.18, .1, .06) : IA == 3 ? vec3(.14, .18, .38) : vec3(.08, .14, .28);
  SC = IA == 5 ? vec3(2.2, .25, .18) : IA == 4 && BR >= 48.95 ? vec3(1.6, 2.4, 3.2) : vec3(2.2, 1.9, 1.5);

  ZP = IA == 0 ? (BR < 6. ? mix(-4.8, -6.9, Z(0., 5.8, BR)) : mix(-6.9, -4.5, Z(6., 6.12, BR))) : -4.6;
  BK = IA == 1 || IA == 3 ? exp(-fract(BR * 2. + vec3(0, .33, .67)) * 6.) : vec3(0);

  if (IA == 0) {
    a = max(0., BR - 6.55) * 1.9;
    BP[0] = vec3(cos(a) * 4.05, .38, BR < 6. ? ZP + .52 : BR < 6.55 ? mix(-6.38, 3.6, (BR - 6.) / .55) : 3.6 + sin(a) * 1.5);
  } else if (IA == 1) {
    int i = int(BR * 2.) % 3;
    vec2 w = mix(BC[i], BC[(i + 1) % 3], .35 + .3 * fract(BR * 2.));
    BP[0] = vec3(w.x, .38, w.y);
  } else if (IA == 2) {
    if (BR < 28.) {
      b = abs(sin(BR * 1.57));
      BP[0] = vec3(S < 7 ? mix(-.85, -1.5, b) : mix(-2.45, -.6, b * .75), .38, S < 7 ? mix(-4.9, -1.5, b) : mix(clamp(floor((BR - 22.) * .5) - 2., -2., 2.) * .72, -.8, b * .75));
    } else {
      a = mix(-1.57, 4.71, (BR - 28.) / 4.);
      BP[0] = vec3(-.15 + cos(a) * 2.35, 1.71 + .5 * sin(a), .2 + sin(a) * 2.35);
    }
  } else if (IA == 3) {
    for (int i = 0; i < 3; i++) {
      a = T * 2.2 + float(i) * 2.094;
      b = S == 9 ? mix(.45, 2.5, L) : i == 2 ? 2.35 : 2.1 + .6 * sin(a * 1.5);
      c = i == 2 && S != 9 ? 1.71 + .5 * sin(a) : .38;
      BP[i] = S == 12 && i < 2 ? vec3(i < 1 ? -.52 + L * .15 : .32 - L * .15, .64, -.6 + (i < 1 ? 1. : -1.) * (L - .4) * .6)
                                : vec3(-.15 + cos(a) * b, c, (S == 9 ? 1.5 : -.4) + sin(a) * b * (i == 2 ? 1. : 1.35));
    }
  } else if (IA == 5) {
    a = Z(52., 57.2, BR);
    BP[0] = vec3(-.15 + .18 * sin(a * 6.283) * (1. - a), .38 - .35 * Z(56.2, 57.2, BR), mix(1.4, -7.2, a));
  }

  vec3 w = S == 2 || S == 8 ? BP[0] :
           vec3(S < 2 ? 4.05 : S == 3 ? -1.3 : S == 5 ? .8 : S == 7 ? -2.3 : IA == 4 ? .35 : -.15,
                IA == 4 ? .08 : S == 4 || S == 11 ? .25 : .45,
                S < 2 ? -6.1 : IA == 1 ? 2.4 : S == 6 ? -4.6 : S == 9 ? .8 : S == 10 ? -1.2 : S == 15 ? mix(-2.2, -5.6, L) : IA == 4 ? 0. : -.4);

  a = (S < 2 ? -.1 : S == 3 || S == 7 ? .88 : S == 5 ? -.75 : S == 8 ? .8 : S == 13 ? -.42 : S == 15 ? .04 : -.2)
      + (S == 3 || S == 6 || S == 7 || S == 14 ? -.3 : S == 15 ? -.04 : .4) * L;
  b = S == 4 || S == 11 ? 1.18 : S == 1 ? .64 : S == 2 || S == 8 || S == 9 ? .56 : S >= 12 && S <= 14 ? .24 : .34;
  float k = S == 1 ? 1.65 : S == 4 || S == 10 || S == 11 ? 5.4 : S == 12 || S == 14 ? 2.15 : S == 15 ? 4.4 : 3.1,
        t = .05, d, m;

  vec3 o = w + k * vec3(cos(b) * sin(a), sin(b), -cos(b) * cos(a)),
       f = normalize(w - o), r = normalize(cross(vec3(0, 1, 0), f)),
       v = normalize(f * 1.75 + u.x * r + u.y * cross(f, r));

  for (int i = 0; i < 95; i++) {
    if (t > 32.) break;
    d = map(o + v * t);
    if (d < .0012 + t * 6e-4) break;
    t += d * .88;
  }

  m = (t < 32. && d < .02) ? M : -1.;
  vec3 p = o + v * t, q = Q, z = env(v), n = vec3(0), e;
  c = .2;

  if (m >= 0.) {
    for (int i = 0; i < 4; i++) {
      e = .5773 * (2. * vec3((i + 3) >> 1 & 1, i >> 1 & 1, i & 1) - 1.);
      n += e * map(p + e * .002);
    }
    n = normalize(n); f = reflect(v, n); r = env(f); w = vec3(.1); o = vec3(0);

    a = m < .5 ? 0. : max(0., -p.y / min(-.01, f.y)); b = 0.;
    e = IA == 4 ? vec3(0) : pfCol((p + f * a).xz, b);
    if (m > .5 && IA != 4 && f.y < -.02 && a < 14.)
      r = mix(r, e * (.7 + 1.8 * b), exp(-a * .15));

    float g = 1., s = .04, h = sat(.35 + map(p + n * .2) * 3.2), l = sat(dot(n, SD)),
          y = pow(sat(1. + dot(n, v)), 4.), rk = .35 * y, sk = .5;
    if (l > 0.) for (int i = 0; i < 16; i++) {
      a = map(p + n * .03 + SD * s);
      g = min(g, sat(6. * a / s));
      s += clamp(a, .035, .28);
    }

    if (m < .5) {
      if (IA == 4) {
        a = sin(p.x * 8. + sin(p.z * 3.) * 2.) * .5 + .5;
        w = mix(vec3(.14, .05, .02), vec3(.28, .11, .04), a);
        rk = .15 * y; sk = .25;
      } else {
        w = e;
        rk = (.12 + .55 * y) * (IA == 5 ? .85 : .55);
        sk = .65;
        o = w * b * 1.45;
      }
    } else if (m < 1.5) {
      bool x = abs(q.y - .22) < .075 && n.y < .55;
      w = x ? vec3(.95, .24, .06) : vec3(.92, .9, .84);
      rk = x ? .05 : .25 * y; sk = x ? .2 : .7;
    } else if (m < 2.5) {
      w = vec3(.08, .09, .11);
      rk = .85 + .15 * y; sk = 2.2;
    } else if (m < 3.5) {
      w = sin(p.z * 2.5) > 0. ? vec3(.85, .18, .08) : vec3(.08, .22, .55);
      rk = .25 * y;
    } else if (m < 4.5) {
      a = .55 + .45 * sin(f.y * 10. + f.x * 6.);
      w = mix(vec3(.28, .15, .03), vec3(1, .78, .28), a * h);
      rk = .45 + .4 * y; sk = 1.6;
      o = w * (.25 + r * .4);
      if (IA == 4 && BR >= 48.95) o += vec3(.5, .9, 1.6) * exp(-length(p - vec3(.96, 0, 0)) * 2.2) * 1.8;
    } else if (m < 5.5) {
      w = mix(bCol(0), bCol(1), .5 + .5 * sin(p.x * 2. + T * 5.));
      o = w * 1.6;
    } else if (m < 8.5) {
      int i = int(m - 6.);
      a = step(cos(atan(q.x, q.z) * 5.) * .12 + .38, length(q.xz));
      w = mix(vec3(1, .96, .85), bCol(i), a);
      o = w * (IA == 5 ? .04 : .65 + 1.6 * BK[i] + .35 * (1. - a)) * (.55 + .45 * y);
      rk = .35 * y; sk = 1.1;
    } else {
      w = vec3(1);
      o = vec3(1.8, 3.2, 5.5);
    }

    z = w * (SC * l * g + HZ * (.65 + .35 * n.y + .25 * sat(dot(n, -SD))) * h) + r * rk + SC * l * g * pow(sat(dot(f, SD)), 48.) * sk + o;
    z = mix(z, env(v), Z(12., 28., t));
    c = sat(abs(t - k) / 14.);
  }

  O = vec4(clamp(z, 0., 5.), c);
}
