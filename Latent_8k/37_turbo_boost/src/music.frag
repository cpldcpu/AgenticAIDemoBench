#version 300 es
precision highp float;
out vec4 O;
// TURBO BOOST - the soundtrack, an original 80s TV-action theme (not the theme of any show). One pixel = one stereo
// sample at 48 kHz: xy is the dry mix, zw the send to the echo and the hall in main.js.
// 128 BPM: a sixteenth = 5625 samples, a bar = 90000 samples, 68 bars. C minor, D minor from bar 56 on.
const int SC[7]=int[7](0,2,3,5,7,8,10);
// two themes, 8 bars of eighths each: 0 rest, 1 hold, else scale step + 2 (9 = C5)
const int TH[128]=int[128](
  6,1,9,1,11,1,1,10, 9,1,1,1,6,1,1,0, 7,1,9,1,11,1,12,1, 13,1,1,12,11,1,10,1,
  6,1,9,1,11,1,1,13, 12,1,11,1,10,1,9,1, 11,1,1,1,9,1,7,1, 10,1,1,1,1,1,1,0,
  16,1,1,15,14,1,13,1, 12,1,1,1,10,1,12,1, 13,1,1,12,10,1,8,1, 9,1,1,1,1,1,13,1,
  16,1,1,15,14,1,16,1, 17,1,1,16,15,1,12,1, 13,1,1,1,18,1,17,1, 16,1,1,1,1,1,1,0);
// chord roots as scale steps: Cm Cm Ab Bb in the verse, Ab Bb Gm Cm Ab Bb Cm Cm in the chorus
const int CH[12]=int[12](0,0,-2,-1,-2,-1,-3,0,-2,-1,0,0);
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
// Hz of a scale step, 0 = C4; the last part is lifted a whole tone
float fq(int s){s+=28;return (N<5040000?16.352:18.354)*exp2(float(SC[s%7]+12*(s/7))/12.);}
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
// the theme's note at sample n (counted from where the theme starts), eighths of 11250 samples, from o:
// step, seconds since it began, seconds until it ends, the step before
vec4 th(int n,int o){
  int e=n/11250,s=e,f=e+1,g;
  for(int i=0;i<6;i++){if(TH[o+s%64]==1)s--;if(TH[o+f%64]==1)f++;}
  g=s-1;
  for(int i=0;i<6;i++)if(TH[o+g%64]==1)g--;
  return vec4(TH[o+s%64],float(n-s*11250)/48e3,float(f*11250-n)/48e3,TH[o+g%64]);
}
// synth brass: three saws, a filter that swells open after the attack, a glide and a late vibrato
vec2 ld(vec4 q,float m){
  float f=fq(int(q.x)-2)*m,g=q.w<2.?f:fq(int(q.w)-2)*m,
        p=f*q.y-(f-g)*.025*(1.-exp(-q.y/.025))-f*2.5e-4*cos(q.y*36.)*sat(q.y*3.-.5),c=500.+3500.*sat(q.y*14.)*(.55+.45*exp(-q.y*4.));
  return q.x<2.?vec2(0):(sw(p,f,c,.5,1.)+vec2(sw(p*1.006,f,c,.5,1.),sw(p*.994,f,c,.5,1.)))*sat(q.y*70.)*sat(q.z*30.);
}
// is there an orchestra stab on sixteenth i?
bool sp(int i){
  int b=i/16,k=i%16;
  return b>=40&&b<64&&(b%2<1?k==0||k==6:k==12)||k==0&&(b==8||b==20||b==40||b==56||b==64);
}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);
  N=c.x+c.y*4096;
  int i=N/5625,b=N/90000,k=i%16,d=CH[b>=40&&b<56?4+(b-40)%8:b%4],j,v;
  float t=float(N)/48e3,x=float(N-i*5625)/48e3,y=float(N-b*90000)/48e3,
        nz=hs(N)*2.-1.,hp=nz-hs(N-1)*2.+1.,
        dr=b>=8&&b<32||b>=40&&b<64?1.:0.,ch=b>=40&&b<56?1.:0.,
        kt=9.,st=9.,f,s,a,w,e,g;
  vec4 o=vec4(0);
  // the kick: on 1, the and of 2, 3 and the and of 3 (and before the next 1 in the chorus)
  for(j=0;j<4;j++)if(((ch>0.?18753:2369)>>((i-j)&15)&1)>0){kt=x+float(j)*.1171875;break;}
  kt=dr>0.?kt:9.;
  float du=1.-.7*exp(-kt*7.);
  // bass: sixteenths on the root, jumping an octave on some of them, a plucked filter and a sine below
  f=fq(d-14)*(1.+float(42276>>k&1));
  a=b<4||b>=32&&b<36||b>=64?0.:b<8?.4:1.;
  w=b<8?250.:b>=36&&b<40?200.+float(b-36)*500.+y*250.:300.+(1100.+700.*ch)*exp(-x*18.);
  o.xy+=(sw(f*x,f,w,.3,1.)+sw(f*x*1.01,f,w,.3,1.)*.6+sin(6.2832*f*x)*.8)*sat(x*500.)*sat((.115-x)*100.)*du*a*.09;
  // pad: a triad of detuned saws, one to each ear, under everything
  a=sat(y*3.)*(b<64?1.:exp(-y*.6-float(b-64)*1.1))*(du*.5+.5)*(.035-.012*ch);
  for(j=0;j<3;j++){
    f=fq(d+2*j-7);
    w=500.+300.*sin(t*.4)+400.*float(b>=32&&b<40);
    o+=vec2(sw(f*t,f,w,.6,1.),sw(f*t*1.005+.3,f,w,.6,1.)).xyxy*a*vec4(1,1,.5,.5);
  }
  // arpeggio of sixteenths through the chord, a square wave, left and right in turn
  if(b>=28&&b<32||b>=40&&b<64){
    j=int[8](0,2,4,7,9,7,4,2)[i%8];
    f=fq(d+j+7);
    s=sw(f*x,f,600.+2500.*(.5+.5*sin(t*.7))*exp(-x*12.),.4,2.)*exp(-x*10.)*sat(x*600.)*(b<32?.12:.06);
    o+=s*(i%2<1?vec4(1,.4,.6,.2):vec4(.4,1,.2,.6));
  }
  // orchestra stabs: the chord in four octaves of saws with a burst of noise
  for(j=0;j<3;j++)if(sp(i-j)){st=x+float(j)*.1171875;break;}
  if(st<1.){
    for(j=0;j<4;j++){
      f=fq(d+int[4](0,2,4,7)[j]-7);
      o+=(sw(f*st,f,500.+4500.*exp(-st*10.),.5,1.)+sw(f*st*2.01,f*2.,500.+4500.*exp(-st*10.),.5,1.))*exp(-st*6.)*sat(st*300.)*vec4(.07,.07,.05,.05);
    }
    o+=nz*exp(-st*25.)*vec4(.2,.2,.1,.1)+sin(6.2832*(40.*st+5.*(1.-exp(-st*12.))))*exp(-st*3.)*float(k<1&&(b==8||b==20||b==40||b==56||b==64))*.6;
  }
  // the lead: theme A at bar 20 and, a tone higher with an octave below, at bar 56; theme B twice in the chorus
  if(b>=20&&b<28||b>=40&&b<64){
    vec4 m=b<28?th(N-1800000,0):b<56?th(N-3600000,64):th(N-5040000,0);
    o+=(ld(m,1.)+(b>=48?ld(m,.5)*.5:vec2(0))).xyxy*vec4(.1,.1,.08,.08);
  }
  // the voice: a buzz through two formants, one vowel per syllable, sometimes a consonant before it; same syllables as the voice box
  if((b>=16&&b<20||b>=32&&b<36)&&k<12&&hs(i)>.3){
    v=int(hs(i*3)*5.);
    f=98.+20.*hs(i*5);
    s=0.;
    for(float h=1.;h<40.;h++){
      e=(h*f-float[5](730.,530.,270.,570.,300.)[v])/90.;
      g=(h*f-float[5](1090.,1840.,2290.,840.,870.)[v])/120.;
      s+=sin(6.2832*h*f*x)*(1./(1.+e*e)+.5/(1.+g*g));
    }
    // the music steps back while the car speaks
    a=sin(3.1416*x/.1171875)*(.6+.4*hs(i*7));
    o=o*(1.-.4*a)+(s*.33+nz*exp(-x*80.)*step(.5,hs(i*11))*.6)*a*vec4(.9,.9,.3,.3);
  }
  // one beat of silence before the chorus
  if(b==39&&y>1.40625)o*=0.;
  // kick, with a click
  o.xy+=(sin(6.2832*(48.*kt+9.*(1.-exp(-kt*25.))))*exp(-kt*7.)*.75+nz*exp(-kt*300.)*.15);
  // gated snare on 2 and 4: a tone, and a big noise tail that the gate cuts
  a=mod(y+.46875,.9375);
  o+=dr*((hs(N/2)+hs(N/3)-1.+nz*.6)*sat((.28-a)*40.)*(.35+.65*exp(-a*12.))+sin(6.2832*185.*a)*exp(-a*20.)*.8)*vec4(.4,.4,.35,.35);
  // the build: a snare roll that doubles its speed, and rising noise
  if(b>=36&&b<40&&y<1.40625+float(b<39)){
    w=b<37?.234375:b<39?.1171875:.05859375;
    a=mod(y,w);
    o+=(nz+hs(N/2)-.5)*exp(-a*28.)*float(b-35)*vec4(.08,.08,.05,.05)+hp*pow(float(b-36)*.25+y/7.5,3.)*vec4(.08,.08,.1,.1);
  }
  // hats in sixteenths, open on the off-beats
  o.xy+=dr*hp*exp(-x*(k%4==2?22.:120.))*(k%2<1?.4:.25)*vec2(.22,.3);
  if(dr>0.&&b%8==7&&k>11){
    // four toms end every eight bars
    a=x;
    o+=sin(6.2832*(220.-30.*float(k-12))*(a+.05*(1.-exp(-a*15.))))*exp(-a*9.)*vec4(.45,.45,.2,.2);
  }
  // a crash begins every eight
  if(b>7&&b%8<1&&(dr>0.||b==40||b==64))o+=hp*exp(-y*2.5)*vec4(.18,.14,.1,.1);
  // the scanner: a whoosh that runs with the light across the nose, from one ear to the other
  a=b<8?sat(t*.5):b>=32&&b<40?.7:b>=64?exp(-y*.4-float(b-64)*.75):.12;
  w=sin(t*6.702);w*=w;
  s=(sw(195.*t-3.357*sin(t*13.404),195.,250.+1600.*w,.25,1.)*.6+(hs(N/3)-.5)*.5)*w*a*.18;
  e=-cos(t*6.702);
  o+=s*vec4(1.-e,1.+e,.5,.5);
  O=o;
}
