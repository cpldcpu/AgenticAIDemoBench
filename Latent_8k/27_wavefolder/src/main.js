// WAVEFOLDER - an 8k synthwave intro by Latent. Lines ending in //DEV are stripped from the release build.
// All precalc (soundtrack, shader compile) happens on the title screen; the click only starts playback.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#06010c;color:#f4c;font:italic 900 6vw Arial;cursor:pointer;user-select:none;text-shadow:0 0 calc(var(--w)*.03vw) #0cf">WAVEFOLDER<div id=P2 style=font-size:2vw;color:#0cf></div></div>`;
  // show a status line and let the browser paint it before the next blocking step
  const Y = (s, w) => (P2.innerText = s, P0.style.setProperty('--w', w), new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  await Y('tuning the oscillators', 20);
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

  // title and credits -> texture unit 1, four lines
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 512;
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.font = 'italic 900 108px Arial';
  ['W A V E F O L D E R', 'an 8k synthwave intro', 'code & music: Claude Fable 5.2', 'L A T E N T'].map((s, i) => x.fillText(s, 1024, i * 128 + 102, 2000));
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987); // trilinear: the default filter picks the nearest texel inside a mip level, which shows as blocks
  g.activeTexture(33984);

  // music: one pixel per sample, rendered by the GPU; xy dry, zw send
  X(4096, 1688, 34836);
  g.viewport(0, 0, 4096, 1688);
  g.useProgram(Q(MUSIC_SRC));
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(27656192);
  g.readPixels(0, 0, 4096, 1688, 6408, 5126, d);
  g.deleteTexture(t);
  // the send goes through a ping-pong echo of three sixteenths and into a hall (four damped delay lines, Householder matrix);
  // the sum passes a soft clipper, which is a wave shaper too
  const u = new AudioBuffer({ length: 6914048, numberOfChannels: 2, sampleRate: 48e3 }), a = u.getChannelData(0), b = u.getChannelData(1),
    e = [2011, 2749, 3407, 4201].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0], m = new Float32Array(36e3);
  for (; i < 6914048; i++) {
    k = i % 18e3;
    l = m[k]; r = m[k + 18e3];
    m[k] = (d[i * 4 + 2] + d[i * 4 + 3]) * .4 + r * .6;
    m[k + 18e3] = l * .6;
    s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? l + d[i * 4 + 2] : r + d[i * 4 + 3]) * .1 + (c[k] += (y[k] - s / 2 - c[k]) * .6) * .85;
    a[i] = Math.tanh((d[i * 4] + l * .6 + y[0] + y[2]) * .65);
    b[i] = Math.tanh((d[i * 4 + 1] + r * .6 + y[1] + y[3]) * .65);
  }
  window.audio = u; //DEV

  // visuals
  await Y('drawing the grid', 60);
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
  fr(0);
  g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  await Y('click to play', 100);
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
