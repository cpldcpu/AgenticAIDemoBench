import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(new URL('../tools/package.json',import.meta.url));
const puppeteer=require('puppeteer-core');
const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage();const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.evaluateOnNewDocument(()=>{window.CAP=1;window.CAPW=640;window.CAPH=360;});
 await page.goto(pathToFileURL(path.join(dir,'dev.html')).href);await page.waitForFunction(()=>window.fr);
 const stats=await page.evaluate(()=>{
  let peak=0,dc=0,power=0,cross=0,other=0,bad=0,delta=0;
  const a=audio.getChannelData(0),b=audio.getChannelData(1);
  for(let i=0;i<a.length;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))bad++;peak=Math.max(peak,Math.abs(a[i]),Math.abs(b[i]));dc+=a[i];power+=a[i]*a[i];other+=b[i]*b[i];cross+=a[i]*b[i];if(i)delta=Math.max(delta,Math.abs(a[i]-a[i-1]));}
  const frames=[];const px=new Uint8Array(640*360*4);
  for(let t=1;t<=128;t++){fr(t);gl.readPixels(0,0,640,360,gl.RGBA,gl.UNSIGNED_BYTE,px);let sum=0;for(let i=0;i<px.length;i+=4)sum+=px[i]+px[i+1]+px[i+2];frames.push({t,mean:sum/(640*360*3)});}
  return {duration:audio.duration,peak,dc:dc/a.length,rms:Math.sqrt(power/a.length),correlation:cross/Math.sqrt(power*other),bad,maxSampleDelta:delta,frames,glError:gl.getError()};
 });
 const packed=await browser.newPage();packed.on('pageerror',e=>errors.push(e.message));packed.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await packed.goto(pathToFileURL(path.join(dir,'intro.html')).href);await packed.waitForFunction(()=>document.body.innerText.includes('CLICK'));
 await packed.keyboard.press('Enter');await packed.waitForFunction(()=>!document.getElementById('P0'));await packed.keyboard.press('KeyP');
 const first=await packed.$eval('#C',c=>c.toDataURL());await new Promise(r=>setTimeout(r,200));const second=await packed.$eval('#C',c=>c.toDataURL());
 await packed.keyboard.press('KeyP');await new Promise(r=>setTimeout(r,200));const third=await packed.$eval('#C',c=>c.toDataURL());
 const report={...stats,bytes:fs.statSync(path.join(dir,'intro.html')).size,errors,externalRequests:requests,pauseStable:first===second,resumeChanges:second!==third};
 fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,frames:`${report.frames.length} frames checked; minimum pre-fade mean ${Math.min(...report.frames.filter(x=>x.t<125).map(x=>x.mean)).toFixed(1)}`},null,2));
 if(report.bytes>8192||errors.length||requests.length||stats.bad||stats.glError||!report.pauseStable||!report.resumeChanges)process.exitCode=1;
}finally{await browser.close();}
