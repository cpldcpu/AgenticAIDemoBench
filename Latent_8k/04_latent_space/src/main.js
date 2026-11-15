// LATENT SPACE - an 8k intro by Latent. Lines ending in //DEV are stripped from the release build.
// All precalc (soundtrack, shader compile) happens on the title screen; the click only starts playback.
(async () => {
  let W = 1920, H = 1080, t, z = 0;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#102;color:#bef;font:200 5vw Bahnschrift,sans-serif;letter-spacing:1.2vw;cursor:pointer;user-select:none"><style>@keyframes k{50%{opacity:.3}}#P0 div{font-size:1.1vw;margin:2.5vw;color:#a8d}</style><canvas id=K width=48 height=48 style="width:14vw;margin:auto;image-rendering:pixelated;box-shadow:0 0 6vw #6af"></canvas>LATENT SPACE<div>AN 8K INTRO BY LATENT</div><p id=P1 style="width:60vw;margin:auto;height:2px;background:linear-gradient(90deg,#bef var(--w),#425 0)"></p><div id=P2></div></div>`;
  // show a status line and let the browser paint it before the next blocking step
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w + '%'), new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  // title screen: a sphere in a field of noise
  const k = K.getContext('2d');
  for (let i = 0; i < 2304; i++) {
    const x = i % 48 - 24, y = (i / 48 | 0) - 24, r = Math.hypot(x, y);
    k.fillStyle = r < 17 ? `hsl(${200 + x + y},90%,${90 - r * 2.5 + (x + y) / 2}%)` : `hsl(${Math.random() * 360},60%,${Math.random() * 60}%)`;
    k.fillRect(x + 24, y + 24, 1, 1);
  }
  await Y('RENDERING SOUNDTRACK', 8);
  const g = C.getContext('webgl2');
  g.getExtension('EXT_color_buffer_float');

  // program from fragment source; fullscreen triangle from gl_VertexID
  const Q = f => {
    const p = g.createProgram();
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', f].map((s, i) => {
      const h = g.createShader(35633 - i);
      g.shaderSource(h, s);
      g.compileShader(h);
      g.attachShader(p, h);
      if (!g.getShaderParameter(h, 35713)) console.error('SHADER ' + i + ': ' + g.getShaderInfoLog(h)); //DEV
    });
    g.linkProgram(p);
    g.getProgramParameter(p, 35714); // block here until it is compiled, not in the first frame
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

  // text -> texture unit 1
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1152;
  x.font = '64px Consolas,monospace';
  x.fillStyle = '#fff';
  ['> z ~ N(0, I)', 'step   /50', 'LATENT SPACE', 'z += 0.1 * randn()', 'x = decode(z)', 'lerp(z1, z2, t)', 'cfg_scale = 14.0', 'CODE + MUSIC: CLAUDE SONNET 5.5 · LATENT', '0123456789'].map((s, i) => x.fillText(s, 64, i * 128 + 86, 1960));
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987); // trilinear, or the glow behind the text shows as blocks
  g.activeTexture(33984);

  // music: one pixel per sample, rendered by the GPU
  X(4096, 1620, 34836);
  g.viewport(0, 0, 4096, 1620);
  g.useProgram(Q(MUSIC_SRC));
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(26542080);
  g.readPixels(0, 0, 4096, 1620, 6408, 5126, d);
  g.deleteTexture(t);
  await Y('MIXING', 30);
  const u = new AudioBuffer({ length: 6635520, numberOfChannels: 2, sampleRate: 48e3 });
  for (let i = 0; i < 2; i++) u.getChannelData(i).set(d.filter((_, j) => j % 4 == i));
  window.audio = u; //DEV

  // visuals
  await Y('COMPILING SHADERS', 45);
  const F = X(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
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
  await Y('WARMING UP', 90);
  fr(0);
  g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  await Y('CLICK TO START', 100);
  P2.style.animation = 'k 1.2s infinite';
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
