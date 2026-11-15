#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. 125 BPM: 16th = 5760 samples, beat = 23040, bar = 92160,
// chord (2 bars) = 184320, section (8 bars) = 737280. 72 bars fill the 4096x1620 texture exactly.
// F major: F C Dm Bb. All timing is integer sample arithmetic.

float hs(int n){
  uint x=uint(n)*747796405u+2891336453u;
  x=((x>>((x>>28)+4u))^x)*277803737u;
  return float((x>>22)^x)/4294967296.;
}
// angular frequency, semitones above D2
float fq(float s){return 460.8*exp2(s/12.);}

vec3 chord(int n){
  int c=n/184320%4;
  return n>=6266880||c==0?vec3(3,7,10):c==1?vec3(2,5,10):c==2?vec3(3,7,12):vec3(3,8,12);
}

// chip arpeggio: soft square, brighter in later sections
float arp(int n){
  if(n<0||n>=6266880)return 0.;
  int sc=n/737280,s=n/5760,L=sc==0?4:1;
  s-=s%L;
  int k=s/L;
  float t=float(n-s*5760)/48e3,l=float(L),
        ph=t*fq(chord(n)[int[4](0,1,2,1)[k%4]]+float(24+12*(k/4%2)+(sc>4&&sc<8?12*(s/32%2):0)));
  return tanh((1.+.6*float(sc))*sin(ph))*exp(-t*(14.-l*2.))*min(t*400.,1.)*smoothstep(.115*l,.1*l,t);
}

// lead: two four-bar phrases in F pentatonic, one note per 8th, 0 = rest
const int ML[64]=int[64](
  7,0,10,7,0,3,0,5, 7,0,0,10,0,12,10,0, 5,0,10,5,0,3,0,5, 5,0,0,7,0,10,12,0,
  15,0,15,12,0,10,0,12, 15,0,0,17,0,15,12,0, 10,0,10,7,0,5,0,7, 10,0,0,12,0,15,17,0);
float lead(int n){
  float o=0.;
  int q=n/11520;
  for(int k=0;k<4;k++){
    int i=q-k,sc=i/64,m=i<0?0:ML[i%32+(sc%4==3||sc==4?32:0)];
    if(sc>1&&sc!=5&&sc<8&&m>0){
      float t=float(n-i*11520)/48e3,
            ph=t*fq(float(m+24))+.4*sin(t*36.)*min(t*2.,1.);
      o+=(tanh(3.*sin(ph))*.6+sin(ph*2.)*.3)*exp(-t*5.)*min(t*300.,1.);
    }
  }
  return o;
}

void main(){
  int n=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096,sc=n/737280,s=n/5760;
  float tb=float(n%23040)/48e3,ts=float(n%5760)/48e3,tc=float(n%184320)/48e3,tx=float(n%737280)/48e3,ph;
  // drums: bars 8-40 and 44-68
  bool dr=n>=737280&&n<6266880&&(n<3686400||n>=4055040);
  vec2 o=vec2(0),ns=vec2(hs(n*2),hs(n*2+1))-.5;
  float pm=dr?1.-.75*exp(-tb*9.):1.;
  if(dr){
    // kick
    o+=tanh(2.5*sin(283.*tb+38.*(1.-exp(-tb*25.))))*exp(-tb*7.)*.6;
    // bass on the three off-16ths, octave jumps
    if(s%4>0){
      ph=ts*fq(vec4(3,-2,0,-4)[n/184320%4]+(s%8==7||s%16==10?12.:0.));
      o+=tanh(1.5*sin(ph+1.6*exp(-ts*14.)*sin(ph*2.)))*exp(-ts*4.)*smoothstep(.118,.1,ts)*min(ts*300.,1.)*.34;
    }
    // hats, snare from the second drum section on
    o+=(hs(n)-hs(n-1))*(s%4==2?.15*exp(-ts*18.):.06*exp(-ts*60.))*vec2(1,.8);
    if(sc>1&&n/23040%2==1)o+=(ns.x+.6*sin(1200.*tb)*exp(-tb*20.))*exp(-tb*18.)*.45;
  }
  // pad
  vec3 c=chord(n);
  float pe=smoothstep(0.,.4,tc)*(n<6266880?smoothstep(3.84,3.3,tc):exp(-tc*.5))*min(float(n)/368640.,1.)*pm*.085;
  for(int j=0;j<4;j++){
    vec2 p=fq(j<3?c[j]+24.:c[0]+12.)*tc*vec2(1.004,.996)+float(j);
    o+=sin(p+(.5+.12*float(sc))*sin(p+.3*sin(tc*2.+float(j))))*pe;
  }
  // arp + lead through a ping-pong dotted-8th echo
  for(int k=0;k<4;k++)
    o+=(arp(n-k*17280)*.2*(.6+.4*pm)+lead(n-k*17280)*.26)*pow(.5,float(k))*(k%2==0?vec2(1,.5):vec2(.5,1));
  // endless riser for the recursion: six sines an octave apart, each climbing one octave per bar
  if(sc==5||sc==6){
    float w=min(float(n-3686400)/2e5,1.)*smoothstep(5160960.,4976640.,float(n));
    for(int j=0;j<6;j++){
      float x=float((n+j*92160)%552960)/552960.;
      o+=sin(522.*(exp2(6.*x)-1.)+vec2(0,1))*pow(sin(3.1416*x),2.)*.035*w;
    }
  }
  // crash on section starts, noise riser into the next section
  if(sc>0&&sc<8)o+=ns*exp(-tx*2.5)*.25;
  if(sc==0||sc==2||sc==5||sc==6)o+=ns*pow(max(tx/3.84-3.,0.),2.)*.3;
  // bar 68: everything is compacted into one hit
  if(n>=6266880){
    float t=float(n-6266880)/48e3;
    o+=tanh(3.*sin(190.*t+60.*(1.-exp(-t*12.))))*exp(-t*2.5)*.7+ns*exp(-t*2.)*.3;
  }
  O=vec4(tanh(o*1.3)*smoothstep(138.2,133.,float(n)/48e3),0,1);
}
