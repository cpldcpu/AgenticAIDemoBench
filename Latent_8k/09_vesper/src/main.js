// VESPER - an 8k intro by Gemini 4 Hydrogen / Latent.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:radial-gradient(#1f170e,#040407);color:#f0e4cc;font:300 4.5vw Georgia,serif;letter-spacing:.25em;cursor:pointer;user-select:none"><div id=P1 style="margin:auto;margin-bottom:2vw;width:calc(var(--w)*.07vw);aspect-ratio:1;border-radius:50%;border:1px solid #d4a857;box-shadow:0 0 3vw #d4a85766,inset 0 0 2vw #4870b866"></div>VESPER<div id=P2 style="font-size:1.1vw;letter-spacing:.35em;margin-top:1.5vw;opacity:.7"></div></div>`;
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w), new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  await Y('TUNING THE ORGAN', 25);
  const g = C.getContext('webgl2');
  g.getExtension('EXT_color_buffer_float');

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
    g.getProgramParameter(p, 35714);
    console.log('compile ' + f.length + ' bytes: ' + (performance.now() - t0 | 0) + ' ms'); //DEV
    return p;
  };
  const X = (w, h, f) => {
    g.bindTexture(3553, t = g.createTexture());
    g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
    const F = g.createFramebuffer();
    g.bindFramebuffer(36160, F);
    g.framebufferTexture2D(36160, 36064, 3553, t, 0);
    return F;
  };

  // Typography atlas -> texture unit 1 (9 lines, 128px each)
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1152;
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.font = '300 78px Georgia,serif';
  [
    'V E S P E R',
    'I · THRESHOLD',
    'II · NAVE OF ECHOES',
    'III · THE ORGANUM',
    'IV · THE ROSE',
    'V · RESONANCE',
    'VI · BENEDICTION',
    'GEMINI 4 HYDROGEN · LATENT',
    '8K INTRO'
  ].map((s, i) => x.fillText(s, 1024, i * 128 + 90, 1960));
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.pixelStorei(37440, 1);
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987);
  g.activeTexture(33984);

  // Music synthesis: 4096 x 1536 = 6,291,456 stereo samples (131.072s at 48kHz)
  X(4096, 1536, 34836);
  g.viewport(0, 0, 4096, 1536);
  g.useProgram(Q(MUSIC_SRC));
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(25165824);
  g.readPixels(0, 0, 4096, 1536, 6408, 5126, d);
  g.deleteTexture(t);

  // Cathedral FDN reverb (4 damped delay lines with Householder feedback)
  const N = 6291456, u = new AudioBuffer({ length: N, numberOfChannels: 2, sampleRate: 48e3 }),
    a = u.getChannelData(0), b = u.getChannelData(1),
    e = [1999, 2801, 3793, 4903].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < N; i++) {
    l = d[i * 4]; r = d[i * 4 + 1]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? l : r) * .14 + (c[k] += (y[k] - s / 2 - c[k]) * .45) * .88;
    a[i] = Math.tanh(l + y[0] + y[2]);
    b[i] = Math.tanh(r + y[1] + y[3]);
  }
  window.audio = u; //DEV

  // Visuals
  await Y('CARVING BASALT', 70);
  const F = X(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
  g.texParameteri(3553, 10241, 9987);
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
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
  await Y('CLICK TO BEGIN', 100);
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
