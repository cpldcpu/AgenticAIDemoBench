#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

// SOUNDING -- night, open sea. A lighthouse sweeps its beam through the fog, and one
// boat keeps its own small lamp. Two kinds of light: the one that looks for you,
// and the one you keep.
const float TAU = 6.283185307;
float T, FOC;
vec3 CP, CR, CU, CF;
vec3 TWR, BOAT, BD;
float LON;

float h1(float n) { return fract(sin(n * 78.233 + 0.4) * 43758.5453); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y);
}
vec3 h3(vec3 p) { return fract(sin(p * vec3(127.1, 311.7, 74.7)) * 43758.5453); }

// ---------------------------------------------------------------------------
// The beam, as a closed-form line integral of a gaussian cone through the fog, so
// no ray can slip past it and there is no march step to undersample.
const float HALF = 0.040;
float beamInt(vec3 ro, vec3 rd, float halfw) {
  vec3 w = ro - TWR;
  float b = dot(BD, rd), d = dot(BD, w), e = dot(rd, w);
  float A = max(1.0 - b * b, 0.025);
  float t = (b * d - e) / A;
  float s = d + t * b;
  // If the ray's closest approach to the axis falls behind the lamp, the ray never
  // enters the cone: it is looking at the back of the beam. Clamping s here instead of
  // returning would invent a bright disc at the lamp -- a second moon in the sky.
  if (s < 0.0 || t < 0.0) return 0.0;
  float rad = 1.5 + s * halfw;
  float x = length(w + rd * t - BD * s) / rad;
  if (x > 3.4) return 0.0;
  // the chord length through the cone. A ray nearly parallel to the axis passes through
  // a lot of it, so ramp A in smoothly instead of letting the integral blow up into a comet.
  float path = rad * 1.10 / sqrt(A) * (1.0 - smoothstep(0.02, 0.30, 1.0 - A));
  path = min(path, 90.0);
  // the fog is not even: it drifts, so the cone is mottled and its edge is never clean
  float n = 0.45 + 1.05 * vn(vec2(s * 0.010 - T * 0.35, x * 2.2 + T * 0.05));
  return (exp(-x * x * 3.2) + 0.055 * exp(-x * x * 0.75)) * n * path * exp(-s * 0.00080);
}

// ---------------------------------------------------------------------------
// The sky. Moonless, and the fog on the horizon is the brightest thing in it.
vec3 sky(vec3 d, float lamp) {
  float y = max(d.y, 0.0);
  vec3 c = mix(vec3(0.0038, 0.0092, 0.0195), vec3(0.0009, 0.0028, 0.0072),
               smoothstep(0.0, 0.40, y));
  c += vec3(0.030, 0.058, 0.092) * exp(-y * 16.0) * 0.70;      // the bank of fog
  c += vec3(0.105, 0.140, 0.180) * exp(-y * 70.0) * 0.42;      // its silver hem

  if (d.y > 0.006) {                                            // stars above it
    vec3 q = d * 210.0, i = floor(q), r = h3(i);
    c += vec3(0.74, 0.86, 1.0) * smoothstep(0.05, 0.0, length(fract(q) - r * 0.8 - 0.2))
       * step(0.94, r.x) * pow(r.y, 4.0) * 4.0 * smoothstep(0.006, 0.12, d.y);
  }
  // the lamp, its halo, and the flare the lens throws when it faces us
  // a lighthouse lens is a small, hard, very bright point with a tight halo. Keep the
  // halo small: a big one turns the tower into a lollipop.
  // a lighthouse lens is a small, hard, very bright point with a tight halo. When the
  // beam is turned toward us the halo swells and a soft pair of spikes appears -- the
  // only flare in the piece, and it always sits exactly on the lamp.
  float la = 1.0 - dot(d, normalize(TWR - CP));
  float face = pow(max(dot(normalize(CP - TWR), BD), 0.0), 14.0);
  // The lantern room is 14 px wide at 300 m. A halo with a 23 px radius turns it into one
  // white blob, so the wide terms are small and the core stays hard: what makes this lamp
  // bright is its contrast against a near-black sky, not the size of its bloom.
  c += vec3(1.0, 0.95, 0.87) * (exp(-la * 1400000.0) * 6.0 + exp(-la * 120000.0) * 0.42
                              + exp(-la * 9000.0) * 0.045
                              + exp(-la * 900.0) * face * 0.30) * lamp;
  return c;
}

// the fleet: lanterns on the water, waiting to be found
vec3 fleetPos(int i) {
  float f = float(i) + 1.0;
  float a = -0.52 + h1(f * 3.7) * 1.04;                  // a fan across the view
  float dd = 90.0 + 520.0 * pow(h1(f * 5.3 + 2.0), 1.25);
  return vec3(sin(a), 0.0, cos(a)) * dd;
}

// Angular distance from a ray to a segment, both seen from ro. Used to draw the
// reflected tower and the reflected boat as the vertical streaks they really are.
// Perpendicular distance from the ray to the segment, in world units at the segment's
// depth. Exact for the whole segment, so a reflected tower is one long streak and not
// a pair of dots at its ends.
float segAng(vec3 ro, vec3 rd, vec3 a, vec3 b) {
  vec3 da = a - ro, db = b - ro;
  vec3 pa = da - rd * dot(da, rd);
  vec3 pb = db - rd * dot(db, rd);
  vec3 d = pb - pa;
  float t = clamp(-dot(pa, d) / max(dot(d, d), 1e-6), 0.0, 1.0);
  return length(pa + d * t);
}

// ---------------------------------------------------------------------------
// The boat, a flat cut-out facing the camera. q in metres, origin at the waterline.
// The outline was drawn and checked offline, then copied here vertex for vertex.
float hp(vec2 p, vec2 a, vec2 b) {
  vec2 v = b - a;
  return (v.x * (p.y - a.y) - v.y * (p.x - a.x)) / length(v);
}
// both return negative inside, so min() is a union
float q4(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  return max(max(hp(p, a, b), hp(p, b, c)), max(hp(p, c, d), hp(p, d, a)));
}
float tri(vec2 p, vec2 a, vec2 b, vec2 c) {
  return max(max(hp(p, a, b), hp(p, b, c)), hp(p, c, a));
}
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 v = b - a, w = p - a;
  return length(w - v * clamp(dot(w, v) / dot(v, v), 0.0, 1.0));
}
float boat(vec2 q) {
  // the hull, one convex outline: sheershoulder, topsides, keel
  float d = hp(q, vec2(-1.30, 0.06), vec2(-2.05, 1.02));
  d = max(d, hp(q, vec2(-2.05, 1.02), vec2(-1.10, 1.16)));
  d = max(d, hp(q, vec2(-1.10, 1.16), vec2(1.05, 1.16)));
  d = max(d, hp(q, vec2(1.05, 1.16), vec2(1.95, 1.06)));
  d = max(d, hp(q, vec2(1.95, 1.06), vec2(2.02, 0.62)));
  d = max(d, hp(q, vec2(2.02, 0.62), vec2(1.30, 0.00)));
  d = max(d, hp(q, vec2(1.30, 0.00), vec2(-1.30, 0.06)));
  // coachroof, mast, bowsprit
  d = min(d, q4(q, vec2(-0.62, 1.62), vec2(0.72, 1.62), vec2(0.60, 1.16), vec2(-0.55, 1.16)));
  d = min(d, seg(q, vec2(0.02, 1.10), vec2(0.02, 5.55)) - 0.055);
  d = min(d, seg(q, vec2(1.80, 1.00), vec2(2.72, 1.40)) - 0.040);
  // the gaff main, and the jib forward of the mast
  d = min(d, q4(q, vec2(0.10, 5.35), vec2(0.10, 1.55), vec2(-2.45, 1.62), vec2(-1.15, 5.10)));
  d = min(d, tri(q, vec2(1.72, 1.42), vec2(0.12, 4.55), vec2(0.12, 1.30)));
  return d;
}

void main() {
  T = R.z;
  float t = T;
  vec2 uv = (gl_FragCoord.xy * 2.0 - R.xy) / R.y;

  // placed by azimuth round the camera, so the shot is composed rather than found
  TWR = vec3(sin(-0.40), 1.0, cos(-0.40)) * 300.0;
  TWR.y = 45.4;
  BOAT = vec3(sin(0.13), 0.0, cos(0.13)) * 30.0;
  LON = smoothstep(15.0, 18.5, t);

  // The beam turns once every 16 s -- eight bars of the score -- and it sweeps over the
  // boat at 27.5 s, then 43.5, 59.5, 75.5, ... (a quarter turn after the phrase, because
  // the tower stands behind the boat as seen from the start). It is the clock of the piece.
  float bz = -0.40 + (t - 19.6) * (TAU / 16.0);
  BD = normalize(vec3(sin(bz), -(0.055 + 0.070 * (0.5 + 0.5 * cos(bz - 2.46))), cos(bz)));

  // --- One take, five moves. The camera orbits on the far side of the boat from the
  // tower and swings round it, so the boat sits under the tower, then the sea opens out
  // behind. Angles were solved and checked with 13_sounding/check_frame.py.
  float k = smoothstep(0.0, 126.0, t);
  // the azimuth of "straight away from the tower, past the boat"
  float away = atan(BOAT.x - TWR.x, BOAT.z - TWR.z);
  // the swing: it starts almost in line and opens out to 35 degrees
  float sw = 0.10 + 0.52 * k + 0.05 * sin(t * 0.19) + 0.03 * sin(t * 0.11 + 1.3);
  float rd_ = 40.0 - 16.0 * k;
  CP = vec3(BOAT.x + sin(away + sw) * rd_, 1.90 + 13.1 * pow(k, 1.2),
            BOAT.z + cos(away + sw) * rd_);

  // aim between the boat and the tower: the tower climbs the frame as we rise
  vec3 aim = normalize(mix(normalize(BOAT + vec3(0.0, 3.0, 0.0) - CP), normalize(TWR - CP), 0.5));
  CF = aim;
  CR = normalize(cross(CF, vec3(0.0, 1.0, 0.0)));
  CU = cross(CR, CF);
  float rl = 0.010 * sin(t * 0.24) + 0.006 * sin(t * 0.43 + 1.7) + 0.035 * smoothstep(108.0, 127.0, t);
  CR = CR * cos(rl) + CU * sin(rl);
  CU = cross(CR, CF);
  FOC = 2.05;

  vec3 rd = normalize(CF + (uv.x * CR + uv.y * CU) / FOC);
  vec3 col = sky(rd, LON);

  // --- the sea: near-black, carrying only what it can mirror
  if (rd.y < 0.0) {
    float tw = CP.y / max(-rd.y, 1e-4);
    vec3 p = CP + rd * tw;
    // deep-water waves, dispersed by gravity, laid out on a golden angle so the sum
    // never lines up into a lattice. Analytic, so the normal is exact.
    vec2 g = vec2(0.0);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      vec2 dir = vec2(cos(fi * 2.39996 + 0.7), sin(fi * 2.39996 + 0.7));
      float f = 0.055 * pow(1.72, fi);
      float a = 0.115 / (1.0 + fi * 0.85);
      float w = sqrt(9.81 * f) * 0.55;
      g += dir * a * cos(dot(p.xz, dir) * f + t * w);
    }
    // the chop flattens with distance, which is also what stops it aliasing
    g /= 1.0 + tw * 0.06;

    vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
    vec3 rr = reflect(rd, n);

    float fr = 0.015 + 0.75 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
    col = sky(rr, 0.0) * fr * 0.62 + vec3(0.0006, 0.0016, 0.0036) * (0.5 + 0.5 * n.y);
    // a faint sheen: the sky is not bright, but it is above us, and water says so
    col += vec3(0.018, 0.030, 0.046) * exp(-tw * 0.015) * fr;
    // the beam, mirrored: the long torn streak it leaves down the swell
    col += vec3(0.42, 0.62, 0.95) * beamInt(p, rr, HALF) * LON * 0.0034;
    // ... and where the cone lands: the pool of lit sea. This is what tells the eye the
    // beam is a volume of light in air and not a painted streak.
    float sPool = TWR.y / max(-BD.y, 0.05);
    vec2 cPool = TWR.xz + BD.xz / max(-BD.y, 0.05) * TWR.y;
    vec2 dp = p.xz - cPool;
    // the ellipse is longest along the beam's own azimuth
    vec2 bAz = normalize(BD.xz + 1e-5);
    float along = dot(dp, bAz), across = dot(dp, vec2(-bAz.y, bAz.x));
    float rA = 7.0 + sPool * HALF * 1.9, rB = 5.0 + sPool * HALF * 0.55;
    float poolF = exp(-(along * along / (rA * rA) + across * across / (rB * rB)) * 1.1);
    poolF *= exp(-sPool * 0.0016) * smoothstep(24.0, 2.0, abs(along));
    col += vec3(0.34, 0.52, 0.82) * poolF * LON * 0.055 * (0.25 + 0.75 * n.y);
    // the reflected tower: its mirror image is a vertical bright line under it, and the
    // swell breaks that line into a path. Drawn against the mirrored segment so the
    // streak is vertical and properly long, not a round halo.
    vec3 twrB = vec3(TWR.x, 0.0, TWR.z);
    float aRef = segAng(CP, rd, twrB, twrB - vec3(0.0, TWR.y, 0.0));
    float spear = smoothstep(0.0, 26.0, tw);
    float wRef = 1.1 + tw * 0.022;          // a path of light widens with distance
    float shadow = exp(-pow(aRef / wRef, 2.0)) * exp(-tw * 0.0020);
    // broken along its length, so it reads as light on water and not as a shaft in air
    shadow *= 0.30 + 0.70 * vn(vec2(tw * 0.05, p.x * 0.30 + T * 0.35));
    shadow *= 0.35 + 0.65 * vn(vec2(p.x * 1.7, p.z * 1.3 + T * 0.8));
    shadow *= exp(-tw * 0.0016);
    col += vec3(1.0, 0.90, 0.74) * shadow * LON * 0.30 * (0.15 + 0.85 * n.y);

    // the reflected boat: the same cut-out, mirrored in the water plane
    {
      vec3 nb = normalize(CP - BOAT - vec3(0.0, 0.0, 0.0));
      vec3 rtb = normalize(cross(vec3(0.0, 1.0, 0.0), nb));
      vec3 upb = cross(nb, rtb);
      float dnr = dot(rr, nb);
      if (dnr < -1e-4) {
        vec3 hp2 = p + rr * (dot(BOAT - p, nb) / dnr);
        vec2 q2 = vec2(dot(hp2 - BOAT, rtb), -dot(hp2 - BOAT, upb));
        q2.y -= 0.10 * sin(t * 0.33) + 0.04 * sin(t * 0.61 + 2.0);
        q2.x -= 0.35;
        float dr = boat(q2);
        float mr = smoothstep(0.05, -0.05, dr);
        float dfade = exp(-tw * 0.012) * 0.75;
        col = mix(col, vec3(0.0026, 0.0045, 0.0082), mr * dfade);
        // the lantern's reflection is a vertical streak, not a halo: squash it along y
        vec2 lq = q2 - vec2(0.30, -5.62);
        float dlr = length(vec2(lq.x * 0.55, lq.y * 0.13));
        col += vec3(1.0, 0.66, 0.30) * exp(-dlr * 2.4) * 0.42 * dfade;
      }
    }
    col = mix(col, vec3(0.020, 0.040, 0.065), pow(smoothstep(300.0, 4200.0, tw), 1.2) * 0.97);
    // and the far water dissolves into the fog, so there is no drawn horizon line
    col += vec3(0.030, 0.052, 0.080) * smoothstep(1200.0, 9000.0, tw);
  }
  // the beam in the air, over everything. Where it points at the lens, keep it soft:
  // a hard additive disc there reads as a bug, not as light.
  // No separate forward-scatter term: it peaks where the view axis lines up with the
  // beam, which is beside the lamp rather than on it, and reads as a second moon.
  // The lamp's own halo in sky() carries the flash when the beam turns toward us.
  float onAxis = max(dot(rd, -BD), 0.0);
  float soft = 1.0 / (1.0 + pow(onAxis, 10.0) * 34.0);
  col += vec3(0.46, 0.66, 1.0) * beamInt(CP, rd, HALF) * LON * 0.012 * soft;


  // --- the fleet
  for (int i = 0; i < 12; i++) {
    vec3 b = fleetPos(i) + vec3(0.0, 1.2, 0.0);
    float d2 = length(b - CP);
    float ang = 1.0 - dot(rd, normalize(b - CP));
    // A lantern is a point at this range. Keep the halo tight, but not below the size of a
    // pixel: a gaussian narrower than the pixel grid samples as a dot that flickers between
    // frames and vanishes, so the far ones were barely visible at 1080p.
    float sig = max(0.30 / d2, 0.0011);
    float lit = smoothstep(0.02, 0.30, beamInt(b, normalize(b - TWR), HALF) * LON);
    float keep = smoothstep(34.0, 60.0, t) * 0.55;
    // the further away, the more of its light one pixel collects: hold the apparent
    // brightness up a little as the lantern shrinks
    col += vec3(1.0, 0.60, 0.26) * (lit * 2.2 + keep) * (0.45 + 0.55 * d2 / 300.0)
         * exp(-ang / (sig * sig)) / (1.0 + d2 * 0.0012);
  }

  // --- the tower: a slim tapered shaft, a gallery that overhangs it, a lantern room
  // and a domed roof. Black on the fog: the silhouette is the point.
  {
    vec3 ax = normalize(vec3(TWR.x, 0.0, TWR.z));
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), ax));
    vec3 base = vec3(TWR.x, 0.0, TWR.z);
    float dn = dot(rd, ax);
    if (dn > 1e-4) {
      vec3 hpp = CP + rd * (dot(base - CP, ax) / dn);
      vec2 q = vec2(dot(hpp - base, rt), hpp.y);
      // TWR is the lens itself, which sits in the middle of the glazing. The shaft stops
      // at the gallery, one glazing half-height below it: with the shaft drawn to the lamp
      // the whole lantern room was hidden behind its own silhouette and the tower read as
      // a bare spike with a blob under it.
      float H = TWR.y - 1.35;
      // the shaft: a clean taper, a little wider at the base
      float wd = mix(2.9, 1.85, clamp(q.y / H, 0.0, 1.0));
      // The cut-out stops at the waterline. Drawn below it (as it was, by 90 m) the
      // silhouette painted a black column straight down over the sea, through the
      // tower's own reflection.
      float d = max((abs(q.x) - wd) * 2.0, max(-q.y, q.y - H) * 2.0);
      // gallery: a thin disc that overhangs the shaft
      d = min(d, max(abs(q.y - H) - 0.30, abs(q.x) - 2.85) * 2.0);
      // lantern room: glazing, wider than the head of the shaft
      d = min(d, max(abs(q.x) - 1.85, abs(q.y - H - 1.35) - 1.05) * 2.0);
      // roof: a shallow dome on top
      d = min(d, max(abs(q.x) - 2.20, abs(q.y - H - 2.75) - 0.40) * 2.0);
      col = mix(col, vec3(0.0035, 0.0060, 0.0105), smoothstep(2.0, -2.0, d) * 0.985);
      // the glazing is glass and the lens burns behind it, but the room still has mullions:
      // a solid white block there turns the whole head into one blob at this range
      float glass = smoothstep(0.10, -0.10, max(abs(q.x) - 1.85, abs(q.y - H - 1.35) - 1.05));
      glass *= 0.55 + 0.45 * step(0.45, abs(fract(q.x * 0.45) - 0.5));
      col = mix(col, vec3(1.0, 0.95, 0.86) * 0.85 * LON, glass * 0.62);
      // the gallery rail and the roof edge each take a line of the lamp
      float rail = smoothstep(0.22, 0.0, abs(q.y - H - 0.34)) * step(abs(q.x), 2.9);
      float eave = smoothstep(0.20, 0.0, abs(q.y - H - 3.10)) * step(abs(q.x), 2.3);
      col += vec3(1.0, 0.90, 0.76) * (rail + eave * 0.6) * 0.30 * LON;
    }
  }

  // --- the boat
  {
    vec3 n = normalize(CP - BOAT);
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), n));
    vec3 up = cross(n, rt);
    float dn = dot(rd, n);
    if (dn < -1e-4) {
      vec3 hpp = CP + rd * (dot(BOAT - CP, n) / dn);
      vec2 q = vec2(dot(hpp - BOAT, rt), dot(hpp - BOAT, up));
      // it rides an easy swell
      q.y -= 0.10 * sin(t * 0.33) + 0.04 * sin(t * 0.61 + 2.0);
      float ro = 0.028 * sin(t * 0.33 + 0.9);
      q = mat2(cos(ro), -sin(ro), sin(ro), cos(ro)) * q;
      q.x -= 0.35;
      vec2 lp = vec2(0.30, 5.62);

      float d = boat(q);
      float m = smoothstep(0.030, -0.030, d);
      m = max(m, smoothstep(0.06, -0.06, length(q - lp) - 0.17));

      // a dark silhouette, warmed only where its own lamp reaches.
      // No rim line: a rim on a union draws creases where two shapes meet.
      float dl = length(q - lp);
      float warm = exp(-max(dl - 0.15, 0.0) * 1.35);
      // It is a silhouette, but never flat: the sky behind is brighter high up, so the
      // sail picks up a little of it and the hull, low down, almost none.
      vec3 sh = vec3(0.0042, 0.0078, 0.0145) * mix(0.45, 3.4, smoothstep(-0.3, 5.6, q.y));
      sh += vec3(0.62, 0.26, 0.075) * warm * warm * 0.55;
      col = mix(col, sh, m);

      // one lamp, with its own flower of light, all in the boat's plane
      float glow = exp(-dl * 2.2);
      col += vec3(1.0, 0.66, 0.30) * glow * (0.85 * m + 0.55 * (1.0 - m));
    }
  }

  O = vec4(max(col, 0.0), 1.0);
}
