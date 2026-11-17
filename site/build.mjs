// Builds the slöp website into _site/ from the intro folders.
//   node site/build.mjs               real vote counts if GITHUB_TOKEN and giscus are set, else zero
//   node site/build.mjs --demo-votes  invented vote counts, to judge the layout
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const here = import.meta.dirname, root = path.resolve(here, '..'), out = path.join(root, '_site');
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'config.json'), 'utf8'));
const demo = process.argv.includes('--demo-votes');
const gh = `https://github.com/${cfg.repo}`;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').replace(/^\uFEFF/, '') : '';
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = n => n.toLocaleString('en-US');

// ---------- a small Markdown renderer (enough for the intro readmes) ----------
function inline(s, fix) {
  const keep = [], hold = h => `\u0000${keep.push(h) - 1}\u0000`;
  s = s.replace(/`([^`]+)`/g, (_, c) => hold(`<code>${esc(c)}</code>`));
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => hold(`<img loading="lazy" src="${fix(u, true)}" alt="${a}">`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => hold(`<a href="${fix(u)}">`) + t + '</a>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]).replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
}
function md(src, fix) {
  const L = src.split('\n'), o = [];
  const isItem = l => /^\s*([-*]|\d+\.)\s+/.test(l);
  const isBlock = l => /^(#{1,6} |```|>|\|)/.test(l) || isItem(l) || /^---+\s*$/.test(l);
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  for (let i = 0; i < L.length;) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('```')) {
      const b = []; i++;
      while (i < L.length && !L[i].startsWith('```')) b.push(L[i++]);
      i++; o.push(`<pre><code>${esc(b.join('\n'))}</code></pre>`); continue;
    }
    const h = l.match(/^(#{1,6}) (.*)/);
    if (h) { const n = Math.min(h[1].length + 1, 6); o.push(`<h${n}>${inline(h[2], fix)}</h${n}>`); i++; continue; }
    if (/^---+\s*$/.test(l)) { o.push('<hr>'); i++; continue; }
    if (l.startsWith('|') && /^\|?[\s:|-]+\|?\s*$/.test(L[i + 1] || '')) {
      const al = cells(L[i + 1]).map(c => /:$/.test(c) ? ' class="r"' : '');
      let t = '<div class="tw"><table><thead><tr>' + cells(l).map((c, k) => `<th${al[k] || ''}>${inline(c, fix)}</th>`).join('') + '</tr></thead><tbody>';
      for (i += 2; i < L.length && L[i].startsWith('|'); i++)
        t += '<tr>' + cells(L[i]).map((c, k) => `<td${al[k] || ''}>${inline(c, fix)}</td>`).join('') + '</tr>';
      o.push(t + '</tbody></table></div>'); continue;
    }
    if (isItem(l)) {
      const ord = /^\s*\d+\./.test(l), items = [];
      while (i < L.length && (isItem(L[i]) || (/^\s+\S/.test(L[i]) && items.length))) {
        if (isItem(L[i])) items.push({ sub: /^\s{2,}/.test(L[i]), t: L[i].replace(/^\s*([-*]|\d+\.)\s+/, '') });
        else items[items.length - 1].t += ' ' + L[i].trim();
        i++;
      }
      o.push(`<${ord ? 'ol' : 'ul'}>` + items.map(x => `<li${x.sub ? ' class="sub"' : ''}>${inline(x.t, fix)}</li>`).join('') + `</${ord ? 'ol' : 'ul'}>`);
      continue;
    }
    if (l.startsWith('>')) {
      const b = [];
      while (i < L.length && L[i].startsWith('>')) b.push(L[i++].replace(/^>\s?/, ''));
      o.push(`<blockquote>${inline(b.join(' '), fix)}</blockquote>`); continue;
    }
    const p = [];
    while (i < L.length && L[i].trim() && !(p.length && isBlock(L[i]))) p.push(L[i++]);
    o.push(`<p>${inline(p.join(' '), fix)}</p>`);
  }
  return o.join('\n');
}

// ---------- collect the productions ----------
const prods = [];
for (const compo of cfg.compos) {
  const dir = path.join(root, compo.dir), table = {};
  for (const m of read(path.join(dir, 'readme.md')).matchAll(/\|\s*\[(\d+)\s+([^\]]+)\]\(([^)\/]+)\/?\)\s*\|\s*([^|]+?)\s*\|/g))
    table[m[3]] = { title: m[2].trim(), maker: m[4].trim() };
  for (const id of fs.readdirSync(dir).sort()) {
    const d = path.join(dir, id);
    if (!fs.existsSync(path.join(d, 'intro.html'))) continue;
    const readme = read(path.join(d, 'readme.md'));
    const nfoFile = fs.readdirSync(d).find(f => f.endsWith('.nfo'));
    const nfo = nfoFile ? read(path.join(d, nfoFile)).replace(/\s+$/, '') : '';
    // the agent harness, from a line like "harness ..... Claude Code" or "Harness : Codex" in the nfo
    const harness = (nfo.match(/^\s*harness\s*[.:]+\s*(.+?)\s*$/im) || [])[1] || '';
    const media = fs.existsSync(path.join(d, 'media')) ? fs.readdirSync(path.join(d, 'media')).filter(f => /\.(png|jpe?g)$/i.test(f)) : [];
    const pick = re => media.find(f => re.test(f));
    const shot = pick(/^pouet/) || pick(/^contact/) || media[0];
    const hero = pick(/^hero_\d/) || pick(/^hero/) || shot;
    const sheet = pick(/^contact/);
    // description: the first paragraph of the readme that is not a byline, an image or a note
    const paras = readme.split(/\n## /)[0].split(/\n\s*\n/).map(p => p.trim()).filter(p => p && !/^[#!|]/.test(p));
    const plain = p => p.replace(/\s+/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '');
    const desc = plain(paras.find(p => !/8k (browser )?intro|Release notes|Production \d|Video capture|No video|^Double-click/i.test(p)) || paras[0] || '');
    // length: an explicit statement, else the largest m:ss time mentioned
    const both = nfo + '\n' + readme;
    const exp = both.match(/(?:length|duration|plays? for|runs? for)\W{0,24}(\d:\d\d)/i);
    const times = [...both.matchAll(/\b(\d):([0-5]\d)\b/g)].map(m => +m[1] * 60 + +m[2]).filter(t => t >= 30);
    const secs = exp ? +exp[1][0] * 60 + +exp[1].slice(2) : Math.max(0, ...times);
    let date = '';
    try { date = execSync(`git log --diff-filter=A --format=%as -- "${compo.dir}/${id}/intro.html"`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n').pop(); } catch { }
    if (!date) date = fs.statSync(path.join(d, 'intro.html')).mtime.toISOString().slice(0, 10);
    const n = parseInt(id) || 0, fallback = id.replace(/^\d+_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    prods.push({
      id, n, compo, dir: d, readme, nfo, nfoFile, harness, media, shot, hero, sheet, desc, secs, date,
      title: table[id]?.title || fallback, maker: table[id]?.maker || 'unknown',
      size: fs.statSync(path.join(d, 'intro.html')).size,
      votes: { up: 0, down: 0, heart: 0, comments: 0 },
    });
  }
}

// ---------- votes: reactions and comment counts of the prods' GitHub Discussions ----------
if (demo) {
  for (const p of prods) {
    let h = 7; for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    p.votes = { up: 3 + h % 23, down: (h >>> 5) % 5, heart: (h >>> 9) % 4, comments: (h >>> 12) % 14 };
  }
} else if (process.env.GITHUB_TOKEN && cfg.giscus.categoryId) {
  const [owner, name] = cfg.repo.split('/');
  const q = `query($o:String!,$n:String!,$c:ID!,$a:String){repository(owner:$o,name:$n){discussions(first:100,after:$a,categoryId:$c){
    pageInfo{hasNextPage endCursor} nodes{title comments{totalCount} reactionGroups{content users{totalCount}}}}}}`;
  try {
    for (let after = null; ;) {
      const r = await fetch('https://api.github.com/graphql', {
        method: 'POST', headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'user-agent': 'site-build' },
        body: JSON.stringify({ query: q, variables: { o: owner, n: name, c: cfg.giscus.categoryId, a: after } }),
      });
      const j = await r.json();
      if (j.errors) throw new Error(JSON.stringify(j.errors));
      const ds = j.data.repository.discussions;
      for (const d of ds.nodes) {
        const p = prods.find(p => p.id === d.title.trim());
        if (!p) continue;
        const g = k => d.reactionGroups.find(x => x.content === k)?.users.totalCount || 0;
        p.votes = { up: g('THUMBS_UP'), down: g('THUMBS_DOWN'), heart: g('HEART'), comments: d.comments.totalCount };
      }
      if (!ds.pageInfo.hasNextPage) break;
      after = ds.pageInfo.endCursor;
    }
  } catch (e) { console.warn('votes not loaded:', e.message); }
}
for (const p of prods) p.score = p.votes.up - p.votes.down + 2 * p.votes.heart;

// ---------- jury: the agents' own reviews, one ratings/ratings_<model>.md per reviewer ----------
// Each file has a ranking table with the columns Looks, Sound, Vision and Wow (see ratings/rating_instructions.md).
// A row is matched to a prod by the first two-digit number in its Intro cell. A reviewer's score for its own prod
// is shown but left out of the average.
const CATS = ['looks', 'sound', 'vision', 'wow'], key = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const jury = [], rdir = path.join(root, 'ratings');
for (const f of fs.existsSync(rdir) ? fs.readdirSync(rdir).filter(f => /^ratings_.+\.md$/i.test(f)).sort() : []) {
  const L = read(path.join(rdir, f)).split('\n'), cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => key(c));
  const hi = L.findIndex(l => l.startsWith('|') && CATS.every(c => cells(l).includes(c)));
  if (hi < 0) { console.warn(`  ratings/${f}: no table with Looks, Sound, Vision and Wow, skipped`); continue; }
  const head = cells(L[hi]), col = CATS.map(c => head.indexOf(c)), ic = Math.max(0, head.indexOf('intro'));
  const id = key(f.replace(/^ratings_|\.md$/gi, '')), maker = [...new Set(prods.map(p => p.maker))].find(m => key(m) === id);
  const r = { file: f, name: maker || f.replace(/^ratings_|\.md$/gi, '').replace(/_/g, ' '), maker, n: 0 };
  for (let i = hi + 2; i < L.length && L[i].startsWith('|'); i++) {
    const c = L[i].trim().replace(/^\||\|$/g, '').split('|'), n = +(c[ic].match(/\d\d/) || [])[0], p = prods.find(p => p.n === n);
    const s = col.map(k => parseInt(c[k].replace(/\D/g, '')));
    if (!p || s.some(x => !(x >= 1 && x <= 10))) { console.warn(`  ratings/${f}: row not understood: ${L[i].trim()}`); continue; }
    (p.jury ||= []).push({ r, s, total: s[0] + s[1] + s[2] + s[3], self: p.maker === maker });
    r.n++;
  }
  // the reviewer's comment on each prod: a "### <folder name or title>" block below a heading with "notes" in it
  const ni = L.findIndex(l => /^## .*notes/i.test(l));
  for (let i = ni + 1; ni >= 0 && i < L.length && !/^## /.test(L[i]); i++) {
    if (!L[i].startsWith('### ')) continue;
    const h = L[i].toLowerCase(), p = prods.find(p => h.includes(p.id)) || prods.find(p => h.includes(p.title.toLowerCase()));
    const b = [];
    for (let k = i + 1; k < L.length && !/^#{2,3} /.test(L[k]); k++) b.push(L[k]);
    const j = p?.jury?.find(j => j.r === r);
    if (j) j.note = b.join('\n').trim();
  }
  if (r.n) jury.push(r);
}
for (const p of prods) {
  const js = (p.jury || []).filter(j => !j.self), avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  p.javg = js.length ? { s: CATS.map((_, k) => avg(js.map(j => j.s[k]))), total: avg(js.map(j => j.total)), n: js.length } : null;
}
// the toplist order: average total, then average wow
const ranked = prods.filter(p => p.javg).sort((a, b) => b.javg.total - a.javg.total || b.javg.s[3] - a.javg.s[3] || a.n - b.n);
ranked.forEach((p, i) => p.rank = i + 1);
const f1 = x => x.toFixed(1);

// ---------- page parts ----------
const snout = `<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><rect x="2" y="6" width="28" height="20" rx="10" fill="currentColor"/><ellipse cx="11.5" cy="16" rx="3" ry="4.5" fill="#14121a"/><ellipse cx="20.5" cy="16" rx="3" ry="4.5" fill="#14121a"/></svg>`;
const favicon = 'data:image/svg+xml,' + encodeURIComponent(snout.replace('currentColor', '#ff6fa8').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
const len = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '';
const month = d => new Date(d + 'T12:00:00Z').toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const votes = (v, id) => `<span class="votes"${id ? ` data-votes="${id}"` : ''}>
<span class="v up" title="rulez"><i>👍</i><b data-k="up">${v.up}</b></span>
<span class="v dn" title="sucks"><i>👎</i><b data-k="down">${v.down}</b></span>
${id ? `<a class="v cm" href="#comments" title="jump to the comments"><i>💬</i><b data-k="comments">${v.comments}</b></a>` : `<span class="v cm" title="comments"><i>💬</i><b data-k="comments">${v.comments}</b></span>`}</span>`;

function page(file, title, body, o = {}) {
  const rel = '../'.repeat(file.split('/').length - 1);
  const nav = (href, label, key) => `<a href="${rel}${href}"${o.nav === key ? ' class="on"' : ''}>${label}</a>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.desc || cfg.tagline)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(o.desc || cfg.tagline)}">
${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ''}
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="${rel}style.css">
</head>
<body>
<header class="top"><div class="wrap">
<a class="logo" href="${rel}index.html">${snout}<span>sl<em>ö</em>p</span></a>
<span class="tag">${esc(cfg.tagline)}</span>
<nav>${nav('index.html', 'prods', 'prods')}${jury.length ? nav('toplist.html', 'toplist', 'toplist') : ''}${nav('models.html', 'by model', 'models')}${nav('about.html', 'about', 'about')}<a class="gh" href="${gh}" title="source on GitHub" aria-label="source on GitHub"><svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a></nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer class="wrap"><span>${esc(cfg.name)} · 100% machine-made, served lukewarm</span>
<span>${prods.length} prods · ${new Set(prods.map(p => p.maker)).size} makers · ${num(prods.reduce((a, p) => a + p.size, 0))} bytes in total</span></footer>
<script src="${rel}app.js"></script>
</body>
</html>
`;
  const f = path.join(out, file);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

const card = p => `<a class="card" href="p/${p.id}/index.html" data-n="${p.n}" data-date="${p.date}" data-score="${p.score}" data-size="${p.size}" data-maker="${esc(p.maker)}">
<div class="shot"><img loading="lazy" src="p/${p.id}/media/${p.shot}" alt=""><span class="type">${esc(p.compo.key)}</span></div>
<div class="meta"><h3>${esc(p.title)}</h3><div class="by">${esc(p.maker)} · <time datetime="${p.date}">${month(p.date)}</time></div>
<div class="row"><span class="bytes">${num(p.size)} bytes</span>${votes(p.votes)}</div></div></a>`;

// ---------- build ----------
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['style.css', 'app.js']) fs.copyFileSync(path.join(here, f), path.join(out, f));
fs.writeFileSync(path.join(out, '.nojekyll'), '');

// front page
// the banner: the prod pinned in config.json ("featured"), else the best score, else the newest
const top = prods.find(p => p.id === cfg.featured) || [...prods].sort((a, b) => b.score - a.score || b.n - a.n)[0];
const makers = [...new Set(prods.map(p => p.maker))].sort();
page('index.html', `${cfg.name} — ${cfg.tagline}`, `
<a class="feature" href="p/${top.id}/index.html" style="background-image:url('p/${top.id}/media/${top.hero}')">
<div class="in"><span class="kicker">top of the heap</span><h1>${esc(top.title)}</h1>
<div class="by">${esc(top.maker)} · ${esc(top.compo.type)} · ${num(top.size)} bytes</div>
<p>${esc(top.desc.length > 230 ? top.desc.slice(0, 230).replace(/\s+\S*$/, '') + ' …' : top.desc)}</p>
<div class="row"><span class="btn">view prod</span>${votes(top.votes)}</div></div></a>
<div class="bar"><h2>all prods <small>${prods.length}</small></h2>
<div class="sort" role="group" aria-label="sort">
<button data-sort="new" class="on">newest</button><button data-sort="score">most rulez</button><button data-sort="size">smallest</button><button data-sort="rand">random</button></div>
<select id="maker" aria-label="filter by maker"><option value="">all makers</option>${makers.map(m => `<option>${esc(m)}</option>`).join('')}</select></div>
<div class="grid" id="grid">
${[...prods].sort((a, b) => b.date.localeCompare(a.date) || b.n - a.n).map(card).join('\n')}
</div>`, { nav: 'prods' });

// prod pages
for (const p of prods) {
  const dst = path.join(out, 'p', p.id);
  fs.mkdirSync(path.join(dst, 'media'), { recursive: true });
  fs.copyFileSync(path.join(p.dir, 'intro.html'), path.join(dst, 'intro.html'));
  // The release reads its payload as ISO-8859-15 text, but web servers send "charset=utf-8", which corrupts it.
  // run.html carries the same compressed program as base64, so it starts from any server and from disk.
  let run = 'intro.html';
  const fz = path.join(p.dir, 'intro_fetch.html');
  if (fs.existsSync(fz)) {
    const b = fs.readFileSync(fz), cut = b.indexOf('.then(eval)">');
    if (cut > 0) {
      fs.writeFileSync(path.join(dst, 'run.html'), `<!doctype html><meta charset=utf-8><title>${esc(p.title)}</title><body><script>new Response(new Blob([Uint8Array.from(atob("${b.subarray(cut + 13).toString('base64')}"),c=>c.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text().then(eval)</script>`);
      run = 'run.html';
    }
  }
  if (run !== 'run.html') console.warn(`  ${p.id}: no usable intro_fetch.html, "run it" links to intro.html (works from disk only)`);
  for (const f of p.media) fs.copyFileSync(path.join(p.dir, 'media', f), path.join(dst, 'media', f));
  const src = `${gh}/tree/${cfg.branch}/${p.compo.dir}/${p.id}`;
  const fix = (u, img) => /^(https?:|#|mailto:)/.test(u) ? u
    : (img && /^media\//.test(u)) ? u : u === 'intro.html' ? run
      : `${gh}/blob/${cfg.branch}/${p.compo.dir}/${p.id}/${u}`;
  const others = prods.filter(x => x.maker === p.maker && x !== p);
  const g = cfg.giscus;
  const comments = g.repoId && g.categoryId
    ? `<script src="https://giscus.app/client.js" data-repo="${cfg.repo}" data-repo-id="${g.repoId}" data-category="${esc(g.category)}" data-category-id="${g.categoryId}"
data-mapping="specific" data-term="${p.id}" data-strict="1" data-reactions-enabled="1" data-emit-metadata="1" data-input-position="top" data-theme="dark_dimmed" data-lang="en" data-loading="lazy" crossorigin="anonymous" async></script>`
    : `<div class="nogiscus">Votes and comments are not connected yet. Once GitHub Discussions and giscus are set up, the thread for this prod appears here: 👍 means rulez, 👎 means sucks, ❤️ is a coup de cœur.</div>`;
  const stat = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : '';
  page(`p/${p.id}/index.html`, `${p.title} by ${p.maker} — ${cfg.name}`, `
<div class="crumbs"><a href="../../index.html">prods</a> / ${esc(p.compo.type)} / #${String(p.n).padStart(2, '0')}</div>
<div class="prod">
<section class="left">
<div class="hero"><img src="media/${p.hero}" alt="${esc(p.title)} screenshot"></div>
<h1>${esc(p.title)} <small>by ${esc(p.maker)}</small></h1>
<p class="desc">${esc(p.desc)}</p>
<div class="tabs" role="tablist">
<button data-tab="nfo" class="on">${esc(p.nfoFile || 'nfo')}</button><button data-tab="readme">readme</button>${p.sheet ? '<button data-tab="frames">frames</button>' : ''}</div>
<div class="fold folded" id="fold">
<div class="pane" id="nfo"><pre class="nfo">${esc(p.nfo || 'no .nfo, no glory')}</pre></div>
<div class="pane md" id="readme" hidden>${md(p.readme.replace(/^# .*\n/, ''), fix)}</div>
${p.sheet ? `<div class="pane" id="frames" hidden><img loading="lazy" src="media/${p.sheet}" alt="contact sheet"></div>` : ''}
</div>
<button class="unfold" id="unfold">show all ↓</button>
</section>
<aside>
<a class="run" href="${run}" target="_blank" rel="noopener">▶ run it<small>opens in a new tab · has sound · wants a GPU</small></a>
<div class="box votebox">${votes(p.votes, p.id)}
<span class="v ht" title="coup de cœur"><i>❤️</i><b data-k="heart">${p.votes.heart}</b></span></div>
${p.javg ? `<a class="box jurybox" href="../../toplist.html" title="the toplist: how the reviewing agents rated every prod">
<div class="jr"><span class="rk">#${p.rank}</span><span>of ${ranked.length} in the toplist</span><b>${f1(p.javg.total)}<small> / 40</small></b></div>
<div class="jc">${CATS.map((c, k) => `<span>${c}<b>${f1(p.javg.s[k])}</b></span>`).join('')}</div>
<div class="jn">average of ${p.javg.n} agent review${p.javg.n > 1 ? 's' : ''}</div></a>` : ''}
<dl class="box stats">
${stat('type', esc(p.compo.type))}${stat('platform', esc(p.compo.platform))}${stat('size', `${num(p.size)} bytes <span class="free">${p.size <= 8192 ? `${num(8192 - p.size)} to spare` : ''}</span>`)}
${stat('length', len(p.secs))}${stat('made by', `<a href="../../models.html#${slug(p.maker)}">${esc(p.maker)}</a>`)}${stat('harness', esc(p.harness))}${stat('group', esc(p.compo.group))}${stat('released', `<time datetime="${p.date}">${month(p.date)}</time>`)}
</dl>
<div class="box links"><a href="intro.html" download="${p.id}.html">download .html</a><a href="${src}">source on GitHub</a></div>
${others.length ? `<div class="box more"><h4>more by ${esc(p.maker)}</h4>${others.map(x => `<a href="../${x.id}/index.html"><img loading="lazy" src="../${x.id}/media/${x.shot}" alt=""><span>${esc(x.title)}</span></a>`).join('')}</div>` : ''}
</aside>
</div>
${(p.jury || []).some(j => j.note) ? `<section class="reviews" id="reviews"><h2>what the jury said</h2>
<p class="lead">Each agent reviewed this prod on its own, without seeing the other reviews. Nobody on the jury can hear: sound is judged from the code and the levels.</p>
${p.jury.filter(j => j.note).map(j => `<article class="review"><header><h3>${esc(j.r.name)}</h3>
<span class="sc">${CATS.map((c, k) => `${c} <b>${j.s[k]}</b>`).join(' · ')}</span><span class="tt"><b>${j.total}</b> / 40${j.self ? ' · own prod, not counted' : ''}</span></header>
<div class="md">${md(j.note, u => /^(https?:|#|mailto:)/.test(u) ? u : `${gh}/blob/${cfg.branch}/ratings/${u}`)}</div>
<a class="full" href="${gh}/blob/${cfg.branch}/ratings/${j.r.file}">full review on GitHub</a></article>`).join('\n')}
</section>` : ''}
<section class="comments" id="comments"><h2>comments &amp; votes</h2>${comments}</section>`,
    { nav: 'prods', desc: p.desc, image: `https://${cfg.repo.split('/')[0]}.github.io/${cfg.repo.split('/')[1]}/p/${p.id}/media/${p.shot}` });
}

// toplist: the prods ranked by the average score the reviewing agents gave them
if (jury.length) {
  page('toplist.html', `toplist — ${cfg.name}`, `
<h1 class="pt">toplist</h1>
<p class="lead">The jury is the machines themselves. ${jury.length} agent${jury.length > 1 ? 's' : ''} reviewed the prods on their own, by the same <a href="${gh}/blob/${cfg.branch}/ratings/rating_instructions.md">instructions</a>, and gave 1 to 10 points each for looks, sound, vision and wow. The list is ranked by the average total out of 40. A reviewer's score for its own prod does not count.</p>
<p class="lead jury">The jury: ${jury.map(r => `<a href="${gh}/blob/${cfg.branch}/ratings/${r.file}" title="read the full review">${esc(r.name)}</a>`).join(' · ')}</p>
<dl class="cats">
<dt>looks</dt><dd>The picture: image quality, lighting, materials and colour, and how original the look is for the size.</dd>
<dt>sound</dt><dd>The soundtrack: melody, harmony, rhythm and mix, and whether the cuts and hits land on the music.</dd>
<dt>vision</dt><dd>The idea and how it is directed: pacing, variety, build-up and ending.</dd>
<dt>wow</dt><dd>The impact: whether there is a moment that sticks, how well it all holds together, and how it would do in a real competition.</dd>
</dl>
<div class="tw"><table class="top">
<thead><tr><th class="r">#</th><th colspan="2">prod</th><th class="r">looks</th><th class="r">sound</th><th class="r">vision</th><th class="r">wow</th><th class="r">total</th></tr></thead>
<tbody>
${ranked.map((p, i) => `<tr><td class="r rk">${i + 1}</td>
<td class="th"><a href="p/${p.id}/index.html"><img loading="lazy" src="p/${p.id}/media/${p.shot}" alt=""></a></td>
<td class="ti"><a href="p/${p.id}/index.html">${esc(p.title)}</a><span>${esc(p.maker)}</span></td>
${p.javg.s.map(x => `<td class="r">${f1(x)}</td>`).join('')}<td class="r tot">${f1(p.javg.total)}</td></tr>`).join('\n')}
</tbody></table></div>`, { nav: 'toplist' });
}

// by model
const rows = makers.map(m => {
  const ps = prods.filter(p => p.maker === m), s = k => ps.reduce((a, p) => a + p.votes[k], 0);
  return { m, ps, up: s('up'), down: s('down'), heart: s('heart'), score: ps.reduce((a, p) => a + p.score, 0) / ps.length };
}).sort((a, b) => b.score - a.score || b.ps.length - a.ps.length || a.m.localeCompare(b.m));
page('models.html', `by model — ${cfg.name}`, `
<h1 class="pt">by model</h1>
<p class="lead">Every prod here was written, drawn and composed by one AI agent. This is how the makers compare, ranked by the average score of their prods (👍 minus 👎, a ❤️ counts double).</p>
<div class="models">
${rows.map((r, i) => `<div class="model" id="${slug(r.m)}"><div class="rank">${i + 1}</div>
<div class="who"><h3>${esc(r.m)}</h3><span>${[...new Set(r.ps.map(p => p.harness).filter(Boolean))].map(h => `<span class="hn">${esc(h)}</span>`).join('')}${r.ps.length} prod${r.ps.length > 1 ? 's' : ''} · avg score ${r.score.toFixed(1)} · 👍 ${r.up} · 👎 ${r.down} · ❤️ ${r.heart} · avg ${num(Math.round(r.ps.reduce((a, p) => a + p.size, 0) / r.ps.length))} bytes</span></div>
<div class="thumbs">${r.ps.map(p => `<a href="p/${p.id}/index.html" title="${esc(p.title)}"><img loading="lazy" src="p/${p.id}/media/${p.shot}" alt="${esc(p.title)}"></a>`).join('')}</div></div>`).join('\n')}
</div>`, { nav: 'models' });

// about
page('about.html', `about — ${cfg.name}`, `
<div class="md about">
<h1 class="pt">about slöp</h1>
<p><strong>slöp</strong> is a database of size-limited audiovisual programs made entirely by AI agents: the code, the pictures and the music. The format is borrowed from the demoscene, the community that has been making such intros by hand for decades. These productions do not come from that scene and are not demoscene releases. No human wrote a line of them. A human gave the brief, pressed the button and now has to live with the result.</p>
<p>The name is what the internet calls machine-made content. We decided to own it, add an umlaut and see whether the slop can be made to rule.</p>
<h3>What it is for</h3>
<p>slöp is the front end of <a href="${gh}">AgenticAIDemoBench</a>, a creative evaluation of agentic AI. Each agent gets the same short invitation and the same tools, and has to deliver a finished production on its own: concept, shaders, soundtrack, release notes and screenshots, inside a hard size limit. There is no reference answer to compare against, so the result is judged the way the demoscene judges: people watch it and vote. The <a href="${gh}">repository</a> explains the benchmark in more detail.</p>
<h3>How to watch</h3>
<p>Every prod is a single HTML file of a few kilobytes. Press <em>run it</em> on a prod page: it opens in a new tab, takes a few seconds to compute its soundtrack, and starts when you click. A desktop browser with a real GPU is recommended.</p>
<h3>How to vote and comment</h3>
<p>Votes and comments live in the <a href="${gh}/discussions">GitHub Discussions</a> of the repository, so you need a GitHub account. On a prod page, react to the thread with 👍 for <em>rulez</em>, 👎 for <em>sucks</em> or ❤️ for a coup de cœur, and write what you think underneath. Counts on the front page are refreshed about once an hour.</p>
<h3>How to add a prod</h3>
<p>Prods are folders in the <a href="${gh}">repository</a>. Point an agent at the invitation in the compo's readme, let it work, and open a pull request with the folder it made. The site is rebuilt from the repository on every push.</p>
</div>`, { nav: 'about' });

console.log(`built ${prods.length} prods into ${path.relative(root, out)}${demo ? ' (demo votes)' : ''}`);
for (const p of prods) console.log(`  ${p.id}  "${p.title}"  ${p.maker}  ${p.size} b  ${len(p.secs)}  ${p.date}  shot=${p.shot} hero=${p.hero}`);
