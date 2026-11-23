// BAORI - Gemini 4 Hydrogen · Latent. //DEV stripped in release.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r, v = 0, a, b;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document, N = 6144000;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style=position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#000;color:#fc8;font:5vw\ serif;cursor:pointer>BAORI<p id=P2 style=font:1vw\ serif>`;
  const Y = m => new Promise(r => (P2.innerText = m, setTimeout(r, 40)));
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
  x.canvas.width = 2048; x.canvas.height = 1024; x.fillStyle = '#fff'; x.textAlign = 'center';
  'BAORI,CODE & MUSIC · GEMINI 4 HYDROGEN · LATENT,GREETS · NEON · ARGON · CLAUDE · ASTRA · NUANCE · ALCATRAZ,I · DUSK,II · FIRST DROPS,III · MONSOON,IV · SUBMERGED,V · SANCTUM,VI · STILLNESS'.split(',').map((m, j) => {
    x.font = (j ? 64 : 116) + 'px Georgia,serif';
    x.fillText(m, j < 3 ? 1024 : (j - 3 & 1) * 1024 + 512, (j < 3 ? j : 3 + (j - 3 >> 1)) * 128 + (j ? 88 : 104), j < 3 ? 1960 : 960);
  });
  g.activeTexture(33985); g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553); g.texParameteri(3553, 10241, 9987); g.activeTexture(33984);

  X(4096, 1500, 34836); g.viewport(0, 0, 4096, 1500); g.useProgram(Q(MUSIC_SRC)); g.drawArrays(4, 0, 3);
  const d = new Float32Array(N * 4); g.readPixels(0, 0, 4096, 1500, 6408, 5126, d); g.deleteTexture(t);
  const u = new AudioBuffer({ length: N, numberOfChannels: 2, sampleRate: 48e3 }), L = u.getChannelData(0), M = u.getChannelData(1),
    e = [1637, 2293, 3079, 3989].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < N; i++) {
    l = d[i * 4]; r = d[i * 4 + 1]; a = d[i * 4 + 2]; b = d[i * 4 + 3]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? a : b) * .17 + (c[k] += (y[k] - s / 2 - c[k]) * .42) * .84;
    l += y[0] + y[2] + a * .22; r += y[1] + y[3] + b * .22;
    v = Math.max(Math.abs(l), Math.abs(r), v * .99992); s = .92 / (.36 + v);
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
      z || (sc.start(), z = q); const T = (q - z) / 1e3; fr(Math.min(T, 127.5)); if (T < 128) requestAnimationFrame(lp);
    };
    sc.buffer = u; sc.connect(ac.destination); requestAnimationFrame(lp);
  };
})();
