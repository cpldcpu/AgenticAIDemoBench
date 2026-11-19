#version 300 es
precision highp float;
out vec4 O;
// WAVEFOLDER - the soundtrack. One pixel = one stereo sample at 48 kHz: xy is the dry mix, zw the send to the
// echo and the hall, which are added in main.js. 120 BPM: a sixteenth = 6000 samples, a bar = 96000 samples, 72 bars.
// A minor, and B minor from bar 56 on. Every voice is a sum of harmonics, each weighted by the response of a resonant low-pass filter.
const int SC[7]=int[7](0,2,3,5,7,8,10);
// the two themes, 8 bars of eighths each: 0 rest, 1 hold, else scale step + 2 (9 = A4)
const int TH[128]=int[128](
  13,1,1,12,11,1,10,11, 9,1,1,1,1,0,9,11, 13,1,1,15,13,1,12,11, 12,1,1,1,1,1,10,12,
  13,1,1,12,11,1,10,11, 16,1,1,15,14,1,13,14, 15,1,1,13,11,1,13,15, 15,1,12,1,10,1,1,0,
  11,1,1,1,9,11,14,1, 12,1,1,1,10,12,15,1, 16,1,1,15,1,13,1,1, 1,1,0,11,12,13,1,12,
  11,1,1,1,9,11,14,1, 15,1,1,1,12,15,17,1, 18,1,1,17,1,15,1,1, 13,1,15,1,17,1,1,0);
// chord roots as scale steps: Am F C G for the verse, F G Am Am F G C Em for the chorus
const int CH[12]=int[12](0,-2,2,-1, -2,-1,0,0,-2,-1,2,-3);
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
// Hz of a scale step, 0 = A3; the last chorus is lifted a whole tone
float fq(int s){s+=28;return (N<5376000?13.75:15.434)*exp2(float(SC[s%7]+12*(s/7))/12.);}
// an oscillator through a resonant low-pass: phase p in cycles, pitch f, cutoff c, damping q; d = 1 is a saw, 2 a square
float sw(float p,float f,float c,float q,float d){
  float s=0.,x;
  p=fract(p);
  for(float h=1.;h*f<min(c*5.,18e3);h+=d){
    x=h*f/c;x*=x;
    s+=sin(6.2832*h*p)/h/sqrt((1.-x)*(1.-x)+x*q);
  }
  return s;
}
// the theme's note under sample n with u samples per eighth, from o: step, seconds since it began, seconds until it ends, the step before
vec4 th(int n,int u,int o){
  int e=n/u,s=e,f=e+1,g;
  for(int i=0;i<6;i++){if(TH[o+s%64]==1)s--;if(TH[o+f%64]==1)f++;}
  g=s-1;
  for(int i=0;i<6;i++)if(TH[o+g%64]==1)g--;
  return vec4(TH[o+s%64],float(n-s*u)/48e3,float(f*u-n)/48e3,TH[o+g%64]);
}
// the lead: three saws spread over both ears, a filter that closes after the attack, a glide from the last note and a late vibrato
vec2 ld(vec4 q,float m,int o){
  float f=fq(int(q.x)-2+o)*m,g=q.w<2.?f:fq(int(q.w)-2+o)*m,
        p=f*q.y-(f-g)*.03*(1.-exp(-q.y/.03))-f*2e-4*cos(q.y*35.)*sat(q.y*3.-.6),c=1200.+5e3*exp(-q.y*5.);
  return q.x<2.?vec2(0):(sw(p,f,c,.4,1.)+vec2(sw(p*1.007,f,c,.4,1.),sw(p*.993,f,c,.4,1.)))*sat(q.y*300.)*sat(q.z*50.);
}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);
  N=c.x+c.y*4096;
  int i=N/6000,b=N/96000,d=CH[b>=32&&b<64?4+(b<40?b/2:b)%8:b%4],k=i%8;
  float x=float(N-i*6000)/48e3,y=float(N-b*96000)/48e3,z=mod(y,.5),br=float(N)/96e3,nz=hs(N)*2.-1.,hp=nz-hs(N-1)*2.+1.,
        kk=b>=8&&b<32||b>=40&&b<68?1.:0.,sn=b>=16&&b<32||b>=40&&b<64?1.:0.,
        du=1.-.8*kk*exp(-z*9.),f,s,a;
  vec4 o=vec4(0);
  // bass: sixteenths on the root with octave jumps (in the chorus every other eighth), a plucked filter, a sine below
  f=fq(d-14)*(1.+float((b>=40&&b<64?52428:42052)>>i%16&1));
  o.xy+=(sw(f*x,f,150.+(900.+900.*sn)*exp(-x*22.),.25,1.)+sw(f*x*1.012,f,150.+(900.+900.*sn)*exp(-x*22.),.25,1.)*.7+sin(6.2832*f*x)*.7)*sat(x*500.)*sat((.125-x)*100.)*du*kk*.085;
  // arpeggio: square wave up and down the chord over a tenth; its filter opens during the intro
  k=k<5?k:8-k;
  f=fq(d+7+2*k+k/3+(b>=48&&b<64?7:0));
  s=sw(f*x,f,300.+(400.+3e3*smoothstep(0.,8.,br))*(b>=32&&b<40?.4:1.+.4*sin(br*.785))*exp(-x*14.),.3,2.)*exp(-x*9.)*sat(x*800.)*smoothstep(71.,66.,br)*(.18-.06*sn);
  o+=s*(i%2<1?vec4(1,.5,1,.3):vec4(.5,1,.3,1));
  // pad: a seventh chord, two detuned saws for each note, one to each ear; it swells on every chord
  a=sat(y*5.)*sat((2.-y)*30.)*du*smoothstep(3.,8.,br)*smoothstep(71.,66.,br)*.032;
  // in the chorus the same chord is stabbed in a 3-3-2 rhythm, an octave up: z is the time since the last stab
  z=9.;
  for(k=3;k-->0;)if((18761>>(i-k)%16&1)>0)z=x+float(k)*.125;
  for(k=0;k<4;k++){
    f=fq(d+2*k);
    s=500.+900.*sn+900.*sat(y*2.);
    o+=vec2(sw(f*y,f,s,.7,1.),sw(f*y*1.006+.5,f,s,.7,1.)).xyxy*a*vec4(1,1,.3,.3)
      +sw(2.*f*z,2.*f,500.+4e3*exp(-z*14.),.5,1.)*exp(-z*6.)*sat(z*400.)*(b>=40&&b<64?.07:0.)*vec4(1,1,.5,.5);
  }
  // before the drums, and in the break, a low saw holds the root while its filter opens
  if(b<8||b>=32&&b<40)o.xy+=sw(fq(d-14)*y,fq(d-14),b<8?80.+40.*br*br:300.,.5,1.)*sat(y*9.)*sat((2.-y)*9.)*.1;
  z=mod(y,.5);
  // lead: theme A in the verses and once more, softly, at the end; theme B at half speed in the break and at full speed in the three choruses.
  // A second voice joins later, an octave below or a third above
  if(b>=16&&b<68){
    vec4 m=b>=32&&b<40?th(N,24000,64):th(N,12000,b<32||b>=64?0:64);
    o+=(ld(m,1.,0)*(b>=32&&b<40||b>=64?.6:1.)+(b>=24&&b<32?ld(m,.5,0)*.4:b>=48&&b<64?ld(m,1.,2)*.5:vec2(0))).xyxy*vec4(.11,.11,.09,.09);
  }
  // one beat of silence before each chorus, for the fill to stand in
  if(b%16==7&&b>8&&y>1.5)o*=0.;
  // kick on every beat
  o.xy+=kk*(sin(6.2832*(45.*z+8.*(1.-exp(-z*28.))))*exp(-z*6.)*.6+nz*exp(-z*400.)*.2);
  // snare on two and four: a tone, and noise that a gate cuts off
  a=mod(y+.5,1.);
  o+=sn*((hs(N/2)+hs(N/5)-1.+nz*.5)*sat((.26-a)*30.)*(.45+.55*exp(-a*18.))+sin(1050.*a+19.*(1.-exp(-a*40.)))*exp(-a*22.)*.8)*vec4(.55,.55,.25,.25);
  // a snare roll that swells through the bar before each chorus
  if(b%16==7&&b>8)o+=(hs(N/2)-.5+nz*.3)*exp(-x*30.)*y*y*vec4(.2,.2,.1,.1);
  // hats in sixteenths, open on the off-beat
  o.xy+=hp*exp(-x*(i%4==2?25.:110.))*(i%2<1?.5:.25)*kk*vec2(.3,.22);
  if(b%8==7){
    // four toms end every eight bars, under a rising noise
    if(y>1.){
      k=int(y*4.-4.);
      a=y-1.-float(k)*.25;
      o+=sin(6.2832*(190.-35.*float(k))*(a+.06*(1.-exp(-a*16.))))*exp(-a*8.)*vec4(.5,.5,.2,.2);
    }
    o.xy+=nz*y*y*y*.012;
  }
  // and a crash begins the next eight
  if(b>7&&b<72&&b%8<1)o+=hp*exp(-y*3.)*vec4(.2,.15,.1,.1);
  O=o;
}
