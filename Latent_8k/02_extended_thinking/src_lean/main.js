// EXTENDED THINKING, lean build - same picture and sound as src/, without the title screen.
// The page stays black while the soundtrack is rendered and the shaders compile, then shows a still of the opening:
// click it to start. Lines ending in //DEV are stripped from the release build.
(async () => {
  let W = 1920, H = 1080, t, z = 0;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none>`;
  await new Promise(r => setTimeout(r, 99)); // let the browser paint the black page before the blocking precalc
  const g = C.getContext('webgl2');
  g.getExtension('EXT_color_buffer_float');

  // program from fragment source; fullscreen triangle from gl_VertexID. The header is shared by all shaders
  // (the .frag files in this folder have none; R and O are unused in some of them).
  const Q = f => {
    const p = g.createProgram();
    ['void main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', f].map((s, i) => {
      const h = g.createShader(35633 - i);
      g.shaderSource(h, '#version 300 es\nprecision highp float;uniform vec4 R;out vec4 O;' + s);
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
  x.canvas.height = 1024;
  x.font = '64px Consolas,monospace';
  x.fillStyle = '#fff';
  ['> make another 8k intro. make it stunning.', '✻ Thinking…', '✻ Spawning subagents…', '✻ Recursing…', '✻ Compacting…', 'EXTENDED THINKING · LATENT', 'STARRING CLAWD · CODE + MUSIC: CLAUDE FABLE 5.2 · LATENT', '● Done (2m 18s · 8k bytes)'].map((s, i) => x.fillText(s, 64, i * 128 + 86, 1960));
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
  const u = new AudioBuffer({ length: 6635520, numberOfChannels: 2, sampleRate: 48e3 });
  for (let i = 0; i < 2; i++) u.getChannelData(i).set(d.filter((_, j) => j % 4 == i));
  window.audio = u; //DEV

  // visuals: scene into the float target, then post to the screen (the scene shader has no B; setting it is ignored)
  const F = X(W, H, 34842), P = [Q(SCENE_SRC), Q(POST_SRC)];
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
  g.viewport(0, 0, W, H);
  const fr = T => P.map((p, i) => {
    g.bindFramebuffer(36160, i ? null : F);
    i && g.generateMipmap(3553);
    g.useProgram(p);
    g.uniform4f(g.getUniformLocation(p, 'R'), W, H, T, 0);
    g.uniform1i(g.getUniformLocation(p, 'B'), 1);
    g.drawArrays(4, 0, 3);
  });
  // warm-up frame; it stays on screen as the "ready" picture
  fr(4);
  g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  onclick = e => {
    onclick = 0;
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
