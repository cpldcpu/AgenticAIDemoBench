// node tools/glcheck.mjs file.frag [...]  -> compile fragment shaders in headless Edge and print the info log with source line numbers
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', ...(process.env.BROWSER_ARGS || '').split(' ').filter(Boolean)] });
const page = await browser.newPage();
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  console.log(f, await page.evaluate(s => {
    const g = document.createElement('canvas').getContext('webgl2'), h = g.createShader(35632);
    g.shaderSource(h, s); g.compileShader(h);
    return g.getShaderParameter(h, 35713) ? 'OK' : g.getShaderInfoLog(h);
  }, src));
}
await browser.close();
