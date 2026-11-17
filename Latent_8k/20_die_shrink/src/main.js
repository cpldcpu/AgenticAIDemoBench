// DIE SHRINK - an 8k intro by Latent. Lines ending in //DEV are stripped from the release build.
// All precalc (soundtrack, shader compile) happens on the title screen; the click only starts playback.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  // title screen: the name in a terminal font, and a row of eight dies that light up as the loading steps finish
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#000;color:#9ef;font:4vw Consolas,monospace;cursor:pointer;user-select:none">DIE SHRINK<p id=P1 style="margin:2vw auto;height:1vw;width:24vw;background:repeating-linear-gradient(90deg,#3cf 0 2vw,#000 0 3vw);clip-path:inset(0 calc(100% - var(--w)*33.4%) 0 0)"></p><div id=P2 style=font-size:1.2vw></div></div>`;
  // show a status line and let the browser paint it before the next blocking step
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w), new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  await Y('etching the wafer', 1);
  const g = C.getContext('webgl2');
  g.getExtension('EXT_color_buffer_float');

  // program from fragment source; fullscreen triangle from gl_VertexID
  const Q = f => {
    const p = g.createProgram();
    const t0 = performance.now(); //DEV
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', f].map((s, i) => {
      const h = g.createShader(35633 - i);
      g.shaderSource(h, s);
      g.compileShader(h);
      g.attachShader(p, h);
      if (!g.getShaderParameter(h, 35713)) console.error('SHADER ' + i + ': ' + g.getShaderInfoLog(h)); //DEV
    });
    g.linkProgram(p);
    g.getProgramParameter(p, 35714); // block here until it is compiled, not in the first frame
    console.log('compile ' + f.length + ' bytes: ' + (performance.now() - t0 | 0) + ' ms'); //DEV
    return p;
  };
  // float texture + framebuffer
  const X = (w, h, f) => {
    g.bindTexture(3553, t = g.createTexture());
    g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
    const F = g.createFramebuffer();
    g.bindFramebuffer(36160, F);
    g.framebufferTexture2D(36160, 36064, 3553, t, 0);
    return F;
  };

  // the captions -> texture unit 1
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1152;
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.font = '900 96px Segoe UI,sans-serif';
  ['DIE SHRINK', 'CLAUDE OPUS 5.5 · LATENT'].map((s, i) => x.fillText(s, 1024, i * 128 + 96, 2000));
  // node labels, eight to a line
  ['10 µm', '3 µm', '800 nm', '180 nm', '65 nm', '22 nm', '7 nm', '3 nm'].map((s, i) => x.fillText(s, i * 256 + 128, 864, 240));
  // the scroller that the SRAM shows: one long strip over four lines
  x.textAlign = 'left';
  x.font = '900 84px Segoe UI,sans-serif';
  for (i = 0; i < 4; i++) x.fillText('                    A LATENT PRODUCTION · CODE AND MUSIC BY CLAUDE OPUS 5.5 · GREETINGS TO ALCATRAZ · NUANCE · LOONIES · CTRL-ALT-TEST · CONSPIRACY · MERCURY · FAIRLIGHT · LJ · TRSI · AND EVERY MODEL IN LATENT · ', -2048 * i, i * 128 + 352);
  i = 0;
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987);
  g.activeTexture(33984);

  // music: one pixel per sample, rendered by the GPU
  X(4096, 1600, 34836);
  g.viewport(0, 0, 4096, 1600);
  g.useProgram(Q(MUSIC_SRC));
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(26214400);
  g.readPixels(0, 0, 4096, 1600, 6408, 5126, d);
  g.deleteTexture(t);
  // the room: a feedback delay network of four damped delay lines, mixed by a Householder matrix
  const u = new AudioBuffer({ length: 6553600, numberOfChannels: 2, sampleRate: 48e3 }), a = u.getChannelData(0), b = u.getChannelData(1),
    e = [1117, 1543, 2011, 2531].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < 6553600; i++) {
    l = d[i * 4]; r = d[i * 4 + 1]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? l : r) * .07 + (c[k] += (y[k] - s / 2 - c[k]) * .5) * .78;
    a[i] = l + y[0] + y[2];
    b[i] = r + y[1] + y[3];
  }
  window.audio = u; //DEV

  // visuals
  await Y('bonding the wires', 2);
  const F = X(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
  g.texParameteri(3553, 10241, 9987);
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
  g.viewport(0, 0, W, H);
  const fr = T => {
    g.bindFramebuffer(36160, F);
    g.useProgram(p1);
    g.uniform4f(g.getUniformLocation(p1, 'R'), W, H, T, 0);
    g.uniform1i(g.getUniformLocation(p1, 'B'), 1);
    g.drawArrays(4, 0, 3);
    g.bindFramebuffer(36160, null);
    g.generateMipmap(3553);
    g.useProgram(p2);
    g.uniform4f(g.getUniformLocation(p2, 'R'), W, H, T, 0);
    g.uniform1i(g.getUniformLocation(p2, 'B'), 1);
    g.drawArrays(4, 0, 3);
  };
  fr(0);
  g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  await Y('click to power on', 3);
  onclick = e => {
    onclick = 0;
    P0.remove();
    C.requestFullscreen();
    const s = new AudioContext().createBufferSource(), L = q => {
      z || (s.start(), z = q);
      fr((q - z) / 1e3);
      requestAnimationFrame(L);
    };
    s.buffer = u;
    s.connect(s.context.destination);
    requestAnimationFrame(L);
  };
})();
