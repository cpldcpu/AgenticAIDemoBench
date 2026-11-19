// SPILLWAY - Latent 8k intro (Gemini 4 Neon). //DEV stripped in release.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r, v = 0, a, b;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document, N = 5963776;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#000;color:#eef;font:700 5vw sans-serif;cursor:pointer">SPILLWAY<p id=P2 style=font:1vw sans-serif;color:#7cc></p></div>`;
  const Y = m => (P2.innerText = m, new Promise(r => requestAnimationFrame(_ => setTimeout(r, 40))));
  await Y('...');
  const g = C.getContext('webgl2'); g.getExtension('EXT_color_buffer_float');
  const Q = f => {
    const p = g.createProgram();
    const t0 = performance.now(); //DEV
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', f].map((c, j) => {
      const h = g.createShader(35633 - j); g.shaderSource(h, c); g.compileShader(h); g.attachShader(p, h);
      if (!g.getShaderParameter(h, 35713)) console.error('SHADER ' + j + ': ' + g.getShaderInfoLog(h)); //DEV
    });
    g.linkProgram(p); g.getProgramParameter(p, 35714);
    console.log('compile ' + f.length + ' bytes: ' + (performance.now() - t0 | 0) + ' ms'); //DEV
    return p;
  };
  const X = (w, h, f) => {
    g.bindTexture(3553, t = g.createTexture()); g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
    const F = g.createFramebuffer(); g.bindFramebuffer(36160, F); g.framebufferTexture2D(36160, 36064, 3553, t, 0); return F;
  };
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048; x.canvas.height = 1024; x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 84px sans-serif';
  'SPILLWAY,CODE & MUSIC · GEMINI 4 NEON · LATENT,BAY 04 · 184M · LATENT,GREETS · NUANCE · ALCATRAZ · LOONIES · LJ · LATENT,01 HEADWATER,02 SLUICE,03 SURGE HALL,04 PENSTOCK,05 TURBINE,06 GRID'.split(',').map((m, j) =>
    x.fillText(m, j < 4 ? 1024 : (j & 1) * 1024 + 512, (j < 4 ? [0, 5, 6, 7][j] : (j >> 1)) * 128 + 92, j < 4 ? 1980 : 960));
  g.activeTexture(33985); g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553); g.texParameteri(3553, 10241, 9987); g.activeTexture(33984);

  X(4096, 1456, 34836); g.viewport(0, 0, 4096, 1456); g.useProgram(Q(MUSIC_SRC)); g.drawArrays(4, 0, 3);
  const d = new Float32Array(N * 4); g.readPixels(0, 0, 4096, 1456, 6408, 5126, d); g.deleteTexture(t);
  const u = new AudioBuffer({ length: N, numberOfChannels: 2, sampleRate: 48e3 }), L = u.getChannelData(0), M = u.getChannelData(1),
    e = [1553, 2137, 2861, 3709].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < N; i++) {
    l = d[i * 4]; r = d[i * 4 + 1]; a = d[i * 4 + 2]; b = d[i * 4 + 3]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? a : b) * .16 + (c[k] += (y[k] - s / 2 - c[k]) * .42) * .84;
    l += y[0] + y[2]; r += y[1] + y[3]; v = Math.max(Math.abs(l), Math.abs(r), v * .99993); s = .92 / (.34 + v);
    L[i] = Math.tanh(l * s); M[i] = Math.tanh(r * s);
  }
  window.audio = u; //DEV

  const F = X(W, H, 34842), P = [Q(SCENE_SRC), Q(POST_SRC)];
  [10241, 10242, 10243].map((p, j) => g.texParameteri(3553, p, j ? 33071 : 9987)); g.viewport(0, 0, W, H);
  const fr = T => P.map((p, j) => {
    g.bindFramebuffer(36160, j ? null : F); j && g.generateMipmap(3553); g.useProgram(p);
    const U = s => g.getUniformLocation(p, s); g.uniform4f(U('R'), W, H, T, 0); g.uniform1i(U('B'), 1); g.drawArrays(4, 0, 3);
  });
  fr(0); g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  await Y('CLICK');
  onclick = () => {
    onclick = 0; P0.remove(); C.requestFullscreen();
    const ac = new AudioContext(), sc = ac.createBufferSource(), lp = q => {
      z || (sc.start(), z = q); const T = (q - z) / 1e3; fr(Math.min(T, 123.5)); if (T < 124) requestAnimationFrame(lp);
    };
    sc.buffer = u; sc.connect(ac.destination); requestAnimationFrame(lp);
  };
})();
