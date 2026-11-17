#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
float h1(float p){return fract(sin(p*127.1)*43758.5);}
void main(){
  float i=gl_FragCoord.x+gl_FragCoord.y*4096.,sr=48000.,BAR=76800.,br=i/BAR;
  float rg=smoothstep(26.,38.,br),coll=step(41.,br)*step(br,46.5),boom=step(47.,br)*step(br,53.),after=step(53.,br),af=smoothstep(58.,63.,br);
  // cold drone, warms with the star
  float drone=sin(i*6.2832*36./sr)+.6*sin(i*6.2832*43./sr)+.4*sin(i*6.2832*52./sr)+.3*sin(i*6.2832*58./sr);
  float o=drone*(.15+.08*rg)*(1.-.7*af);
  o+=(h1(floor(i*.3))-.5)*.03*(1.-.9*af);
  // main-sequence warm pad
  float pad=sin(i*6.2832*110./sr)*.3+sin(i*6.2832*164.8/sr)*.2+sin(i*6.2832*220./sr)*.15;
  o+=pad*(.13+.12*rg)*step(10.,br)*step(br,41.);
  // heartbeat kick, accelerating into the collapse
  float bph=br*4.*(1.+9.*coll);
  float bt=fract(bph),ke=exp(-bt*9.),kf=55.+120.*exp(-bt*18.);
  float kick=sin(i*6.2832*kf/sr)*ke;
  o+=kick*.16*step(10.,br)*step(br,46.5)*(1.+1.5*coll);
  // rising sweep into the drop
  o+=sin(i*6.2832*(60.+br*9.)/sr)*.08*coll;
  // supernova slam
  float slam=exp(-max(0.,br-47.)*1.4)*boom;
  float chord=sin(i*6.2832*110./sr)+sin(i*6.2832*164.8/sr)+sin(i*6.2832*220./sr)+sin(i*6.2832*330./sr);
  o+=chord*.13*slam+sin(i*6.2832*39./sr)*.45*exp(-max(0.,br-47.)*1.1)*boom+(h1(floor(i*.5))-.5)*.6*exp(-max(0.,br-47.)*1.1)*boom;
  // afterglow: pulsar ping + ethereal pad fading out
  float pbt=fract(br*4.);
  float ping=sin(i*6.2832*880./sr)*exp(-pbt*10.);
  o+=ping*.15*after;
  float apad=sin(i*6.2832*220./sr)+.5*sin(i*6.2832*277./sr)+.3*sin(i*6.2832*329.6/sr);
  o+=apad*.1*exp(-max(0.,br-53.)*.12)*after;
  o*=1.-.85*smoothstep(70.,74.,br);
  o=tanh(o*1.0);
  O=vec4(o,o*.9+(h1(i)*.01-.005),0.,1.);
}
