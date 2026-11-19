// FROM HERE / Latent. Distances are in turntable units. Y is up.
(async () => {
  const D=document, width=1920, height=1080;
  let w=width,h=height;
  if(window.CAPW){w=CAPW;h=CAPH} //DEV
  D.title='From Here / Latent';
  D.body.innerHTML=`<style>*{box-sizing:border-box}body{margin:0;background:#162c36;color:#fff7dd;font:15px Arial,sans-serif}canvas{position:fixed;inset:0;width:100%;height:100%;object-fit:contain;touch-action:none}#P0{position:fixed;inset:0;display:grid;align-content:end;justify-items:start;padding:7vh 7vw;background:linear-gradient(0deg,#122534eb,transparent 64%)}h1{font:italic normal clamp(56px,9vw,175px)/1 Georgia,serif;letter-spacing:-.07em;margin:.12em 0 .22em}small,button{font:bold 13px/1.3 Consolas,monospace;letter-spacing:.09em}button{color:#172e35;background:#fff5dc;border:0;border-radius:2em;padding:.85em 1.5em;cursor:pointer}button:disabled{opacity:.75}#end{position:fixed;bottom:4%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#152f38eb;padding:.45em .55em .45em 1.3em;border-radius:2em}#end button{margin-left:1em}</style><canvas id=C width=${w} height=${h}></canvas><div id=P0><small>LATENT / GPT-6.2 ASTRA</small><h1>From Here</h1><button id=play disabled>Assembling the sculpture</button></div><div id=end hidden><small>Drag or use &larr; &rarr; to turn</small><button id=replay>Replay</button></div>`;
  await new Promise(resolve=>setTimeout(resolve,50));
  try{
  const g=C.getContext('webgl2',{antialias:false,alpha:false});
  if(!g || !g.getExtension('EXT_color_buffer_float'))throw Error('WebGL2 with floating-point render targets required');
  const full='#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}';
  function program(vertex,fragment){
    const p=g.createProgram();
    [vertex,fragment].forEach((source,i)=>{
      const s=g.createShader(35633-i);g.shaderSource(s,source);g.compileShader(s);
      if(!g.getShaderParameter(s,35713))throw Error(g.getShaderInfoLog(s));
      g.attachShader(p,s);
    });
    g.linkProgram(p);if(!g.getProgramParameter(p,35714))throw Error(g.getProgramInfoLog(p));
    return p;
  }
  // The sculpture and the light see the same moving vertices.
  const model=SCENE_SRC;
  const sculpt=program(model.replace('#version 300 es','#version 300 es\n#define VERTEX'),model);
  const music=program(full,MUSIC_SRC), post=program(full,POST_SRC);
  const uniform=(p,name,...v)=>g.uniform4f(g.getUniformLocation(p,name),...v);
  function texture(unit,internal,format,type,tw,th,filter){
    const tex=g.createTexture();g.activeTexture(33984+unit);g.bindTexture(3553,tex);
    g.texImage2D(3553,0,internal,tw,th,0,format,type,null);
    for(const [key,value] of [[10241,filter],[10240,filter],[10242,33071],[10243,33071]])g.texParameteri(3553,key,value);
    return tex;
  }
  function target(tex,attachment){
    const f=g.createFramebuffer();g.bindFramebuffer(36160,f);
    g.framebufferTexture2D(36160,attachment,3553,tex,0);return f;
  }
  const rows=938,samples=3840000,mt=texture(0,34836,6408,5126,4096,rows,9728);
  const mf=target(mt,36064);
  g.viewport(0,0,4096,rows);g.useProgram(music);g.drawArrays(4,0,3);
  const pcm=new Float32Array(4096*rows*4);
  g.readPixels(0,0,4096,rows,6408,5126,pcm);
  const buffer=new AudioBuffer({length:samples,numberOfChannels:2,sampleRate:48000});
  const left=buffer.getChannelData(0),right=buffer.getChannelData(1);
  // Only the instruments with a room send feed the cross-coupled dotted echoes.
  const tapL=new Float32Array(18000),tapR=new Float32Array(24000);
  let dampL=0,dampR=0;
  for(let i=0;i<samples;i++){
    const l=i%tapL.length,r=i%tapR.length,offset=i*4;
    dampL+=.29*(tapL[l]-dampL);dampR+=.32*(tapR[r]-dampR);
    tapL[l]=pcm[offset+3]+dampR*.37;tapR[r]=pcm[offset+2]+dampL*.37;
    const master=.63*Math.min(1,(samples-i)/24000);
    left[i]=Math.tanh((pcm[offset]+.35*dampL)*.89)*master;
    right[i]=Math.tanh((pcm[offset+1]+.35*dampR)*.89)*master;
  }
  g.deleteFramebuffer(mf);g.deleteTexture(mt);
  // Each height cuts both type specimens into runs. Every pair of runs is one piece.
  const ink=D.createElement('canvas').getContext('2d');
  const slices=21;
  function profile(word,span){
    ink.canvas.width=600;ink.canvas.height=200;ink.font='900 190px Arial Black,Arial,sans-serif';
    const m=ink.measureText(word),left=m.actualBoundingBoxLeft,right=m.actualBoundingBoxRight;
    ink.setTransform(590/(right+left),0,0,194/m.actualBoundingBoxAscent,5+590*left/(right+left),197);
    ink.fillText(word,0,0);
    const data=ink.getImageData(0,0,600,200).data;
    return Array.from({length:slices},(_,j)=>{
      const y=Math.floor(197-(j+.5)*194/slices),runs=[];
      let begin=-1;
      for(let x=0;x<600;x++){
        if(data[(y*600+x)*4+3]>127){if(begin<0)begin=x}
        else if(begin>=0){runs.push([(x+begin-600)/1200*span,(x-begin)/1200*span]);begin=-1}
      }
      return runs;
    });
  }
  const you=profile('YOU',6.8),me=profile('ME',5.7),instances=[];
  const add=(x,y,z,r,dx,dy,dz,material)=>instances.push(x,y,z,r,dx-r,dy-r,dz-r,material);
  you.forEach((row,j)=>row.forEach(([x,dx])=>me[j].forEach(([z,dz])=>{
    add(x,.12+(j+.5)*.126,-z,.016,dx,.060,dz,0);
  })));
  // Flat ground, followed by three cylindrical lathe profiles and engraved rim ticks.
  add(0,-.76,0,0,75,.1,75,1);
  const blocks=instances.length/8,radius=4.48;
  add(0,-.39,0,0,radius,.25,radius,2);
  add(0,-.105,0,0,radius+.045,.046,radius+.045,3);
  add(0,.015,0,0,radius+.065,.085,radius+.065,4);
  const verts=[],tri=(a,b,c)=>verts.push(...a,...b,...c);
  // The central face, four rolled edges and four corners share the same square grid.
  const grid=[-1,-1,1,1],rim=[-1,0,0,1];
  for(let axis=0;axis<3;axis++)for(const side of [-1,1]){
    const pt=(i,j)=>{
      let p=[0,0,0],n=[0,0,0],u=(axis+1)%3,v=(axis+2)%3;
      p[axis]=n[axis]=side;p[u]=grid[i];p[v]=grid[j];n[u]=rim[i];n[v]=rim[j];
      const k=Math.hypot(...n);return [...p,...n.map(x=>x/k)];
    };
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      let a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);
      tri(a,b,c);tri(a,c,d);
    }
  }
  const boxCount=verts.length/6;
  for(let i=0;i<192;i++){
    const pt=(a,y,cap)=>{let x=Math.cos(a),z=Math.sin(a);return [x,y,z,cap?0:x,cap?y:0,cap?0:z]};
    const a=i*Math.PI/96,b=(i+1)*Math.PI/96;
    tri(pt(a,-1,0),pt(a,1,0),pt(b,1,0));tri(pt(b,1,0),pt(b,-1,0),pt(a,-1,0));
    tri([0,1,0,0,1,0],pt(a,1,1),pt(b,1,1));
  }
  function mesh(data){
    const b=g.createBuffer();g.bindBuffer(34962,b);g.bufferData(34962,new Float32Array(data),35044);return b;
  }
  const geometry=mesh(verts),parts=mesh(instances);
  function vao(first){
    const obj=g.createVertexArray();g.bindVertexArray(obj);
    function attrib(slot,n,stride,offset,divisor){
      g.enableVertexAttribArray(slot);g.vertexAttribPointer(slot,n,5126,false,stride,offset);g.vertexAttribDivisor(slot,divisor);
    }
    g.bindBuffer(34962,geometry);attrib(0,3,24,0,0);attrib(1,3,24,12,0);
    g.bindBuffer(34962,parts);attrib(2,4,32,first*32,1);attrib(3,4,32,first*32+16,1);
    return obj;
  }
  const boxes=vao(0),drums=vao(blocks);
  const shadow=texture(2,33190,6402,5125,2048,2048,9728),lamp=target(shadow,36096);
  g.drawBuffers([0]);g.readBuffer(0);
  const surface=texture(0,34842,6408,5131,w,h,9729),fb=target(surface,36064);
  const depth=g.createRenderbuffer();g.bindRenderbuffer(36161,depth);g.renderbufferStorage(36161,33189,w,h);
  g.framebufferRenderbuffer(36160,36096,36161,depth);
  // Typeset once for the filmed titles.
  ink.canvas.width=1536;ink.canvas.height=384;ink.fillStyle='white';
  ink.font='italic 177px Georgia,serif';ink.fillText('From Here',14,162);
  ink.font='bold 40px Consolas,monospace';ink.fillText('LATENT     /     GPT-6.2 ASTRA',20,252);
  ink.fillText('CODE, FORM & MUSIC     /     GPT-6.2 ASTRA',20,343);
  g.activeTexture(33985);g.bindTexture(3553,g.createTexture());g.texImage2D(3553,0,6408,6408,5121,ink.canvas);
  g.texParameteri(3553,10241,9729);g.texParameteri(3553,10240,9729);
  const ease=(a,b,t)=>{let x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x)};
  // Angle, elevation, half-height, target x/y/z. Orthographic projection makes both readings exact.
  const shots=[
    [0,-.65,.43,1.6,-1.4,1.4,1.15],[4,-.58,.38,1.78,-1,1.4,1.05],
    [5,.65,.36,4.55,0,1.30,0],[15,1.14,.65,4.65,0,2.25,0],
    [15.01,-.5,1.08,3.6,0,2.4,0],[20,-.72,1.28,3.85,0,2.15,0],
    [20.01,-.8,.42,3.35,0,1.55,0],[28,0,0,2.55,0,1.35,0],[32.5,0,0,2.55,0,1.35,0],
    [38,.65,.38,3.75,0,1.7,0],[40,.70,.48,3.75,0,1.8,0],
    [40.01,-.65,.13,1.63,-1.15,2.05,.8],[46,-.28,.3,2.15,-.6,2.9,.2],
    [46.01,1.9,.72,5.10,0,2.35,0],[52,2.35,.54,4.95,0,2.3,0],
    [52.01,2.55,.7,3.65,0,1.8,0],[62.5,Math.PI/2,0,2.52,0,1.34,0],[67.5,Math.PI/2,0,2.52,0,1.34,0],
    [73,.82,.40,3.58,0,1.15,0],[80,.79,.42,3.64,0,1.15,0]
  ];
  function frame(t,hand){
    let i=1;while(i<shots.length-1&&shots[i][0]<t)i++;
    const a=shots[i-1],b=shots[i],u=ease(a[0],b[0],t),v=a.map((p,j)=>p+(b[j]-p)*u);
    if(hand!==undefined){v[1]=hand;v[2]=.42*Math.sin(2*hand)**2;v[3]=2.52+1.12*Math.sin(2*hand)**2;v[5]=1.34-.19*Math.sin(2*hand)**2}
    g.useProgram(sculpt);uniform(sculpt,'A[0]',v[1],v[2],v[3],0);uniform(sculpt,'A[1]',v[4],v[5],v[6],0);
    g.enable(2929);
    for(const pass of [1,0]){
      g.activeTexture(33986);g.bindTexture(3553,pass?null:shadow);
      g.uniform1i(g.getUniformLocation(sculpt,'B'),2);
      g.bindFramebuffer(36160,pass?lamp:fb);g.viewport(0,0,pass?2048:w,pass?2048:h);
      const day=1-ease(35,40,t)*(1-ease(53,60,t));
      g.clearColor(.018+.662*day,.044+.746*day,.067+.693*day,1);g.clear(16640);uniform(sculpt,'R',w,h,t,pass);
      g.bindVertexArray(boxes);g.drawArraysInstanced(4,0,boxCount,blocks);
      g.bindVertexArray(drums);g.drawArraysInstanced(4,boxCount,verts.length/6-boxCount,3);
    }
    g.bindVertexArray(null);g.disable(2929);g.bindFramebuffer(36160,null);
    g.useProgram(post);uniform(post,'R',w,h,t,0);g.uniform1i(g.getUniformLocation(post,'B'),1);g.drawArrays(4,0,3);
  }
  frame(73);
  window.audio=buffer;window.fr=frame;window.cv=C;window.gl=g;window.fbo=fb; //DEV
  if(window.CAP)return; //DEV
  play.textContent='Click to play';play.disabled=false;
  let ac,angle=.79,drag=null;
  function turn(value){angle=Math.max(0,Math.min(Math.PI/2,value));frame(80,angle)}
  C.onpointerdown=e=>{if(!end.hidden){drag=[e.clientX,angle];C.setPointerCapture(e.pointerId)}};
  C.onpointermove=e=>{if(drag)turn(drag[1]+(e.clientX-drag[0])*3/C.clientWidth)};
  C.onlostpointercapture=()=>drag=null;
  onkeydown=e=>{if(!end.hidden&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();turn(angle+(e.key==='ArrowLeft'?-.065:.065))}};
  async function start(){
    play.disabled=true;end.hidden=true;
    ac ||= new AudioContext();if(!D.fullscreenElement)C.parentElement.requestFullscreen().catch(()=>{});
    await ac.resume();P0.style.display='none';
    const voice=ac.createBufferSource();voice.buffer=buffer;voice.connect(ac.destination);
    const startTime=ac.currentTime;voice.start(startTime);
    function tick(){
      let t=ac.currentTime-startTime;
      if(t<80){frame(t);requestAnimationFrame(tick)}else{turn(.79);end.hidden=false}
    }
    tick();
  }
  P0.onclick=()=>{if(!play.disabled)start()};replay.onclick=start;
  }catch(error){play.textContent=error.message}
})();
