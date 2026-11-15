// EMERGENCE - an 8k intro by Latent. Lines ending in //DEV are stripped from the release build.
(async () => {
  let W = 1920, H = 1080, t, z = 0;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="display:grid;place-content:center;text-align:center;background:radial-gradient(at bottom,#079,#000 75%);color:#8ef;font:200 5vw sans-serif;letter-spacing:1vw;cursor:pointer"><style>@keyframes k{50%{opacity:.3}}#C,#P0{position:fixed;inset:0}#C{width:100%;height:100%}#P0 *{margin:auto}#P0 div{font-size:1.1vw;margin:2vw;color:#fda}</style><svg width=88 viewBox=-8,-8,16,16 fill=none><path stroke=#8ef d="M0-7 5-5 7 0 5 5 0 7-5 5-7 0-5-5zM-1-1h2v2h-2z"/><path stroke=#fda d="M0-5 5 0 0 5-5 0zM-3-3H3V3H-3z"/></svg>EMERGENCE<div>AN 8K INTRO BY LATENT</div><p id=P1 style="width:60vw;height:2px;background:linear-gradient(90deg,#8ef var(--w),#235 0)"></p><div id=P2></div></div>`;
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w + '%'), new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));

  await Y('SOUND', 8);
  const g = C.getContext('webgl2');
  g.getExtension('EXT_color_buffer_float');
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
    g.getProgramParameter(p, 35714);
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

  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1024;
  x.font = '52px monospace';
  x.fillStyle = '#fff';
  ['01 // NUCLEATION', '02 // MORPHOGENESIS', '03 // ARCHITECTURE', '04 // RESONANCE', '05 // SINGULARITY', '06 // EMERGENCE', 'EMERGENCE · LATENT', 'CODE + MUSIC: ARGON · 2026'].map((s, i) => {
    x.textAlign = i > 5 ? 'center' : 'left';
    x.fillText(s, i > 5 ? 1024 : 48, i * 128 + 86, 1952);
  });
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987); // trilinear, or the glow behind the text shows as blocks
  g.activeTexture(33984);

  X(4096, 1620, 34836);
  g.viewport(0, 0, 4096, 1620);
  g.useProgram(Q(MUSIC_SRC));
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(26542080);
  g.readPixels(0, 0, 4096, 1620, 6408, 5126, d);
  g.deleteTexture(t);
  await Y('MIX', 30);
  const u = new AudioBuffer({ length: 6635520, numberOfChannels: 2, sampleRate: 48e3 });
  for (let i = 0; i < 2; i++) u.getChannelData(i).set(d.filter((_, j) => j % 4 == i));
  window.audio = u; //DEV

  await Y('SHADERS', 45);
  const F = X(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
  g.viewport(0, 0, W, H);
  const fr = T => [p1, p2].map((p, i) => {
    g.bindFramebuffer(36160, i ? null : F);
    i && g.generateMipmap(3553);
    g.useProgram(p);
    g.uniform4f(g.getUniformLocation(p, 'R'), W, H, T, 0);
    i && g.uniform1i(g.getUniformLocation(p, 'B'), 1);
    g.drawArrays(4, 0, 3);
  });
  await Y('WARMUP', 90);
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
