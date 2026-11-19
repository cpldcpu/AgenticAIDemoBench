// TILT - an 8k intro by Latent. Lines ending in //DEV are stripped from the release build.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document;
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#000;color:#ffe;font:900 4vw Segoe UI Black,sans-serif;letter-spacing:1vw;cursor:pointer;user-select:none">T I L T<p id=P1 style="margin:2vw auto;height:.3vw;background:#f41;width:calc(var(--w)*9vw)"></p><div id=P2 style="font:1.1vw Consolas,monospace;color:#4df"></div></div>`;
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w), new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  await Y('INSERTING COIN', 1);
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
    g.useProgram(p);
    g.uniform1i(g.getUniformLocation(p, 'B'), 1);
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

  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1152;
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.font = '900 82px "Segoe UI Black",sans-serif';
  [
    'T I L T',
    'I · SKILL SHOT — BALL 1',
    'II · POP BUMPERS — 1000 PTS',
    'III · DROP TARGETS — LOCK LIT',
    'IV · JACKPOT MULTIBALL',
    'V · PLUMB BOB — DANGER',
    'VI · TILT — GAME OVER',
    'CODE + MUSIC: GEMINI 4 ARGON · LATENT'
  ].map((s, i) => x.fillText(s, 1024, i * 128 + 94, 1880));
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987);
  g.activeTexture(33984);

  X(4096, 1200, 34836);
  g.viewport(0, 0, 4096, 1200);
  Q(MUSIC_SRC);
  g.drawArrays(4, 0, 3);
  const d = new Float32Array(19660800);
  g.readPixels(0, 0, 4096, 1200, 6408, 5126, d);
  g.deleteTexture(t);
  const u = new AudioBuffer({ length: 4915200, numberOfChannels: 2, sampleRate: 48e3 }), a = u.getChannelData(0), b = u.getChannelData(1),
    e = [1187, 1601, 2111, 2689].map(n => new Float32Array(n)), y = [0, 0, 0, 0], c = [0, 0, 0, 0];
  for (; i < 4915200; i++) {
    l = d[i * 4]; r = d[i * 4 + 1]; s = 0;
    for (k = 4; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 4; k--;) e[k][i % e[k].length] = (k & 1 ? l : r) * .055 + (c[k] += (y[k] - s / 2 - c[k]) * .55) * .72;
    a[i] = l + y[0] + y[2];
    b[i] = r + y[1] + y[3];
  }
  window.audio = u; //DEV

  await Y('ENERGIZING SOLENOIDS', 2);
  const F = X(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
  g.texParameteri(3553, 10241, 9987);
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
  g.viewport(0, 0, W, H);
  const fr = T => {
    [F, null].map((f, i) => {
      g.bindFramebuffer(36160, f);
      i && g.generateMipmap(3553);
      g.useProgram(i ? p2 : p1);
      g.uniform4f(g.getUniformLocation(i ? p2 : p1, 'R'), W, H, T, 0);
      g.drawArrays(4, 0, 3);
    });
  };
  fr(0);
  g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  await Y('CLICK TO PULL PLUNGER', 3);
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
