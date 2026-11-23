#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A, B;
out vec4 O;

float ss(float a, float b, float x){ return smoothstep(a, b, x); }
float ex(float x){ return exp(clamp(x, -80., 0.)); }
vec3 tx(vec3 col, vec2 uv, float row, float cl, vec2 pos, vec2 sz, float al, vec3 tint){
  if(al <= .005) return col;
  vec2 q = (uv - pos) / sz + .5;
  if(max(abs(q.x - .5), abs(q.y - .5)) > .5) return col;
  vec2 t = vec2(row < 2.5 ? q.x : cl * .5 + q.x * .5, (row + 1. - q.y) / 8.);
  return mix(col * (1. - .88 * textureLod(B, t, 2.5).a * al), tint, textureLod(B, t, 0.).a * al);
}

void main(){
  vec2 uv = gl_FragCoord.xy / R.xy, px;
  float T = R.z, B0 = T / 2., coc = clamp(textureLod(A, uv, 0.).a, 0., 1.);
  px = coc * 6.5 / R.xy;
  vec3 col = vec3(0);
  for(int i = min(0, int(R.x)); i < 12; i++){
    float fi = float(i), r = sqrt((fi + .5) / 12.), a = fi * 2.4, ca = 1. + length(uv - .5) * .004;
    vec2 o = vec2(cos(a), sin(a)) * r * px;
    col += vec3(textureLod(A, (uv - .5) * ca + .5 + o, coc * 2.).r, textureLod(A, uv + o, coc * 2.).g, textureLod(A, (uv - .5) / ca + .5 + o, coc * 2.).b);
  }
  col /= 12.;
  for(int m = 1; m <= 5; m++) col += textureLod(A, uv, float(m) * 1.35).rgb * exp(-float(m) * .48) * .022;

  float drp = ((B0 >= 20. && B0 < 32.) || (B0 >= 32. && B0 < 48.)) ? 1. : 0.;
  vec2 vc = uv * 2. - 1.;
  col *= (1. + drp * .055 * exp(-fract(B0 * 4.) * 5.)) * (1. - dot(vc, vc) * .15) * 1.15;
  col = pow(clamp((col * (2.51 * col + .03)) / (col * (2.43 * col + .59) + .14), 0., 1.), vec3(.94)) * ss(0., 1., T) * (1. - ss(124.5, 127.5, T));
  float dawnP = ss(56.5, 60.5, B0);
  float sun = ex(-length(uv - vec2(.62, .86)) * 3.2);
  col = mix(col, col * vec3(1.14, .93, .72) + vec3(1., .62, .3) * sun * .55 + vec3(.9, .42, .26) * ex(-abs(uv.y - .14) * 4.) * .22, dawnP);

  float sY = R.x / R.y * .5625, crA = ss(59., 60.2, B0) * (1. - ss(63.8, 64.8, B0));
  col = tx(col, uv, 0., 0., vec2(.5, .86), vec2(.88, .15 * sY), ss(.25, .9, B0) * (1. - ss(3.5, 4.4, B0)) + ss(58.8, 60., B0) * (1. - ss(63.2, 64.2, B0)), vec3(.99, .88, .64));
  col = tx(col, uv, 1., 0., vec2(.5, .21), vec2(.84, .088 * sY), crA, vec3(.96, .88, .72));
  col = tx(col, uv, 2., 0., vec2(.5, .13), vec2(.88, .078 * sY), crA, vec3(.78, .86, .95));
  for(int i = 0; i < 6; i++){
    float a0 = float[6](.6, 8.3, 20.3, 32.3, 48.3, 56.3)[i];
    col = tx(col, uv, 3. + float(i >> 1), float(i & 1), vec2(.21, .1), vec2(.38, .07 * sY), ss(a0, a0 + .5, B0) * (1. - ss(a0 + (i == 5 ? 2.2 : i == 0 ? 2. : 3.), a0 + (i == 5 ? 2.9 : i == 0 ? 2.6 : 3.7), B0)), vec3(.98, .88, .7));
  }
  O = vec4(clamp(col + (fract(sin(dot(gl_FragCoord.xy + fract(T) * 13., vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255., 0., 1.), 1.);
}
