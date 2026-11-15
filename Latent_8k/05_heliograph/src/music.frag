#version 300 es
precision highp float;
out vec4 O;
// Original 72-bar composition in 7/8, 135 quarter notes/minute, 112 seconds.
// 3+2+2 grouping; struck inharmonic metal, felt strings, reed choir and broken drums.
// n*3 arithmetic keeps all sixteenth/eighth/bar boundaries sample accurate.
float noise(int n){uint x=uint(n);x^=x>>16;x*=2246822519u;x^=x>>13;x*=3266489917u;x^=x>>16;return float(x)/4294967296.*2.-1.;}
float freq(float m){return 6.2831853*440.*exp2((m-69.)/12.);}
float env(float t,float d){return (1.-exp(-t*350.))*exp(-t*d);}
// Eight two-bar sonorities: extended voicings over a moving pedal, no pop loop.
const vec4 H[8]=vec4[8](vec4(47,54,61,64),vec4(47,57,62,66),vec4(44,54,59,63),vec4(45,56,61,66),vec4(40,54,59,63),vec4(42,57,61,68),vec4(46,56,61,64),vec4(47,54,58,66));
// An eight-bar melody, with space for the tail of each struck note.
const int M[56]=int[56](
  83,0,78,81,0,85,0,  78,0,76,0,73,78,0,
  75,0,78,82,0,87,85,  80,0,76,0,73,0,75,
  78,0,83,85,0,90,0,  88,85,0,81,0,80,0,
  82,0,85,0,80,78,0,  78,0,75,73,0,71,0);
vec2 pan(float x){return vec2(sqrt(.5-x*.45),sqrt(.5+x*.45));}
// A struck bar with deliberately inharmonic upper modes and a softer string underneath.
float bell(float t,float m){
  float p=t*freq(m);
  return env(t,3.1)*(sin(p+2.1*sin(p*1.997)*exp(-t*18.))*.7+sin(p*2.756)*exp(-t*6.)*.25+sin(p*5.404)*exp(-t*12.)*.12);
}
vec2 melody(int nn){
  if(nn<0)return vec2(0);
  int ns=nn*3,s=ns/32000,b=s/7;
  vec2 v=vec2(0);
  if(b<8||b>=68)return v;
  for(int j=0;j<4;j++){
    int k=s-j;if(k<0)continue;
    int m=M[k%56];
    float t=float(ns-k*32000)/144000.;
    if(m>0){
      float pitch=float(m)+(b>=44&&b<60?0.:-12.);
      if(b>=32&&b<44)pitch-=12.;
      float amp=b<20?.12:b<32?.10:b<44?.15:.14;
      v+=bell(t,pitch)*amp*pan(sin(float(k)*2.4)*.8);
    }
  }
  return v;
}
void main(){
  int n=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096,ns=n*3,
      s=ns/16000,e=ns/32000,b=ns/224000,k=s%14;
  float T=float(n)/48000.,ts=float(ns%16000)/144000.,
        te=float(ns%32000)/144000.,tb=float(ns%224000)/144000.;
  vec2 o=vec2(0),nz=vec2(noise(n),noise(n+9173));
  bool drums=b>=8&&b<32||b>=44&&b<68;
  if(b<8){
    int k=e%7;
    if(k==0||k==3||k==5){
      float m=H[(b/2)%8][k==0?1:k==3?2:3]+12.;
      o+=bell(te,m)*.085*pan(k==3?-.7:.6);
    }
  }
  // Unequal groups make the mechanism lurch forward: 3 eighths, then 2, then 2.
  if(drums){
    int kk=k<6?0:k<10?6:10;
    float tk=float(ns-(s-k+kk)*16000)/144000.;
    o+=sin(295.*tk+37.*(1.-exp(-tk*45.)))*env(tk,19.)*.66;
    // Snare at the second group and the turnaround; body plus filtered-noise difference.
    if(k>=6&&k<8||k>=12){
      float t=k>=12?float(ns-(s-k+12)*16000)/144000.:float(ns-(s-k+6)*16000)/144000.;
      o+=(nz*.52+sin(1150.*t)*exp(-t*20.)*.32)*env(t,28.)*.42;
    }
    float ht=te,accent=e%7==2||e%7==4?.13:.065;
    accent*=.82+.18*noise(e*7919);
    o+=(noise(n)-noise(n-1))*env(ht,e%7==4?20.:85.)*accent*pan(e%2==0?-.6:.6);
    if(b>=52&&k%2==1)o+=sin(ts*freq(101.)+sin(ts*freq(107.)))*env(ts,95.)*.035;
    // Syncopated sub and woody pluck, a composed 14-step bass rhythm.
    int pat=int[14](1,0,0,1,0,1,0,0,1,0,1,0,0,1)[k];
    if(pat==1){
      float m=H[(b/2)%8].x-12.+(k==5?7.:k==13?12.:0.),p=ts*freq(m);
      o+=(sin(p)+sin(2.*p+1.8*exp(-ts*20.))*.32)*env(ts,11.)*.29;
    }
  }
  // Long, continuous bowed voices. Overlapping two-bar events prevent hard retriggers.
  for(int a=0;a<2;a++){
    int event=b/2-a;
    if(event<0||event>=34)continue;
    float t=float(ns-event*448000)/144000.,len=28./9.,
          amp=(1.-exp(-t*1.6))*exp(-max(t-len+.5,0.)*2.4);
    vec4 ch=H[event%8];
    for(int j=0;j<4;j++){
      float m=ch[j]+(j==0?0.:12.),p=t*freq(m),
            vib=.012*sin(t*28.+float(j)),v=0.;
      for(int q=1;q<=4;q++){
        float f=float(q);v+=sin(p*f+sin(t*.6+float(j))*f*.22+vib*f)/pow(f,1.8);
      }
      float gain=b<8?.033:b<32?.023:b<44?.045:.037;
      o+=v*amp*gain*pan(float(j)/2.-.75);
    }
  }
  // A separate five-note ostinato walks across the seven-beat bar.
  if(b>=16&&b<32||b>=44&&b<68){
    for(int j=0;j<3;j++){
      int k2=s-j;float t=float(ns-k2*16000)/144000.;
      int bi=k2/14,st=k2%14;
      if(k2>=0&&st%3==0){
        float m=H[(bi/2)%8][(st/3)%4]+12.;
        o+=bell(t,m)*.058*pan(sin(float(k2))*.65);
      }
    }
  }
  // Echoes cross the barline at three and five eighths, rather than dotted-four echoes.
  for(int d=0;d<4;d++){
    int delay=int[4](0,32000,53333,85333)[d];
    vec2 v=melody(n-delay);
    o+=(d%2==0?v:v.yx)*pow(.48,float(d));
  }
  // The high finale gains a slow, independent reed countermelody, in two-bar breaths.
  if(b>=44&&b<68){
    int q=(b-44)/2;
    float t=float(ns-(q+22)*448000)/144000.,
          m=float(int[12](66,64,63,61,59,61,64,66,68,66,63,59)[q]),
          p=t*freq(m)+.025*sin(t*32.),
          breath=smoothstep(0.,.15,t)*(1.-smoothstep(2.5,3.11,t));
    o+=(sin(p)+sin(3.*p)*.22+sin(5.*p)*.07)*breath*.068*vec2(.85,1.);
  }
  // The light-written knot has its own delicately detuned glass harmonics.
  if(b>=36&&b<44){
    for(int j=0;j<5;j++){
      float t=te+float(j)*.00013,p=t*freq(83.+float(j)*7.);
      o+=sin(p+sin(p*1.414)*.3)*env(te,10.)*.013*pan(float(j)*.4-.8);
    }
  }
  // Hand-cranked ratchet fills, only at the end of a phrase.
  if(b%8==7&&b>=7&&b<68&&k>=10){
    float t=float(ns%8000)/144000.;
    o+=(nz*.18+sin(t*freq(92.+float(k-10)*2.))*.08)*env(t,65.);
  }
  // Section entrances: a low metal plate, not a sampled crash.
  for(int j=0;j<5;j++){
    float start=float(int[5](0,8,20,44,68)[j])*14./9.,t=T-start;
    if(t>=0.&&t<7.)o+=(bell(t,35.)*.24+bell(t,59.)*.05)*vec2(.8,1.);
  }
  // A bowed plate swells into three structural changes, then releases its modes.
  for(int j=0;j<3;j++){
    float end=float(int[3](8,20,44)[j])*14./9.,t=T-end+28./9.;
    if(t>0.&&t<28./9.){
      float swell=pow(t/(28./9.),3.);
      for(int k=0;k<4;k++){
        float p=T*freq(78.+float(k)*5.31);
        o+=sin(p+.4*sin(T*3.))*swell*.018*pan(float(k)*.5-.75);
      }
    }
  }
  // Final cadence hangs alone, then fades to silence with the image.
  if(b>=68){float t=T-952./9.;o+=(bell(t,47.)*.3+bell(t,78.)*.10)*vec2(.9,1.);}
  float fade=smoothstep(0.,.025,T)*(1.-smoothstep(109.,111.9,T));
  O=vec4(tanh(o*1.5)*fade,0,1);
}
