// Build an intro:  node tools/build.mjs <introDir> [variant]
//   <introDir>/src/{main.js,scene.frag,post.frag,music.frag}  ->  <introDir>/intro.html (packed) + intro.html.br (brotli, needs a server) + dev.html (unpacked)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { minify as terser } from 'terser';
import zopfli from '@gfx/zopfli';
import { minify as glslmin, scoped } from './glslmin.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
// optional variant: sources in <introDir>/src_<variant>, outputs named intro_<variant>.html, dev_<variant>.html, ...
const variant = process.argv[3];
const SRC = variant ? 'src_' + variant : 'src';
const out = n => path.join(dir, variant ? n.replace(/^(intro|dev)/, '$1_' + variant) : n);
const src = f => fs.readFileSync(path.join(dir, SRC, f), 'utf8');
const EXT = ['R', 'A', 'B', 'O'];
const smExe = path.join(here, 'shader_minifier.exe');

function shader(f) {
  if (fs.existsSync(smExe) && !process.env.NO_SM) {
    const tmp = path.join(dir, SRC, f + '.min');
    execFileSync(smExe, ['--format', 'text', '--preserve-externals', '-o', tmp, path.join(dir, SRC, f)]);
    const s = fs.readFileSync(tmp, 'utf8'); fs.unlinkSync(tmp);
    return s.replace(/\r/g, '').trim();
  }
  return glslmin(src(f), EXT);
}

const sh = { SCENE_SRC: shader('scene.frag'), POST_SRC: shader('post.frag'), MUSIC_SRC: shader('music.frag') };
for (const k in sh) console.log(k.padEnd(10), sh[k].length, 'bytes minified');

const TERSER = {
  ecma: 2020, toplevel: true,
  compress: { passes: 4, unsafe: true, unsafe_arrows: true, unsafe_math: true, booleans_as_integers: true, hoist_vars: false },
  mangle: { toplevel: true }, format: { comments: false },
};
const noDev = s => s.split('\n').filter(l => !/\/\/DEV\s*$/.test(l)).join('\n');
const brotli = s => zlib.brotliCompressSync(Buffer.from(s), { params: {
  [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(s) } });
const brWrap = s => '<body><script>' + s + '</script>';

// RENAME_OPT=<tries>: search for shader identifier names that brotli packs better (built-in minifier only).
// Renaming cannot change what a shader computes. The search is seeded, so a build is reproducible.
const tries = +process.env.RENAME_OPT || 0;
let optCode;
if (tries) {
  const keys = Object.keys(sh), S = keys.map(k => scoped(src(k.slice(0, -4).toLowerCase() + '.frag'), EXT)), nm = S.map(s => s.init());
  // terser runs once on the real thing; the shader strings in its output are then swapped for each candidate
  let tpl = src('main.js');
  keys.forEach((k, i) => { tpl = tpl.replace(k, JSON.stringify(S[i].render(nm[i]))); });
  tpl = (await terser(noDev(tpl), TERSER)).code.replace(/;$/, '');
  S.forEach((s, i) => {
    const str = JSON.stringify(s.render(nm[i])).slice(1, -1);
    if (!tpl.includes(str)) throw new Error('RENAME_OPT: shader string not found in the terser output');
    tpl = tpl.replace(str, () => `@@${i}@@`);
  });
  const fill = () => S.reduce((c, s, i) => c.replace(`@@${i}@@`, () => JSON.stringify(s.render(nm[i])).slice(1, -1)), tpl);
  const cost = () => brotli(brWrap(fill())).length;
  let seed = 1;
  const rnd = n => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) % n; };
  let best = cost();
  const first = best;
  for (let it = 0; it < tries; it++) {
    const s = rnd(S.length), a = nm[s], i = rnd(S[s].n), name = S[s].pool[rnd(S[s].pool.length)], old = a[i];
    if (name === old) continue;
    // take the name; symbols that hold it and may not share it get this symbol's old name
    const moved = [];
    a[i] = name;
    for (let j = 0; j < a.length; j++) if (j !== i && a[j] === name && !S[s].ok(a, j)) { a[j] = old; moved.push(j); }
    let c = S[s].ok(a, i) && moved.every(j => S[s].ok(a, j)) ? cost() : Infinity;
    if (c <= best) best = c;
    else { a[i] = old; for (const j of moved) a[j] = name; }
  }
  keys.forEach((k, i) => { sh[k] = S[i].render(nm[i]); });
  optCode = fill(); // used as the release: terser names its variables by letter frequency, so a second run would shift them
  console.log('rename opt', first, '->', best, 'brotli bytes after', tries, 'tries');
}

let js = src('main.js');
for (const k in sh) js = js.replace(k, JSON.stringify(sh[k]));

// dev build: unmangled, keeps //DEV lines, runs on double-click
fs.writeFileSync(out('dev.html'), '<meta charset=utf-8><body><script>\n' + js + '\n</script>');

// release: strip //DEV lines, terser
const t = await terser(noDev(js), TERSER);

const code = Buffer.from(optCode || t.code.replace(/;$/, ''), 'utf8');
// ROADROLLER=<1|2>: pack the code with Roadroller (context-mixing packer whose output is JavaScript that unpacks
// itself) before deflate. Helps intro.html and intro_fetch.html; the brotli build gains nothing and stays without it.
// 2 searches the model parameters longer than 1.
let packed = code;
if (process.env.ROADROLLER) {
  const { Packer } = await import('roadroller');
  const packer = new Packer([{ data: code.toString(), type: 'js', action: 'eval' }], {});
  await packer.optimize(+process.env.ROADROLLER);
  const { firstLine, secondLine } = packer.makeDecoder();
  // unpack it here once and compare, so a packer problem cannot reach a release
  // (Roadroller writes non-ASCII characters as \uXXXX escapes, which mean the same in JavaScript)
  let got;
  new Function('eval', firstLine + secondLine)(s => { got = s; });
  if (String(got).replace(/\\u([0-9a-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) !== code.toString())
    throw new Error('Roadroller output does not unpack to the input');
  packed = Buffer.from(firstLine + secondLine, 'utf8');
  console.log('roadroller', packed.length, 'bytes of self-unpacking js');
}
const z = Buffer.from(await zopfli.deflateAsync(packed, { numiterations: 300 }));
console.log('js+glsl   ', code.length, 'bytes -> deflate', z.length);

// (a) fetch bootstrap: needs http:// or --allow-file-access-from-files
const head = n => `<svg onload="fetch\`#\`.then(t=>t.blob()).then(t=>new Response(t.slice(${n}).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()).then(eval)">`;
const hl = head(head(999).length).length;
const fetchHtml = Buffer.concat([Buffer.from(head(hl), 'latin1'), z]);

// (b) double-click bootstrap: payload lives in an HTML comment of an ISO-8859-15 document and is read back from the DOM.
//     Bytes the HTML parser would mangle (NUL, CR, the escape byte, and '>' that could close the comment) are escaped as 0x01,(b^64).
const esc = [];
for (let i = 0; i < z.length; i++) {
  const b = z[i], p = esc[esc.length - 1];
  if (b === 0 || b === 13 || b === 1 || (b === 62 && (esc.length < 2 || p === 45 || p === 33))) esc.push(1, b ^ 64);
  else esc.push(b);
}
if (esc[esc.length - 1] === 45) throw new Error('payload ends in "-" (retry with different zopfli iterations)');
const dcHtml = Buffer.concat([
  Buffer.from('<meta charset=l9><!--', 'latin1'), Buffer.from(esc),
  Buffer.from(`--><script>t=new TextDecoder('l9').decode(new Uint8Array(256).map((_,i)=>i));s=document.currentScript.previousSibling.data;for(b=[],i=0;c=s[i++];)b.push((c=t.indexOf(c))-1?c:t.indexOf(s[i++])^64);new Response(new Blob([new Uint8Array(b)]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text().then(eval)</script>`, 'latin1'),
]);

// (c) brotli: the smallest, but Chromium has no DecompressionStream('brotli'), so the browser must get it over
//     HTTP with "Content-Encoding: br" (tools/serve_br.ps1). The charset comes from the Content-Type header.
//     The closing tag is needed: a script that is still open at the end of the file is not run.
//     With BROTLI_SWEEP set, a few encoder settings are tried and the smallest result is kept (worth a few bytes).
let brHtml = brotli(brWrap(code.toString()));
if (process.env.BROTLI_SWEEP) for (const lgwin of [14, 16, 18]) for (const ndirect of [0, 4, 8, 15]) for (const mode of [0, 1]) {
  const b = zlib.brotliCompressSync(Buffer.from(brWrap(code.toString())), { params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: code.length + 23, [zlib.constants.BROTLI_PARAM_MODE]: mode,
    [zlib.constants.BROTLI_PARAM_LGWIN]: lgwin, [zlib.constants.BROTLI_PARAM_NDIRECT]: ndirect } });
  if (b.length < brHtml.length) brHtml = b;
}

fs.writeFileSync(out('intro.html.br'), brHtml);
fs.writeFileSync(out('intro.html'), dcHtml);
fs.writeFileSync(out('intro_fetch.html'), fetchHtml);
const rep = (n, b) => console.log(n.padEnd(18), b.length, 'bytes', b.length <= 8192 ? `(OK, ${8192 - b.length} free)` : `(OVER by ${b.length - 8192})`);
rep(path.basename(out('intro.html')), dcHtml);
rep(path.basename(out('intro_fetch.html')), fetchHtml);
rep(path.basename(out('intro.html.br')), brHtml);
