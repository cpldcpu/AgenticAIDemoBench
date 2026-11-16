#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

const float TAU = 6.2831853;
float T;

float hx(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hx(i), hx(i + vec2(1.0, 0.0)), f.x),
             mix(hx(i + vec2(0.0, 1.0)), hx(i + vec2(1.0)), f.x), f.y);
}

float hexd(vec2 p, float r) {
  p = abs(p);
  return max(dot(p, vec2(0.866025, 0.5)), p.y) - r;
}

// Distance to the nearest free-space boundary; m = 0 stone, 1 amethyst.
float map(vec3 p, out float m) {
  m = 0.0;
  if (T < 16.0) {
    // Act I: a shaft through the sediment
    return 6.0 - length(p.xz) + 0.4 * vn(p.xz * 0.7 + vec2(p.y * 0.35));
  }
  float R0 = 4.2 + 40.0 * smoothstep(96.0, 118.0, T);
  float wall = R0 - length(p) + 0.08 * vn(p.xy * 1.7 + vec2(p.z * 1.3));

  // Ring of ten columns that grows out of the floor, and a central crystal
  float hg = max(0.02, 3.2 * smoothstep(18.0, 40.0, T));
  float ang = atan(p.z, p.x) + 0.1 * T, sec = TAU / 10.0;
  ang = mod(ang + sec * 0.5, sec) - sec * 0.5;
  vec2 c = length(p.xz) * vec2(cos(ang), sin(ang));
  float col = max(hexd(vec2(c.x - 2.7, c.y), 0.42), abs(p.y + 4.0 - hg * 0.5) - hg * 0.5);
  float ca = cos(0.2 * T), sa = sin(0.2 * T);
  float cen = max(hexd(mat2(ca, -sa, sa, ca) * p.xz, 0.35), abs(p.y) - 2.6);
  float dc = min(col, cen);
  m = dc < wall ? 1.0 : 0.0;
  return min(wall, dc);
}

// March; accumulates amethyst glow in gl. Returns t (>= 50 means miss).
float march(vec3 ro, vec3 rd, out float m, out float gl) {
  float t = 0.0, d;
  gl = 0.0;
  for (int i = 0; i < 120; i++) {
    d = map(ro + rd * t, m);
    gl += m * 0.012 * exp(-3.0 * max(d, 0.0));
    if (d < 0.001 * t) break;
    t += d * 0.8;
    if (t > 50.0) break;
  }
  return t;
}

vec3 nor(vec3 p) {
  const vec3 K[4] = vec3[4](vec3(1, -1, -1), vec3(-1, -1, 1), vec3(-1, 1, -1), vec3(1, 1, 1));
  vec3 n = vec3(0.0);
  float m;
  for (int i = 0; i < 4; i++) n += K[i] * map(p + K[i] * 0.002, m);
  return normalize(n);
}

float ao(vec3 p, vec3 n) {
  float o = 0.0, m;
  for (int i = 1; i <= 4; i++) {
    float h = 0.09 * float(i);
    o += (h - map(p + n * h, m)) * pow(0.6, float(i));
  }
  return clamp(1.0 - 1.5 * o, 0.0, 1.0);
}

void main() {
  T = R.z;
  vec2 uv = (gl_FragCoord.xy * 2.0 - R.xy) / R.y;

  vec3 ro, ta = vec3(0.0);
  if (T < 16.0) {
    ro = vec3(1.2 * sin(0.4 * T), 3.0 - 0.5 * T, 1.2 * cos(0.3 * T));
    ta = ro + vec3(cos(0.2 * T), -0.4, sin(0.2 * T));
  } else if (T < 40.0) {
    float a = 0.22 * T;
    ro = 3.0 * vec3(cos(a), 0.5 * sin(0.3 * T), sin(a));
    ta = vec3(0.0, -0.4, 0.0);
  } else if (T < 72.0) {
    float a = 0.35 * T;
    ro = 2.4 * vec3(cos(a), 0.5 + 0.6 * sin(0.5 * T), sin(a));
    ta = vec3(0.0, 0.5, 0.0);
  } else if (T < 96.0) {
    float k = floor(T / 4.0);
    vec3 dir = vec3(hx(vec2(k, 1.0)), hx(vec2(k, 2.0)), hx(vec2(k, 3.0))) - 0.5;
    ro = 1.6 * normalize(dir + vec3(0.0, 0.15, 0.0));
  } else {
    float a = 0.2 * T;
    ro = 3.2 * vec3(cos(a), 0.8, sin(a));
  }

  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.7 * ww);

  float m, gl;
  float t = march(ro, rd, m, gl);
  vec3 bgc = mix(vec3(0.02, 0.01, 0.05), vec3(0.12, 0.05, 0.22), smoothstep(-0.3, 0.7, rd.y));
  vec3 col = bgc;
  if (t < 50.0) {
    vec3 p = ro + rd * t;
    vec3 n = nor(p);
    float o = ao(p, n);
    vec3 L = normalize(vec3(0.35, 1.0, 0.25));
    float dif = max(dot(n, L), 0.0);
    float fr = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    if (m > 0.5) {
      col = vec3(0.30, 0.08, 0.75) * (0.15 + 0.9 * dif) * o;
      col += vec3(0.1, 0.8, 0.75) * fr * 0.6;
      col += vec3(0.9, 0.8, 1.0) * pow(max(dot(reflect(rd, n), L), 0.0), 40.0) * 0.3;
    } else {
      float band = fract(p.y * 1.2 + 0.4 * vn(p.xz * 0.7));
      vec3 stone = mix(vec3(0.09, 0.08, 0.15), vec3(0.22, 0.16, 0.3), smoothstep(0.25, 0.8, band));
      col = stone * (0.2 + 0.8 * dif) * o + vec3(0.05, 0.25, 0.25) * fr * 0.5;
    }
    col += vec3(0.5, 0.15, 1.0) * gl * 0.2;
    col = mix(col, bgc, 1.0 - exp(-t * 0.05));
  } else {
    col += vec3(0.5, 0.15, 1.0) * gl * 0.2;
  }
  O = vec4(col, 1.0);
}
