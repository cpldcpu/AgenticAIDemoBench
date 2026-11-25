#version 300 es
precision highp float;
out vec4 O;
// DECKLE - the soundtrack, an original chamber-folk piece for kalimba, flute, strings and brushes.
// One pixel = one stereo sample at 48 kHz: xy is the dry mix, zw the send to the echo and the hall in main.js.
// 100 BPM: an eighth = 14400 samples, a bar = 115200 samples (2.4 s), 52 bars. D major; E major from bar 40.
// Bars: 0-3 page, 4-11 dusk, 12-19 night (flute), 20-23 build, 24-31 storm, 32-35 calm, 36-39 dawn, 40-47 tutti, 48-51 close.
const int SC[7]=int[7](0,2,4,5,7,9,11);
// two themes, 8 bars of eighths each: 0 rest, 1 hold, else scale step (7 = D5)
const int TH[128]=int[128](
  4,1,4,5,7,1,5,4, 5,1,1,1,2,1,4,5, 7,1,5,1,3,5,7,1, 6,1,4,1,6,7,8,1,
  7,1,7,8,9,1,8,7, 9,1,7,1,5,1,1,1, 5,1,7,1,5,1,7,1, 7,1,1,1,1,1,1,0,
  9,1,1,7,5,1,7,1, 5,1,1,1,1,1,0,0, 7,1,1,5,3,1,5,1, 6,1,8,1,9,1,8,6,
  11,1,1,9,7,1,9,1, 7,1,1,1,5,1,1,1, 7,1,5,1,3,1,5,1, 6,1,1,1,1,1,1,0);
// chord roots by bar: D Bm G A D Bm G D, and the storm's Bm Bm G A Bm Bm G A
const int CA[8]=int[8](0,5,3,4,0,5,3,0);
const int CB[8]=int[8](5,5,3,4,5,5,3,4);
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
// Hz of a scale step, 0 = D4 (E4 after bar 40)
float fq(int s){s+=28;return (N<4608000?18.354:20.602)*exp2(float(SC[s%7]+12*(s/7))/12.);}
// the chord root of a bar, in scale steps
int cr(int b){
  int s=b<20?b<4?0:b<12?4:12:b<32?b<24?20:24:b<36?32:b<40?36:b<48?40:48;
  s=(b-s)%8;
  return b>=48?int[4](0,5,3,0)[min(b-48,3)]:b>=20&&b<32?CB[s]:CA[s];
}
// smooth noise, u in cells
float vn(float u){int i=int(floor(u));float f=fract(u);f*=f*(3.-2.*f);return mix(hs(i),hs(i+1),f)*2.-1.;}
// a saw through a resonant low-pass (harmonic sum), phase p in cycles, pitch f, cutoff c, damping q
float sw(float p,float f,float c,float q){
  float s=0.,x;
  p=fract(p);
  for(float h=1.;h*f<min(c*5.,16e3);h++){
    x=h*f/c;x*=x;
    s+=sin(6.2832*h*p)/h/sqrt((1.-x)*(1.-x)+x*q);
  }
  return s;
}
// the theme's note at sample n (counted from where the theme starts): step, seconds since it began, seconds until it ends
vec3 th(int n,int o){
  int e=n/14400,s=e,f=e+1;
  for(int i=0;i<6;i++){if(TH[o+s%64]==1)s--;if(TH[o+f%64]==1)f++;}
  return vec3(TH[o+s%64],float(n-s*14400)/48e3,float(f*14400-n)/48e3);
}
// kalimba: a tine, with a short ring at 5.4 times the pitch
float kal(float f,float t){return (sin(6.2832*f*t)*exp(-t*3.)+.45*sin(34.*f*t)*exp(-t*20.))*sat(t*900.);}
// glockenspiel: bar partials
float glk(float f,float t){return (sin(6.2832*f*t)+.5*sin(17.3*f*t)*exp(-t*6.)+.3*sin(34.*f*t)*exp(-t*12.))*exp(-t*2.5)*sat(t*900.);}
// flute: a sine with two overtones, vibrato that comes in late, a breath of noise
float flu(vec3 q,float f,float nz){
  float p=6.2832*f*q.y+.5*sat(q.y*2.-.3)*sin(32.67*q.y);
  return (sin(p)+.28*sin(2.*p)+.1*sin(3.*p)+nz*.03)*sat(q.y*18.)*sat(q.z*12.);
}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);
  N=c.x+c.y*4096;
  int e=N/14400,b=N/115200,k=e%8,j,d=cr(b),rp=d>2?d-7:d,bd=d-7-7*int(d>2),g,m;
  float t=float(N)/48e3,x=float(N-e*14400)/48e3,y=float(N-b*115200)/48e3,
        nz=hs(N)*2.-1.,hp=nz-hs(N-1)*2.+1.,
        f,s,a,w,fin=exp(-max(t-120.,0.)*.5);
  bool A1=b>=4&&b<12,A2=b>=12&&b<20,BR=b>=20&&b<24,ST=b>=24&&b<32,CM=b>=32&&b<36,D1=b>=36&&b<40,D2=b>=40&&b<48,OU=b>=48;
  vec4 o=vec4(0);
  // pad: three detuned saws through a low-pass that opens with the section, one to each ear; each bar's chord starts fresh
  a=(b<4?sat(t/9.6)*.5:A1?.7:A2?.9:BR?1.1:ST?1.:CM?.7:D1?.9:D2?1.2:1.)*sat(y*12.)*sat((2.4-y)*20.)*fin*.02;
  w=(ST?500.:700.)+300.*sin(t*.4)+500.*float(D2);
  for(j=0;j<3;j++){
    f=fq(rp+2*j);
    o+=vec2(sw(f*y,f,w,.6),sw(f*y*1.004+.3,f,w,.6)).xyxy*a*vec4(1,1,.7,.7);
  }
  // the theme: kalimba in the first part and the page, flute at night, strings in the storm, all of them in the tutti
  g=b<4?0:A1?4:A2?12:ST?24:b<40?36:b<48?40:48;
  if(b<4||A1||A2||ST||D1||D2||OU&&b<51){
    vec3 q=th(N-g*115200,ST?64:0),p=th(N-g*115200-int(q.y*48e3)-1,ST?64:0);
    f=fq(int(q.x));
    s=0.;
    if(q.x>1.){
      if(b<12||D1||OU||D2)s+=kal(f,q.y)*(D2?.25:.4);
      if(A2||D2)s+=flu(q,f,nz)*.22;
      if(D2)s+=glk(f*2.,q.y)*.08;
      if(ST)s+=(sw(f*.5*q.y,f*.5,700.+2500.*sat(q.y*5.),.5)+sw(f*.503*q.y,f*.5,700.+2500.*sat(q.y*5.),.5))*sat(q.y*40.)*sat(q.z*15.)*.07;
    }
    // the note before it keeps ringing
    if(p.x>1.&&(b<12||D1||OU||D2))s+=kal(fq(int(p.x)),p.y+q.y)*(D2?.25:.4);
    o+=s*fin*vec4(.9,.9,.4,.4)*(ST?1.:.8+.2*sin(t));
  }
  if(b==51)o+=(kal(fq(7),y)*.35+glk(fq(14),y)*.12)*vec4(1,1,.8,.8)*fin;
  // arpeggio in eighths through the chord: kalimba, from the night on and in the tutti; three eighths ring over each other
  if(A2||D2||BR&&b>21||OU&&b<50){
    s=0.;
    for(j=0;j<3;j++){
      m=cr((e-j)/8);
      s+=kal(fq((m>2?m-7:m)+int[8](0,2,4,7,4,2,0,2)[(e-j)%8]),x+float(j)*.3);
    }
    s*=(D2?.2:.16)*(BR?.5:1.);
    o+=s*(k%2<1?vec4(1,.5,.5,.2):vec4(.5,1,.2,.5));
  }
  // bass: a plucked sine on the root, the fifth and the octave; in the storm every eighth, a saw
  if(A1&&b>5||A2||D1&&b>37||D2||CM&&b>33){
    s=0.;
    for(j=0;j<3;j++){
      m=(e-j)%8;
      a=float(m==0||m==3)+float(m==4)*.8+float(m==6)*.6;
      g=cr((e-j)/8);
      f=fq(g-7-7*int(g>2)+(m==4?4:0)+(m==6?7:0));
      s+=(sin(6.2832*f*(x+float(j)*.3))+.4*sin(12.566*f*(x+float(j)*.3))*exp(-(x+float(j)*.3)*9.))*exp(-(x+float(j)*.3)*4.)*sat((x+float(j)*.3)*400.)*a;
    }
    o.xy+=s*.2*(D2?1.2:1.);
  }
  if(ST||BR&&b>21){
    f=fq(bd-7+(k%4==3?4:0));
    a=k%4==0?1.:.55;
    o.xy+=sw(f*x,f,300.+500.*exp(-x*8.),.4)*sat(x*300.)*sat((.3-x)*60.)*a*.06*(ST?1.:.6);
  }
  // soft kick (a box drum), brush shaker, a tick on two and four
  if(A1&&b>5||A2||D1&&b>37||D2||ST){
    a=float[8](1.,0.,0.,ST?.8:0.,1.,0.,ST?.7:0.,ST?.6:0.)[k];
    o.xy+=sin(6.2832*(50.*x+14.*(1.-exp(-x*30.))))*exp(-x*(ST?7.:10.))*a*.45+nz*exp(-x*300.)*a*.05;
    s=hp*exp(-mod(x,.15)*70.)*(k%2<1?.5:1.)*.07*(ST?.6:1.);
    o+=s*(k%2<1?vec4(.5,1,0,0):vec4(1,.5,0,0));
    o.xy+=float(k==2||k==6)*sin(6.2832*1500.*x)*exp(-x*80.)*.05;
  }
  // storm: toms, thunder after every flash, rain
  if(ST||b==23){
    if(k>3&&(b>25||b==23))o+=sin(6.2832*(110.-12.*float(k%4))*(x+.04*(1.-exp(-x*14.))))*exp(-x*7.)*vec4(.3,.3,.15,.15);
    for(j=0;j<6;j++){
      a=(float(N)-float[6](25.,26.5,28.,28.25,29.75,31.)[j]*115200.)/48e3;
      if(a>0.&&a<5.)o+=(vn(a*55.)*.6+vn(a*120.)*.35+sin(6.2832*(48.*a+4.*(1.-exp(-a*2.))))*.6)*exp(-a*1.2)*sat(a*40.)*vec4(.5,.5,.3,.3);
    }
    o.xy+=hp*.035*sat(t/60.-.38)*sat(1.-(t-76.)*.4)*vec2(1,1.1);
  }
  // a wind rises through the build
  if(BR)o.xy+=vn(t*300.)*(float(b-20)+y/2.4)*.02*vec2(1,.9);
  // paper: the sheet is pulled up (bars 3 to 5) and let down again (bars 48.5 to 50.7), then a soft thud
  a=t-7.2;
  if(a>0.&&a<4.8)o+=vn(600.*a+1500.*a*a/4.8)*sin(3.1416*a/4.8)*.25*vec4(1,.8,.3,.2);
  a=t-116.4;
  if(a>0.&&a<5.3)o+=vn(4000.*a-340.*a*a)*sin(3.1416*a/5.3)*.2*vec4(.8,1,.2,.3);
  a=t-121.7;
  if(a>0.&&a<1.)o.xy+=vn(a*70.)*exp(-a*7.)*.5+sin(6.2832*45.*a)*exp(-a*8.)*.4;
  // lantern chimes at night and at sunrise
  if(b>=16&&b<24||b>=40&&b<48){
    s=0.;
    for(j=0;j<4;j++){
      a=mod(float(e-j)*1.618,1.);
      if(a<.35)s+=glk(fq(int[5](7,9,11,14,16)[int(a*20.)%5]),x+float(j)*.3);
    }
    o+=s*.05*sat(float(b-15))*sat(float(48-b))*vec4(1,.6,.5,.3);
  }
  o*=sat(t*2.);
  O=o;
}
