// Tiny GLSL ES 3.0 minifier: strips comments/whitespace, shortens numbers and
// renames every identifier that is not a keyword, builtin, swizzle or preserved external.
// If tools/shader_minifier.exe exists, build.mjs prefers it; this is the dependency-free fallback.
const KEEP = new Set(`void float int uint bool vec2 vec3 vec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4 mat2 mat3 mat4
sampler2D const uniform in out inout if else for while do return break continue discard precision highp mediump lowp
struct layout location true false main sin cos tan asin acos atan pow exp exp2 log log2 sqrt inversesqrt abs sign floor ceil fract
mod min max clamp mix step smoothstep length distance dot cross normalize reflect refract tanh sinh cosh round trunc
texture textureLod texelFetch textureSize dFdx dFdy fwidth any all not lessThan greaterThan equal isnan isinf
gl_FragCoord gl_VertexID gl_Position radians degrees faceforward es`.split(/\s+/));

const TOK = /(#[^\n]*\n?)|((?:\d+\.\d*|\.\d+|\d+)(?:e[+-]?\d+)?u?)|([A-Za-z_]\w*)|(\s+)|(\+\+|--|[\s\S])/g;

function* names() {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const c of a) yield c;
  for (const c of a) for (const d of a + '0123456789') yield c + d;
}

function lex(src, keep) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
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
  return toks;
}

// join tokens; name(k) gives the text of an identifier token
function emit(toks, name) {
  let out = '', last = '';
  for (const k of toks) {
    const v = k.t === 'id' ? name(k) : k.v;
    if (k.t === 'pp' && out && !out.endsWith('\n')) out += '\n';
    if (last && ((/\w$/.test(last) && /^\w/.test(v)) || (/[+-]$/.test(last) && v[0] === last.slice(-1)) ||
        (/\d$/.test(last) && v[0] === '.' && k.t === 'num') )) out += ' ';
    out += v;
    last = v;
  }
  return out;
}

export function minify(src, preserve = []) {
  const keep = new Set([...KEEP, ...preserve]);
  const toks = lex(src, keep);
  const freq = new Map();
  for (const k of toks) if (k.t === 'id') freq.set(k.v, (freq.get(k.v) || 0) + 1);
  const gen = names(), map = new Map();
  for (const [id] of [...freq].sort((a, b) => b[1] - a[1])) {
    let n;
    do n = gen.next().value; while (keep.has(n));
    map.set(id, n);
  }
  return emit(toks, k => map.get(k.v));
}

// Scoped renaming for build.mjs's RENAME_OPT search. Unlike minify(), locals of different functions are separate
// symbols and may share a name, and the caller chooses the names:
//   { n: number of symbols, count[i], pool: usable one-letter names, ok(names, i): may symbol i keep names[i]?,
//     init(): a valid starting assignment, render(names): the minified shader }
// A name that never occurs outside a function (parameter list + body) is a local of that function. A local must
// differ from the other locals of its function, from every global the function mentions and from the function itself.
export function scoped(src, preserve = []) {
  const keep = new Set([...KEEP, ...preserve]);
  const toks = lex(src, keep);
  let depth = 0, fn = -1, nfn = 0, body = false;
  const self = [];
  toks.forEach((k, i) => {
    if (fn < 0 && depth === 0 && k.v === '(' && i > 1 && /id|kw/.test(toks[i - 1].t) && /id|kw/.test(toks[i - 2].t)) { fn = nfn++; body = false; self[fn] = toks[i - 1]; }
    k.fn = fn;
    if (k.v === '{') { depth++; body = true; }
    if (k.v === '}' && --depth === 0) fn = -1;
    if (k.v === ';' && depth === 0 && !body) fn = -1; // prototype
  });
  const glob = new Set();
  for (const k of toks) if (k.t === 'id' && k.fn < 0) glob.add(k.v);
  const index = new Map(), count = [], groups = Array.from({ length: nfn }, () => new Set()), globals = new Set();
  for (const k of toks) if (k.t === 'id') {
    const g = glob.has(k.v), key = g ? 'g:' + k.v : k.fn + ':' + k.v;
    if (!index.has(key)) { index.set(key, count.length); count.push(0); }
    k.sym = index.get(key);
    count[k.sym]++;
    if (g) globals.add(k.sym);
    if (k.fn >= 0) groups[k.fn].add(k.sym);
  }
  self.forEach((k, f) => { if (k.t === 'id') groups[f].add(k.sym); });
  const n = count.length, conflicts = Array.from({ length: n }, () => new Set());
  for (const g of [globals, ...groups]) for (const a of g) for (const b of g) if (a !== b) conflicts[a].add(b);
  const pool = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(c => !keep.has(c));
  const ok = (nm, i) => { for (const j of conflicts[i]) if (nm[j] === nm[i]) return false; return true; };
  return {
    n, count, pool, ok,
    init() {
      const nm = new Array(n).fill(null);
      for (const i of [...count.keys()].sort((a, b) => count[b] - count[a])) {
        const gen = names();
        do nm[i] = gen.next().value; while (keep.has(nm[i]) || !ok(nm, i));
      }
      return nm;
    },
    render: nm => emit(toks, k => nm[k.sym]),
  };
}
