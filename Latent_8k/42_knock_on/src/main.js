// KNOCK-ON - an 8k intro by Latent. Lines ending in //DEV are stripped from the release build.
// All precalc (soundtrack, shader compile) happens on the title screen; the click only starts playback.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r, e = 0;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#000;color:#eee;font:5vw Georgia;letter-spacing:.3em;cursor:pointer;user-select:none">KNOCK-ON<div id=P2 style="font:italic 1.6vw Georgia;letter-spacing:0;color:#d33"></div></div>`;
  // show a status line and let the browser paint it before the next blocking step
  const Y = s => (P2.innerText = s, new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  await Y('tuning 2,800 dominoes');
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

  // title and captions -> texture unit 1, eight lines of 128 pixels; captions start at the left edge
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1024;
  x.fillStyle = '#fff';
  ['KNOCK-ON', 'A LATENT 8K INTRO', 'one domino, one note', 'two rows, two tempi', 'each one half again as tall', 'CODE AND MUSIC BY CLAUDE OPUS 5.5', 'LATENT 2026', 'a spiral, from the outside in'].map((s, i) => {
    x.font = i % 5 > 1 ? 'italic 96px Georgia' : i ? '72px Georgia' : '112px Georgia';
    x.letterSpacing = i % 5 > 1 ? '0px' : '24px';
    x.textAlign = i % 5 > 1 ? 'left' : 'center';
    x.fillText(s, i % 5 > 1 ? 8 : 1024, i * 128 + 98, 2030);
  });
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987);
  g.activeTexture(33984);

  // music: one pixel per sample, rendered by the GPU; xy dry, zw the send to the hall
  X(4096, 1172, 34836);
  g.viewport(0, 0, 4096, 1172);
  g.useProgram(Q(MUSIC_SRC));
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(19202048);
  g.readPixels(0, 0, 4096, 1172, 6408, 5126, d);
  g.deleteTexture(t);
  // the hall: four damped delay lines mixed by a Householder matrix; then a slow compressor that cannot clip
  const u = new AudioBuffer({ length: 48e5, numberOfChannels: 2, sampleRate: 48e3 }), a = u.getChannelData(0), b = u.getChannelData(1),
    E = [2203, 2917, 3571, 4409].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < 48e5; i++) {
    s = 0;
    for (k = 4; k--;) s += y[k] = E[k][i % E[k].length];
    for (k = 4; k--;) E[k][i % E[k].length] = d[i * 4 + 2 + (k & 1)] * .2 + (c[k] += (y[k] - s / 2 - c[k]) * .45) * .88;
    l = d[i * 4] + y[0] + y[2] * .5;
    r = d[i * 4 + 1] + y[1] + y[3] * .5;
    e = Math.max(Math.abs(l), Math.abs(r), e * .99997);
    a[i] = l / (.4 + e);
    b[i] = r / (.4 + e);
  }
  window.audio = u; //DEV

  // visuals
  await Y('setting up the table');
  const F = X(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
  g.texParameteri(3553, 10241, 9987); // trilinear, so the blur from the coarse mip levels is smooth
  g.viewport(0, 0, W, H);
  const fr = T => {
    g.bindFramebuffer(36160, F);
    g.useProgram(p1);
    g.uniform4f(g.getUniformLocation(p1, 'R'), W, H, T, 0);
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
  await Y('click to knock');
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
