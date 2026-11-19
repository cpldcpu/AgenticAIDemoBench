#version 300 es
precision highp float;
out vec4 O;
// KINDLING - the soundtrack. One pixel = one stereo sample at 48 kHz; the forest echo is added in main.js.
// A fire dance in 7/8 (3+2+2): one eighth = 7200 samples = 0.15 s, one bar = 50400 samples = 1.05 s, 128 bars.
// D hijaz (D Eb F# G A Bb C) over a drone, for frame drum, lyre, reed pipe, flute and the fire itself.
const int SC[7]=int[7](0,1,4,5,7,8,10);
// the tune, 8 bars of 7 eighths: 0 rest, 1 hold, else scale step (5 = D4)
const int TH[56]=int[56](
  5,1,1,7,8,9,1,  10,9,8,7,1,6,1,  5,1,6,7,8,7,6,  5,1,1,4,1,5,1,
  9,1,12,12,1,11,10,  9,1,10,9,8,7,1,  8,1,9,10,9,8,7,  6,1,8,6,1,5,1);
const int RT[8]=int[8](0,0,0,0,0,0,5,1);     // bass note of each bar, semitones above D
const int OS[7]=int[7](5,9,12,9,7,9,11);     // the lyre's figure
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
// smooth noise at 48000/d Hz
float vn(int d){int i=N/d;float f=float(N-i*d)/float(d);f*=f*(3.-2.*f);return mix(hs(i),hs(i+1),f)*2.-1.;}
// Hz of a scale step
float fq(int s){s+=30;return 293.66*exp2(float(SC[s%7]+12*(s/7)-60)/12.);}
// phase of a steady tone, exact over the whole track
float ph(float f){return float(uint(N)*uint(f*21.845+.5)%1048576u)/1048576.;}
// the tune's note under sample n with u samples per eighth: step, seconds since it began, seconds until it ends
vec3 th(int n,int u){
  int e=n/u,s=e,f=e+1;
  for(int i=0;i<3;i++){if(TH[s%56]==1)s--;if(TH[f%56]==1)f++;}
  return vec3(TH[s%56],float(n-s*u)/48e3,float(f*u-n)/48e3);
}
// a pipe: phase modulation; x > 2 is a reed, x = .5 a flute. o shifts the scale step, m the octave.
// The reed begins each note with a grace note from two steps above
float pp(vec3 q,int o,float m,float x){
  float p=6.2832*fq(int(q.x)+o+int(x*step(q.y,.04)))*m*(q.y+4e-4*sin(q.y*34.)*sat(q.y*4.-.5)),e=sat(q.y*30.)*sat(q.z*40.);
  return q.x<2.?0.:sin(p+x*e*sin(p))*e;
}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);
  N=c.x+c.y*4096;
  int e=N/7200,b=e/7;
  float x=float(N-e*7200)/48e3,y=float(N-b*50400)/48e3,br=float(N)/50400.,nz=hs(N)*2.-1.,
        fu=br>=24.&&br<64.||br>=80.&&br<112.?1.:0.,cl=br>=80.&&br<112.?1.:0.,s,a,v,g,f;
  vec2 o=vec2(0);
  // what was struck in the last four eighths
  for(int k=0;k<4;k++){
    int i=e-k,q=i%7;
    if(i<0)break;
    a=x+float(k)*.15;
    v=float(i)/7.;
    g=v>=24.&&v<64.||v>=80.&&v<112.?1.:0.;
    // lyre: gut string, the high partials die first
    s=0.;
    f=fq(OS[q])*exp2(float(RT[i/7%8])/12.-1.);
    for(float h=1.;h<8.;h++)s+=sin(6.2832*f*h*a)*exp(-a*(1.5+h*1.5))/h;
    o+=s*vec2(.16,.1)*smoothstep(8.,10.,v)*(1.-.5*smoothstep(64.,66.,v)*smoothstep(81.,79.,v))*smoothstep(127.,112.,v);
    // frame drum: dum
    s=q<1?step(16.,v)*step(v,112.):q==3?g*.6:q==5?step(80.,v)*g*.8:0.;
    o+=sin(6.2832*(52.*a+1.7*(1.-exp(-a*28.))))*exp(-a*7.)*s*.75;
    // tek on the rim, ghost notes, and a roll before each new part
    s=g*float[7](0.,0.,.3,0.,.25,1.,.5)[q];
    if(i/7%16==15)s=g*(.3+.1*float(q));
    o+=(nz*.6+sin(a*5200.))*exp(-a*70.)*s*vec2(.45,.6);
    // hands clap in the climax
    if(q==3||q==5)o+=nz*exp(-a*30.)*sat(sin(a*500.)+.6)*step(80.,v)*g*.5;
    // one last blow as the dance ends
    if(i==784)o+=(sin(330.*a+9.*exp(-a*20.))+nz*.4)*exp(-a*5.);
    // flint on steel, six times before the fire catches
    if(q<1)o+=(nz+sin(a*17e3))*exp(-a*90.)*step(2.,v)*step(v,8.)*.4;
  }
  // shaker in sixteenths
  o+=nz*exp(-mod(x,.075)*90.)*fu*(.2+.2*step(x,.075));
  // bass: one note a bar
  f=6.2832*73.42*exp2(float(RT[b%8])/12.)*y;
  o+=sin(f+.9*sin(f))*exp(-y*1.5)*sat(y*300.)*sat((1.05-y)*50.)*fu*.3;
  // drone: two strings a fifth apart, the wheel digs in on the accents
  a=exp(-x*9.)*fu*(e%7==0||e%7==3||e%7==5?1.:0.);
  for(float h=1.;h<9.;h++)
    o+=(sin(6.2832*h*ph(73.42))+sin(6.2832*h*ph(110.3)))/sqrt(h)*(1.+a*h*.5)*.03*smoothstep(4.,16.,br)*smoothstep(127.,114.,br)*vec2(1.+.3*sin(h+br),1.-.3*sin(h+br));
  // the tune: reed pipe with an echo to one side; an octave and a third are added later.
  // The flute plays it at half speed before the dance, in the break and at dawn
  for(int k=0;k<2;k++){
    int n=max(N-k*10800,0);
    v=float(n)/50400.;
    vec3 m=th(n,7200);
    s=(pp(m,0,1.,2.5)+step(48.,v)*.5*pp(m,0,2.,1.5)+step(96.,v)*.6*pp(m,2,1.,2.5))*(v>=32.&&v<64.||v>=80.&&v<112.?.28:0.)
     +pp(th(n,14400),0,2.,.5)*(v>=16.&&v<32.||v>=64.&&v<80.||v>=112.?.2:0.)*smoothstep(128.,120.,v);
    o+=s*(k<1?vec2(1,.8):vec2(.1,.4));
  }
  // the fire: crackle, with a few loud pops, over a low roar; wind before and after
  int w=N/1800;
  a=float(N-w*1800)/48e3-hs(w*3+1)*.03;
  g=sat(br/2.-4.)*sat((130.-br)/8.);
  if(a>0.)o+=nz*exp(-a*700.)*pow(hs(w*7+2),7.)*g*(2.5-fu)*vec2(hs(w*5),1.-hs(w*5));
  o+=vn(110)*(.6+.4*vn(9000))*g*.08*(1.+cl);
  o+=vec2(vn(70),vn(71))*sat(vn(60000)*.5+.6)*(.07-.05*g);
  O=vec4(tanh(o*.8)*.75,0,1);
}
