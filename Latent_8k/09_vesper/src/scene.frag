#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

const float PI = 3.14159265;
const float TAU = 6.2831853;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

// Smooth cathedral + organum + rose window SDF.
// Returns distance; sets matID: 0 = basalt stone, 1 = brushed brass, 2 = stained glass / emissive
float map(vec3 p, float T, float beatPulse, out float matID) {
  matID = 0.0;

  // Repeating nave bay along Z (period 8.0)
  float pz = mod(p.z, 8.0) - 4.0;
  float ax = abs(p.x);

  // Side walls with lancet window cutouts
  float wall = 10.6 - ax;
  float winArch = max(abs(pz) - 1.25, abs(p.y - 7.8) - 4.8);
  // Pointed arch top for window
  float archTop = length(vec2(pz, max(p.y - 11.2, 0.0))) - 1.25;
  winArch = min(winArch, archTop);
  wall = max(wall, -winArch);

  // Vaulted ceiling (parabolic gothic arch)
  float ceilY = 21.5 - 0.055 * p.x * p.x;
  float ceiling = ceilY - p.y;
  // Transverse stone ribs at bay boundaries
  float rib = length(vec2(pz, p.y - ceilY)) - 0.42;
  float dArch = min(wall, min(ceiling, rib));

  // Fluted pillars at |x| = 7.4, pz = 0
  vec2 pilP = vec2(ax - 7.4, pz);
  float pilAng = atan(pilP.y, pilP.x);
  float pilR = 0.72 + 0.045 * cos(14.0 * pilAng);
  float pillar = length(pilP) - pilR;
  // Pillar plinth & capital
  float cap = sdBox(vec3(pilP.x, p.y - 12.2, pilP.y), vec3(0.95, 0.35, 0.95));
  pillar = min(pillar, cap);
  float d = min(dArch, pillar);

  // End wall & Rose Window at z = 88.0
  vec2 roseP = p.xy - vec2(0.0, 14.0);
  float roseR = length(roseP);
  float endWall = max(88.0 - p.z, -(roseR - 6.3));
  if (p.z > 76.0) {
    d = min(d, endWall);
    // Polar-folded gothic tracery inside the Rose Window
    float a = atan(roseP.y, roseP.x) + T * 0.04;
    float fold = abs(fract(a * 12.0 / TAU) - 0.5) * roseR;
    float spokes = fold - 0.15;
    float rings = abs(fract(roseR * 0.48) - 0.5) * 2.1 - 0.16;
    float petals = abs(roseR - 3.6 - 0.7 * cos(a * 12.0)) - 0.14;
    float tracery = max(min(min(spokes, rings), petals), abs(p.z - 88.0) - 0.28);
    tracery = max(tracery, roseR - 6.3);
    if (tracery < d) { d = tracery; matID = 0.0; }

    // Glowing stained glass pane behind tracery
    float glass = max(abs(p.z - 88.35) - 0.08, roseR - 6.2);
    if (glass < d) { d = glass; matID = 2.0; }
  }

  // Side lancet stained glass recessed panes
  float sideGlass = max(abs(ax - 10.8) - 0.06, winArch);
  if (sideGlass < d) { d = sideGlass; matID = 2.0; }

  // The Great Organum at z = 48.0 (culled outside [36, 60] for speed)
  if (abs(p.z - 48.0) < 12.0) {
    // Organ pipe array
    float ix = clamp(round(p.x / 0.52), -9.0, 9.0);
    float pipeX = p.x - ix * 0.52;
    float pipeZ = p.z - 48.0;
    float pipeH = 4.2 + 5.8 * exp(-0.06 * ix * ix) + 0.55 * beatPulse * (0.5 + 0.5 * sin(ix * 1.9 + T * 3.0));
    vec3 pp = vec3(pipeX, p.y - pipeH * 0.5 - 1.2, pipeZ);
    float pipe = max(length(pp.xz) - 0.17, abs(pp.y) - pipeH * 0.5);
    // Organ chest/pedestal
    float chest = sdBox(p - vec3(0.0, 0.7, 48.0), vec3(5.2, 0.7, 1.1));
    float dOrg = min(pipe, chest);

    // Concentric astrolabe brass rings around (0, 11.5, 45.5)
    vec3 rp = p - vec3(0.0, 11.5, 45.5);
    vec3 r1 = rp; r1.xy *= rot(T * 0.25); r1.yz *= rot(0.5);
    vec3 r2 = rp; r2.xz *= rot(-T * 0.35); r2.xy *= rot(1.1);
    float rings = min(sdTorus(r1, vec2(2.6, 0.07)), sdTorus(r2, vec2(1.9, 0.06)));
    dOrg = min(dOrg, rings);

    if (dOrg < d) {
      d = dOrg;
      matID = 1.0; // brushed brass
    }

    // Glowing resonator core inside the astrolabe
    float core = length(rp) - (0.55 + 0.12 * beatPulse);
    if (core < d) {
      d = core;
      matID = 2.0;
    }
  }

  return d;
}

vec3 calcNormal(vec3 p, float T, float beatPulse) {
  float m;
  vec2 e = vec2(0.004, -0.004);
  return normalize(
    e.xyy * map(p + e.xyy, T, beatPulse, m) +
    e.yyx * map(p + e.yyx, T, beatPulse, m) +
    e.yxy * map(p + e.yxy, T, beatPulse, m) +
    e.xxx * map(p + e.xxx, T, beatPulse, m)
  );
}

// Combined 1-loop soft shadow + ambient occlusion
float calcOccShadow(vec3 p, vec3 n, vec3 ldir, float T, float beatPulse) {
  float occ = 0.0, sca = 1.0, m;
  for (int i = 1; i <= 5; i++) {
    float h = 0.15 * float(i);
    float d = map(p + n * h + ldir * h * 0.6, T, beatPulse, m);
    occ += (h - d) * sca;
    sca *= 0.65;
  }
  return clamp(1.0 - 1.8 * occ, 0.08, 1.0);
}

// Stained glass spectral palette
vec3 glassColor(float phase) {
  return 0.55 + 0.45 * cos(TAU * (phase + vec3(0.0, 0.18, 0.48)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / R.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * R.xy) / R.y;
  float T = R.z;

  float beat = T * 2.0;
  float bar = beat * 0.25;
  float beatPulse = exp(-min(fract(beat) * 5.5, 40.0));

  // 6-Act Camera Choreography & Focal Distance
  vec3 ro = vec3(0.0, 2.2, 4.0);
  vec3 ta = vec3(0.0, 3.5, 20.0);
  float focalDist = 14.0;
  float actIntensity = 1.0;
  float fogDens = 0.022;

  if (T < 16.0) {
    // Act I: Threshold (0-16s) - low colonnade glide in warm amber mist
    float u = T / 16.0;
    ro = vec3(-2.4 + 1.4 * u, 1.15 + 0.5 * u, -10.0 + 16.0 * u);
    ta = vec3(0.4 - 0.4 * u, 2.8 + 1.8 * u, ro.z + 18.0);
    focalDist = 15.0;
    fogDens = 0.036;
    actIntensity = 0.55 + 0.45 * smoothstep(0.0, 5.0, T);
  } else if (T < 40.0) {
    // Act II: Nave of Echoes (16-40s) - soaring ribbed vaults & colored shafts
    float u = (T - 16.0) / 24.0;
    ro = vec3(sin(u * 3.14) * 3.2, 2.5 + 6.5 * u, 6.0 + 22.0 * u);
    ta = vec3(-sin(u * 2.0) * 1.5, 11.5 - 2.5 * u, ro.z + 16.0);
    focalDist = 18.0;
    fogDens = 0.024;
  } else if (T < 72.0) {
    // Act III: The Organum (40-72s) - dramatic sweep around the brass pipe organ
    float u = (T - 40.0) / 32.0;
    float ang = (u - 0.5) * 1.25;
    ro = vec3(sin(ang) * 7.8, 2.4 + 5.2 * sin(u * PI), 45.5 - cos(ang) * 12.0);
    ta = vec3(0.0, 7.2 + 2.2 * sin(u * PI), 47.2);
    focalDist = length(ta - ro);
  } else if (T < 96.0) {
    // Act IV: The Rose (72-96s) - centered mandala orbit (unobstructed)
    float u = (T - 72.0) / 24.0;
    ro = vec3(sin(u * 2.4) * 2.4, 13.2 + 1.2 * sin(u * PI), 69.0 + 10.5 * u);
    ta = vec3(0.0, 14.0, 88.0);
    focalDist = length(ta - ro);
  } else if (T < 116.0) {
    // Act V: Resonance Climax (96-116s) - sweeping crane past Organum (never clips pipes)
    float u = (T - 96.0) / 20.0;
    float ang = -0.75 + 1.5 * u;
    ro = vec3(sin(ang) * 7.2, 2.2 + 6.5 * sin(u * PI), 46.5 - cos(ang) * 16.0);
    ta = vec3(0.0, 7.5 + 3.0 * u, 48.0 + 16.0 * u);
    focalDist = 18.0;
    actIntensity = 1.15;
  } else {
    // Act VI: Benediction (116-128s) - calm pullback along mirror water
    float u = clamp((T - 116.0) / 12.0, 0.0, 1.0);
    ro = vec3(0.0, 1.3, 22.0 - 18.0 * u);
    ta = vec3(0.0, 4.2 - 1.5 * u, 50.0);
    focalDist = 16.0;
    fogDens = 0.028 + 0.015 * u;
    actIntensity = 1.0 - smoothstep(0.65, 1.0, u);
  }

  vec3 cw = normalize(ta - ro);
  vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
  vec3 cv = cross(cu, cw);
  vec3 rd = normalize(p.x * cu + p.y * cv + 1.55 * cw);

  vec3 roOrig = ro, rdOrig = rd;

  // Primary + 1 analytic water-plane reflection in a single march loop
  float t = 0.05;
  float tPrimary = 60.0;
  float matID = 0.0;
  bool refl = false;
  bool hit = false;
  vec3 att = vec3(1.0);
  vec3 col = vec3(0.0);
  vec3 hitPos = vec3(0.0);

  for (int i = 0; i < 96; i++) {
    vec3 q = ro + rd * t;

    // Analytic flooded mirror floor at y = 0.0
    if (q.y < 0.0 && !refl && rd.y < -0.001) {
      float tPlane = -ro.y / rd.y;
      tPrimary = tPlane;
      vec3 pw = ro + rd * tPlane;

      // Beat-synced cymatic ripples
      float rOrg = length(pw.xz - vec2(0.0, 48.0));
      float ripAmp = (0.004 + 0.012 * beatPulse) * smoothstep(0.0, 20.0, T) * (1.0 - smoothstep(116.0, 126.0, T));
      float nx = cos(rOrg * 3.5 - T * 6.0) * (pw.x / max(rOrg, 0.1)) * ripAmp + 0.005 * cos(pw.x * 6.0 + T * 2.0);
      float nz = cos(rOrg * 3.5 - T * 6.0) * ((pw.z - 48.0) / max(rOrg, 0.1)) * ripAmp + 0.005 * sin(pw.z * 5.0 - T * 1.6);
      vec3 nW = normalize(vec3(-nx, 1.0, -nz));

      float fres = 0.05 + 0.95 * pow(clamp(1.0 - dot(-rd, nW), 0.0, 1.0), 5.0);
      att *= fres * vec3(0.76, 0.84, 0.95);
      ro = pw + vec3(0.0, 0.02, 0.0);
      rd = reflect(rd, nW);
      t = 0.05;
      refl = true;
      continue;
    }

    float d = map(q, T, beatPulse, matID);
    if (d < 0.003 * t + 0.002) {
      if (!refl) tPrimary = t;
      hit = true;
      hitPos = q;
      break;
    }
    t += d * 0.85;
    if (t > 65.0) {
      if (!refl) tPrimary = 65.0;
      break;
    }
  }

  // Lighting
  vec3 ldir = normalize(vec3(0.35 * sin(T * 0.08), 0.55, 0.75));
  vec3 keyCol = mix(vec3(1.0, 0.68, 0.32), vec3(0.45, 0.72, 1.0), 0.5 + 0.5 * sin(T * 0.09));

  if (hit) {
    vec3 n = calcNormal(hitPos, T, beatPulse);
    float occ = calcOccShadow(hitPos, n, ldir, T, beatPulse);
    vec3 v = -rd;
    float ndl = max(dot(n, ldir), 0.0);
    vec3 h = normalize(ldir + v);
    float spec = pow(max(dot(n, h), 0.0), matID > 0.5 ? 64.0 : 24.0);

    if (matID < 0.5) {
      // Dark wet basalt / brutalist stone
      float grain = 0.85 + 0.15 * sin(hitPos.x * 9.0) * sin(hitPos.y * 7.0) * sin(hitPos.z * 9.0);
      vec3 albedo = vec3(0.045, 0.048, 0.058) * grain;
      col = albedo * (0.22 * occ + 1.4 * ndl * keyCol * occ) + vec3(0.18, 0.22, 0.28) * spec * occ;
    } else if (matID < 1.5) {
      // Brushed warm brass (The Organum)
      vec3 brass = vec3(0.85, 0.62, 0.28);
      float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 4.0);
      col = brass * (0.15 * occ + 1.2 * ndl * occ) + brass * spec * 2.4 * occ + vec3(0.4, 0.55, 0.85) * fres * 0.45;
    } else {
      // Stained glass / emissive core
      float phase = 0.08 * hitPos.z + 0.04 * hitPos.y + 0.03 * T;
      float em = 1.35 + 0.45 * beatPulse;
      if (hitPos.z > 82.0) {
        vec2 rp = hitPos.xy - vec2(0.0, 14.0);
        phase = atan(rp.y, rp.x) / TAU * 3.0 + length(rp) * 0.14 + T * 0.04;
        em = 1.05 + 0.25 * beatPulse;
      }
      vec3 gCol = mix(vec3(1.0, 0.62, 0.22), glassColor(phase), smoothstep(10.0, 22.0, T));
      col = gCol * em;
    }
  } else {
    // Deep twilight apse sky
    col = mix(vec3(0.01, 0.015, 0.03), vec3(0.06, 0.09, 0.16), clamp(rd.y * 0.6 + 0.3, 0.0, 1.0));
  }

  // Distance fog
  float fog = 1.0 - exp(-min(t * fogDens, 40.0));
  vec3 fogCol = mix(vec3(0.025, 0.018, 0.012), vec3(0.015, 0.022, 0.038), smoothstep(10.0, 24.0, T));
  col = mix(col, fogCol, fog) * att;

  // Volumetric God-Rays + drifting golden incense motes (22 jittered steps)
  float maxVolT = min(tPrimary, 46.0);
  float dt = maxVolT / 22.0;
  float jitter = hash12(gl_FragCoord.xy + fract(T) * 100.0);
  vec3 vol = vec3(0.0);
  for (int i = 0; i < 22; i++) {
    float tv = (float(i) + jitter) * dt;
    vec3 q = roOrig + rdOrig * tv;

    // Lancet window shafts (repeating every 8m in Z, angled inward from |x|=10)
    float qz = mod(q.z, 8.0) - 4.0;
    float beamY = 9.5 - 0.48 * (10.0 - abs(q.x));
    float inLancet = smoothstep(1.6, 0.2, abs(qz)) * smoothstep(3.2, 0.3, abs(q.y - beamY)) * smoothstep(10.5, 8.5, abs(q.x));

    // Rose window shaft (from z=88, y=14)
    float roseDist = length(q.xy - vec2(0.0, 14.0 - (88.0 - q.z) * 0.12));
    float inRose = smoothstep(7.5 + (88.0 - q.z) * 0.08, 1.0, roseDist) * smoothstep(42.0, 86.0, q.z);

    // Swirling incense / dust density + floating golden motes
    float dust = 0.55 + 0.45 * sin(q.x * 0.55 + T * 0.25) * sin(q.y * 0.65 - T * 0.18) * sin(q.z * 0.45 + T * 0.15);
    vec3 mp = fract(q * 0.85 - vec3(0.0, T * 0.12, 0.0)) - 0.5;
    float mote = smoothstep(0.06, 0.0, length(mp)) * smoothstep(14.0, 3.0, tv);

    vec3 shaftCol = mix(vec3(1.0, 0.66, 0.28), glassColor(q.z * 0.05 + T * 0.02), smoothstep(12.0, 28.0, T));
    vec3 roseCol = glassColor(atan(q.y - 14.0, q.x) / TAU + T * 0.04);

    vol += ((inLancet * shaftCol * 0.026 + inRose * roseCol * 0.032) * dust + mote * vec3(1.0, 0.78, 0.38) * 0.18) * (0.85 + 0.35 * beatPulse) * dt;
  }

  col = (col + vol) * actIntensity;

  // Circle of Confusion in alpha for post.frag Bokeh DoF
  float coc = clamp(abs(tPrimary - focalDist) / 22.0, 0.0, 1.0);
  O = vec4(clamp(col, 0.0, 32.0), coc);
}
