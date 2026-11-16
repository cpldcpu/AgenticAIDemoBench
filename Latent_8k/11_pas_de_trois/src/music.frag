#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. Electro swing in D minor, 128 BPM, 64 bars.
// beat = 22500 samples; swung 8ths start at 0 and 15000; a triplet tick = 7500; bar = 90000.
const int BAR=90000;
// tunes in swung 8ths (0 rest, 1 hold, else MIDI): the 8-bar theme, then the 2-bar riff of act two and its 2-bar ending
const int TH[96]=int[96](
  69,0,74,0,77,1,76,74, 69,1,1,0,0,0,72,73, 74,0,79,0,82,1,81,79, 74,1,1,0,0,0,72,74,
  77,74,69,77,74,69,77,74, 77,74,70,77,74,70,80,1, 79,1,76,73,69,1,73,76, 74,1,1,0,0,0,0,0,
  72,0,69,72,0,74,72,69, 77,0,74,0,72,1,0,0, 70,0,74,0,79,1,77,74, 73,1,1,0,76,73,69,0);
// chords as bass note*3 + kind (0 minor 6th, 1 dominant 7th, 2 major 6th):
// theme Dm Dm Gm Gm Dm Bb7 A7 Dm, act two F D7 Gm C7 F D7 Gm A7, act three D C# C B Bb7 Bb7 A7 A7
const int PR[24]=int[24](114,114,129,129,114,103,100,114,125,115,129,109,125,115,129,100,114,111,108,105,103,103,100,100);
int N;
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float sat(float x){return clamp(x,0.,1.);}
float w(float m){return 2764.6*exp2((m-69.)/12.);}
// the chord of bar b; the last eight bars of the finale are a tone higher
int ch(int b){return PR[b<4?b+4:b<20?(b-4)%8:b<28?b-12:b<40?b-16:b<44?23:b<60?(b-44)%8:0]+(b>51?6:0);}
// first sample of swung 8th e
int sw(int e){return e/2*22500+(e&1)*15000;}
// the note under sample n of a tune that starts at TH[o] and repeats after L 8ths: MIDI, seconds since it began, seconds until it ends
vec3 th(int n,int o,int L){
  int e=n/22500*2+n%22500/15000,s=e,f=e+1;
  for(int i=0;i<8;i++){if(TH[o+s%L]==1)s--;if(TH[o+f%L]==1)f++;}
  return vec3(TH[o+s%L],float(n-sw(s))/48e3,float(sw(f)-n)/48e3);
}
// trumpet: FM 1:1, brighter while the note is loud; g makes it growl
float tp(vec3 q,float g){
  float f=w(q.x),e=sat(q.y*50.)*sat(q.z*40.)*(.65+.35*exp(-q.y*5.)),
        p=f*q.y+f*3e-4*sin(q.y*34.)*sat(q.y*4.-.8);
  return sin(p+(1.5+2.*e+g*sin(q.y*150.))*e*sin(p))*e;
}
// plucked chord note
float pk(float t,float m){float p=w(m)*t,r=0.;for(float k=1.;k<5.;k++)r+=sin(p*k)/k*exp(-t*(5.+5.*k));return r*sat(t*900.);}
// upright bass
float bs(float t,float m){float p=w(m)*t;return (sin(p+1.1*sin(p)*exp(-t*8.))+.3*sin(2.*p)*exp(-t*12.))*exp(-t*3.)*sat(t*300.)*sat((.46-t)*40.);}
void main(){
  N=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096;
  int b=min(N/BAR,63),nb=N-b*BAR,q=nb/22500,x=nb/7500,c=ch(b),r=c/3,ty=c%3,tn=-1,o=0,L=64,
      e=q*2+nb%22500/15000,
      bn=b>31&&b<44?r+12*(q&1):q<1?r:q<2?r+(ty>0?4:3):q<3?r+7:ch(b+1)/3-1;
  float tb=float(nb)/48e3,tq=float(nb-q*22500)/48e3,tx=float(nb-x*7500)/48e3,bf=float(b)+tb/1.875,
        tr=b>51?2.:0.,v,kk=0.,s=0.,z=hs(N)-.5;
  vec2 o2=vec2(0);
  // walking bass: root, third, fifth, then a semitone below the next root; root and octave under the drums of act three
  if(b<60)o2+=bs(tq,float(bn))*.4;
  else if(b<62&&q<1)o2+=bs(tq,float(r))*.5;
  // in the finale a synthesizer doubles the bass an octave higher
  if(b>43&&b<60)o2+=tp(vec3(bn+12,tq,.42-tq),0.)*.13;
  // kick on every beat; everything else ducks under it
  if(b>3&&b<32||b>35&&b<60)s+=sin(283.*tq-37.7*exp(-25.*tq))*exp(-tq*7.)*(b<12?.3:.5),kk=exp(-tq*9.);
  // ride cymbal: ding, ding-a-ding
  if(b>1&&b<60&&(b<32||b>35)&&(x%3<1||x%6>4))s+=(hs(N)-hs(N-1))*exp(-tx*(x%3<1?35.:80.))*.11;
  // finger snaps in the first twelve bars, then a snare, on two and four
  if((q&1)>0){
    if(b<12)s+=z*sin(tq*8e3)*exp(-tq*60.)*.6;
    else if(b<32||b>43&&b<60)s+=(z*exp(-tq*25.)+sin(tq*1150.)*exp(-tq*35.)*.5)*.35;
  }
  // act three: two tom-toms in triplets
  if(b>31&&b<44)s+=sin((x%3<1?560.:820.)*tx+5.*exp(-tx*30.))*exp(-tx*9.)*(x%3<1?1.:x%3>1?.55:x>5?.3:0.)*.5;
  // snare fills at the end of every fourth bar, and a long roll with a noise riser before the finale
  v=b>39&&b<44?(bf-40.)/4.:b<60&&b%4==3&&x>(b%8==3?5:8)?.5+float(x)*.04:0.;
  tn=b>39&&b<42?1:0;
  s+=(z*exp(-(tn>0?tq:tx)*30.)+sin((tn>0?tq:tx)*1150.)*exp(-(tn>0?tq:tx)*40.)*.4)*v*v*.5+(b>39&&b<44?z*v*v*.12:0.);
  tn=-1;
  // crash cymbal where a section begins, and on the last chord
  if(b%8==4||b==32||b==61)s+=(hs(N)-hs(N-1))*exp(-tb*2.5)*.14;
  // chords, plucked on two and four
  if((b>3&&b<32||b>43&&b<60)&&(q&1)>0)
    for(int i=0;i<3;i++)o2+=pk(tq,float(r+24+(i<1?ty>0?4:3:i<2?7:ty==1?10:9)))*.12*vec2(.6+.2*float(i),1.-.2*float(i));
  // brass section: the Charleston rhythm (one, and the "and" of two), then the last chord, held; every stab falls off at its end
  if(b>11&&b<20||b>43&&b<62){
    v=x<5||b>60?tb:tb-.78125;
    float du=b>60?1.6:.25;
    for(int i=0;i<3;i++)o2+=tp(vec3(float(r+24+(i<1?ty>0?4:3:i<2?7:ty==1?10:9))-20.*max(v-du*.5,0.),v,du-v),0.)*.12*vec2(1.-.2*float(i),.6+.2*float(i));
  }
  // before the finale the brass climbs a semitone per bar
  if(b>39&&b<44)
    for(int i=0;i<3;i++)o2+=tp(vec3(57+4+3*i+b-40,tq,.2-tq),0.)*.1*(.4+v);
  // where the lead is in its tune
  if(b>3&&b<20)tn=N-4*BAR;
  if(b>43&&b<60)tn=N-44*BAR;
  if(b>1&&b<4)tn=N+4*BAR;                // the prologue ends the way the theme does
  if(b>19&&b<32)tn=N-(b<28?20:24)*BAR,o=tn/BAR>5?80:64,L=16;
  if(tn>=0){
    vec3 nt=th(tn,o,L);
    if(nt.x>1.){
      nt.x+=tr;
      o2+=tp(nt,0.)*.38*vec2(1,.8);
      // a vibraphone on top in the finale
      if(b>43)o2+=sin(w(nt.x+12.)*nt.y)*exp(-nt.y*5.)*sat(nt.y*500.)*.09*vec2(.5,1);
      // a second voice an octave below from bar 12 on
      nt.x-=12.;
      if(b>11)o2+=tp(nt,0.)*.12*vec2(.6,1);
    }
  }
  // act three: four long growling notes
  if(b>31&&b<40)o2+=tp(vec3(int[4](62,65,68,73)[(b-32)/2],float(N-(b&62)*BAR)/48e3,float((b|1)*BAR+BAR-N)/48e3),1.5)*.32*vec2(.8,1);
  // the ending: a run up the scale into the last chord
  if(b==60)o2+=tp(vec3(62.+tr+float(int[8](0,2,3,5,7,8,10,12)[e]),float(nb-sw(e))/48e3,float(sw(e+1)-nb)/48e3),0.)*.3;
  if(b==61)o2+=tp(vec3(81.+tr,tb,1.6-tb),1.)*.3;
  // an old record in the prologue
  s+=(step(.9992,hs(N/2))*z*.7+z*.012)*sat(4.-bf);
  O=vec4(tanh((o2*(1.-.4*kk)+s)*.8),0,1);
}
