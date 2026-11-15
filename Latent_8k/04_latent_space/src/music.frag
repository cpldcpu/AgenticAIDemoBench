#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. 144 BPM: 16th = 5000 samples, 8th = 10000, beat = 20000, bar = 80000,
// section (8 bars) = 640000. 80 bars = 6,400,000 samples. A minor: Am F C G, one chord per bar.
// Timeline (bars): 0 intro | 8 drop | 24 breakdown | 32 drop | 48 breakdown | 56 drop | 72 outro | 80 end

float hs(int n){
  uint x=uint(n)*747796405u+2891336453u;
  x=((x>>((x>>28)+4u))^x)*277803737u;
  return float((x>>22)^x)/4294967296.;
}
// angular frequency, semitones above A1 (55 Hz)
float fq(float s){return 345.6*exp2(s/12.);}
// soft saw: four harmonics, no aliasing
float sw(float p){return sin(p)+sin(2.*p)*.5+sin(3.*p)*.33+sin(4.*p)*.25;}
// chord root and third (semitones above A1) of bar b
float rt(int b){return float[4](0.,-4.,3.,-2.)[b%4];}
float c3(int b){return b%4==0?3.:4.;}

// plucked arpeggio, 16ths, brighter and higher as the track goes on
float arp(int n){
  if(n<0)return 0.;
  int s=n/5000,b=s/16,k=int[8](0,2,1,2,3,2,1,3)[s%8];
  float t=float(n-s*5000)/48e3,
        ph=t*fq(rt(b)+vec4(0,c3(b),7,12)[k]+24.+(b>=32&&b<48||b>=56?12.*float(s/8%2):0.));
  return (sw(ph)*.4+tanh(2.*sin(ph*2.+exp(-t*30.)))*.3)*exp(-t*(b<24?12.:18.))*min(t*500.,1.);
}

// lead, 8ths, note+1 (0 = rest), semitones above A3
const int ML[64]=int[64](
  13,0,16,0,20,0,18,16, 13,0,16,0,21,0,20,16, 16,0,11,0,20,0,23,0, 18,0,15,0,11,0,18,0,
  20,0,23,0,25,0,23,20, 21,0,25,0,28,0,25,21, 28,0,23,0,20,0,23,0, 18,0,23,0,27,0,23,18);
float lead(int n,int b){
  float o=0.;
  for(int k=0;k<3;k++){
    int i=max(n/10000-k,0),m=ML[i%64];
    if(m>0){
      float t=float(n-i*10000)/48e3,
            ph=t*fq(float(m+11)+(b>=32&&b<48&&i%64>31?12.:0.))+.3*sin(t*40.)*min(t*3.,1.);
      o+=(sw(ph)+sw(ph*1.006)*.8+sin(ph*.5)*.7)*exp(-t*(b<32?4.:3.))*min(t*400.,1.);
    }
  }
  return o;
}

void main(){
  int n=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096,b=n/80000,s=n/5000;
  float tb=float(n%20000)/48e3,ts=float(n%5000)/48e3,tc=float(n%80000)/48e3,tx=float(n%640000)/48e3,ph;
  vec2 o=vec2(0),ns=vec2(hs(n*2),hs(n*2+1))-.5;
  bool dr=b>=6&&b<24||b>=32&&b<48||b>=56&&b<72,bs=dr&&b>=8;
  float pm=dr?1.-.85*exp(-tb*6.):1.;
  if(dr){
    // kick; muffled while the picture is still denoising
    o+=tanh(2.5*sin(283.*tb+38.*(1.-exp(-tb*25.))))*exp(-tb*7.)*(b<8?.45:.7)+(hs(n)-.5)*exp(-tb*300.)*.3;
    // closed hats on 16ths, open hats on the off-beat 8ths
    o+=(hs(n)-hs(n-1))*(s%4==2?.2*exp(-ts*16.):.07*exp(-ts*70.))*vec2(1,.8);
    // clap on 2 and 4
    if(b>=8&&n/20000%2==1)o+=(ns+.4*sin(1500.*tb))*exp(-tb*14.)*.4;
  }
  if(bs){
    // rolling bass: off-beat 16ths, octave jumps
    if(s%4>0){
      ph=ts*fq(rt(b)+(s%8==7||s%16==10?12.:0.));
      o+=tanh(2.*(sw(ph)*.5+sin(ph*.5)))*exp(-ts*5.)*smoothstep(.1,.08,ts)*min(ts*400.,1.)*.4*pm;
    }
    // supersaw stabs on the off-beat 8ths
    if(s%4==2){
      for(int j=0;j<3;j++)for(int d=0;d<3;d++){
        ph=ts*fq(rt(b)+36.+vec3(0,c3(b),7)[j]+float(d-1)*.07);
        o+=sw(ph+float(d*j))*exp(-ts*8.)*.03*vec2(1.+.4*float(d-1),1.-.4*float(d-1));
      }
    }
  }
  // supersaw pad: three chord notes, three detuned voices each
  vec3 cv=vec3(0,c3(b),7);
  float pe=(b>=24&&b<32||b>=48&&b<56?.8:.55)*smoothstep(0.,.5,tc)*min(float(n)/400000.,1.)*pm*.06;
  if(b>=72)pe*=exp(-float(n-5760000)/48e3*.6);
  for(int j=0;j<4;j++)for(int d=0;d<3;d++){
    ph=tc*fq(j<3?rt(b)+12.+cv[j]:rt(b)+12.)*(1.+float(d-1)*.004)+float(j*3+d);
    o+=(sin(ph+.6*sin(ph*2.+tc*.7))+sin(ph*2.)*.3)*pe*vec2(.5+.25*float(d),1.-.25*float(d))*(j<3?1.:.6);
  }
  // arpeggio and lead through a ping-pong dotted-8th echo
  float ag=b<4?.0:b<8?.5:b>=72?exp(-float(n-5760000)/48e3*.8):1.;
  for(int k=0;k<4;k++)
    o+=(arp(n-k*15000)*.2*(.5+.5*pm)*ag+(b>=16&&b<24||b>=24&&b<32||b>=32&&b<48||b>=56&&b<72?lead(n-k*15000,b)*.065*(b>=24&&b<32?1.4:1.):0.))*pow(.55,float(k))*(k%2==0?vec2(1,.4):vec2(.4,1));
  // snare roll into each drop: 8ths, 16ths, 32nds
  for(int q=0;q<4;q++){
    int e=int[4](640000,1920000,2560000,4480000)[q],r=n-e+80000;
    if(r>=0&&r<80000){
      int g=r<40000?20000:r<60000?10000:5000;
      float t=float(r%g)/48e3,x=float(r)/80000.;
      o+=(ns+.5*sin(900.*t))*exp(-t*(g==5000?40.:18.))*.3*(.3+x);
    }
  }
  // riser into the drops: noise sweep and a rising tone
  for(int q=0;q<4;q++){
    int e=int[4](640000,1920000,2560000,4480000)[q],r=n-e+320000;
    if(r>=0&&r<320000){
      float x=float(r)/320000.;
      o+=(ns*x*x*.2+sin(2000.*x*x*x*x+float(r)*.04*x)*x*x*.06*vec2(1,.7));
    }
  }
  // crash on each section start
  if(b>=8&&b<72&&b%8==0)o+=ns*exp(-tx*2.2)*.25;
  // outro: a last low hit and a sparkle
  if(n>=6080000){
    float t=float(n-6080000)/48e3;
    o+=tanh(2.*sin(150.*t+50.*(1.-exp(-t*8.))))*exp(-t*1.6)*.5*smoothstep(0.,.01,t);
  }
  O=vec4(tanh(o*1.25)*smoothstep(133.2,128.,float(n)/48e3),0,1);
}
