#version 300 es
precision highp float;
// UNA CORDA - one piano note per draw call; the pixels it covers are its samples (48 kHz, stereo in r,g),
// added up by blending. R = (MIDI note, + .5 with the soft pedal; velocity; first sample; seconds until the damper falls)
uniform vec4 R;
out vec4 O;
float hs(float n){return fract(sin(n*91.3458)*47453.5453);}
void main(){
  float n=floor(gl_FragCoord.y)*4096.+floor(gl_FragCoord.x)-R.z,t=n/48e3,m=floor(R.x),u=R.x-m,v=R.y*(1.-u*.3),k=m-69.,
    // stretched octaves as a tuner sets them (Railsback curve), and the stiffness of the string
    f0=440.*exp2(k/12.+(.2*k+2e-4*k*k*k)/1200.),
    B=1e-4*exp2((m-48.)/9.5)+1.2e-4*exp2((30.-m)/10.),
    // a hard, fast hammer brings out the upper partials
    sl=(1.15-v)*.42*clamp(f0/260.,.12,1.)*(1.+u*.4),fc=1800.+9e3*v*v,
    dt=(hs(m)-.5)*1.3e-3,r=t-R.w,s=0.,f,a,e1,e2,p;
  if(n<0.)discard;
  for(float i=1.;i<72.;i++){
    f=i*f0*sqrt(1.+B*i*i);
    if(f>16e3)break;
    // struck an eighth of the way along the string: those partials are weak; the soundboard radiates little bass
    a=(.25+.75*abs(sin(i*.3927)))*exp(-(i-1.)*sl)/(1.+f*f/(fc*fc))*f/(f+140.)*inversesqrt(i);
    // two of the unison strings: in phase they give the loud prompt sound, out of phase the long aftersound
    e1=exp(-t*(.4+f0*.004+f*f*3e-7));
    e2=exp(-t*(.08+f0*.0009+f*f*8e-8))*(.25+u*.4);
    if(r>0.&&m<89.)a*=exp(-r*(5.+f*.012));
    p=6.2832*hs(i+m);
    s+=a*((e1+e2)*sin(6.2832*fract(f*t))+(e1-e2)*sin(6.2832*fract(f*(1.+dt)*t)+p*.3));
  }
  s*=1.-exp(-t*(900.+2e3*v));
  // the knock of the hammer and the key on the keybed, ringing in the case
  s+=v*v*exp(-t*35.)*(sin(565.*t)+.6*sin(1018.*t+1.)+.4*sin(1530.*t+2.))*.3*(1.-u*.6)+(hs(n*.913+m)-.5)*v*v*v*exp(-t*400.)*.15;
  // player's view: bass to the left
  O=vec4(vec2(1.-k/80.,1.+k/80.)*s*pow(v,2.2)*.1,0,0);
}
