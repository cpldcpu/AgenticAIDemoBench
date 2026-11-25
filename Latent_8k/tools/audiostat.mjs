// node tools/audiostat.mjs <introDir>  -> per-section peak/RMS of the GPU-rendered soundtrack, NaN check, real-time frame cost
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const dir = path.resolve(process.argv[2]);
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', ...(process.env.BROWSER_ARGS || '').split(' ').filter(Boolean)],
});
const page = await browser.newPage();
page.on('console', m => console.log('[page]', m.text()));
await page.evaluateOnNewDocument(() => { window.CAP = 1; });
await page.goto(pathToFileURL(path.join(dir, 'dev.html')).href);
await page.waitForFunction(() => window.fr, { timeout: 120000 });
const r = await page.evaluate(() => {
  const out = [];
  for (let s = 0; s < 9; s++) {
    let pk = 0, sq = 0, nan = 0, n = 0, zc = 0, prev = 0;
    for (let c = 0; c < 2; c++) {
      const d = audio.getChannelData(c);
      for (let i = s * 768000; i < Math.min((s + 1) * 768000, d.length); i++) {
        const v = d[i]; if (v !== v) nan++; pk = Math.max(pk, Math.abs(v)); sq += v * v; n++;
        if (c == 0) { if ((v > 0) != (prev > 0)) zc++; prev = v; }
      }
    }
    out.push(`sec ${s} (${s * 16}s): peak ${pk.toFixed(3)} rms ${Math.sqrt(sq / n).toFixed(3)} zero-cross/s ${(zc / 16).toFixed(0)} nan ${nan}`);
  }
  // frame cost at 1080p: render + force completion
  const px = new Uint8Array(4);
  for (const t of [20, 40, 56, 72, 90, 105, 120]) {
    fr(t); gl.readPixels(0, 0, 1, 1, 6408, 5121, px);
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) { fr(t + i / 60); gl.readPixels(0, 0, 1, 1, 6408, 5121, px); }
    out.push(`t=${t}: ${((performance.now() - t0) / 10).toFixed(1)} ms/frame @1080p`);
  }
  return out;
});
console.log(r.join('\n'));
await browser.close();
