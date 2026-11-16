#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. Drum and bass in F minor, 171 BPM, 84 bars.
// A 16th is 4200 samples, a beat 16800, a bar 67200 (1.4 s).
const int BAR=67200;
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
float w(float m){return 2764.6*exp2((m-69.)/12.);}
// a struck metal bar
float bl(float t,float m){float p=w(m)*t;return sin(p+2.5*exp(-t*9.)*sin(3.5*p))*exp(-t*5.)*sat(t*800.);}
void main(){
  N=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096;
  int b=N/BAR,nb=N-b*BAR,st=nb/4200,e=st/3,tr=int[4](0,0,-4,-2)[b/2%4];
  float tb=float(nb)/48e3,ts=float(nb-st*4200)/48e3,bf=float(b)+tb/1.4,t2=tb+float(b&1)*1.4,
        z=hs(N)-.5,hz=hs(N)-hs(N-1),s=0.,v=0.,p,kk=0.,tk=-1.,tn=-1.,g=.5,
        // the wobble of the bass; the spikes in the picture follow the same curve
        wb=.5-.5*cos(6.2832*fract(tb/1.4*float[8](4.,4.,8.,4.,4.,6.,8.,16.)[b%8]));
  bool dr=b>15&&b<32||b>43&&b<76,bu=b>7&&b<16||b>39&&b<44;
  vec2 o=vec2(0);
  // mains hum of the coil: under the intro, the breakdown and the ending
  p=w(29.)*float(N)/48e3;
  o+=(sat(bf/2.)*sat(2.-bf/8.)+sat(bf-32.)*sat(44.-bf)*.6+sat(bf-76.)*sat((84.-bf)/3.))
     *.13*(sin(p)+.5*sin(2.*p+sin(tb*4.5))+.25*sin(3.*p)*sin(tb*2.24));
  // the lamps: a relay clunk when each ring switches on or off
  if(b<6&&(b&1)>0||b>80&&b<84)s+=(z*exp(-tb*40.)+sin(400.*tb)*exp(-tb*14.))*.5;
  // drums. the drops: kick on 1 and the "and" of 3, snare on 2 and 4
  if(dr){
    tk=st<10?tb:tb-.875;
    if(b%4==3&&st>5&&st<10)tk=tb-.525;
    tn=st<4?-1.:st<12?tb-.35:tb-1.05;
    v=.9;
  }
  // the builds: four on the floor, getting louder, and a snare roll in the last bar
  if(bu){
    tk=mod(tb,.35);
    v=.25+.5*fract(bf/8.);
    if(b==15||b==43)tn=mod(tb,st<8?.175:.0875),g=.15+.3*tb;
  }
  if(tk>=0.)kk=exp(-tk*8.),s+=sin(290.*tk-40.*exp(-28.*tk))*exp(-tk*7.)*v;
  if(tn>=0.)s+=(z*exp(-tn*16.)*1.3+sin(1200.*tn+3.*exp(-tn*40.))*exp(-tn*28.))*g;
  // hats on every 16th, one left open; ghost notes on the snare
  if(dr||b>35&&b<44)s+=hz*exp(-ts*(st==14?25.:110.))*((st&1)>0?.09:.18);
  if(dr&&(st==7||st==9||st==15&&(b&1)>0))s+=z*exp(-ts*45.)*.2;
  // a second, faster hat in the last part
  if(b>59&&b<76)s+=hz*exp(-fract(tb/.175)*9.)*.07;
  // noise risers before the drops, cymbals on them
  if(b>13&&b<16||b>41&&b<44)v=fract(bf/2.),s+=hz*v*v*.3;   // 14..16 and 42..44
  if(b==16||b==44||b==68||b==76)s+=hz*exp(-tb*2.2)*.35+sin(300.*tb-90.*exp(-tb*3.))*exp(-tb*3.)*.5;
  // bass: a sub and a growl whose brightness wobbles; in the builds it pulses with the kick
  if(dr||bu){
    p=w(float(29+tr+(dr&&b%4==3&&st>11?12:0)))*tb;
    v=dr?wb:exp(-mod(tb,.35)*6.)*fract(bf/8.);
    o+=(sin(p)*.55+sin(2.*p+(1.+4.*v)*sin(p+.6*sin(3.*p+tb))+vec2(0,.6))*v*.3+sin(4.*p+3.*v*sin(2.*p))*v*.12*sat(bf-60.))*(1.-.6*kk);
  }
  // pad: a minor ninth chord, moved in parallel every two bars
  v=sat((bf-3.)/5.)*(dr?.3:1.)*sat((84.-bf)/4.)*sat(t2*3.)*sat((2.8-t2)*3.);
  for(int i=0;i<5;i++){
    p=w(float(int[5](53,56,60,63,67)[i]+tr))*t2;
    o+=v*.07*(sin(p+.4*sin(p*2.003)+vec2(i,-i))+.3*sin(2.*p+float(i)));
  }
  // bells in threes over the bar; sparse in the breakdown
  if(b>23&&b<76&&(dr||e%3==0)||b>75&&b<80&&e<1)
    o+=bl(tb-float(e)*.2625,float(int[6](72,79,75,82,79,77)[e]+tr+(b>67&&b<76?12:0)))*.16*vec2(.6+.4*float(e&1),1.-.4*float(e&1));
  O=vec4(tanh((o*(1.-.5*kk)+s)*.8),0,1);
}
