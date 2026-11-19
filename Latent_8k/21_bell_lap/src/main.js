// Bell Lap. The framebuffer and capture interface follow Latent's shared loader.
(async () => {
  let w = 1600, h = 900;
  if (window.CAPW) { w = CAPW; h = CAPH } //DEV
  document.title = 'BELL LAP / LATENT';
  document.body.innerHTML = `<style>*{box-sizing:border-box}body{margin:0;background:#181529;color:#edff52;font-family:Arial,sans-serif}canvas,#P0{position:fixed;inset:0;width:100%;height:100%;object-fit:contain}#P0{background:#21192e;display:grid;place-content:center;cursor:pointer;text-align:center}b{font:italic 1000 14vw/.88 Arial;letter-spacing:-1vw;border-block:.6vw solid;padding:2vw 1vw}small{font:bold 1.1rem monospace;letter-spacing:.17em;margin:1.6em}</style><canvas id=C width=${w} height=${h}></canvas><div id=P0><small>LATENT &nbsp; / &nbsp; TRACK CYCLING</small><b>BELL LAP</b><small id=statusLine>BUILDING THE TRACK</small></div>`;
  await new Promise(r => setTimeout(r,80));
  const g = C.getContext('webgl2',{antialias:false});
  g.getExtension('EXT_color_buffer_float');
  function program(frag) {
    const p=g.createProgram();
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}',frag].forEach((src,i)=>{
      const s=g.createShader(35633-i);
      g.shaderSource(s,src); g.compileShader(s); g.attachShader(p,s);
    });
    g.linkProgram(p);
    if(!g.getProgramParameter(p,35714)) throw Error(g.getProgramInfoLog(p));
    return p;
  }
  function target(w,h,format){
    const tex=g.createTexture();
    g.bindTexture(3553,tex);
    g.texImage2D(3553,0,format,w,h,0,6408,5126,null);
    g.texParameteri(3553,10241,9729);
    g.texParameteri(3553,10242,33071); g.texParameteri(3553,10243,33071);
    const fb=g.createFramebuffer();
    g.bindFramebuffer(36160,fb);
    g.framebufferTexture2D(36160,36064,3553,tex,0);
    return [tex,fb];
  }
  const music=program(MUSIC_SRC), scene=program(SCENE_SRC), post=program(POST_SRC);
  const rows=900,samples=4096*rows;
  const [mt,mf]=target(4096,rows,34836);
  g.viewport(0,0,4096,rows); g.useProgram(music); g.drawArrays(4,0,3);
  const pcm=new Float32Array(samples*4);
  g.readPixels(0,0,4096,rows,6408,5126,pcm);
  const buffer=new AudioBuffer({length:samples,numberOfChannels:2,sampleRate:48000});
  for(let ch=0;ch<2;ch++){
    const dst=buffer.getChannelData(ch);
    for(let i=0;i<samples;i++) dst[i]=pcm[i*4+ch];
  }
  g.deleteTexture(mt);g.deleteFramebuffer(mf);
  g.activeTexture(33985);
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.canvas.width=1024;ctx.canvas.height=2048;
  const words=['BELL LAP','LATENT   /   RACING CLUB','KEIRIN','ONE TO GO','07','PHOTO FINISH','GPT-6.2 ASTRA  /  LATENT','VELODROME','FINAL   /   200 M','+0.012','21','04','13','12','32','03','11'];
  words.forEach((word,i)=>{
    ctx.fillStyle='white';ctx.font=i==1||i==6||i==8?'bold 64px monospace':'italic 1000 100px Arial Black,Arial,sans-serif';
    ctx.save();ctx.translate(8,i*100+83);ctx.scale(1000/ctx.measureText(word).width,1);ctx.fillText(word,0,0);ctx.restore();
  });
  g.bindTexture(3553,g.createTexture());g.texImage2D(3553,0,6408,6408,5121,ctx.canvas);g.generateMipmap(3553);
  g.activeTexture(33984);
  const [surface,fb]=target(w,h,34842);
  g.texParameteri(3553,10241,9987);
  const draw=(p,t)=>{
    g.useProgram(p);
    g.uniform4f(g.getUniformLocation(p,'R'),w,h,t,0);
    g.uniform1i(g.getUniformLocation(p,'B'),1);
    g.drawArrays(4,0,3);
  };
  function frame(t){
    g.viewport(0,0,w,h);
    g.bindFramebuffer(36160,fb);draw(scene,t);
    g.bindFramebuffer(36160,null);g.generateMipmap(3553);draw(post,t);
  }
  frame(0);
  window.audio=buffer; window.fr=frame;window.cv=C;window.gl=g;window.fbo=fb; //DEV
  if(window.CAP)return; //DEV
  statusLine.textContent='CLICK TO RACE';
  P0.onclick=async()=>{
    const ac=new AudioContext();await ac.resume();
    P0.remove();C.requestFullscreen().catch(()=>{});
    const player=ac.createBufferSource();player.buffer=buffer;player.connect(ac.destination);
    const start=ac.currentTime;player.start(start);
    const tick=()=>{const t=ac.currentTime-start;frame(Math.min(76.8,t));if(t<76.8)requestAnimationFrame(tick)};
    tick();
  };
})();
