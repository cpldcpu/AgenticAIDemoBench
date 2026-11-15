// Reproducible production checks and artifact capture. Does not make a video.
// Run from any directory: node 05_heliograph/verify.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url)),media=path.join(dir,'media');
const require=createRequire(new URL('../tools/package.json',import.meta.url));
const puppeteer=require('puppeteer-core');
fs.mkdirSync(media,{recursive:true});
const errors=[],requests=[];
const browser=await puppeteer.launch({
  executablePath:process.env.BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless:true,protocolTimeout:180000,
  args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required','--mute-audio']
});
try{
  const page=await browser.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.setViewport({width:1920,height:1080});
  await page.evaluateOnNewDocument(()=>{window.CAP=1;});
  await page.goto(pathToFileURL(path.join(dir,'dev.html')).href);
  await page.waitForFunction(()=>window.fr,{timeout:120000});
  const stats=await page.evaluate(()=>{
    const l=audio.getChannelData(0),r=audio.getChannelData(1),bars=[];
    let nonfinite=0,peak=0,sum=0,lr=0,ll=0,rr=0;
    const words=new Uint32Array(l.buffer);let checksum=2166136261;
    for(let i=0;i<l.length;i++){
      checksum=Math.imul(checksum^words[i],16777619);
      for(const v of [l[i],r[i]]){if(!Number.isFinite(v))nonfinite++;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
      lr+=l[i]*r[i];ll+=l[i]*l[i];rr+=r[i]*r[i];
    }
    for(let b=0;b<72;b++){
      const a=Math.round(b*48000*14/9),z=Math.round((b+1)*48000*14/9);
      let sq=0,pk=0,dc=0;
      for(let i=a;i<z;i++){sq+=l[i]*l[i]+r[i]*r[i];pk=Math.max(pk,Math.abs(l[i]),Math.abs(r[i]));dc+=l[i]+r[i];}
      bars.push({bar:b,seconds:+(b*14/9).toFixed(4),peak:+pk.toFixed(5),rms:+Math.sqrt(sq/(2*(z-a))).toFixed(5),dc:+(dc/(2*(z-a))).toFixed(7)});
    }
    return{samples:l.length,seconds:audio.duration,sampleRate:audio.sampleRate,nonfinite,peak,rms:Math.sqrt(sum/(l.length*2)),stereoCorrelation:lr/Math.sqrt(ll*rr),checksum:checksum>>>0,bars};
  });
  assert.equal(stats.nonfinite,0);assert.equal(stats.seconds,112);assert.ok(stats.peak<.99);
  assert.ok(stats.stereoCorrelation<.999,'soundtrack must contain real stereo information');
  // Export exactly the auditioned samples, without any video or lossy encoding.
  const wav=Buffer.alloc(44+stats.samples*4);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(192000,28);
  wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
  for(let off=0;off<stats.samples;off+=480000){
    const count=Math.min(480000,stats.samples-off);
    const base64=await page.evaluate((off,count)=>{
      const l=audio.getChannelData(0),r=audio.getChannelData(1),a=new Int16Array(count*2);
      for(let i=0;i<count;i++){a[i*2]=Math.round(l[off+i]*32767);a[i*2+1]=Math.round(r[off+i]*32767);}
      const bytes=new Uint8Array(a.buffer);let s='';
      for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
      return btoa(s);
    },off,count);
    Buffer.from(base64,'base64').copy(wav,44+off*4);
  }
  fs.writeFileSync(path.join(media,'heliograph.wav'),wav);
  const frames=await page.evaluate(()=>{
    const report=[],pixel=new Uint8Array(4),c=document.createElement('canvas');c.width=64;c.height=36;
    const x=c.getContext('2d');
    const times=Array.from({length:72},(_,i)=>(i+.5)*14/9);
    for(const t of times){
      fr(t);gl.readPixels(0,0,1,1,6408,5121,pixel);
      x.drawImage(cv,0,0,64,36);const data=x.getImageData(0,0,64,36).data;let sum=0;
      for(let i=0;i<data.length;i+=4)sum+=data[i]+data[i+1]+data[i+2];
      report.push({t:+t.toFixed(4),brightness:+(sum/(64*36*3)).toFixed(2)});
    }
    return report;
  });
  assert.ok(frames.every(f=>f.brightness>2),'unexpected black frame');
  const performance=await page.evaluate(()=>{
    const renderer=gl.getExtension('WEBGL_debug_renderer_info'),out=[];
    const px=new Uint8Array(4);
    for(const t of [10,26,38,52,58,64,72,82,94,106]){
      fr(t);gl.readPixels(0,0,1,1,6408,5121,px);const start=window.performance.now();
      for(let i=0;i<20;i++){fr(t+i/60);gl.readPixels(0,0,1,1,6408,5121,px);}
      out.push({seconds:t,msPerFrame:+((window.performance.now()-start)/20).toFixed(3)});
    }
    return{renderer:renderer?gl.getParameter(renderer.UNMASKED_RENDERER_WEBGL):'unknown',frames:out};
  });
  const save=async(t,name)=>{
    const data=await page.evaluate(t=>{fr(t);return cv.toDataURL('image/png').split(',')[1];},t);
    fs.writeFileSync(path.join(media,name),Buffer.from(data,'base64'));
  };
  await save(72.5,'still_1920x1080.png');
  const referenceImage=await page.evaluate(()=>{fr(72.5);return cv.toDataURL();});
  await page.evaluateOnNewDocument(()=>{window.CAP=1;window.CAPW=1600;window.CAPH=1200;});
  await page.reload();await page.waitForFunction(()=>window.fr,{timeout:120000});
  await save(72.5,'hero_1600x1200.png');
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',path.join(media,'hero_1600x1200.png'),'-vf','scale=400:300','-frames:v','1','-q:v','2',path.join(media,'pouet_400x300.jpg')]);
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',path.join(media,'heliograph.wav'),'-lavfi','showspectrumpic=s=1600x600:legend=1:scale=log:fscale=log:color=intensity','-frames:v','1',path.join(media,'soundtrack_spectrum.png')]);
  // Test the actual file:// packed release, including input, pause and replay.
  const release=await browser.newPage();await release.setViewport({width:1920,height:1080});
  release.on('pageerror',e=>errors.push(e.message));
  release.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  release.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await release.evaluateOnNewDocument(()=>{
    const NativeContext=AudioContext,NativeBuffer=AudioBuffer;
    window.AudioContext=class extends NativeContext{
      constructor(...a){super(...a);window.auditContext=this;}
      get currentTime(){const v=super.currentTime;this.origin??=v;return this.auditTime===undefined?v:this.origin+this.auditTime;}
      createBufferSource(){const s=super.createBufferSource();window.auditSource=s;return s;}
    };
    window.AudioBuffer=class extends NativeBuffer{constructor(...a){super(...a);window.auditBuffer=this;}};
  });
  const start=Date.now();await release.goto(pathToFileURL(path.join(dir,'intro.html')).href);
  await release.waitForFunction(()=>document.body.innerText.includes('P TO PAUSE'),{timeout:120000});
  const readyMs=Date.now()-start;
  await release.screenshot({path:path.join(media,'check_ready.png')});
  const packedChecksum=await release.evaluate(()=>{
    const words=new Uint32Array(auditBuffer.getChannelData(0).buffer);let h=2166136261;
    for(const n of words)h=Math.imul(h^n,16777619);return h>>>0;
  });
  assert.equal(packedChecksum,stats.checksum,'packed and development audio differ');
  await release.keyboard.press('Enter');await release.waitForFunction(()=>!document.getElementById('P0'));
  await release.waitForFunction(()=>window.auditContext.currentTime>.5);
  await release.screenshot({path:path.join(media,'check_playing.png')});
  const packedImage=await release.evaluate(async()=>{
    auditContext.auditTime=72.5;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const image=C.toDataURL();delete auditContext.auditTime;return image;
  });
  assert.equal(packedImage,referenceImage,'packed and development image differ');
  await release.keyboard.press('KeyP');await release.waitForFunction(()=>auditContext.state==='suspended');
  const paused=await release.evaluate(()=>auditContext.currentTime);
  await new Promise(r=>setTimeout(r,200));
  assert.equal(await release.evaluate(()=>auditContext.currentTime),paused);
  await release.keyboard.press('KeyP');await release.waitForFunction(()=>auditContext.state==='running');
  await release.evaluate(()=>auditSource.stop());
  await release.waitForFunction(()=>document.body.innerText.includes('CLICK TO REPLAY'));
  await release.mouse.click(800,500);await release.waitForFunction(()=>!document.getElementById('P0')&&auditContext.state==='running');
  await release.evaluate(()=>C.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await release.waitForFunction(()=>document.body.innerText.includes('GRAPHICS CONTEXT LOST')&&auditContext.state==='suspended');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const bytes=fs.statSync(path.join(dir,'intro.html')).size;assert.ok(bytes<=8192);
  const report={releaseBytes:bytes,freeBytes:8192-bytes,readyMs,audio:stats,performance,frameAudit:frames,
    checks:{shaderErrors:errors,externalRequests:requests,doubleClickBootstrap:true,packedAudioMatches:true,packedImageMatches:true,keyboardStart:true,pauseResume:true,replay:true,contextLossMessage:true}};
  fs.writeFileSync(path.join(media,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({bytes,readyMs,peak:stats.peak,rms:stats.rms,stereoCorrelation:stats.stereoCorrelation,performance,checks:report.checks},null,2));
}finally{await browser.close();}
