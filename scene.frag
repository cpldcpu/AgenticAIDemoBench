#version 430
layout(location = 0) uniform int F;
layout(binding = 0) uniform sampler2D A;
layout(location = 0) out vec4 O;

const vec2 R = vec2(1920., 1080.);
uint S;

uint pcg() {
  S = S * 747796405u + 2891336453u;
  uint w = ((S >> ((S >> 28u) + 4u)) ^ S) * 277803737u;
  return (w >> 22u) ^ w;
}
float rnd() { return float(pcg()) / 4294967296.; }
vec2 rnd2() { return vec2(rnd(), rnd()); }

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Material IDs:
// 0: stone architecture / plinth (travertine / dark basalt)
// 1: dark slate wet floor
// 2: cut optical crystal prism / lens (dispersive crown glass)
// 3: blown glass sphere (clear thin-wall shell)
// 4: brushed brass rings / accents
// 5: glowing amber core filament

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}

float sdTriPrism(vec3 p, vec2 h) {
  vec3 q = abs(p);
  return max(q.z - h.y, max(q.x * .866025 + p.y * .5, -p.y) - h.x * .5);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

vec2 opU(vec2 a, vec2 b) { return a.x < b.x ? a : b; }

vec2 map(vec3 p) {
  // Ground dark slate plane + stepped obsidian/travertine plinth
  float fl = p.y;
  float pl = sdBox(p - vec3(0., .16, 0.), vec3(2.8, .16, 1.55)) - .02;
  float pl2 = sdBox(p - vec3(0., .36, 0.), vec3(2.15, .06, 1.05)) - .015;
  vec2 d = vec2(fl, 1.);
  d = opU(d, vec2(min(pl, pl2), 0.));

  // Architectural sanctuary: rear travertine wall with sunlit arched openings & fluted colonnade
  float backWall = sdBox(p - vec3(0., 3.2, -4.6), vec3(9., 3.4, .4));
  // Three tall arched portals letting cool sky + sunbeams enter
  vec3 wp = p - vec3(0., 2.4, -4.6);
  wp.x = mod(wp.x + 1.5, 3.) - 1.5;
  float arch = max(abs(wp.x) - .78, wp.y - 1.2);
  arch = min(arch, length(vec2(wp.x, wp.y - 1.2)) - .78);
  arch = max(arch, abs(wp.z) - .6);
  backWall = max(backWall, -arch);

  // Side walls + ceiling with overhead oculus slit
  float ceiling = sdBox(p - vec3(0., 5.2, 0.), vec3(9., .35, 7.));
  float oculus = sdBox(p - vec3(1.1, 5.2, -.4), vec3(1.15, .5, 1.8));
  ceiling = max(ceiling, -oculus);
  float sideW = min(sdBox(p - vec3(-5.8, 3., 0.), vec3(.4, 3.4, 7.)),
                    sdBox(p - vec3( 5.8, 3., 0.), vec3(.4, 3.4, 7.)));
  float archStr = min(min(backWall, ceiling), sideW);

  // Fluted rear colonnade
  vec3 cp = p - vec3(0., 0., -3.2);
  cp.x = abs(cp.x);
  if (cp.x > .85) {
    float cx = mod(cp.x - .85 + .85, 1.7) - .85;
    vec3 q = vec3(cx, cp.y, cp.z);
    float col = length(q.xz) - (.32 - .022 * cos(atan(q.z, q.x) * 14.));
    col = max(col, abs(q.y - 2.7) - 2.7);
    archStr = min(archStr, col);
  }
  // Upper lintel beam
  archStr = min(archStr, sdBox(p - vec3(0., 4.75, -3.2), vec3(8., .42, .48)));
  d = opU(d, vec2(archStr, 0.));

  // Centerpiece 1: Cut triangular optical crystal prism on left plinth
  vec3 tp = p - vec3(-1.32, .96, .18);
  tp.xz *= rot(.58);
  tp.xy *= rot(-.24);
  float prism = sdTriPrism(tp, vec2(.76, .52)) - .015;
  d = opU(d, vec2(prism, 2.));

  // Centerpiece 2: Hollow blown-glass sphere + inner amber filament + brass gimbal rings
  vec3 sp = p - vec3(.08, 1.24, -.04);
  float rSph = length(sp);
  float glassShell = abs(rSph - .74) - .04;
  d = opU(d, vec2(glassShell, 3.));

  vec3 rp1 = sp; rp1.yz *= rot(.58); rp1.xy *= rot(.42);
  vec3 rp2 = sp; rp2.xz *= rot(-.75); rp2.yz *= rot(1.08);
  float rings = min(sdTorus(rp1, vec2(.50, .024)), sdTorus(rp2, vec2(.36, .020)));
  float cradle = sdTorus(p - vec3(.08, .45, -.04), vec2(.56, .034));
  d = opU(d, vec2(min(rings, cradle), 4.));

  // Inner warm glowing amber orb
  d = opU(d, vec2(rSph - .17, 5.));

  // Centerpiece 3: Right-side upright biconvex glass disc + brass pedestal + calibration sphere
  vec3 lp = p - vec3(1.38, .92, .08);
  vec3 lpr = lp;
  lpr.xz *= rot(-.42);
  float lens = max(length(lpr) - .46, abs(lpr.z) - .11) - .015;
  d = opU(d, vec2(lens, 2.));
  // Brass ring mount & small calibration sphere
  float mount = sdTorus(lpr.xzy, vec2(.49, .022));
  float stem = sdBox(p - vec3(1.38, .44, .08), vec3(.06, .04, .06)) - .01;
  float orb2 = length(p - vec3(1.06, .62, .56)) - .19;
  d = opU(d, vec2(min(min(mount, stem), orb2), 4.));

  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(1., -1.) * .0006;
  return normalize(
    e.xyy * map(p + e.xyy).x +
    e.yyx * map(p + e.yyx).x +
    e.yxy * map(p + e.yxy).x +
    e.xxx * map(p + e.xxx).x
  );
}

vec2 trace(vec3 ro, vec3 rd, float side, float maxT) {
  float t = .002;
  for (int i = 0; i < 150; i++) {
    vec2 h = map(ro + rd * t);
    float d = h.x * side;
    if (abs(d) < .0005 * (1. + t * .15)) return vec2(t, h.y);
    t += max(abs(d), .0004);
    if (t > maxT) break;
  }
  return vec2(-1., -1.);
}

vec3 cosineHemi(vec3 n) {
  vec2 u = rnd2();
  float a = 6.2831853 * u.x;
  float z = u.y * 2. - 1.;
  float r = sqrt(max(0., 1. - z * z));
  return normalize(n + vec3(r * cos(a), r * sin(a), z));
}

vec3 sunDir = normalize(vec3(.36, .84, -.41));

vec3 skyColor(vec3 rd) {
  float sunCos = max(dot(rd, sunDir), 0.);
  vec3 sky = mix(vec3(.14, .22, .38), vec3(.32, .48, .74), clamp(rd.y * .5 + .5, 0., 1.));
  // Bright intense sun disk for sharp path-traced caustics + warm corona
  float disk = smoothstep(.996, .9988, sunCos);
  sky += vec3(1., .84, .56) * (disk * 180. + pow(sunCos, 32.) * 4.5);
  return sky;
}

float shadowSun(vec3 p) {
  vec3 d = normalize(sunDir + (vec3(rnd(), rnd(), rnd()) - .5) * .045);
  vec2 h = trace(p + d * .01, d, 1., 18.);
  return h.x < 0. ? 1. : (h.y == 2. || h.y == 3. ? .38 : 0.);
}

vec3 tracePath(vec3 ro, vec3 rd, int ch) {
  vec3 col = vec3(0.);
  vec3 thr = vec3(1.);
  float side = 1.;

  // Spectral channel + Cauchy dispersion
  float wl = float(ch) * .5;
  vec3 specMask = ch == 0 ? vec3(3., 0., 0.) : (ch == 1 ? vec3(0., 3., 0.) : vec3(0., 0., 3.));
  thr *= specMask;

  // Volumetric single-scattering in the sunbeam
  vec2 hit0 = trace(ro, rd, 1., 24.);
  float tMax = hit0.x > 0. ? hit0.x : 14.;
  float tVol = rnd() * min(tMax, 9.);
  vec3 vp = ro + rd * tVol;
  if (vp.y > .1 && vp.y < 5.1) {
    vec2 sh = trace(vp, sunDir, 1., 14.);
    if (sh.x < 0.) {
      float phase = .10 + .55 * pow(max(dot(rd, sunDir), 0.), 5.);
      col += thr * vec3(1., .84, .56) * phase * .055;
    }
  }

  for (int b = 0; b < 8; b++) {
    vec2 h = (b == 0) ? hit0 : trace(ro, rd, side, 24.);
    if (h.x < 0.) {
      col += thr * skyColor(rd);
      break;
    }

    vec3 p = ro + rd * h.x;
    vec3 n = calcNormal(p) * side;
    int mat = int(h.y + .5);

    if (mat == 5) {
      col += thr * vec3(4.8, 2.2, .65);
      break;
    }

    // Subtle crystal tint via Beer-Lambert absorption
    if (side < 0.) {
      vec3 sigma = (mat == 2) ? vec3(.14, .035, .045) : vec3(.04, .02, .015);
      thr *= exp(-sigma * h.x);
    }

    if (mat == 2 || mat == 3) {
      float ior = (mat == 2) ? (1.51 + .075 * wl) : (1.48 + .02 * wl);
      float eta = (side > 0.) ? (1. / ior) : ior;
      float cosi = clamp(-dot(rd, n), 0., 1.);
      float f0 = (1. - eta) / (1. + eta); f0 *= f0;
      float fresnel = f0 + (1. - f0) * pow(1. - cosi, 5.);
      vec3 refl = reflect(rd, n);
      vec3 refr = refract(rd, n, eta);
      if (length(refr) < .001 || rnd() < fresnel) {
        ro = p + n * .002;
        rd = refl;
      } else {
        ro = p - n * .003;
        rd = normalize(refr);
        side = -side;
      }
      continue;
    }

    float rough = .82;
    vec3 albedo = vec3(.58, .52, .44);
    float metal = 0.;

    if (mat == 0) {
      float grain = sin(p.y * 22. + sin(p.x * 6. + p.z * 5.) * 1.3) * .5 + .5;
      albedo = mix(vec3(.44, .40, .35), vec3(.62, .56, .48), grain);
      if (p.y < .46 && abs(p.x) < 3.0 && abs(p.z) < 1.7) {
        albedo = vec3(.09, .10, .12);
        rough = .16;
      }
    } else if (mat == 1) {
      float tile = smoothstep(.01, .03, abs(fract(p.x * .5) - .5)) * smoothstep(.01, .03, abs(fract(p.z * .5) - .5));
      albedo = mix(vec3(.04, .045, .055), vec3(.09, .10, .12), tile);
      rough = mix(.20, .07, tile);
    } else if (mat == 4) {
      albedo = vec3(.93, .72, .34);
      rough = .13;
      metal = 1.;
    }

    float f0 = metal > .5 ? .88 : .04;
    float cosi = clamp(-dot(rd, n), 0., 1.);
    float specP = f0 + (1. - f0) * pow(1. - cosi, 5.);

    if (metal > .5 || rnd() < specP) {
      vec3 rdir = normalize(reflect(rd, n) + cosineHemi(n) * rough * rough);
      if (dot(rdir, n) <= 0.) rdir = cosineHemi(n);
      thr *= mix(vec3(1.), albedo, metal);
      ro = p + n * .002;
      rd = rdir;
    } else {
      // Direct NEE to sun
      float vis = shadowSun(p);
      float ndl = max(dot(n, sunDir), 0.);
      col += thr * albedo * vec3(1., .86, .60) * (ndl * vis * 2.5);
      // Direct NEE to inner amber core
      vec3 toOrb = vec3(.08, 1.24, -.04) - p;
      float d2 = dot(toOrb, toOrb);
      vec3 ldir = toOrb * inversesqrt(d2);
      float ndo = max(dot(n, ldir), 0.);
      if (ndo > 0.) {
        vec2 oh = trace(p + n * .003, ldir, 1., sqrt(d2) - .2);
        if (oh.x < 0. || oh.y == 3.) {
          col += thr * albedo * vec3(1.9, .78, .22) * (ndo / (1. + d2 * 1.4)) * (oh.x < 0. ? 1. : .75);
        }
      }
      thr *= albedo;
      ro = p + n * .002;
      rd = cosineHemi(n);
    }

    if (b > 2) {
      float pSurv = clamp(max(thr.r, max(thr.g, thr.b)), .05, .95);
      if (rnd() > pSurv) break;
      thr /= pSurv;
    }
  }
  return min(col, vec3(22.));
}

void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  if (F < 0) {
    vec4 acc = texelFetch(A, px, 0);
    vec3 c = acc.rgb / max(acc.a, 1.);

    // Subtle wide highlight bloom from accumulated HDR buffer
    vec3 glow = vec3(0.);
    for (int i = -2; i <= 2; i++) {
      for (int j = -2; j <= 2; j++) {
        vec4 s = texelFetch(A, clamp(px + ivec2(i, j) * 6, ivec2(0), ivec2(1919, 1079)), 0);
        vec3 sc = s.rgb / max(s.a, 1.);
        glow += max(sc - 1.05, 0.);
      }
    }
    c += glow * .02;

    // Vignette
    vec2 uv = gl_FragCoord.xy / R - .5;
    c *= 1. - dot(uv, uv) * .42;

    // Exposure + Narkowicz ACES filmic tone map
    c *= .88;
    c = (c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14);
    c = pow(clamp(c, 0., 1.), vec3(1. / 2.2));

    S = uint(px.x) * 1973u + uint(px.y) * 9277u + 1337u;
    c += (rnd() - .5) / 255.;
    O = vec4(c, 1.);
    return;
  }

  S = uint(px.x) * 1973u + uint(px.y) * 9277u + uint(F) * 26699u + 1u;
  vec2 jit = rnd2() - .5;
  vec2 uv = (gl_FragCoord.xy + jit - .5 * R) / R.y;

  vec3 ro = vec3(-.42, 1.72, 4.85);
  vec3 ta = vec3(.02, 1.04, -.15);
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(fw, vec3(0., 1., 0.)));
  vec3 up = cross(rt, fw);

  // Thin-lens Depth of Field focused on centerpiece (~4.95 m)
  vec3 rd = normalize(fw * 2.05 + rt * uv.x + up * uv.y);
  vec2 ap = rnd2();
  float r = sqrt(ap.x) * .034, th = 6.2831853 * ap.y;
  vec3 focusPt = ro + rd * (4.95 / dot(rd, fw));
  ro += (rt * cos(th) + up * sin(th)) * r;
  rd = normalize(focusPt - ro);

  vec3 col = tracePath(ro, rd, F % 3);
  O = vec4(col, 1.);
}
