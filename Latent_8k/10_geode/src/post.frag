#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

// Text row `idx` (0..7) of the typography texture B, placed at uv `pos` with screen width `w`.
float ink(vec2 uv, vec2 pos, float w, float idx) {
  vec2 size = vec2(w, w * R.x / R.y / 16.0);
  vec2 q = (uv - pos) / size + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
  vec2 b = vec2(q.x, (7.0 - idx + q.y) / 8.0);
  return max(texture(B, b).a, 0.5 * textureLod(B, b, 2.2).a);
}

void main() {
  vec2 uv = gl_FragCoord.xy / R.xy;
  float T = R.z;

  // Kaleidoscope burst that follows every drop cut (6-fold mirror of the scene)
  float kk = step(72.0, T) * step(T, 96.0) * exp(-mod(T, 4.0) * 2.5);
  vec2 pc = (uv - 0.5) * vec2(R.x / R.y, 1.0);
  float an = atan(pc.y, pc.x), sc = 3.14159 / 3.0;
  an = abs(mod(an, 2.0 * sc) - sc);
  vec2 kp = length(pc) * vec2(cos(an), sin(an));
  vec2 su = mix(uv, kp * vec2(R.y / R.x, 1.0) + 0.5, kk);

  vec3 c = texture(A, su).rgb;
  // Bloom from the scene's mip chain
  c += 0.06 * (textureLod(A, su, 3.0).rgb + textureLod(A, su, 5.0).rgb + textureLod(A, su, 7.0).rgb);

  // Sparse twinkling dust in the cavity
  float dh = fract(sin(dot(floor(gl_FragCoord.xy / 3.0), vec2(12.9, 78.2))) * 43758.5);
  c += step(0.997, dh) * step(16.0, T) * vec3(0.6, 0.9, 1.0) * 0.3 * (0.5 + 0.5 * sin(T * 7.0 + dh * 90.0));

  // Flashes: at each act change, and at every 4-second cut in the drop
  float fl = step(72.0, T) * step(T, 96.0) * exp(-mod(T, 4.0) * 5.0);
  fl += exp(-abs(T - 16.0) * 6.0) + exp(-abs(T - 40.0) * 6.0) + exp(-abs(T - 72.0) * 6.0)
      + exp(-abs(T - 96.0) * 6.0) + exp(-abs(T - 120.0) * 6.0);
  c += fl * vec3(0.7, 0.5, 1.0) * 0.2;

  c = aces(c * 0.95);
  vec2 q = uv - 0.5;
  c *= 1.0 - dot(q, q) * 0.8;
  c = pow(c, vec3(0.4545));

  // Title, subtitle, act label and credits
  float title = smoothstep(1.0, 2.5, T) * (1.0 - smoothstep(7.0, 9.0, T));
  c = mix(c, vec3(1.0), ink(uv, vec2(0.5, 0.56), 0.45, 0.0) * title);
  c = mix(c, vec3(0.8, 1.0, 0.95), ink(uv, vec2(0.5, 0.46), 0.3, 1.0) * title * 0.8);

  float s = T < 16.0 ? 0.0 : T < 40.0 ? 16.0 : T < 72.0 ? 40.0 : T < 96.0 ? 72.0 : T < 120.0 ? 96.0 : 120.0;
  float idx = T < 16.0 ? 2.0 : T < 40.0 ? 3.0 : T < 72.0 ? 4.0 : T < 96.0 ? 5.0 : T < 120.0 ? 6.0 : 7.0;
  float la = smoothstep(s + 0.8, s + 2.0, T) * (1.0 - smoothstep(s + 6.0, s + 7.5, T));
  float lw = idx == 7.0 ? 0.7 : 0.3;
  float lp = idx == 7.0 ? 0.5 : 0.14;
  c = mix(c, vec3(0.9, 0.85, 1.0), ink(uv, vec2(0.5, lp), lw, idx) * la);

  // Fade to black at the end
  c *= 1.0 - smoothstep(123.0, 127.5, T);
  O = vec4(c, 1.0);
}
