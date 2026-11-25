// Capture stills / contact sheet / video from an intro's dev.html, rendered frame by frame (deterministic).
//   node tools/capture.mjs <introDir> sheet [t1,t2,...]      -> media/contact_sheet.jpg (16 tiles)
//   node tools/capture.mjs <introDir> still <t> [out.png]    -> one full-res frame
//   node tools/capture.mjs <introDir> video [seconds] [fps]  -> media/<name>.mp4 (with the GPU-rendered soundtrack)
//   node tools/capture.mjs <introDir> check <file.html>      -> load a packed build in the browser and report errors
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2]);
const mode = process.argv[3] || 'sheet';
const media = path.join(dir, 'media');
fs.mkdirSync(media, { recursive: true });
const name = path.basename(dir).replace(/^\d+_/, '');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER || EDGE, headless: 'new', protocolTimeout: 600000,
  args: [...(process.env.BARGS ? process.env.BARGS.split(' ') : ['--use-angle=d3d11', '--enable-gpu']), '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
    '--window-size=1920,1080', '--hide-scrollbars', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
let nlog = 0;
page.on('console', m => { if (nlog++ < 12) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));

async function open(file, w, h) {
  await page.evaluateOnNewDocument((w, h) => { window.CAP = 1; window.CAPW = w; window.CAPH = h; }, w, h);
  await page.goto(pathToFileURL(file).href);
  const t0 = Date.now();
  await page.waitForFunction(() => window.fr, { timeout: 120000 });
  const info = await page.evaluate(() => {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  console.log('init', Date.now() - t0, 'ms on', info);
}
const grab = (t, type, q) => page.evaluate((t, type, q) => { fr(t); return cv.toDataURL(type, q).split(',')[1]; }, t, type, q);

if (mode === 'check') {
  await page.goto(pathToFileURL(path.resolve(process.argv[4])).href);
  const t0 = Date.now();
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(media, 'check_loading.png') });
  await page.waitForFunction(() => document.body && /CLICK/i.test(document.body.innerText), { timeout: 120000 });
  console.log('ready after', Date.now() - t0, 'ms:', JSON.stringify(await page.evaluate(() => document.body.innerText)));
  await page.screenshot({ path: path.join(media, 'check_ready.png') });
  await page.mouse.click(400, 300);
  await new Promise(r => setTimeout(r, 4000));
  console.log('after click: start screen', await page.evaluate(() => document.getElementById('P0') ? 'still there' : 'gone'));
  await page.screenshot({ path: path.join(media, 'check_playing.png') });
} else if (mode === 'still') {
  await open(path.join(dir, 'dev.html'), +process.env.CAPW || 1920, +process.env.CAPH || 1080);
  const out = process.argv[5] || path.join(media, 'still.png');
  fs.writeFileSync(out, Buffer.from(await grab(+process.argv[4], 'image/png'), 'base64'));
} else if (mode === 'sheet') {
  await open(path.join(dir, 'dev.html'), 960, 540);
  const times = (process.argv[4] || '5,12,18,26,34,44,50,58,66,76,82,90,100,108,116,124').split(',').map(Number);
  const tmp = fs.mkdtempSync(path.join(media, 'tmp'));
  for (let i = 0; i < times.length; i++) {
    const t0 = Date.now();
    fs.writeFileSync(path.join(tmp, String(i).padStart(3, '0') + '.png'), Buffer.from(await grab(times[i], 'image/png'), 'base64'));
    console.log('t=' + times[i], Date.now() - t0, 'ms');
  }
  const out = process.argv[5] || path.join(media, 'contact_sheet.jpg');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(tmp, '%03d.png'),
    '-vf', `scale=480:270,tile=4x${Math.ceil(times.length / 4)}:padding=4:margin=4:color=black`, '-frames:v', '1', '-q:v', '2', out]);
  fs.rmSync(tmp, { recursive: true });
  console.log('wrote', out);
} else if (mode === 'video') {
  const secs = +(process.argv[4] || 137), fps = +(process.argv[5] || 60);
  await open(path.join(dir, 'dev.html'), +process.env.CAPW || 1920, +process.env.CAPH || 1080);
  // soundtrack -> 16-bit WAV
  const N = Math.round(secs * 48000), wav = Buffer.alloc(44 + N * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(48000, 24); wav.writeUInt32LE(192000, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
  for (let o = 0; o < N; o += 480000) {
    const b64 = await page.evaluate((o, n) => {
      const l = audio.getChannelData(0), r = audio.getChannelData(1), a = new Int16Array(n * 2);
      for (let i = 0; i < n; i++) { a[i * 2] = Math.max(-1, Math.min(1, l[o + i])) * 32767; a[i * 2 + 1] = Math.max(-1, Math.min(1, r[o + i])) * 32767; }
      let s = ''; const u = new Uint8Array(a.buffer);
      for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
      return btoa(s);
    }, o, Math.min(480000, N - o));
    Buffer.from(b64, 'base64').copy(wav, 44 + o * 4);
  }
  const wavPath = path.join(media, name + '.wav');
  fs.writeFileSync(wavPath, wav);
  const out = path.join(media, name + '.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', wavPath, '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '26', '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(secs * fps), t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const buf = Buffer.from(await grab(i / fps, 'image/jpeg', 0.96), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.unlinkSync(wavPath);
  console.log('wrote', out);
}
await browser.close();
