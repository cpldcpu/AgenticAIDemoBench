#version 300 es
precision highp float;
// GATHER. 150 BPM, one bar = 76800 samples. A night shift: hum and breath
// through the quiet shots, a kick and a tick through the working shots,
// bells over the showroom. The drops sit on the same bars as the cuts.
uniform vec4 R;
out vec4 O;
float h1(float p){return fract(sin(p*127.1)*43758.5);}
void main(){
  float i=gl_FragCoord.x+gl_FragCoord.y*4096.,sr=48000.,BAR=76800.,br=i/BAR;
  // working shots: bars 14-42 and 56-70
  float work=step(14.,br)*step(br,42.)+step(56.,br)*step(br,70.);
  float quiet=1.-work;
  // furnace hum, always, louder in the hall
  float hum=sin(i*6.2832*52./sr)*.14*(.5+.5*step(br,14.));
  hum+=sin(i*6.2832*104./sr)*.03;
  // breath, the blower, only while glass is being worked
  float breath=h1(floor(i*.35))*smoothstep(0.,.4,fract(br*.5))*smoothstep(1.,.55,fract(br*.5));
  breath*=.09*work;
  // kick on the beat, a pitch drop
  float ke=exp(-fract(br)*9.);
  float kick=sin(i*6.2832*(60.+140.*exp(-fract(br)*20.))/sr)*ke*work*.42;
  // a wooden tick on the 8ths
  float tk=exp(-fract(br*2.)*18.)*work*.16;
  // bells: a figure of five, over the showroom and the yard (bars 56-84)
  float show=step(56.,br)*step(br,84.);
  float ni=mod(floor(br*2.),6.);
  float freq=float[6](330.,392.,440.,494.,440.,349.)[int(ni)];
  float env=exp(-fract(br*2.)*2.2);
  float bell=sin(i*6.2832*freq/sr)*env*show*.2;
  bell+=sin(i*6.2832*freq*2.5/sr)*exp(-fract(br*2.)*4.)*show*.05;
  // a snare on 2 and 4 in the working shots
  float sn=exp(-fract(br*2.+.5)*6.)*h1(floor(i*.7))*step(.5,fract(br*2.))*0.;
  float snare=h1(floor(i*1.7))*exp(-fract(br+.5)*5.)*work*.28*step(.45,fract(br))*step(fract(br),.55);
  float o=tanh((hum+breath+kick+tk+bell+snare)*1.3);
  O=vec4(o,o*.88+h1(i)*.008,0,1);
}
