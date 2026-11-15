#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. 120 BPM: 16th = 6000 samples, beat = 24000, chord = 192000, section (16 s) = 768000.
// All timing is integer sample arithmetic, so there is no float drift.

float hs(int n){
  uint x=uint(n)*747796405u+2891336453u;
  x=((x>>((x>>28)+4u))^x)*277803737u;
  return float((x>>22)^x)/4294967296.;
}
// semitones above D2
float fq(float s){return 460.8*exp2(s/12.);} // 2*pi*73.34Hz

vec3 chord(int n){
  int c=n/192000%4;
  return n>=6144000?vec3(0,7,12):c==0?vec3(0,3,7):c==1?vec3(0,3,8):c==2?vec3(-2,3,7):vec3(-2,2,5);
}

float arp(int n){
  if(n<0||n>=6144000)return 0.;
  int sc=n/768000,s=n/6000,L=sc==0||sc==7?4:1;
  s-=s%L;
  float t=float(n-s*6000)/48e3,l=float(L),
        ph=t*fq(chord(n)[s%3]+float(24+12*(s%8/4)+(sc>2&&sc<7&&sc!=5?12:0)));
  return sin(ph+(1.+.5*float(sc))*exp(-t*10.)*sin(ph*2.))*exp(-t*(13.-l*2.))*min(t*400.,1.)*smoothstep(.125*l,.1*l,t);
}

const int ML[32]=int[32](7,0,0,12,15,0,14,12,12,0,0,8,12,0,15,0,10,0,0,7,10,0,15,14,14,0,0,10,14,0,17,14);
float lead(int n){
  float o=0.;
  int q=n/24000;
  for(int k=0;k<4;k++){
    int i=q-k;
    if(i>=128&&i<256&&ML[i%32]>0){
      float t=float(n-i*24000)/48e3,
            ph=t*fq(float(ML[i%32]+24+(i>=192&&i<224?12:0)))+.4*sin(t*34.)*min(t,1.);
      o+=sin(ph+1.8*exp(-t*4.)*sin(ph))*exp(-t*3.)*min(t*200.,1.);
    }
  }
  return o;
}

void main(){
  int n=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096,sc=n/768000,s=n/6000;
  float tb=float(n%24000)/48e3,ts=float(n%6000)/48e3,tc=float(n%192000)/48e3,tx=float(n%768000)/48e3,ph;
  bool dr=sc>0&&sc<5||sc==6;
  vec2 o=vec2(0);
  float pm=dr?1.-.75*exp(-tb*9.):1.;
  if(dr){
    // kick
    o+=tanh(2.5*sin(283.*tb+38.*(1.-exp(-tb*25.))))*exp(-tb*7.)*.6;
    // bass on the three off-16ths
    if(s%4>0){
      ph=ts*fq(vec4(0,-4,3,-2)[n/192000%4]+(s%8==7?12.:0.));
      o+=sin(ph+1.6*exp(-ts*14.)*sin(ph*2.))*exp(-ts*4.)*smoothstep(.125,.1,ts)*min(ts*300.,1.)*.36;
    }
    if(sc>1){
      // hats, clap
      o+=(hs(n)-hs(n-1))*(s%4==2?.16*exp(-ts*18.):.07*exp(-ts*60.))*vec2(1,.8);
      if(n/24000%2==1)o+=(hs(n*2+1)-.5+.6*sin(1200.*tb)*exp(-tb*20.))*exp(-tb*18.)*.45;
    }
  }
  // pad
  vec3 c=chord(n);
  float pe=(n<6144000?smoothstep(0.,.4,tc)*smoothstep(4.,3.5,tc):smoothstep(0.,.4,tc)*exp(-tc*.4))*min(float(n)/384e3,1.)*pm*.09;
  for(int j=0;j<4;j++){
    vec2 p=fq(j<3?c[j]+24.:c[0]+12.)*tc*vec2(1.004,.996)+float(j);
    o+=sin(p+(.5+.15*float(sc))*sin(p+.3*sin(tc*2.+float(j))))*pe;
  }
  // arp + lead through a ping-pong dotted-8th echo
  for(int k=0;k<4;k++)
    o+=(arp(n-k*18000)*.3*(.6+.4*pm)+lead(n-k*18000)*.28)*pow(.5,float(k))*(k%2==0?vec2(1,.5):vec2(.5,1));
  // crash on section starts, noise riser into the drops
  if(sc>0&&sc<8)o+=(vec2(hs(n*2),hs(n*2+1))-.5)*exp(-tx*2.5)*.25;
  if(sc==2||sc==5)o+=(vec2(hs(n*2),hs(n*2+1))-.5)*pow(max(tx/4.-3.,0.),2.)*.3;
  O=vec4(tanh(o*1.3)*smoothstep(138.,131.,float(n)/48e3),0,1);
}
