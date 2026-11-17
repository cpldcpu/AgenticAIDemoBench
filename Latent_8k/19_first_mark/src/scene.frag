#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
float T, BR, M, REL, HV;
int ACT, HC;
vec3 RO, Q, HP[11];
float sat(float x) { return clamp(x, 0., 1.); }
float Z(float a, float b, float x) { return smoothstep(a, b, x); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sm(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float h1(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ns(vec2 p) { vec2 i = floor(p), f = p - i; f *= f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + 1.), f.x), f.y); }
float el(vec3 p, vec3 r) { return (length(p / r) - 1.) * min(r.x, min(r.y, r.z)); }
float el2(vec2 p, vec2 r) { return (length(p / r) - 1.) * min(r.x, r.y); }
float cap(vec3 p, vec3 a, vec3 b, float r) { vec3 q = p - a, v = b - a; return length(q - v * sat(dot(q, v) / dot(v, v))) - r; }
float cp(vec2 p, vec2 a, vec2 b, float r) { vec2 q = p - a, v = b - a; return length(q - v * sat(dot(q, v) / dot(v, v))) - r; }

// Aurochs: long body, high withers, low head and jointed galloping legs.
float bull(vec3 p) {
  float d = sm(el(p - vec3(-.12, 1.43, 0), vec3(1.3, .52, .43)),
                el(p - vec3(.43, 1.67, 0), vec3(.72, .67, .48)), .13);
  d = sm(d, el(p - vec3(-.88, 1.4, 0), vec3(.52, .49, .41)), .12);
  d = sm(d, cap(p, vec3(.78, 1.63, 0), vec3(1.28, 1.3, 0), .29), .08);
  d = sm(d, el(p - vec3(1.43, 1.3, 0), vec3(.44, .32, .3)), .07);
  d = sm(d, el(p - vec3(1.76, 1.08, 0), vec3(.38, .21, .25)), .06);
  for (int i = 0; i < 4; i++) {
    float x = i < 2 ? .65 : -.78, z = (i & 1) == 0 ? -.29 : .29,
          a = BR * 25.133 + float(i) * 1.7,
          y = .08 + max(0., sin(a)) * (ACT == 3 ? .53 : .035),
          xx = x + cos(a) * (ACT == 3 ? .48 : .02),
          kx = mix(x, xx, .55) + (i < 2 ? -.13 : .14);
    d = sm(d, cap(p, vec3(x, 1.3, z), vec3(kx, .65, z), .09), .045);
    d = sm(d, cap(p, vec3(kx, .65, z), vec3(xx, y, z), .061), .025);
    d = min(d, el(p - vec3(xx + .045, y, z), vec3(.12, .07, .1)));
  }
  d = sm(d, cap(p, vec3(-1.22, 1.53, 0), vec3(-1.54, .72 + .1 * sin(T * 3.), .08), .042), .025);
  return d;
}
vec3 hornP(float t, float z) {
  return vec3(1.4 - .45 * sin(t * 3.1416) + .25 * t + z * .12 * t,
              1.55 + .6 * sin(t * 1.5708) * (1. + .12 * sin(HV * 2.3)),
              z * (.22 + .55 * t * (1. + .14 * cos(HV * 1.7))));
}
float horns(vec3 p) {
  float d = 99.;
  for (int i = 0; i < 2; i++) {
    float z = i == 0 ? -1. : 1., t = sat((p.y - 1.55) / .6);
    for (int j = 0; j < 3; j++) {
      vec3 c = hornP(t, z), v = p - c,
           u = vec3(-1.4137 * cos(t * 3.1416) + .25 + z * .12,
                 .9425 * cos(t * 1.5708) * (1. + .12 * sin(HV * 2.3)), z * .55 * (1. + .14 * cos(HV * 1.7))),
           w = vec3(4.441 * sin(t * 3.1416), -1.4803 * sin(t * 1.5708) * (1. + .12 * sin(HV * 2.3)), 0);
      t = sat(t + dot(v, u) / max(.05, dot(u, u) - dot(v, w)));
    }
    d = min(d, length(p - hornP(t, z)) - mix(.1, .018, t));
  }
  return d;
}
float cave(vec3 p) {
  float r = ACT == 3 || ACT == 4 ? 6.7 : 5.5;
  r += .28 * sin(p.z * .61) + .17 * sin(p.z * 1.73 + p.y) + .13 * sin(p.x * 4. + p.z * 2.3) * sin(p.y * 5. - p.z)
     + .055 * sin(p.x * 11. + p.z * 7.) * sin(p.y * 13. - p.z * 3.);
  float d = r - length(vec2(p.x, (p.y - 2.65) * .9));
  d = min(d, p.y + .045 * sin(p.x * 2.7 + p.z) * sin(p.z * 3.1));
  // Flowstone fingers give the tunnel a geological, not architectural, silhouette.
  float id = floor((p.z + 1.5) / 3.), tip = 2.25 + h1(vec2(id, 4)) * .75;
  vec3 q = p; q.z = mod(p.z + 1.5, 3.) - 1.5; q.x = abs(p.x) - (4.1 + .5 * h1(vec2(id, 2)));
  float f = max(length(q.xz) - (.025 + max(0., p.y - tip) * (.07 + .06 * h1(vec2(id, 8)))), max(tip - p.y, p.y - 5.6));
  if (ACT == 3) {
    q.x = abs(p.x) - 4.7;
    f = min(f, max(length(q.xz) - (.3 - p.y * .17), max(-p.y, p.y - 1.45)));
  }
  return min(d, f);
}
float map(vec3 p) {
  float d = cave(p), bd = 99., a, id = 0.;
  M = p.y < .15 ? 1. : 0.;
  vec3 q, bq;
  for (int i = 0; i < 11; i++) {
    if (i >= HC) break;
    if ((ACT == 3 || ACT == 4) && length(HP[i] - RO) < (ACT == 4 ? 8. : 4.2)) continue;
    q = p - HP[i];
    a = el(q - vec3(0, 1.25, 0), vec3(2., 1.5, .9));
    if (a < bd) { bd = a; bq = q; id = float(i); }
  }
  HV = id;
  if (HC > 0) {
    bq.xz *= rot(-1.5708);
    bq.z /= REL;
    a = bull(bq) * .78;
    if (a < d) { d = a; M = 2.; Q = bq; }
    a = horns(bq) * .85;
    if (a < d) { d = a; M = 3.; Q = bq; }
  }
  return d;
}
float paintBull(vec2 p) {
  float d = sm(el2(p - vec2(0, 1.4), vec2(1.17, .57)), el2(p - vec2(.53, 1.64), vec2(.65, .72)), .12);
  d = sm(d, el2(p - vec2(1.32, 1.4), vec2(.5, .38)), .1);
  d = min(d, el2(p - vec2(1.66, 1.17), vec2(.34, .24)));
  for (int i = 0; i < 4; i++) {
    float x = i < 2 ? .63 : -.67, z = (i & 1) == 0 ? -.12 : .12;
    d = min(d, cp(p, vec2(x, 1.3), vec2(x + z, .12), .075));
  }
  d = min(d, cp(p, vec2(1.23, 1.7), vec2(1.1, 2.15), .055));
  d = min(d, cp(p, vec2(1.1, 2.15), vec2(1.48, 2.32), .04));
  d = min(d, cp(p, vec2(-1., 1.55), vec2(-1.42, .8), .04));
  return d;
}
float hand(vec2 p) {
  float d = el2(p - vec2(0, -.05), vec2(.34, .43));
  d = min(d, cp(p, vec2(-.25, .2), vec2(-.42, .85), .075));
  d = min(d, cp(p, vec2(-.1, .25), vec2(-.13, 1.04), .078));
  d = min(d, cp(p, vec2(.07, .25), vec2(.1, 1.12), .08));
  d = min(d, cp(p, vec2(.23, .18), vec2(.34, .94), .074));
  d = min(d, cp(p, vec2(-.27, -.05), vec2(-.7, .34), .09));
  return d;
}
float pigment(vec3 p) {
  float d = 0., e;
  // The sprayed negative hand at the entrance.
  if (ACT == 0 || ACT == 6) {
    vec2 q = vec2(p.z + 2., p.y - 1.85) * .55;
    e = (1. - Z(1.2, 1.7, length(q))) * Z(-.025, .025, hand(q));
    e *= .7 + .65 * ns(q * 28.);
    d = max(d, e * (ACT == 0 ? Z(1.8, 4.8, BR) : 1.));
  }
  // One animal is drawn from left to right, then lifts out of the wall.
  if (ACT == 1 || ACT == 2) {
    vec2 q = vec2(p.z + 8., p.y);
    e = 1. - Z(-.035, .035, paintBull(q));
    e *= sat((BR - 8.) * .75 - (q.x + 1.6) * .55) * (.65 + .5 * ns(q * 24.));
    d = max(d, e * (ACT == 2 ? .3 + .7 * (1. - Z(17., 20., BR)) : 1.));
  }
  // Herd memories repeat around the upper gallery in the final movement.
  if (ACT >= 4) {
    vec2 q = vec2(mod(p.z + 2.5, 5.) - 2.5, p.y - .35);
    q.x *= mod(floor((p.z + 2.5) / 5.), 2.) < .5 ? -1. : 1.;
    e = (1. - Z(-.04, .04, paintBull(q * 1.15))) * (.55 + .5 * ns(q * 22.));
    e *= ACT == 5 ? 1. - .82 * Z(49., 55., BR) : ACT == 6 ? .35 : 1.;
    d = max(d, e * Z(41., 45., BR));
    // Small negative hands and counted dots sit between the large animals.
    vec2 h = vec2(mod(p.z + 4., 7.) - 3.5, p.y - 2.65) * 1.15;
    float hs = (1. - Z(1., 1.45, length(h))) * Z(-.03, .03, hand(h));
    d = max(d, hs * .72 * Z(41., 45., BR));
    vec2 g = vec2(mod(p.z, .42) - .21, mod(p.y + .1, .38) - .19);
    float dots = (1. - Z(.035, .075, length(g))) * (1. - Z(.2, .65, abs(p.y - 3.65))) * (.5 + .5 * ns(p.zy * 3.));
    d = max(d, dots * .65 * Z(41., 45., BR));
  }
  return sat(d);
}

void main() {
  vec2 u = (gl_FragCoord.xy * 2. - R.xy) / R.y;
  T = R.z; BR = T / 2.;
  ACT = BR < 8. ? 0 : BR < 16. ? 1 : BR < 24. ? 2 : BR < 40. ? 3 : BR < 48. ? 4 : BR < 56. ? 5 : 6;
  float start = float[7](0., 8., 16., 24., 40., 48., 56.)[ACT], dur = ACT == 3 ? 16. : 8., l = sat((BR - start) / dur);
  REL = 1.; HC = 0;
  for (int i = 0; i < 11; i++) HP[i] = vec3(0, 0, -100);
  if (ACT == 2) {
    HC = 1; REL = mix(5., 1., Z(17., 20., BR));
    HP[0] = vec3(mix(-4.75, -2.2, Z(17., 20., BR)), 0, -8.);
  } else if (ACT == 3 || ACT == 4) {
    HC = ACT == 4 ? (BR < 45. ? 7 : 0) : 11; REL = ACT == 4 ? mix(1., 8., Z(42., 45., BR)) : 1.;
    for (int i = 0; i < 11; i++) {
      float x = (float(i % 3) - 1.) * 2.1 + .2 * sin(float(i)),
            z = mod(float(i) * (ACT == 4 ? 6. : 3.4) + (BR - 24.) * 6., ACT == 4 ? 66. : 37.4) - (ACT == 4 ? 40. : 25.);
      if (ACT == 4) x = mix(x, (x < 0. ? -1. : 1.) * 5.1, Z(42., 45., BR));
      HP[i] = vec3(x, ACT == 3 ? .055 * sin(BR * 25.133 + float(i) * 1.7) : 0., z);
    }
  }
  vec3 ta, ro;
  if (ACT == 0) { ro = vec3(1.8 - .5 * l, 2.1, 4.5 - 1.5 * l); ta = vec3(-4.4, 2., -2.); }
  else if (ACT == 1) { ro = vec3(1.4 - .8 * l, 2., -2.5 - l); ta = vec3(-4.6, 1.65, -8.); }
  else if (ACT == 2) { ta = vec3(-2.4, 1.25, -8.); float a = l * 1.25; ro = ta + vec3(cos(a) * (4.6 - .3 * l), .65 + .2 * l, sin(a) * (4.6 - .3 * l)); }
  else if (ACT == 3) {
    int s = int((BR - 24.) / 4.); float v = fract((BR - 24.) / 4.);
    if (s == 0) { ro = vec3(3., 2., 6. - 2. * v); ta = vec3(0, 1.2, -8.); }
    else if (s == 1) { ro = vec3(5., 1.4, -4. - 4. * v); ta = vec3(0, 1., -8. - 4. * v); }
    else if (s == 2) { ro = vec3(-1.5, .65, 12.); ta = vec3(0, 1., -2.); }
    else { ro = vec3(1.5, 3.2, 15.); ta = vec3(0, 1., -2.); }
  }
  else if (ACT == 4) { ro = vec3(1.2, 3. + 2. * l, 12. - 2. * l); ta = vec3(0, 1.8, -5.); }
  else if (ACT == 5) { ro = vec3(2.5 - 1.2 * l, 2., 4. - 2. * l); ta = vec3(-4., 2., -5.); }
  else { ro = vec3(1.4 - .4 * l, 2.1, 3.5 - l); ta = vec3(-4.4, 2., -2.); }
  RO = ro;
  vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0, 1, 0), f)), rd = normalize(f * 1.62 + u.x * r + u.y * cross(f, r));
  float t = .03, d = 0., focus = length(ta - ro), m = -1.;
  int steps = R.x > 1200. ? 125 : 100;
  for (int i = 0; i < 125; i++) {
    if (i >= steps || t > 48.) break;
    d = map(ro + rd * t);
    if (d < .0015 + t * .00035) break;
    t += d * .68;
  }
  if (t < 48. && d < .025) m = M;
  vec3 p = ro + rd * t, q = Q, col = vec3(.018, .01, .006);
  if (m >= 0.) {
    vec3 n = vec3(0), e;
    for (int i = 0; i < 4; i++) {
      e = .5773 * (2. * vec3((i + 3) >> 1 & 1, i >> 1 & 1, i & 1) - 1.);
      n += e * map(p + e * .003);
    }
    n = normalize(n);
    vec3 lp = ro + f * .5 + vec3(.18, -.2, 0), lv = lp - p, ld = normalize(lv);
    float ds = length(lv), dl = sat(dot(n, ld)), sh = 1., s = .045, ao = sat(.35 + map(p + n * .25) * 2.5), pg = 0.;
    if (dl > .005) for (int i = 0; i < 16; i++) {
      float a = map(p + n * .035 + ld * s);
      sh = min(sh, sat(8. * a / s)); s += clamp(a, .04, .55);
    }
    float rock = .48 + .42 * ns(p.zy * 6. + ns(p.xz * 4.)) + .22 * ns(p.zy * 23. + p.xz * 3.),
          vein = pow(ns(p.zy * .8 + ns(p.xz * .7) * 2.), 16.);
    vec3 al = vec3(.19, .145, .098) * rock + vein * vec3(.11, .1, .075);
    if (m > .5 && m < 1.5) al = vec3(.11, .078, .047) * rock;
    if (m > 1.5 && m < 2.5) {
      al = ACT == 2 ? vec3(.34, .058, .016) : vec3(.095, .047, .024);
      al *= .65 + .45 * ns(p.zy * 11. + p.xz * 3.);
      if (min(length(q - vec3(1.49, 1.39, .285)), length(q - vec3(1.49, 1.39, -.285))) < .042) al = vec3(.003);
    }
    if (m > 2.5) al = vec3(.46, .34, .19) * rock;
    if (m < .5) {
      if (ACT == 0 || ACT == 6) {
        vec2 hv = vec2(p.z + 2., p.y - 1.85) * .55;
        float hm = (1. - Z(-.025, .025, hand(hv))) * (ACT == 0 ? Z(1.8, 4.8, BR) : 1.);
        al = mix(al, vec3(.018, .013, .009), hm * .9);
      }
      if (ACT >= 4) {
        vec2 hv = vec2(mod(p.z + 4., 7.) - 3.5, p.y - 2.65) * 1.15;
        al = mix(al, vec3(.025, .018, .012), (1. - Z(-.03, .03, hand(hv))) * .75);
      }
      pg = pigment(p);
      al = mix(al, vec3(.55, .052, .012) * (.65 + .45 * rock), pg);
      if (ACT == 2) {
        vec2 v = vec2(p.z + 8., p.y - 1.3);
        float cr = (1. - Z(.018, .055, abs(sin(atan(v.y, v.x) * 7. + ns(v * 4.) * 2.)))) * Z(.5, 1., length(v)) * (1. - Z(1.7, 2.6, length(v))) * Z(17., 19., BR);
        al *= 1. - cr * .72;
      }
      if (ACT == 5) al = mix(al, vec3(.48, .44, .34), Z(49., 56., BR) * (.18 + .45 * ns(p.zy * 4.)));
    }
    vec3 fire = vec3(1.75, .78, .32) * (.93 + .07 * sin(T * 17.) * sin(T * 7.3)) * (ACT == 3 ? 1.6 : ACT >= 4 ? 1.8 : 1.);
    col = al * (vec3(.07, .055, .045) * ao + fire * dl * sh * 5.2 / (1. + ds * ds * .16));
    col += al * vec3(.24, .11, .045) * (ACT >= 3 && ACT <= 5 ? 1. : .15) * ao;
    if (m > 1.5) col += al * vec3(.28, .16, .08) * ao * (ACT >= 3 ? 1.5 : .5);
    if (ACT == 5) col += vec3(.12, .018, .004) * pg;
    col += fire * pow(sat(dot(reflect(-ld, n), -rd)), 32.) * sh * .009 / (1. + ds * .2);
    col *= .55 + .45 * ao;
    col = mix(col, vec3(.012, .007, .004), Z(15., 42., t));
  }
  // Low torch scattering, kept out of the already dusty stampede.
  if (ACT != 3 && ACT != 4) {
    float v = 0.;
    for (int i = 0; i < 6; i++) {
      vec3 sp = ro + rd * min(t, 18.) * (float(i) + .5) / 6.;
      v += ns(sp.xy * 1.3 + sp.z) * exp(-float(i) * .25);
    }
    col += vec3(.025, .011, .004) * v / 6. * sat(t * .15);
  }
  // A little suspended dust catches the same torch, without becoming a starfield.
  for (int i = 0; i < 14; i++) {
    vec2 h = vec2(h1(vec2(i, 2)), h1(vec2(i, 7)));
    vec2 v = vec2(fract(h.x + T * .003), fract(h.y - T * .009)) * 2. - 1.;
    float a = sat((ACT == 3 ? .004 : .0025) / (length(u - v * vec2(1.7, 1.)) + .001));
    col += vec3(.3, .16, .065) * a * (ACT == 3 ? .28 : .14);
  }
  if (ACT == 3) col += vec3(.025, .011, .004) * Z(3., 18., t);
  O = vec4(clamp(col, 0., 4.), sat(abs(t - focus) / 14.) * .5);
}