// Settle. Loader after Latent's shared pattern: music into a float texture, scene into a
// float framebuffer with mipmaps, post with the text texture to the screen.
(async () => {
  let w = 1920, h = 1080;
  if (window.CAPW) { w = CAPW; h = CAPH } //DEV
  document.title = 'SETTLE / LATENT';
  document.body.innerHTML = `<style>body{margin:0;background:#05070d}canvas,#P0{position:fixed;inset:0;width:100%;height:100%;object-fit:contain}#P0{display:grid;place-items:center;cursor:pointer;color:#f1e6d2;font:italic 22px Georgia;letter-spacing:.2em}</style><canvas id=C width=${w} height=${h}></canvas><div id=P0>winding the music box</div>`;
  await new Promise(r => setTimeout(r, 60));
  const g = C.getContext('webgl2', { antialias: false });
  g.getExtension('EXT_color_buffer_float');
  const program = frag => {
    const p = g.createProgram();
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', frag].forEach((src, i) => {
      const s = g.createShader(35633 - i);
      g.shaderSource(s, src); g.compileShader(s); g.attachShader(p, s);
    });
    g.linkProgram(p);
    if (!g.getProgramParameter(p, 35714)) throw Error(g.getProgramInfoLog(p));
    return p;
  };
  const target = (w, h, f) => {
    const tex = g.createTexture();
    g.bindTexture(3553, tex);
    g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
    g.texParameteri(3553, 10241, 9729);
    const fb = g.createFramebuffer();
    g.bindFramebuffer(36160, fb);
    g.framebufferTexture2D(36160, 36064, 3553, tex, 0);
    return fb;
  };
  const music = program(MUSIC_SRC), scene = program(SCENE_SRC), post = program(POST_SRC);
  // 124 s of stereo at 48 kHz, drawn in strips so no single draw runs long
  const rows = 1454, n = 4096 * rows;
  target(4096, rows, 34836);
  g.useProgram(music); g.enable(3089);
  for (let y = 0; y < rows; y += 64) { g.viewport(0, 0, 4096, rows); g.scissor(0, y, 4096, 64); g.drawArrays(4, 0, 3) }
  g.disable(3089);
  const pcm = new Float32Array(n * 4);
  g.readPixels(0, 0, 4096, rows, 6408, 5126, pcm);
  const buffer = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: 48000 });
  for (let ch = 0; ch < 2; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = pcm[i * 4 + ch];
  }
  // text: title, subtitle, credit, last line
  const x = document.createElement('canvas').getContext('2d');
  x.canvas.width = 1024; x.canvas.height = 512;
  x.fillStyle = '#fff'; x.textAlign = 'center';
  ['Settle', 'an 8k intro by Latent', 'Claude Opus 5.5', 'code, music and snow'].forEach((s, i) => {
    x.font = i ? i == 2 ? 'italic 66px Georgia' : '62px Georgia' : 'italic 110px Georgia';
    x.fillText(s, 512, i * 128 + 96);
  });
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture()); g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553);
  g.activeTexture(33984);
  const fb = target(w, h, 34842);
  g.texParameteri(3553, 10241, 9987);
  const draw = (p, t) => {
    g.useProgram(p);
    g.uniform4f(g.getUniformLocation(p, 'R'), w, h, t, 0);
    g.uniform1i(g.getUniformLocation(p, 'B'), 1);
    g.drawArrays(4, 0, 3);
  };
  const frame = t => {
    g.viewport(0, 0, w, h);
    g.bindFramebuffer(36160, fb); draw(scene, t);
    g.bindFramebuffer(36160, null); g.generateMipmap(3553); draw(post, t);
  };
  frame(0);
  window.audio = buffer; window.fr = frame; window.cv = C; window.gl = g; window.fbo = fb; //DEV
  if (window.CAP) return; //DEV
  P0.textContent = 'click to shake';
  P0.onclick = async () => {
    const ac = new AudioContext();
    C.requestFullscreen().catch(() => { }); await ac.resume();
    P0.remove();
    const s = ac.createBufferSource(); s.buffer = buffer; s.connect(ac.destination);
    const t0 = ac.currentTime; s.start(t0);
    const tick = () => { const t = ac.currentTime - t0; frame(Math.min(124, t)); if (t < 124) requestAnimationFrame(tick) };
    tick();
  };
})();
