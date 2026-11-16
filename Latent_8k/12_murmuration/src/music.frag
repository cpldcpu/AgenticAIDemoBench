#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. Pastoral ambient in C minor, 120 BPM, 64 bars.
// beat = 48000 samples, bar = 96000. The birdsong density follows the size of the flock on screen.
const int BAR=96000;
// chords, two bars each: root*4 + kind (0 minor, 1 major, 2 major 7th)
const int CP[32]=int[32](192,192, 226,226, 205,205, 233,233, 212,212, 192,192, 198,221, 198,198,
  192,192, 192,233, 192,192, 226,226, 205,205, 233,233, 226,212, 198,192);
// the piano motif, in 8ths (0 rest, 1 hold, else MIDI): four bars of quiet arpeggio song
const int MT[32]=int[32](79,0,0,0, 84,0,83,0, 79,0,0,0, 0,0,76,0, 77,0,79,0, 84,0,79,0, 76,0,74,0, 72,0,0,0);
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
float w(float m){return 2764.6*exp2((m-69.)/12.);}
int ch(int b){return CP[b<64?b/2:31];}
// notes of a chord: root, third, fifth, colour tone, in staff order
vec4 tones(int c){
  float r=float(c/4);int k=c%4;
  return vec4(r,r+(k<1?3.:4.),r+7.,r+(k<1?10.:k<2?7.:11.));
}
// felt piano: a few soft harmonics over a hammer thump
float pno(float t,float m,float v){
  float f=w(m),x=0.;
  for(float k=1.;k<5.;k++)x+=sin(6.2832*f*k*t)*exp(-t*(1.+.6*k))/pow(k,1.7);
  x+=sin(6.2832*f*t*2.)*exp(-t*90.)*.12+.08*sin(t*f*37.)*exp(-t*260.);
  return x*v*sat(t*400.);
}
// one pad voice: a soft six-harmonic stack, detuned by du
float pd(float t,float m,float du){
  float f=w(m)*(1.+.0008*du),x=0.;
  for(float k=1.;k<7.;k++)x+=sin(6.2832*f*k*t+du)*pow(k,-1.6);
  return x;
}
void main(){
  N=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096;
  int b=min(N/BAR,63),nb=N-b*BAR,q=nb/48000,x16=nb/6000,e8=nb/24000;
  float tb=float(nb)/48e3,tq=float(nb-q*48000)/48e3,T=float(N)/48e3,bf=float(b)+tb/2.;
  vec4 tn=tones(ch(b));
  vec2 acc=vec2(0),o2=acc;
  float s=0.,z=hs(N)-.5,v;
  // how loud the birds are: sparse at first, a crowd for the spectacle, fading at the end
  float DEN=.12*sat(bf/4.)+.75*smoothstep(6.,10.,bf)*(1.-smoothstep(58.,63.,bf));
  // ----- pad: 2-bar swells, the harmonic ground. Tremolo while the falcon hunts
  float s2=tb+float(b&1)*2.,env=sat(s2/1.2)*(1.-smoothstep(3.2,4.,s2));
  if(b>2&&b<62){
    float trem=(b>23&&b<32)?.55+.45*sin(56.55*T):1.;
    for(int i=0;i<4;i++)o2+=(pd(s2,tn[i]+12.,1.)+pd(s2,tn[i]+12.,-1.))*env*trem*.028;
    o2+=(pd(s2,tn.x,1.)+pd(s2,tn.x,-1.))*env*trem*.05;
  }
  // ----- piano motif: bars 4-11, then sparse during the roost
  if(b>3&&b<12||b>55){
    int m8=(b>55?e8%32:(b-4)*8+e8%8);
    int mn=MT[m8%32],ago=0;
    // find the note this 8th belongs to (holds extend backwards)
    for(int i=0;i<8;i++){if(MT[(m8-i+32)%32]>1)break;ago++;}
    if(ago>0)m8-=ago-1;
    if(mn>1){
      float u=tb-float((b>55?(e8-(ago)):((b-4)*8+e8-(ago)))%4*8)/48000.;
      u=float(nb-(e8-ago)*24000)/48e3;
      float hum=(hs(b*8+e8)-.5)*.004;
      v=(b>55?.5:.8);
      o2+=pno(u,float(mn)+hum,v*.3)*vec2(1.-.15*u,1.);
      o2+=pno(u,float(mn-12)+hum,v*.14);
    }
  }
  // ----- spectacle ostinato: a plucked arpeggio runs while the sky dances
  if(b>31&&b<58){
    int p=x16%8;
    float tn2=tn[p%3]+(p>3?12.:0.)+12.,u=float(nb-x16*6000)/48e3,
          e=exp(-u*14.)*sat(u*600.)*(p%2<1?.22:.13);
    o2+=sin(6.2832*w(tn2)*u+sin(6.2832*w(tn2)*u*2.01)*.6)*e*vec2(.7,.9);
  }
  // ----- sub under the spectacle and heartbeat pulse before it
  if(b>31&&b<56)o2.x+=sin(6.2832*w(tn.x-12.)*tq)*exp(-tq*2.)*.25;
  float kk=0.;
  if((b>13&&b<24||b>31&&b<56)&&tq<.4){
    v=b>31?.5:.22;
    s+=sin(300.*tq-30.*exp(-20.*tq))*exp(-tq*9.)*v;
    kk=exp(-tq*8.);
  }
  // spectacle kit: offbeat hats, a clap on two and four, tom fill closing each four bars
  if(b>31&&b<56){
    float tx=float(nb-(nb/12000)*12000)/48e3;
    if((nb/12000)%2>0)s+=(hs(N)-hs(N-1))*exp(-tx*90.)*.09;
    if((q&1)>0&&tq<.25)s+=z*exp(-tq*30.)*.4+sin(tq*1400.)*exp(-tq*40.)*.12;
    if(b%4==3&&x16>11)s+=sin((x16%4<2?190.:150.)*6.2832*tx)*exp(-tx*11.)*.3;
  }
  // ----- the falcon: no drums, a held breath, then a long whoosh up to the drop
  if(b>27&&b<32){
    v=sat((bf-28.)/4.);
    s+=(hs(N)-hs(N-1))*(hs(N)-hs(N-(1+int(40.*(1.-v)))))*v*v*1.8;
  }
  // a big breath at the drop
  if(b==32)s+=(hs(N)-hs(N-2))*exp(-tb*3.)*.16;
  // ----- starlings: chirps and the airborne shimmer of thousands of wings
  for(int j=0;j<2;j++){
    int s0=N/4096-j,n=N-s0*4096;
    float h1=hs(s0*3),h2=hs(s0*3+1),h3=hs(s0*3+2);
    if(h1<DEN){
      for(int k=0;k<2;k++){
        float st=k<1?h2*2600.:1700.+h3*2200.,u=(float(n)-st)/48e3;
        if(u>0.&&u<.14){
          float f0=3200.+2600.*hs(s0*7+k*3+5),ph=6.2832*f0*(u-.28*u*u/.14),
                ww=sin(ph)*(.6+.4*sin(ph*.13+565.*u)),e=sin(3.1416*u/.14);
          e*=e;
          float pan=hs(s0*11+k+9);
          acc+=ww*e*(k<1?.10:.05)*vec2(1.-.5*pan,.5+.5*pan);
        }
      }
    }
  }
  s+=(hs(N)-hs(N-3))*.004*DEN*(b>1?1.:sat(bf*.5));
  // roosting chatter at bedtime, then crickets
  if(b>55)acc*=1.+float(b-55)*.1;
  if(b>57&&b<63){
    int g7=N/2286;
    if(hs(g7)<.25&&N-g7*2286<900)s+=sin(26389.*T)*exp(-float(N-g7*2286)*.01)*.05;
  }
  o2=o2*(1.-.35*kk)+acc;
  O=vec4(tanh((o2+s)*.85),0,1);
}
