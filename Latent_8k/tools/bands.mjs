// node tools/bands.mjs <introDir> [out.wav]  -> RMS, peak and share of energy in seven bands for every 4 bars of the soundtrack; optional 16-bit WAV.
// The bar length in samples comes from the BAR environment variable (default 81920 = 140.625 BPM); set $env:BAR for other tempos.
import path from 'node:path'; import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const dir = path.resolve(process.argv[2]);
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist', ...(process.env.BROWSER_ARGS || '').split(' ').filter(Boolean)] });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { window.CAP = 1; });
await page.goto(pathToFileURL(path.join(dir, 'dev.html')).href);
await page.waitForFunction(() => window.fr, { timeout: 120000 });
const r = await page.evaluate(B => {
  const L = audio.getChannelData(0), R = audio.getChannelData(1), n = 4096, out = [];
  const edges = [0, 60, 150, 400, 1000, 2500, 6000, 24000];
  const fft = (re, im) => { const N = re.length; for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len; for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), s = Math.sin(a * k), xr = re[i + k + len / 2] * c - im[i + k + len / 2] * s, xi = re[i + k + len / 2] * s + im[i + k + len / 2] * c; re[i + k + len / 2] = re[i + k] - xr; im[i + k + len / 2] = im[i + k] - xi; re[i + k] += xr; im[i + k] += xi; } } };
  for (let sec = 0; sec * 4 * B < L.length; sec++) {
    const s0 = sec * 4 * B, bands = new Array(7).fill(0); let sq = 0, pk = 0;
    for (let w = 0; w < 24; w++) {
      const o = s0 + Math.floor(w * (4 * B - n) / 24), re = new Float64Array(n), im = new Float64Array(n);
      for (let i = 0; i < n; i++) { const v = (L[o + i] + R[o + i]) / 2; re[i] = v * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / n)); }
      fft(re, im);
      for (let k = 1; k < n / 2; k++) { const f = k * 48000 / n, e = re[k] * re[k] + im[k] * im[k]; for (let b = 0; b < 7; b++) if (f >= edges[b] && f < edges[b + 1]) bands[b] += e; }
    }
    for (let i = s0; i < s0 + 4 * B; i++) { sq += L[i] * L[i]; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
    const tot = bands.reduce((a, b) => a + b, 0) || 1;
    out.push(`bars ${String(sec * 4).padStart(2)}-${sec * 4 + 4}: rms ${Math.sqrt(sq / (4 * B)).toFixed(3)} pk ${pk.toFixed(2)} | ` + bands.map(b => (100 * b / tot).toFixed(0).padStart(3)).join(' '));
  }
  return out;
}, +(process.env.BAR || 81920));
console.log('bands(%):  <60  60-150 150-400 400-1k 1k-2.5k 2.5k-6k >6k');
console.log(r.join('\n'));
if (process.argv[3]) {
  const pcm = await page.evaluate(() => { const L = audio.getChannelData(0), R = audio.getChannelData(1), a = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { a[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; a[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; } let s = ''; const u = new Uint8Array(a.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); });
  const d = Buffer.from(pcm, 'base64'), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + d.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(48000, 24); h.writeUInt32LE(192000, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(d.length, 40);
  fs.writeFileSync(process.argv[3], Buffer.concat([h, d]));
}
await browser.close();
