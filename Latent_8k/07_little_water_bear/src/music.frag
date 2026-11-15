#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. This is the dry orchestra; the concert hall is added in main.js.
// 100 BPM: 16th = 7200 samples, 8th = 14400, beat = 28800, bar = 115200. 56 bars and a tail.
// A small score in F major for clarinet, plucked strings, string section, glockenspiel, horn, harp and timpani.
const int BAR=115200;
// the walking theme: 8 bars of 8ths; 0 rest, 1 hold, else MIDI note
const int TH[64]=int[64](
  65,0,69,72,77,1,72,0, 76,0,72,76,79,1,1,0, 77,0,74,77,81,1,79,77, 74,1,1,70,74,1,0,0,
  72,0,69,72,77,1,81,0, 82,0,79,77,74,1,77,0, 76,0,79,76,72,1,74,76, 77,1,1,1,0,0,0,0);
// the progression F C/E Dm Bb F/A Gm7 C7 F: bass note and the chord above it
const int RT[8]=int[8](41,40,38,34,33,31,36,41);
const ivec3 CH[8]=ivec3[8](ivec3(60,65,69),ivec3(60,64,67),ivec3(62,65,69),ivec3(62,65,70),ivec3(60,65,69),ivec3(58,62,65),ivec3(58,60,64),ivec3(57,60,65));
// per bar: which chord of the progression, and how loud the string section plays (tenths)
const int HB[58]=int[58](0,0,0,6, 0,1,2,3,4,5,6,7, 3,3,6,6, 4,5,6,7, 2,2,3,3,2,2,2,2, 6,6,6,6, 0,0,1,1,2,2,3,3,4,5,6,6, 6,6,6,6, 0,0,0,6, 4,5,6,7, 7,7);
const int PL[58]=int[58](4,5,5,5, 2,2,2,2,2,2,2,2, 4,4,4,3, 3,3,3,3, 4,4,4,4,3,3,2,1, 2,3,5,7, 9,9,9,9,9,9,9,9,9,9,9,7, 4,3,2,2, 2,2,3,5, 5,5,5,5, 6,0);
const int MX[7]=int[7](0,2,4,5,7,9,10);      // C mixolydian, for the runs and the harp
const int PN[5]=int[5](0,2,4,7,9);           // pentatonic, for dew, stars and rain
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
float w(float m){return 2764.6*exp2((m-69.)/12.);}
// smooth noise at 48000/d Hz
float vn(int d){int i=N/d;float f=float(N-i*d)/float(d);f*=f*(3.-2.*f);return mix(hs(i),hs(i+1),f)*2.-1.;}
// the theme note under sample n, with u samples per 8th: MIDI, seconds since it began, seconds until it ends
vec3 th(int n,int u){
  int e=n/u,s=e,f=e+1;
  for(int i=0;i<8;i++){if(TH[s]==1)s--;if(f<64&&TH[f]==1)f++;}
  return vec3(TH[s],float(n-s*u)/48e3,float(f*u-n)/48e3);
}
// wind instrument, two-operator FM: ratio 2 gives the odd harmonics of a clarinet, ratio 1 a horn. a = attack speed
float wd(vec3 q,float tr,float r,float a){
  float f=w(q.x+tr),p=f*q.y+f*1e-4*sin(q.y*35.)*sat(q.y*3.-.6),e=sat(q.y*a)*sat(q.z*25.);
  return q.x<2.?0.:sin(p+(2.5-r)*e*sin(r*p))*e;
}
// plucked string
float pz(float t,float m){float p=w(m)*t,r=0.;for(float k=1.;k<6.;k++)r+=sin(p*k)/k*exp(-t*(2.+3.*k));return r*sat(t*800.);}
// glockenspiel
float gl(float t,float m){float p=w(m)*t;return sin(p+.8*exp(-t*9.)*sin(p*3.5))*exp(-t*4.)*sat(t*3e3);}
// two desks of bowed strings: band-limited saws, slightly detuned, one per ear
vec2 st(float t,float m){vec2 p=w(m)*t*vec2(.997,1.004),r=vec2(0);for(float k=1.;k<8.;k++)r+=sin(p*k+k)/k;return r;}
// timpani
float tm(float t,float m){return sin(w(m)*t+4.*exp(-t*25.))*exp(-t*3.5)*sat(t*400.);}
// the string section plays the chord of bar b; t = seconds since that bar began. Each chord is bowed into the next one.
vec2 pd(int b,float t){
  int h=HB[b];
  float tr=b>31&&b<44?-4.:0.;
  vec2 r=st(t,float(RT[h]+12)+tr);
  for(int i=0;i<3;i++)r+=st(t,float(CH[h][i])+tr);
  // tremolo while the wind rises and before the tutti
  if(b>27&&b<32||b>49&&b<52)r*=.6+.4*sin(t*82.);
  return r*sat(t*4.)*sat((2.7-t)*3.3)*float(PL[b])*.007;
}
void main(){
  N=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096;
  int b=min(N/BAR,57),nb=N-b*BAR,e=nb/14400,q=nb/28800,x=nb/7200,h=HB[b],u=14400,tn=-1;
  float tb=float(nb)/48e3,t8=float(nb-e*14400)/48e3,tq=float(nb-q*28800)/48e3,tx=float(nb-x*7200)/48e3,
        tr=b>31&&b<44?-4.:0.,ct=0.,cv=.3,bf=float(b)+tb/2.4,r;
  vec2 o=pd(b,tb);
  if(b>0)o+=pd(b-1,tb+2.4);
  bool wk=b>3&&b<12||b>15&&b<20||b>51&&b<56;
  // the walk: bass on beats one and three, plucked chords on two and four
  if(wk){
    if((q&1)<1)o+=pz(tq,float(RT[h]))*.5;
    else for(int i=0;i<3;i++)o+=pz(tq,float(CH[h][i]))*.13*vec2(.5+.25*float(i),1.-.25*float(i));
  }
  // where the clarinet is in the theme
  if(b>3&&b<12)tn=N-4*BAR;
  if(b>15&&b<20)tn=N-12*BAR;
  if(b>51&&b<56)tn=N-48*BAR,cv=.36;
  if(b==2||b==3)tn=N-2*BAR,u=28800,cv=.16;          // a first call, at half speed
  if(b==13||b==14)tn=N-13*BAR,u=28800,cv=.2;        // the same, puzzled, in front of the drop
  if(b==49&&q<2||b==50)tn=nb,cv=.22;                // waking up
  if(b>19&&b<24)tn=N-16*BAR,u=28800,ct=-12.,cv=.25,o+=pz(tb,float(RT[h]))*.35; // noon: the minor bars, low and slow
  if(tn>=0){
    vec3 nt=th(tn,u);
    o+=wd(nt,ct,2.,40.)*cv*vec2(1,.8);
    // glockenspiel on top when the theme returns
    if(b>15&&cv>.25&&nt.x>1.)o+=gl(nt.y,nt.x+12.)*.1*vec2(.6,1);
  }
  // run up into the theme
  if(b==15||b==51)o+=wd(vec3(60+MX[e%7]+e/7*12,t8,.28-t8),0.,2.,60.)*.3;
  // harp: up with the wind, down with the rain
  if(b==30||b==31||b==44||b==45){
    int i=b<40?(N-30*BAR)/7200:31-(N-44*BAR)/7200;
    o+=pz(tx,float(48+MX[i%7]+i/7*12))*.3*vec2(1.-float(i)/40.,.3+float(i)/40.);
  }
  // glockenspiel: dew at dawn, stars in orbit, the first drops of rain
  for(int j=0;j<5;j++){
    int k=N/14400-j,kb=k/8;
    r=hs(k*13+5);
    if(r<(kb<4?.5:kb>31&&kb<44?.3:kb>45&&kb<49?.7:0.))
      o+=gl(float(N-k*14400)/48e3,float(77+PN[int(r*977.)%5]+int(r*61.)%2*12)+(kb>31&&kb<44?-4.:0.))*.09*vec2(fract(r*7.),1.-fract(r*7.));
  }
  // a drop: two notes when the bear finds it, one when it lands on the tun, four while it folds itself away
  if(b==12&&q>1)o+=gl(tq,q<3?93.:89.)*.25;
  if(b==48&&q>1)o+=gl(tb-1.2,96.)*.4;
  if(b>23&&b<28)o+=gl(tb,float(int[4](81,77,74,69)[b-24]))*.3;
  // heat: one high violin note (1760 Hz fits the bar exactly)
  if(b>19&&b<28)o+=.02*sin(11058.4*tb)*sat(bf-20.)*sat(27.5-bf)*(.6+.4*sin(tb*40.));
  // wind, thunder, rain
  r=bf<32.?sat((bf-28.)/4.):bf<44.?exp((32.-bf)*5.):sat((bf-44.)*4.)*sat((47.-bf)*.3);
  o+=(vn(41)+.6*vn(13))*r*r*.35*(.7+.3*vn(19000))*vec2(.8+.2*vn(30000),1);
  if(b>45&&b<51)o+=(vn(500)+vn(1300))*exp(-(bf-46.)*1.5)*.5+(hs(N)-hs(N-1))*.02*sat(51.-bf);
  // timpani: rolls into the two big downbeats, then one stroke every other bar in orbit and on the beat in the tutti
  r=b>50?bf-51.:bf*.5-15.;
  if(b==30||b==31||b==51)o+=tm(tx,36.)*.5*r*r;
  if(b>31&&b<42&&(b&1)<1||b==56)o+=tm(tb,float(RT[h])+tr)*.6;
  if(b>51&&b<56&&(q&1)<1)o+=tm(tq,float(RT[h]))*.3;
  // cymbal on the two big downbeats
  if(b==32||b==52)o+=(hs(N)-hs(N-1))*exp(-tb*2.)*.12;
  // orbit: the theme at half speed on the horn, with violins an octave above, over a deep bass
  if(b>31&&b<44){
    vec3 nt=b<40?th(N-32*BAR,28800):vec3(int[4](81,79,76,72)[b-40],tb,2.4-tb);
    o+=wd(nt,-4.,1.,12.)*.3*vec2(.8,1)+st(nt.y,nt.x+8.)*.03*sat(nt.y*6.)*sat(nt.z*6.)*step(2.,nt.x)
      +sin(w(float(RT[h])-4.)*tb)*sat(tb*5.)*sat((2.4-tb)*5.)*.3;
  }
  // last chord
  if(b==56)for(int i=0;i<3;i++)o+=pz(tb,float(CH[7][i]))*.3+gl(tb,89.)*.05;
  O=vec4(tanh(o*.8),0,1);
}
