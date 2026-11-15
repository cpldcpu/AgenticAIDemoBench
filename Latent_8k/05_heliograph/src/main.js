// HELIOGRAPH. Original visual design and score, GPT-6.1 Sol, November 2026.
// The GPU synthesizes the complete score before playback. //DEV lines are capture hooks.
(async () => {
  document.title='HELIOGRAPH';
  let W = 1920, H = 1080, t, context;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  document.body.innerHTML = `<style>body{margin:0;background:#080e13}#C,#P0{position:fixed;inset:0;width:100%;height:100%}#C{object-fit:contain;cursor:none}#P0{display:grid;place-content:center;text-align:center;background:radial-gradient(ellipse at 50% 85%,#293e42,#080e13 65%);color:#f3dfb5;font:300 5.4vw Bahnschrift,sans-serif;letter-spacing:1.3vw;cursor:pointer}#P0 div{font-size:.85vw;letter-spacing:.35vw;margin:2.2vw}#P1{height:1px;width:42vw;margin:auto;background:linear-gradient(90deg,#ead3a2 var(--w),#354349 0)}@keyframes k{50%{opacity:.4}}</style><canvas id=C width=${W} height=${H}></canvas><div id=P0><svg width=110 height=110 viewBox="-55 -55 110 110" style="margin:0 auto 3vw" fill=none stroke=#cfb881><circle r="12"/><ellipse rx=46 ry=16 transform="rotate(30)"/><ellipse rx=46 ry=16 transform="rotate(90)"/><ellipse rx=46 ry=16 transform="rotate(150)"/></svg>HELIOGRAPH<div>A CHOREOGRAPHY OF LIGHT / 8192 BYTES</div><p id=P1></p><div id=P2></div></div>`;
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w + '%'), new Promise(r => requestAnimationFrame(() => setTimeout(r, 30))));
  try {
    await Y('CASTING THE BELLS', 5);
    const g = C.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
    if (!g || !g.getExtension('EXT_color_buffer_float')) throw Error('WebGL2 with floating-point rendering required');
    const Q = f => {
      const p = g.createProgram();
      ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', f].map((s, i) => {
        const h = g.createShader(35633 - i);
        g.shaderSource(h, s); g.compileShader(h); g.attachShader(p, h);
        if (!g.getShaderParameter(h, 35713)) throw Error(g.getShaderInfoLog(h));
      });
      g.linkProgram(p);
      if (!g.getProgramParameter(p, 35714)) throw Error(g.getProgramInfoLog(p));
      return p;
    };
    const X = (w, h, f) => {
      g.bindTexture(3553, t = g.createTexture());
      g.texImage2D(3553, 0, f, w, h, 0, 6408, 5126, null);
      const F = g.createFramebuffer(); g.bindFramebuffer(36160, F);
      g.framebufferTexture2D(36160, 36064, 3553, t, 0);
      return F;
    };
    // Typography atlas: large title and quiet, widely spaced chapter captions.
    const x = document.createElement('canvas').getContext('2d');
    x.canvas.width = 2048; x.canvas.height = 640;
    x.fillStyle = '#fff'; x.font = '300 100px Bahnschrift,sans-serif';
    ['H E L I O G R A P H', 'I / THE FIRST PHOTON', 'II / A FIELD OF HOURS', 'III / TORSION', 'VI / THE SUN UNFOLDS', 'VII / AFTERIMAGE', 'CODE + ORIGINAL SCORE / GPT-6.1 SOL', 'A CHOREOGRAPHY OF LIGHT', 'IV / THE CLOCK WITHOUT HANDS', 'V / WRITING WITH LIGHT'].map((s, i) => {
      x.font = i == 0 ? '300 64px Bahnschrift,sans-serif' : '32px Bahnschrift,sans-serif';
      x.textAlign=i==0?'center':'left';
      x.fillText(s, i==0?1024:28, i * 64 + 48, 1980);
    });
    g.activeTexture(33985); g.bindTexture(3553, g.createTexture());
    g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553); g.activeTexture(33984);
    X(4096, 1313, 34836); g.viewport(0, 0, 4096, 1313); g.useProgram(Q(MUSIC_SRC)); g.drawArrays(4, 0, 3);
    const d = new Float32Array(4096 * 1313 * 4);
    g.readPixels(0, 0, 4096, 1313, 6408, 5126, d); g.deleteTexture(t);
    await Y('WEAVING THE SCORE', 35);
    const u = new AudioBuffer({ length: 5376000, numberOfChannels: 2, sampleRate: 48000 });
    for (let c = 0; c < 2; c++) {
      const a = u.getChannelData(c);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + c];
    }
    window.audio = u; //DEV
    await Y('POLISHING THE LIGHT', 60);
    const F = X(W, H, 34842), p = Q(SCENE_SRC), q = Q(POST_SRC);
    g.texParameteri(3553, 10241, 9987);
    g.texParameteri(3553, 10242, 33071); g.texParameteri(3553, 10243, 33071);
    g.viewport(0, 0, W, H);
    const fr = T => {
      g.bindFramebuffer(36160, F); g.useProgram(p);
      g.uniform4f(g.getUniformLocation(p, 'R'), W, H, T, 0); g.drawArrays(4, 0, 3);
      g.bindFramebuffer(36160, null); g.generateMipmap(3553); g.useProgram(q);
      g.uniform4f(g.getUniformLocation(q, 'R'), W, H, T, 0);
      g.uniform1i(g.getUniformLocation(q, 'B'), 1); g.drawArrays(4, 0, 3);
    };
    fr(0); g.readPixels(0, 0, 1, 1, 6408, 5121, new Uint8Array(4));
    window.fr = fr; window.cv = C; window.gl = g; window.fbo = F; //DEV
    if (window.CAP) return; //DEV
    await Y('CLICK / ENTER TO START - P TO PAUSE', 100); P2.style.animation = 'k 2s infinite';
    const panel=P0, play = async () => {
      onclick = null;
      const a = context = new AudioContext(), s = a.createBufferSource(); s.buffer = u; s.connect(a.destination);
      await a.resume(); C.requestFullscreen().catch(() => {}); panel.remove();
      const start = a.currentTime; s.start(start);
      let running=true;
      s.onended=()=>{running=false;fr(112);a.close();document.body.append(panel);P2.innerText='CLICK TO REPLAY';onclick=play;};
      const L = () => { if(running){fr(a.currentTime-start);requestAnimationFrame(L);} };
      L();
    };
    onclick=play;
    onkeydown=e=>{if(e.code=='Space'||e.code=='Enter'){e.preventDefault();onclick&&onclick();}if(e.code=='KeyP'&&context)context.state=='running'?context.suspend():context.state=='suspended'&&context.resume();};
    C.addEventListener('webglcontextlost',e=>{e.preventDefault();context&&context.suspend();document.body.append(panel);P2.innerText='GRAPHICS CONTEXT LOST / RELOAD TO RESTART';onclick=onkeydown=null;});
  } catch (e) { P2.innerText = e.message; console.error(e); }
})();
