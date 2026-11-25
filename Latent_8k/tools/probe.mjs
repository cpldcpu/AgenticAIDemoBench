// Debug helper: node tools/probe.mjs <introDir> t1,t2,...  -> prints the scene FBO's centre pixel (raw float RGBA) per time
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const dir = path.resolve(process.argv[2]);
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new',
  args: [...(process.env.BARGS ? process.env.BARGS.split(' ') : ['--use-angle=d3d11', '--enable-gpu']), '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('console', m => console.log('[page]', m.text()));
await page.evaluateOnNewDocument(() => { window.CAP = 1; window.CAPW = 320; window.CAPH = 180; });
await page.goto(pathToFileURL(path.join(dir, 'dev.html')).href);
await page.waitForFunction(() => window.fr, { timeout: 120000 });
for (const dbg of [5,6,7]) for (const t of process.argv[3].split(',').map(Number)) {
  await page.evaluate(d => { window.DBG = d }, dbg);
  const v = await page.evaluate(t => {
    fr(t);
    gl.bindFramebuffer(36160, window.fbo);
    const a = new Float32Array(4);
    const o = [];for (const [x, y] of [[160, 90], [40, 30], [280, 150], [100, 140]]) { gl.readPixels(x, y, 1, 1, 6408, 5126, a); o.push([...a].map(v => +v.toFixed(3)).join(',')); } return o;
    return [...a].map(x => +x.toFixed(4));
  }, t);
  console.log('dbg' + dbg + ' t=' + t, v.join('   '));
}
await browser.close();

