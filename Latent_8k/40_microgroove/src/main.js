// MICROGROOVE - 8k intro by Latent (Gemini 4 Carbon). //DEV stripped in release.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r, a, b, v = 0, p0 = 0, p1 = 0, vL = 0, vR = 0;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document, M = Math, N = 5898240;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#06070a;cursor:none></canvas><div id=P0 style=position:fixed;inset:0;display:grid;place-content:center;text-align:center;color:#f6d59e;font:900\ 5.5vw\ sans-serif;cursor:pointer>MICROGROOVE<div id=P2 style=font:2vw\ monospace>...</div></div>`;
  await new Promise(q => setTimeout(q, 40));
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
  const TP = m => [10241, 10242, 10243].map((p, j) => g.texParameteri(3553, p, j ? 33071 : m));

  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048; x.canvas.height = 1024; x.fillStyle = '#fff'; x.textAlign = 'center';
  'MICROGROOVE,CODE & MUSIC · GEMINI 4 CARBON · LATENT,GREETS · OPUS · FABLE · ASTRA · NEON · HYDROGEN · ARGON,I · 33 1/3 RPM,II · 45/45 STEREO,III · CLASS A,IV · ANTI-SKATE,V · 45 RPM,VI · LOCKED GROOVE'.split(',').map((q, k) => {
    x.font = (k ? 52 : 112) + 'px ' + (k > 2 ? 'monospace' : 'sans-serif');
    x.fillText(q, k < 3 ? 1024 : (k - 3 & 1) * 1024 + 512, (k < 3 ? k : 3 + (k - 3 >> 1)) * 128 + 90, k < 3 ? 1960 : 960);
  });
  g.activeTexture(33985); g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553); TP(9987);

  g.activeTexture(33984); X(4096, 1440, 34836); g.viewport(0, 0, 4096, 1440); g.useProgram(Q(MUSIC_SRC)); g.drawArrays(4, 0, 3);
  const d = new Float32Array(N * 4); g.readPixels(0, 0, 4096, 1440, 6408, 5126, d); g.deleteTexture(t);

  const u = new AudioBuffer({ length: N, numberOfChannels: 2, sampleRate: 48e3 }),
    L = u.getChannelData(0), R0 = u.getChannelData(1),
    e = [1637, 2293, 3989, 17280].map(n => new Float32Array(n)),
    y = [0, 0, 0, 0], c = [0, 0, 0, 0], ev = new Float32Array(16384);
  for (; i < N; i++) {
    a = d[i * 4 + 2]; b = d[i * 4 + 3]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? b : a) * .2 + (c[k] += (y[k] - s / 2 - c[k]) * .45) * .8;
    l = d[i * 4] + (y[0] + y[2]) * .78; r = d[i * 4 + 1] + (y[1] + y[3]) * .78;
    v = M.max(M.abs(l), M.abs(r), v * .99993); s = 1.25 / (.32 + v);
    L[i] = l = M.tanh(l * s); R0[i] = r = M.tanh(r * s);
    p0 += ((l + r) * .5 - p0) * .002; p1 += (M.abs(l - r) - p1) * .001; vL += (M.abs(l) - vL) * 3e-4; vR += (M.abs(r) - vR) * 3e-4;
    i % 1440 || ev.set([p0 * 4, p1 * 2.6, vL * 4.2, vR * 4.2], i / 360);
  }
  window.audio = u; //DEV
  g.activeTexture(33986); g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 34842, 4096, 1, 0, 6408, 5126, ev); TP(9729); g.texParameteri(3553, 10240, 9729);

  g.activeTexture(33984);
  const F = X(W, H, 34842), P = [Q(SCENE_SRC), Q(POST_SRC)]; TP(9987);
  const fr = T => P.map((p, k) => {
    g.viewport(0, 0, W, H); g.bindFramebuffer(36160, k ? null : F); k && g.generateMipmap(3553); g.useProgram(p);
    g.uniform4f(g.getUniformLocation(p, 'R'), W, H, T, 0);
    g.uniform1i(g.getUniformLocation(p, 'B'), 2 - k);
    g.drawArrays(4, 0, 3);
  });
  fr(0); g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  P2.innerText = 'CLICK';
  onclick = () => {
    onclick = 0; P0.remove(); C.requestFullscreen().catch(() => { });
    const ac = new AudioContext(), sc = ac.createBufferSource(), lp = q => {
      z || (sc.start(), z = q); const T = (q - z) / 1e3; fr(M.min(T, 122.8)); if (T < 123) requestAnimationFrame(lp);
    };
    sc.buffer = u; sc.connect(ac.destination); requestAnimationFrame(lp);
  };
})();
