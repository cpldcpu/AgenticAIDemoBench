#version 300 es
precision highp float;
out vec4 O;
// SNOW GLOBE - the soundtrack: an original music-box waltz in D major. 96 BPM, 3/4, 72 bars = 135 s.
// One pixel = one stereo sample at 48 kHz: xy is the dry mix, zw the send to the echo and hall in main.js.
// A sixteenth = 7500 samples, a bar = 90000. Melody on a grid of 6 eighths per bar: value = scale step + 5
// (step 7 = D5), 0 = rest. Chord roots are scale steps relative to D4, +10 to keep the array positive.
const int SC[7]=int[7](0,2,4,5,7,9,11);
const int ML[432]=int[432](
  9,0,12,0,13,0, 12,0,11,0,9,0, 10,0,9,0,7,0, 8,0,0,0,0,0, 9,0,12,0,13,0, 14,0,13,0,12,0, 11,0,9,0,7,0, 5,0,0,0,0,0, 9,0,12,0,13,0, 14,0,13,0,12,0, 13,0,12,0,11,0, 12,0,0,0,0,0,
  10,0,9,0,7,0, 8,0,9,0,7,0, 6,0,7,0,5,0, 7,0,6,0,5,0, 9,0,12,0,13,0, 12,0,11,0,9,0, 10,0,9,0,7,0, 8,0,0,0,0,0, 9,0,12,0,13,0, 14,0,13,0,12,0, 11,0,9,0,7,0, 5,0,0,0,0,0,
  9,0,12,0,13,0, 14,0,13,0,12,0, 13,0,12,0,11,0, 12,0,0,0,0,0, 10,0,9,0,7,0, 8,0,9,0,7,0, 6,0,7,0,5,0, 8,0,7,0,5,0, 12,13,14,0,13,12, 11,0,9,0,7,0, 10,11,12,0,11,10, 9,0,0,0,0,0,
  13,14,15,14,13,12, 13,0,11,0,9,0, 10,11,12,13,12,11, 12,0,0,0,0,0, 14,15,16,0,15,14, 13,0,12,0,11,0, 12,13,14,15,14,13, 12,0,0,0,0,0, 11,12,13,0,12,11, 10,0,9,0,7,0, 9,0,8,0,7,0, 5,0,0,0,0,0,
  9,0,12,0,13,0, 12,0,11,0,9,0, 10,0,9,0,7,0, 8,0,0,0,0,0, 9,0,12,0,13,0, 14,0,13,0,12,0, 11,0,9,0,7,0, 5,0,0,0,0,0, 9,0,12,0,13,0, 14,0,13,0,12,0, 13,0,12,0,11,0, 12,0,0,0,0,0,
  10,0,9,0,7,0, 8,0,9,0,7,0, 10,0,9,0,7,0, 5,0,0,0,0,0, 9,0,12,0,0,0, 13,0,12,0,11,0, 10,0,9,0,7,0, 8,0,0,0,0,0, 7,0,6,0,5,0, 3,0,5,0,0,0, 5,0,0,0,0,0, 0,0,0,0,0,0);
// I vi IV V waltz: D D Bm Bm G G A A ...
const int CH[72]=int[72](
  10,10,8,8,6,6,7,7, 10,10,8,8,6,7,10,10,
  10,10,8,8,6,6,7,7, 10,8,6,7,10,6,7,10,
  8,6,10,7, 8,6,4,7, 8,6,6,10, 7,6,10,10,
  10,10,8,8,6,6,7,7, 10,10,8,8,6,7,10,10,
  10,6,7,10, 6,7,10,10);
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float fq(int s){s+=28;return 18.354*exp2(float(SC[s%7]+12*(s/7))/12.);}
float sat(float x){return clamp(x,0.,1.);}
// one struck music-box tine: sine fundamental plus inharmonic partials that die away faster, two detuned ears
vec2 mb(float f,float a,float v){
  float e=exp(-a*6.)*sat(a*4000.);
  float s=sin(6.2832*f*a)+.5*sin(6.2832*f*2.*a)*exp(-a*15.)+.3*sin(6.2832*f*3.03*a)*exp(-a*26.)+.22*sin(6.2832*f*4.24*a)*exp(-a*42.);
  float r=sin(6.2832*f*1.0021*a)+.5*sin(6.2832*f*2.004*a)*exp(-a*15.)+.3*sin(6.2832*f*3.01*a)*exp(-a*26.);
  return vec2(s,r*.85)*e*v;
}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);
  N=c.x+c.y*4096;
  int i=N/7500,b=i/12,k=i%12,e8=b*6+k/2;
  float t=float(N)/48e3,x=float(N-i*7500)/48e3,y=float(N-b*90000)/48e3;
  int root=CH[b]-10;
  float nz=hs(N)*2.-1.,hp=nz-hs(N-1)*2.+1.,lp=hs(N/9)*2.-1.;
  vec4 o=vec4(0);
  // the melody
  int mv=ML[e8];
  float vol=b<8?.5:b<16?.8:b<32?.8:b<48?1.:b<64?1.15:.7;
  if(mv>0){
    float a=float(N-e8*15000)/48e3;
    o+=mb(fq(mv+2),a,vol*.21).xyxy*vec4(1,1,.45,.45)+nz*exp(-a*400.)*vol*.06*vec4(1,1,.5,.5);
  }
  // bass on beat 1, chord on beats 2 and 3
  if(b>=8&&b<71){
    if(k==0)o+=(sin(6.2832*fq(root-7)*y)+.4*sin(6.2832*fq(root-7)*2.*y)*exp(-y*6.))*exp(-y*1.6)*sat(y*80.)*.2*vec4(1,1,.7,.7);
    if(k==4||k==8){
      float a=y-float(k)*.15625;
      for(int j=0;j<3;j++)o+=mb(fq(root+2*j),a,.065*exp(-a*2.5)).xyxy*vec4(1,1,.5,.5);
    }
  }
  // a small bell every four bars from bar 16
  if(b>=16&&b<71&&b%4<1&&k==0)o+=sin(6.2832*fq(root+19)*y)*exp(-y*1.1)*.06*vec4(1,1,.5,.5);
  // winding the key: ratchet clicks in the first bar
  if(b<1&&k%2==0)o+=nz*exp(-x*600.)*.12*vec4(1,1,.5,.5);
  // the shaker: noise while the globe is shaken, same bar windows as SW in scene.frag
  float g=(b>=8&&b<16?.5*exp(-fract(y/.625)*3.):b>=40&&b<56?.38*(.55+.45*sin(float(b)*6.283)):0.);
  o+=(lp*g*.4+hp*g*.25)*vec4(.5,.5,.6,.6);
  O=o;
}
