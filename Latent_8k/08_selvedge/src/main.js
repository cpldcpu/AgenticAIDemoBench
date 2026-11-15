// SELVEDGE. Original visual design and score, GPT-6 Astra, November 2026.
// The GPU synthesizes the complete score before playback. //DEV lines are capture hooks.
(async () => {
  document.title='SELVEDGE';
  let W = 1920, H = 1080, t, context;
  if (window.CAPW) { W = CAPW; H = CAPH } //DEV
  document.body.innerHTML = `<style>body{margin:0;background:#181719}#C,#P0{position:fixed;inset:0;width:100%;height:100%}#C{object-fit:contain;cursor:none}#P0{display:grid;place-content:center;text-align:center;background:radial-gradient(ellipse at 50% 85%,#54232b,#181719 65%);color:#eee8db;font:300 5.4vw Bahnschrift,sans-serif;letter-spacing:1.3vw;cursor:pointer}#P0 div{font-size:.85vw;letter-spacing:.35vw;margin:2.2vw}#P1{height:1px;width:42vw;margin:auto;background:linear-gradient(90deg,#bf193e var(--w),#44383a 0)}@keyframes k{50%{opacity:.4}}</style><canvas id=C width=${W} height=${H}></canvas><div id=P0><div style="font-size:7vw;color:#cc2145;letter-spacing:-.6vw">/////</div>SELVEDGE<div>A FILM WOVEN FROM NOTHING / 8192 BYTES</div><p id=P1></p><div id=P2></div></div>`;
  const Y = (s, w) => (P2.innerText = s, P1.style.setProperty('--w', w + '%'), new Promise(r => requestAnimationFrame(() => setTimeout(r, 30))));
  try {
    await Y('SPINNING THE VOICES', 5);
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
    ['S E L V E D G E', '01 / FILAMENT', '02 / WARP AND WEFT', '03 / UNDER TENSION', '05 / THE WIND REMEMBERS', '06 / ONE THREAD REMAINS', 'CODE + ORIGINAL SCORE / GPT-6 ASTRA', 'LATENT / EIGHT KILOBYTES', '04 / BREAKING POINT', 'A FILM WOVEN FROM NOTHING'].map((s, i) => {
      x.font = i == 0 ? '300 60px Bahnschrift,sans-serif' : '48px Bahnschrift,sans-serif';
      x.textAlign=i==0?'center':'left';
      x.fillText(s, i==0?1024:28, i * 64 + 48, 1980);
    });
    g.activeTexture(33985); g.bindTexture(3553, g.createTexture());
    g.texImage2D(3553, 0, 6408, 6408, 5121, x.canvas); g.generateMipmap(3553); g.activeTexture(33984);
    X(4096, 1500, 34836); g.viewport(0, 0, 4096, 1500); g.useProgram(Q(MUSIC_SRC)); g.drawArrays(4, 0, 3);
    const d = new Float32Array(4096 * 1500 * 4);
    g.readPixels(0, 0, 4096, 1500, 6408, 5126, d); g.deleteTexture(t);
    await Y('WEAVING THE SCORE', 35);
    const u = new AudioBuffer({ length: 6144000, numberOfChannels: 2, sampleRate: 48000 });
    // Four damped delay lines with a Householder feedback matrix.
    const delays=[1499,2111,2633,3251].map(n=>new Float32Array(n)), damp=[0,0,0,0], taps=[0,0,0,0];
    const left=u.getChannelData(0),right=u.getChannelData(1);
    for(let i=0;i<left.length;i++){
      let sum=0;
      for(let k=0;k<4;k++)sum+=taps[k]=delays[k][i%delays[k].length];
      for(let k=0;k<4;k++){
        damp[k]+=.4*(taps[k]-sum*.5-damp[k]);
        delays[k][i%delays[k].length]=d[i*4+(k%2)]*.07+damp[k]*.78;
      }
      const fade=Math.min(1,(left.length-i)/96000);
      left[i]=(d[i*4]+.65*(taps[0]+taps[2]))*fade;
      right[i]=(d[i*4+1]+.65*(taps[1]+taps[3]))*fade;
    }
    window.audio = u; //DEV
    await Y('THREADING THE LOOM', 60);
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
    await Y('READY', 100); P2.style.animation = 'k 2s infinite';
    const panel=P0, play = async () => {
      onclick = null;
      const a = context = new AudioContext(), s = a.createBufferSource(); s.buffer = u; s.connect(a.destination);
      await a.resume(); C.requestFullscreen().catch(() => {}); panel.remove();
      const start = a.currentTime; s.start(start);
      let running=true;
      s.onended=()=>{running=false;fr(128);a.close();document.body.append(panel);P2.innerText='CLICK TO REPLAY';onclick=play;};
      const L = () => { if(running){fr(a.currentTime-start);requestAnimationFrame(L);} };
      L();
    };
    onclick=play;
    onkeydown=e=>{if(e.code=='Space'||e.code=='Enter'){e.preventDefault();onclick&&onclick();}if(e.code=='KeyP'&&context)context.state=='running'?context.suspend():context.state=='suspended'&&context.resume();};
    P2.innerText='CLICK / ENTER TO START - P TO PAUSE';
    C.addEventListener('webglcontextlost',e=>{e.preventDefault();context&&context.suspend();document.body.append(panel);P2.innerText='GRAPHICS CONTEXT LOST / RELOAD TO RESTART';onclick=onkeydown=null;});
  } catch (e) { P2.innerText = e.message; console.error(e); }
})();
