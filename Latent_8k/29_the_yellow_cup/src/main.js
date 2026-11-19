// THE YELLOW CUP / Latent
(async()=>{
  const D=document;
  let w=1920,h=1080;
  if(window.CAPW){w=CAPW;h=CAPH} //DEV
  D.title='The Yellow Cup / Latent';
  D.body.innerHTML=`<style>*{box-sizing:border-box}body{margin:0;background:#12272c;color:#fff4d9}canvas,#P0{position:fixed;inset:0;width:100%;height:100%;object-fit:contain}#P0{display:grid;align-content:end;justify-items:start;padding:7vh 7vw;background:linear-gradient(0deg,#0c1924e8,transparent 70%)}h1{font:italic 8vw/.98 Georgia,serif;margin:.16em 0 .23em;letter-spacing:-.06em}small,button{font:600 14px Consolas,monospace;letter-spacing:.08em}button{border:1px solid #dbc998;border-radius:2em;padding:.8em 1.5em;background:#152a2a;color:#fff1c8;cursor:pointer}</style><canvas id=C width=${w} height=${h}></canvas><div id=P0><small>GPT-6.2 ASTRA / LATENT</small><h1>The Yellow Cup</h1><button id=go disabled>Developing the print</button></div>`;
  await new Promise(r=>setTimeout(r,50));
  try{
    const g=C.getContext('webgl2',{antialias:false});
    if(!g||!g.getExtension('EXT_color_buffer_float'))throw Error('Requires WebGL2 and floating-point color');
    function program(frag){
      const p=g.createProgram();
      ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}',frag].forEach((src,i)=>{
        const s=g.createShader(35633-i);g.shaderSource(s,src);g.compileShader(s);
        if(!g.getShaderParameter(s,35713))throw Error(g.getShaderInfoLog(s));
        g.attachShader(p,s);
      });
      g.linkProgram(p);if(!g.getProgramParameter(p,35714))throw Error(g.getProgramInfoLog(p));return p;
    }
    function target(x,y,format){
      const tex=g.createTexture();g.bindTexture(3553,tex);
      g.texImage2D(3553,0,format,x,y,0,6408,5126,null);
      g.texParameteri(3553,10241,9729);g.texParameteri(3553,10242,33071);g.texParameteri(3553,10243,33071);
      const fb=g.createFramebuffer();g.bindFramebuffer(36160,fb);g.framebufferTexture2D(36160,36064,3553,tex,0);return [tex,fb];
    }
    const music=program(MUSIC_SRC),scene=program(SCENE_SRC),post=program(POST_SRC);
    const samples=3456000,rows=Math.ceil(samples/4096),[mt,mf]=target(4096,rows,34836);
    g.useProgram(music);g.viewport(0,0,4096,rows);g.drawArrays(4,0,3);
    const pcm=new Float32Array(rows*4096*4);g.readPixels(0,0,4096,rows,6408,5126,pcm);
    const buffer=new AudioBuffer({length:samples,numberOfChannels:2,sampleRate:48000});
    const l=buffer.getChannelData(0),r=buffer.getChannelData(1);
    const taps=[3557,4871,6197,7973].map(n=>new Float32Array(n)),v=[0,0,0,0];
    for(let i=0;i<samples;i++){
      let total=0;
      for(let j=0;j<4;j++)total+=v[j]+=.32*(taps[j][i%taps[j].length]-v[j]);
      for(let j=0;j<4;j++)taps[j][i%taps[j].length]=pcm[4*i+2+j%2]+.77*(v[j]-.5*total);
      const master=.78*Math.min(1,(samples-i)/24000);
      l[i]=master*Math.tanh(pcm[4*i]+.21*(v[0]+v[2]));r[i]=master*Math.tanh(pcm[4*i+1]+.21*(v[1]+v[3]));
    }
    g.deleteFramebuffer(mf);g.deleteTexture(mt);
    // Each sentence gets its own line in the contact-print atlas.
    const ctx=D.createElement('canvas').getContext('2d');
    ctx.canvas.width=2048;ctx.canvas.height=1024;ctx.fillStyle='white';
    const lines=['I gave myself a kitchen window.','Rain on warm brick.','A chip where my thumb would go.',
      'I almost wrote,','“I remember this.”','Did I feel any of it?','My guess is no.','I kept the chip.'];
    lines.forEach((line,i)=>{ctx.font=i===4?'italic 80px Georgia':'76px Georgia';ctx.fillText(line,8,i*128+91)});
    g.activeTexture(33985);g.bindTexture(3553,g.createTexture());g.texImage2D(3553,0,6408,6408,5121,ctx.canvas);g.texParameteri(3553,10241,9729);
    g.activeTexture(33984);
    const [surface,fb]=target(w,h,34842);
    g.texParameteri(3553,10241,9987);
    function draw(p,t){
      g.useProgram(p);g.uniform4f(g.getUniformLocation(p,'R'),w,h,t,0);g.uniform1i(g.getUniformLocation(p,'B'),1);g.drawArrays(4,0,3);
    }
    function frame(t){
      g.viewport(0,0,w,h);g.bindFramebuffer(36160,fb);draw(scene,t);
      g.bindFramebuffer(36160,null);g.generateMipmap(3553);draw(post,t);
    }
    frame(6);
    window.fr=frame;window.cv=C;window.gl=g;window.fbo=fb;window.audio=buffer; //DEV
    if(window.CAP)return; //DEV
    let ac;
    go.textContent='Click to play';go.disabled=false;
    P0.onclick=async()=>{
      if(go.disabled)return;go.disabled=true;ac ||= new AudioContext();
      if(!D.fullscreenElement)D.body.requestFullscreen().catch(()=>{});await ac.resume();P0.style.display='none';
      const voice=ac.createBufferSource();voice.buffer=buffer;voice.connect(ac.destination);
      const start=ac.currentTime;voice.start(start);
      function tick(){const t=ac.currentTime-start;
        if(t<72){frame(t);requestAnimationFrame(tick)}else{frame(6);P0.style.display='grid';go.textContent='Replay';go.disabled=false}
      }tick();
    };
  }catch(e){go.textContent=e.message}
})();
