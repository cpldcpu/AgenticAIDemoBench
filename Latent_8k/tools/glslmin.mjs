// Tiny GLSL ES 3.0 minifier: strips comments/whitespace, shortens numbers and
// renames every identifier that is not a keyword, builtin, swizzle or preserved external.
// If tools/shader_minifier.exe exists, build.mjs prefers it; this is the dependency-free fallback.
const KEEP = new Set(`void float int uint bool vec2 vec3 vec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4 mat2 mat3 mat4
sampler2D const uniform in out inout if else for while do return break continue discard precision highp mediump lowp
struct true false main sin cos tan asin acos atan pow exp exp2 log log2 sqrt inversesqrt abs sign floor ceil fract
mod min max clamp mix step smoothstep length distance dot cross normalize reflect refract tanh sinh cosh round trunc
texture textureLod texelFetch textureSize dFdx dFdy fwidth any all not lessThan greaterThan equal isnan isinf
gl_FragCoord gl_VertexID gl_Position radians degrees faceforward es`.split(/\s+/));

const TOK = /(#[^\n]*\n?)|((?:\d+\.\d*|\.\d+|\d+)(?:e[+-]?\d+)?u?)|([A-Za-z_]\w*)|(\s+)|(\+\+|--|[\s\S])/g;

function* names() {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const c of a) yield c;
  for (const c of a) for (const d of a + '0123456789') yield c + d;
}

export function minify(src, preserve = []) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const keep = new Set([...KEEP, ...preserve]);
  const toks = [];
  let m, prev = '';
  TOK.lastIndex = 0;
  while ((m = TOK.exec(src))) {
    if (m[4]) continue;
    if (m[1]) toks.push({ t: 'pp', v: m[1].trim() + '\n' });
    else if (m[2]) {
      let v = m[2];
      if (/[.e]/.test(v) && !/u$/.test(v)) {
        if (!/e/.test(v)) v = v.replace(/^0+(?=\.)/, '').replace(/(\.\d*?)0+$/, '$1');
        if (v === '.') v = '0.';
      }
      toks.push({ t: 'num', v });
    } else if (m[3]) toks.push({ t: prev === '.' || keep.has(m[3]) ? 'kw' : 'id', v: m[3] });
    else toks.push({ t: 'op', v: m[5] });
    prev = toks[toks.length - 1].v;
  }
  const freq = new Map();
  for (const k of toks) if (k.t === 'id') freq.set(k.v, (freq.get(k.v) || 0) + 1);
  const gen = names(), map = new Map();
  for (const [id] of [...freq].sort((a, b) => b[1] - a[1])) {
    let n;
    do n = gen.next().value; while (keep.has(n));
    map.set(id, n);
  }
  let out = '', last = '';
  for (const k of toks) {
    const v = k.t === 'id' ? map.get(k.v) : k.v;
    if (last && ((/\w$/.test(last) && /^\w/.test(v)) || (/[+-]$/.test(last) && v[0] === last.slice(-1)) ||
        (/\d$/.test(last) && v[0] === '.' && k.t === 'num') )) out += ' ';
    out += v;
    last = v;
  }
  return out;
}
