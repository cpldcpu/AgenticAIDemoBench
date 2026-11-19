// ZERO-G - Latent 8k intro (Gemini 4 Neon in Antigravity). //DEV stripped in release.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, j, k, s, l, r, a, b;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document, N = 4096 * 1550, S = 'position:fixed;inset:0;background:#03050c;';
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style="${S}width:100%;height:100%;object-fit:contain;cursor:none"></canvas><div id=P0 style="${S}display:grid;place-content:center;text-align:center;color:#eef;font:700 4vw sans-serif;white-space:pre;cursor:pointer">ZERO-G\n...</div>`;
  await new Promise(r => setTimeout(r, 40));
  const g = C.getContext('webgl2'); g.getExtension('EXT_color_buffer_float');
  const Q = f => {
    const p = g.createProgram();
    const t0 = performance.now(); //DEV
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', f].map((c, j) => {
      const h = g.createShader(35633 - j); g.shaderSource(h, c); g.compileShader(h); g.attachShader(p, h);
      if (!g.getShaderParameter(h, 35713)) console.error('SHADER ' + j + ': ' + g.getShaderInfoLog(h)); //DEV
    });
    g.linkProgram(p); g.useProgram(p); g.uniform1i(g.getUniformLocation(p, 'B'), 1);
    console.log('compile ' + f.length + ' bytes: ' + (performance.now() - t0 | 0) + ' ms'); //DEV
    return p;
  };
  const X = (w, h, f) => {
    g.bindTexture(3553, t = g.createTexture()); g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
    const F = g.createFramebuffer(); g.bindFramebuffer(36160, F); g.framebufferTexture2D(36160, 36064, 3553, t, 0); return F;
  };
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048; x.canvas.height = 1024; x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 84px sans-serif';
  'ZERO-G,> build zero-g. make it sing.,◈ THINKING · TWIN CORES,◈ MULTIMODAL · PIXELS & SPECTRUM,◈ SWARM · MESSAGE BOARD,◈ ZOPFLI · 8192 B,GEMINI 4 NEON · ANTIGRAVITY · LATENT,GREETS · CLAUDE · HYDROGEN · ARGON · NUANCE · ALCATRAZ · LATENT'.split(',').map((m, j) =>
    x.fillText(m, j ? 1024 : 512, j * 128 + 92, 1960));
  for (k = 10; k--;) x.fillText(k, 1074 + k * 100, 92);
  g.activeTexture(33985); g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553); g.texParameteri(3553, 10241, 9987); g.activeTexture(33984);

  X(4096, 1550, 34836); g.viewport(0, 0, 4096, 1550); Q(MUSIC_SRC); g.drawArrays(4, 0, 3);
  const d = new Float32Array(N * 4); g.readPixels(0, 0, 4096, 1550, 6408, 5126, d); g.deleteTexture(t);
  const u = new AudioBuffer({ length: N, numberOfChannels: 2, sampleRate: 48e3 }), L = u.getChannelData(0), M = u.getChannelData(1),
    e = [1699, 2341, 3119, 4057].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < N; i++) {
    j = i * 4; l = d[j]; r = d[j + 1]; a = d[j + 2]; b = d[j + 3]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? a : b) * .16 + (c[k] += (y[k] - s / 2 - c[k]) * .38) * .85;
    L[i] = Math.tanh((l + y[0] + y[2]) * 1.15) * .9; M[i] = Math.tanh((r + y[1] + y[3]) * 1.15) * .9;
  }
  window.audio = u; //DEV

  const F = X(W, H, 34842), P = [Q(SCENE_SRC), Q(POST_SRC)];
  [10241, 10242, 10243].map((p, j) => g.texParameteri(3553, p, j ? 33071 : 9987)); g.viewport(0, 0, W, H);
  const fr = T => P.map((p, j) => {
    g.bindFramebuffer(36160, j ? null : F); j && g.generateMipmap(3553); g.useProgram(p);
    g.uniform4f(g.getUniformLocation(p, 'R'), W, H, T, 0); g.drawArrays(4, 0, 3);
  });
  fr(0); g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  P0.innerText = 'ZERO-G\nCLICK';
  onclick = () => {
    onclick = 0; P0.remove(); C.requestFullscreen();
    const sc = new AudioContext().createBufferSource(), lp = q => {
      z || (sc.start(), z = q); const T = (q - z) / 1e3; fr(Math.min(T, 131.5)); if (T < 132) requestAnimationFrame(lp);
    };
    sc.buffer = u; sc.connect(sc.context.destination); requestAnimationFrame(lp);
  };
})();
