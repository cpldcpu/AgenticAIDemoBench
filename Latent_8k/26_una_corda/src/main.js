// UNA CORDA - an 8k intro by Latent. Lines ending in //DEV are stripped from the release build.
// A nocturne in D-flat major for a modelled grand piano. The score below is expanded into a list of
// played notes (rubato, pedalling, dynamics, a human hand); each note is then rendered by the GPU
// as one draw call, and the same list drives the strings, hammers, dampers and keys on screen.
(async () => {
  let W = 1920, H = 1080, t, z = 0, i = 0, k, s, l, r, q, b, S = 7, v, m, P;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  const D = document, M = Math, N = [], G = [], X = [];
  D.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;cursor:none></canvas><div id=P0 style="position:fixed;inset:0;display:grid;place-content:center;text-align:center;background:#000;color:#dcb27a;font:italic 6vw Georgia">Una Corda<div id=P2 style=font-size:2vw></div></div>`;
  const Y = s => (P2.innerText = s, new Promise(r => requestAnimationFrame(_ => setTimeout(r, 60))));
  const g = C.getContext('webgl2'), R = _ => (S = S * 16807 % 2147483647) / 2147483647,
    // set uniform R of program p, and samplers A and B to units a and b
    U = (p, a, b, ...v) => (g.useProgram(p), g.uniform4f(g.getUniformLocation(p, 'R'), ...v), g.uniform1i(g.getUniformLocation(p, 'A'), a), g.uniform1i(g.getUniformLocation(p, 'B'), b));
  g.getExtension('EXT_color_buffer_float');
  g.getExtension('EXT_float_blend');

  // ---------------- the score ----------------
  // 46 bars of 4/4, counted in 24ths of a bar. Pitches are MIDI note + 30 as characters.
  // Chord voicings for the left hand (bass, then three notes upward), one letter each:
  //  a Db  b Db/F  c Bbm7  d Gbmaj7  e Ebm7  f Ab7  g F7/A  h Bbm  i Gb  j Gbm6  k Bbm/Ab  l F7
  //  m Eb7/G  n Cø7/Gb  o Db7  p Ebm  q Dbmaj7  r Gbm6/Db
  const VO = 'CJSVGOV[@GOVHOSXELT[>ENT?GNQ@GOX<CLT<CKQ>GOS;BKQ=EOU<BLQCJMSELQTCJNSCKQT',
    // one chord per half bar: intro, A, A, B (agitato), climax, cadenza, A (una corda), coda
    CH = 'aaaaaaccddefabghijfaaaccddefabghijflhkdlhkmdnlhoipnlhiefqhjfffffaaccddefabghijfhraraqaraaaaa',
    DY = '3345545553566566665667677899886423323443332211', // loudness per bar
    TP = '5544454446444544462222111233476955565568788999', // slowness per bar (rubato)
    // the melody: pitch, length. "!" is a rest. A' repeats the theme, its first four bars an octave up
    TH = 'k<l4k2i6g8b4d6f6g6k6p<n6l6k4i2f6k<l4k2s6r<p4o2p6p8n4l6o6',
    MU = '!H!Bb6' + TH + 'n6l4i2g<' + TH + 'n6l4i2c4f4i4' +
      'k4p8n4k8l8k4i4f4c4d4g8k4l6k2s8r2p2n6k6i6l6k4i2f6g6k6n6q6p8n4l6s6u6s6r6o6' +
      'w<x4w2s6x<w4u2r6s<s1r1p1n1k1i1g1f1d1b1_1[1o<n<' +
      'V1Z1]1`1b1f1i1l1n1r1u1x1z1x1w1u1s1r1p1n1l1k1i1g1f6g6i6b6' +
      TH + 'n6l4i2k<o6l6k<o6l6k4i4g4g2k2n2r2s2w2z<{2x2u2s2o2l2k<sH!H';
  // rubato: the length of every 24th, eased from bar to bar
  for (q = 0, t = 1; q <= 1104; q++) G[q] = t, b = q / 24 | 0, t += (3.2 + .12 * (TP[b] - (TP[b] - (TP[b + 1] || 9)) * (q % 24) / 24)) / 24;
  // the damper pedal is changed at every bar and at every new harmony
  for (q = 0; q < 88; q++) (q % 2 < 1 || CH[q] != CH[q - 1]) && X.push(G[q * 12]);
  X.push(G[1104] + 9);
  // a note: pitch, velocity, grid position, length. Released when the key comes up or the pedal lifts, whichever is later
  const A = (m, v, q, d, o) => {
    t = G[q] + (R() - .5) * .014 + (o || 0);
    for (l of X) if (l > t + .05) break;
    for (r of N) (r[0] | 0) == m && r[4] > t && r[2] < t && (r[4] = r[3] = t);
    N.push([m + (q > 767 && q < 960) * .5, M.min(1, v * (.94 + R() * .12)), t, G[q + d] - .03, M.max(G[q + d] - .03, l + .07)]);
  };
  // the left hand
  for (q = 0; q < 88; q++) {
    k = VO.substr((CH.charCodeAt(q) - 97) * 4, 4);
    b = q / 2 | 0;
    v = .2 + .6 * (DY[b] - (DY[b] - DY[b + 1]) * (q % 2) / 2) / 9;
    if (b > 29 && b < 32) { for (i = 0; i < 4; i++) A(k.charCodeAt(i) - 30 - !i * 12, v * .7, q * 12, 12, i * .04); continue }
    for (i = 0; i < 6; i++) A(k.charCodeAt(i > 3 ? 6 - i : i) - 30, v * (i ? .6 + .06 * (i == 3) : .75), q * 12 + i * 2, 2);
    b > 17 && b < 30 && A(k.charCodeAt(0) - 42, v * .55, q * 12, 12);
  }
  // the final chord, rolled from the bottom: Db over five octaves
  [25, 37, 44, 53, 61, 68, 77].map((m, i) => A(m, .45 - i * .02, 1056, 24, i * .07));
  // the right hand
  for (q = i = 0; i < MU.length; i += 2) {
    m = MU.charCodeAt(i) - 30 + (q > 767 && q < 864) * 12; s = MU.charCodeAt(i + 1) - 48;
    b = q / 24 | 0;
    if (m > 9) {
      v = (.3 + .6 * DY[b] / 9) * (.85 + .15 * M.sin(M.PI * (q % 96) / 96) + .004 * (m - 75) + (s > 7) * .06);
      A(m, v, q, s, -.012);
      // agitato and climax: the tune in octaves, with the harmony under the long notes
      if (b > 17 && b < 30) {
        A(m - 12, v * .8, q, s, -.006);
        if (s > 5 && b > 25) for (k = 1; k < 4; k++) A(VO.charCodeAt((CH.charCodeAt(q / 12 | 0) - 97) * 4 + k) - 18, v * .5, q, s);
      }
    }
    q += s;
  }

  // ---------------- the piano: one draw per note, added up in a float framebuffer ----------------
  await Y('voicing ' + N.length + ' hammers');
  const ns = (G[1104] + 9) * 48e3 | 0, rows = ns / 4096 + 1 | 0;
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
    g.getProgramParameter(p, 35714);
    console.log('compile ' + f.length + ' bytes: ' + (performance.now() - t0 | 0) + ' ms'); //DEV
    return p;
  };
  const F0 = (w, h, f) => {
    g.bindTexture(3553, t = g.createTexture());
    g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
    const F = g.createFramebuffer();
    g.bindFramebuffer(36160, F);
    g.framebufferTexture2D(36160, 36064, 3553, t, 0);
    return F;
  };
  const t1 = performance.now(); //DEV
  F0(4096, rows, 34836);
  g.viewport(0, 0, 4096, rows);
  P = Q(MUSIC_SRC);
  g.enable(3042); g.blendFunc(1, 1); g.enable(3089);
  for (r of N) {
    q = r[2] * 48e3 | 0;
    U(P, 0, 0, r[0], r[1], q, r[4] - r[2]);
    g.scissor(0, q / 4096, 4096, M.min(r[4] - r[2] + 3, 30) * 12);
    g.drawArrays(4, 0, 3);
  }
  g.disable(3042); g.disable(3089);
  const d = new Float32Array(rows * 16384);
  g.readPixels(0, 0, 4096, rows, 6408, 5126, d);
  g.deleteTexture(t);
  console.log('music ' + N.length + ' notes, ' + (performance.now() - t1 | 0) + ' ms'); //DEV
  // the hall: eight damped delay lines mixed by a Householder matrix (a feedback delay network)
  const u = new AudioBuffer({ length: ns, numberOfChannels: 2, sampleRate: 48e3 }), a = u.getChannelData(0), c = u.getChannelData(1),
    e = [1693, 1951, 2287, 2539, 2857, 3181, 3557, 3911].map(n => new Float32Array(n)), y = [], h = [0, 0, 0, 0, 0, 0, 0, 0];
  for (i = 0, m = 1e-9; i < ns; i++) {
    l = d[i * 4]; r = d[i * 4 + 1]; s = 0;
    for (k = 8; k--;) s += y[k] = e[k][i % e[k].length];
    for (k = 8; k--;) e[k][i % e[k].length] = (k & 1 ? l : r) * .15 + (h[k] += (y[k] - s / 4 - h[k]) * .4) * .001 ** (e[k].length / 12e4);
    m = M.max(m, M.abs(a[i] = l + (y[0] + y[2] + y[4] + y[6]) * .3), M.abs(c[i] = r + (y[1] + y[3] + y[5] + y[7]) * .3));
  }
  // a gentle compressor: an envelope with ~0.7 s release sets the gain, so quiet passages come up and peaks never clip
  for (i = k = 0; i < ns; i++) k = M.max(M.abs(a[i] /= m), M.abs(c[i] /= m), k * .99997), a[i] *= l = 1.2 / (.3 + k), c[i] *= l;
  window.audio = u; window.notes = N; window.grid = G; //DEV

  // title and credits -> texture unit 1
  const x = D.createElement('canvas').getContext('2d');
  x.canvas.width = 2048;
  x.canvas.height = 1024;
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  // four rows of 256: title, subtitle, credits, and the maker's name cast into the plate
  ['italic 210px Georgia', '80px Georgia', '72px Georgia', 'bold 150px Georgia'].map((f, i) => {
    x.font = f;
    x.fillText(['Una Corda', 'nocturne in D♭ major', 'code & music: Claude Opus 5.5 · Latent', 'LATENT & SONS'][i], 1024, i * 256 + 185, 1980);
  });
  g.activeTexture(33985);
  g.bindTexture(3553, g.createTexture());
  g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas);
  g.generateMipmap(3553);
  g.texParameteri(3553, 10241, 9987);
  // the state of the 88 strings -> texture unit 2: struck, ringing, damper lifted, seconds since struck
  g.activeTexture(33986);
  g.bindTexture(3553, g.createTexture());
  g.texParameteri(3553, 10241, 9728);
  g.texParameteri(3553, 10240, 9728);
  const K = new Float32Array(352);
  g.activeTexture(33984);

  // visuals
  const F = F0(W, H, 34842), p1 = Q(SCENE_SRC), p2 = Q(POST_SRC);
  g.texParameteri(3553, 10242, 33071);
  g.texParameteri(3553, 10243, 33071);
  g.viewport(0, 0, W, H);
  const fr = T => {
    // pedal: down, except for a moment at each change
    for (l of X) if (l > T - .08) break;
    l = l > T ? .7 : 0;
    for (i = 0; i < 88; i++) K.set([0, 0, l, 99], i * 4);
    for (r of N) if ((s = T - r[2]) >= 0 && s < 30) {
      i = (r[0] | 0) * 4 - 84;
      K[i] = M.max(K[i], r[1] * M.exp(-s * 9));
      K[i + 1] += r[1] * M.exp(-s * (.3 + r[0] / 200)) * (T > r[4] ? M.exp((r[4] - T) * 6) : 1);
      T < r[3] && (K[i + 2] = 1);
      K[i + 3] = M.min(K[i + 3], s);
    }
    for (q = 0; G[q + 1] <= T && q < 1103;) q++;
    g.activeTexture(33986);
    g.texImage2D(3553, 0, 34836, 88, 1, 0, 6408, 5126, K);
    g.activeTexture(33984);
    g.bindFramebuffer(36160, F);
    U(p1, 1, 2, W, H, T, s = (q + M.min(1, M.max(0, (T - G[q]) / (G[q + 1] - G[q])))) / 24);
    g.drawArrays(4, 0, 3);
    g.bindFramebuffer(36160, null);
    g.generateMipmap(3553);
    U(p2, 0, 1, W, H, T, s);
    g.drawArrays(4, 0, 3);
  };
  fr(0);
  g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
  window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
  if (window.CAP) return; //DEV
  await Y('click to play');
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
