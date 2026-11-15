#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

// Sample line `idx` (0..8) from typography texture B with soft drop shadow
vec2 textSample(vec2 uv, vec2 pos, vec2 size, float idx) {
  vec2 q = (uv - pos) / size + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec2(0.0);
  // Canvas Y is top-down, WebGL texture Y is bottom-up
  float v0 = (8.0 - idx) / 9.0;
  vec2 buv = vec2(q.x, v0 + q.y / 9.0);
  float ink = texture(B, buv).a;
  float glow = textureLod(B, buv, 2.2).a;
  return vec2(ink, glow);
}

void main() {
  vec2 uv = gl_FragCoord.xy / R.xy;
  float T = R.z;
  float asp = R.x / R.y;

  // 1. Golden-angle Bokeh Depth of Field
  vec4 center = texture(A, uv);
  float coc = center.a;
  vec3 col = center.rgb;
  if (coc > 0.03) {
    vec3 acc = vec3(0.0);
    float rad = coc * 0.014;
    float lod = coc * 2.8;
    for (int i = 0; i < 16; i++) {
      float fi = float(i);
      float a = fi * 2.3999632;
      float r = sqrt((fi + 0.5) / 16.0) * rad;
      vec2 off = vec2(cos(a) / asp, sin(a)) * r;
      acc += textureLod(A, clamp(uv + off, 0.001, 0.999), lod).rgb;
    }
    col = mix(col, acc / 16.0, smoothstep(0.03, 0.25, coc));
  }

  // 2. Subtle chromatic aberration near edges
  vec2 d = uv - 0.5;
  float ca = dot(d, d) * 0.008;
  col.r = mix(col.r, texture(A, clamp(uv + d * ca, 0.001, 0.999)).r, 0.5);
  col.b = mix(col.b, texture(A, clamp(uv - d * ca, 0.001, 0.999)).b, 0.5);

  // 3. Multi-mip bloom + anamorphic horizontal streak
  vec3 bloom = max(textureLod(A, uv, 3.0).rgb - 0.65, 0.0) * 0.24
             + max(textureLod(A, uv, 4.6).rgb - 0.55, 0.0) * 0.32
             + max(textureLod(A, uv, 6.0).rgb - 0.45, 0.0) * 0.35;
  vec3 streak = max(textureLod(A, uv + vec2(0.03, 0.0), 3.8).rgb - 0.9, 0.0)
              + max(textureLod(A, uv - vec2(0.03, 0.0), 3.8).rgb - 0.9, 0.0);
  col += bloom + streak * vec3(0.25, 0.35, 0.55) * 0.18;

  // 4. ACES Filmic Tone Mapping + Vignette + Film Grain
  col = aces(col * 1.15);
  col = pow(col, vec3(1.0 / 2.2));
  col *= 1.0 - 0.48 * dot(d, d);
  float grain = fract(sin(dot(gl_FragCoord.xy + fract(T) * 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.018;

  // Global fade in / out
  col *= smoothstep(0.0, 2.0, T) * (1.0 - smoothstep(126.0, 128.0, T));

  // 5. Architectural Typography
  float tAlpha = 0.0;
  vec2 tVal = vec2(0.0);
  // Title
  float fTitle = smoothstep(2.0, 3.5, T) * (1.0 - smoothstep(7.5, 9.0, T))
               + smoothstep(119.5, 121.0, T) * (1.0 - smoothstep(125.5, 127.0, T));
  if (fTitle > 0.01) {
    tVal = textSample(uv, vec2(0.5, 0.54), vec2(0.75, 0.13), 0.0);
    tAlpha = max(tAlpha, tVal.x * fTitle);
  }
  // Chapter captions (bottom center)
  float capIdx = -1.0, fCap = 0.0;
  if (T > 9.0 && T < 15.0) { capIdx = 1.0; fCap = smoothstep(9.0, 10.2, T) * (1.0 - smoothstep(13.8, 15.0, T)); }
  else if (T > 17.0 && T < 23.0) { capIdx = 2.0; fCap = smoothstep(17.0, 18.2, T) * (1.0 - smoothstep(21.8, 23.0, T)); }
  else if (T > 41.0 && T < 47.0) { capIdx = 3.0; fCap = smoothstep(41.0, 42.2, T) * (1.0 - smoothstep(45.8, 47.0, T)); }
  else if (T > 73.0 && T < 79.0) { capIdx = 4.0; fCap = smoothstep(73.0, 74.2, T) * (1.0 - smoothstep(77.8, 79.0, T)); }
  else if (T > 97.0 && T < 103.0) { capIdx = 5.0; fCap = smoothstep(97.0, 98.2, T) * (1.0 - smoothstep(101.8, 103.0, T)); }
  else if (T > 116.5 && T < 120.5) { capIdx = 6.0; fCap = smoothstep(116.5, 117.5, T) * (1.0 - smoothstep(119.5, 120.5, T)); }

  if (capIdx > 0.0 && fCap > 0.01) {
    vec2 cVal = textSample(uv, vec2(0.5, 0.10), vec2(0.42, 0.065), capIdx);
    col *= 1.0 - 0.55 * cVal.y * fCap;
    col = mix(col, vec3(0.95, 0.89, 0.76), cVal.x * fCap * 0.9);
  }
  // End credits
  float fCred = smoothstep(120.5, 122.0, T) * (1.0 - smoothstep(126.0, 127.5, T));
  if (fCred > 0.01) {
    vec2 crVal = textSample(uv, vec2(0.5, 0.14), vec2(0.46, 0.065), 7.0);
    col *= 1.0 - 0.5 * crVal.y * fCred;
    col = mix(col, vec3(0.88, 0.80, 0.66), crVal.x * fCred * 0.85);
  }

  if (fTitle > 0.01) {
    col *= 1.0 - 0.65 * tVal.y * fTitle;
    col = mix(col, vec3(0.98, 0.92, 0.80), tAlpha);
  }

  O = vec4(clamp(col, 0.0, 1.0), 1.0);
}
