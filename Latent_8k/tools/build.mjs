// Build an intro:  node tools/build.mjs <introDir>
//   <introDir>/src/{main.js,scene.frag,post.frag,music.frag}  ->  <introDir>/intro.html (packed) + dev.html (unpacked)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { minify as terser } from 'terser';
import zopfli from '@gfx/zopfli';
import { minify as glslmin } from './glslmin.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const src = f => fs.readFileSync(path.join(dir, 'src', f), 'utf8');
const EXT = ['R', 'A', 'B', 'O'];
const smExe = path.join(here, 'shader_minifier.exe');

function shader(f) {
  if (fs.existsSync(smExe) && !process.env.NO_SM) {
    const out = path.join(dir, 'src', f + '.min');
    execFileSync(smExe, ['--format', 'text', '--preserve-externals', '-o', out, path.join(dir, 'src', f)]);
    const s = fs.readFileSync(out, 'utf8'); fs.unlinkSync(out);
    return s.replace(/\r/g, '').trim();
  }
  return glslmin(src(f), EXT);
}

const sh = { SCENE_SRC: shader('scene.frag'), POST_SRC: shader('post.frag'), MUSIC_SRC: shader('music.frag') };
for (const k in sh) console.log(k.padEnd(10), sh[k].length, 'bytes minified');

let js = src('main.js');
for (const k in sh) js = js.replace(k, JSON.stringify(sh[k]));

// dev build: unmangled, keeps //DEV lines, runs on double-click
fs.writeFileSync(path.join(dir, 'dev.html'), '<meta charset=utf-8><body><script>\n' + js + '\n</script>');

// release: strip //DEV lines, terser
const rel = js.split('\n').filter(l => !/\/\/DEV\s*$/.test(l)).join('\n');
const t = await terser(rel, {
  ecma: 2020, toplevel: true,
  compress: { passes: 4, unsafe: true, unsafe_arrows: true, unsafe_math: true, booleans_as_integers: true, hoist_vars: false },
  mangle: { toplevel: true }, format: { comments: false },
});
const code = Buffer.from(t.code.replace(/;$/, ''), 'utf8');
const z = Buffer.from(await zopfli.deflateAsync(code, { numiterations: 300 }));
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

fs.writeFileSync(path.join(dir, 'intro.html'), dcHtml);
fs.writeFileSync(path.join(dir, 'intro_fetch.html'), fetchHtml);
const rep = (n, b) => console.log(n.padEnd(18), b.length, 'bytes', b.length <= 8192 ? `(OK, ${8192 - b.length} free)` : `(OVER by ${b.length - 8192})`);
rep('intro.html', dcHtml);
rep('intro_fetch.html', fetchHtml);
