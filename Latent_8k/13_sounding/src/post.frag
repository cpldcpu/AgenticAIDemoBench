#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

// one row (0..7) of the typography atlas, centred at pos
float ink(vec2 uv, vec2 pos, float w, float idx) {
  vec2 size = vec2(w, w * R.x / R.y / 16.0);
  vec2 q = (uv - pos) / size + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
  vec2 b = vec2(q.x, (7.0 - idx + q.y) / 8.0);
  return max(texture(B, b).a, 0.5 * textureLod(B, b, 2.2).a);
}

float h1(float n) { return fract(sin(n * 78.233 + 0.4) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / R.xy;
  float T = R.z;
  vec3 c = texture(A, uv).rgb;

  // Halation: light blooms in the water on the lens, and only the highlights do it, so
  // subtract a floor first. Blue, because the beam and the fog are blue.
  vec3 b1 = textureLod(A, uv, 2.2).rgb;
  vec3 b2 = textureLod(A, uv, 4.2).rgb;
  vec3 b3 = textureLod(A, uv, 6.0).rgb;
  c += max(b1 - 0.30, 0.0) * vec3(0.30, 0.46, 0.95) * 0.60;
  c += max(b2 - 0.18, 0.0) * vec3(0.22, 0.38, 0.90) * 0.45;
  c += max(b3 - 0.12, 0.0) * vec3(0.16, 0.28, 0.85) * 0.35;

  // A slow anamorphic wash across the frame at every beam pass, so the turns of the
  // light are felt even when the shaft is out of shot.
  c *= 1.0 + 0.06 * sin(T * 6.283185307 / 16.0);

  c = aces(c * 1.30);

  // vignette, gentle: this is a night picture and the corners should fall away
  vec2 q = uv - vec2(0.5, 0.48);
  c *= 1.0 - dot(q, q) * 1.35;

  c = pow(max(c, 0.0), vec3(0.4545));

  // film grain, seeded by the frame so it crawls the way film does, and only in the
  // shadows, where a real negative would show it
  float g = h1(dot(floor(gl_FragCoord.xy), vec2(1.0, 137.0)) + floor(T * 24.0) * 311.7) - 0.5;
  c += g * 0.022 * (1.0 - c);

  // --- typography
  // The title block sits in the empty upper sky: at 0.60 the subtitle landed on the
  // lantern's glow and read as a smudge behind it.
  float tt = smoothstep(2.2, 3.6, T) * (1.0 - smoothstep(9.5, 11.5, T));
  c = mix(c, vec3(0.86, 0.90, 0.96), ink(uv, vec2(0.5, 0.775), 0.30, 0.0) * tt);
  c = mix(c, vec3(0.55, 0.66, 0.80), ink(uv, vec2(0.5, 0.700), 0.17, 1.0) * tt * 0.85);
  // a hairline rule between them
  float rule = smoothstep(0.0016, 0.0, abs(uv.y - 0.735)) * step(0.30, uv.x) * step(uv.x, 0.70);
  c += vec3(0.55, 0.68, 0.86) * rule * tt * 0.55;

  // act labels, low left, each fading in on its own beat
  float s = T < 16.0 ? 0.0 : T < 44.0 ? 16.0 : T < 76.0 ? 44.0 : T < 100.0 ? 76.0 : 100.0;
  float idx = T < 16.0 ? 2.0 : T < 44.0 ? 3.0 : T < 76.0 ? 4.0 : T < 100.0 ? 5.0 : 6.0;
  float la = smoothstep(s + 1.2, s + 2.8, T) * (1.0 - smoothstep(s + 9.0, s + 11.0, T));
  la *= 1.0 - smoothstep(113.0, 118.0, T);
  c = mix(c, vec3(0.62, 0.74, 0.88), ink(uv, vec2(0.235, 0.115), 0.29, idx) * la);

  // credits, once, near the end
  // in the upper sky: at 0.20 they were printed straight across the boat
  float cr = smoothstep(114.0, 118.0, T) * (1.0 - smoothstep(121.0, 124.5, T));
  c = mix(c, vec3(0.78, 0.85, 0.94), ink(uv, vec2(0.5, 0.855), 0.62, 7.0) * cr);

  // the last three seconds: everything goes, slowly
  c *= 1.0 - smoothstep(124.0, 127.6, T);
  O = vec4(c, 1.0);
}
