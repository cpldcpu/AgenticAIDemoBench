#version 300 es
precision highp float;
out vec4 O;
// KNOCK-ON - the soundtrack. One pixel = one stereo sample at 48 kHz: xy is the dry mix, zw the send to the hall in main.js.
// Every domino that is struck plays a note: a marimba tone and the click of plastic on plastic. The strike times are
// the ones the picture uses, so the score and the film cannot drift apart. 120 BPM, a sixteenth = one domino.
float T;
float hs(float n){uint x=uint(int(n))*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float fq(float m){return 440.*exp2((m-69.)/12.);}
float sn(float x){return sin(6.2832*x);}
// a twelve-note figure in D major pentatonic, as semitones above D4; one note per domino
const float PT[12]=float[12](-5.,0.,2.,7.,4.,2.,9.,7.,12.,9.,4.,2.);
// a struck bar: fundamental, the fourth partial that a marimba bar is tuned to, a short mallet knock
float mar(float t,float f,float s){
  return (sn(f*t)+.5*sn(4.*f*t)*exp(-t*9.)+.25*sn(9.9*f*t)*exp(-t*40.))*exp(-t*(1.6+f/300.)/s)*min(t*900.,1.);
}
// the click of a domino hitting the next one: a hard plastic tick, lower for a bigger domino
float clk(float t,float k,float s){
  return ((hs(T*48e3)-.5)*exp(-t*300./s)+.7*sn((1700.+2200.*hs(k))*t/s)*exp(-t*250./s))*min(t*4e3,1.);
}
// a row of dominoes struck every iv seconds from t0: strike k plays PT[k%12]
vec2 row(float t0,float iv,float k1,float o,float p){
  float n=floor((T-t0)/iv),k,t,v;
  vec2 r=vec2(0);
  for(int j=0;j<10;j++){
    k=n-float(j);
    if(k>=1.&&k<=k1){
      t=T-t0-k*iv;
      v=.75+.25*float(int(k)%4==0)+.2*hs(k+o);
      r+=vec2(mar(t,fq(62.+p+PT[int(k)%12]),1.)*v*.3,clk(t,k+o,1.)*.45);
    }
  }
  return r;
}
// chords as MIDI notes, four voices: Bm G D A, then the D pedal before the big one, then D major with the ninth
const vec4 CH[7]=vec4[7](vec4(50,57,62,69),vec4(54,59,62,66),vec4(55,59,62,66),vec4(54,57,62,69),vec4(52,57,61,64),vec4(50,57,62,64),vec4(50,57,64,66));
const float BS[4]=float[4](35.,31.,38.,33.);
float pad(vec4 c,float t){
  float s=0.,f;
  for(int i=0;i<4;i++){
    f=fq(c[i]);
    for(float h=1.;h<7.;h++)s+=(sn(f*h*T*1.003)+sn(f*h*T*.997+hs(h)))/h/h*(1.+.5*sn(T*.2+h));
  }
  return s;
}
void main(){
  T=floor(gl_FragCoord.y)*4096.+floor(gl_FragCoord.x);
  T/=48e3;
  vec2 m=vec2(0),x,y=vec2(0);
  float s=0.,b,t,k,c,e,i,h,a,w;
  // --- the strikes ---
  if(T>7.8&&T<26.){x=row(7.875,.125,129.,0.,0.);m+=x.x+x.y;}
  if(T>23.9&&T<42.){
    x=row(24.,.125,128.,0.,0.);m+=vec2(x.x*.9+x.y,x.x*.3+x.y*.5);
    x=row(24.,.1212,132.,.5,0.);m+=vec2(x.x*.3+x.y*.5,x.x*.9+x.y);
  }
  if(T>39.9&&T<58.){x=row(40.,.125,128.,0.,0.);m+=x.x+x.y;x=row(40.,.125,128.,0.,12.);m+=vec2(.4,.6)*(x.x*.5);}
  if(T>71.9&&T<90.){x=row(72.,.125,69.,0.,0.);m+=x.x+x.y;}
  // the dominoes that grow: eleven strikes, each lower and longer, then the big one lands
  if(T>56.&&T<80.){
    a=56.;h=.12;
    for(int j=0;j<12;j++){
      w=.774*sqrt(h);
      if(j>0&&T>a){t=T-a;e=float[11](86.,83.,81.,78.,74.,71.,69.,66.,62.,57.,50.)[j-1];m+=(mar(t,fq(e),sqrt(h*4.))*.35+clk(t,float(j),sqrt(h*8.))*.25)*(.6+.05*float(j));}
      a+=w;h*=1.5;
    }
    a-=w;a+=w*1.6423;
    if(T>a){
      t=T-a;
      // a sub drop, a rumble of slow noise and the click of a ten-metre domino
      b=sn(30.*t+8.*(1.-exp(-t*6.)))*exp(-t*1.2)*1.3;
      c=T*260.;
      b+=mix(hs(floor(c)),hs(floor(c)+1.),smoothstep(0.,1.,fract(c)))*exp(-t*2.5)*1.2-.6*exp(-t*2.5);
      b+=clk(t,99.,12.)*.6;
      m+=b;y+=b*.6;
    }
  }
  // the field: up to forty rows struck in the same sixteenth; grains a few milliseconds apart
  if(T>72.&&T<87.){
    k=floor((T-72.)/.125);
    for(int j=0;j<2;j++){
      c=0.;
      for(i=0.;i<20.;i++)c+=step(2.*i,k)*step(k,2.*i+69.);
      for(int g=0;g<6;g++){
        e=k*7.+float(g);
        t=T-72.-k*.125-hs(e)*.03;
        if(t>0.)m+=clk(t,e,1.)*sqrt(c)*.05*vec2(hs(e+.5),1.-hs(e+.5));
      }
      k--;
    }
  }
  // the last domino of the field falls: one chord, struck once
  if(T>85.4){t=T-85.4;for(int j=0;j<4;j++){e=float[4](50.,57.,66.,74.)[j];m+=mar(t,fq(e),3.)*.22*vec2(.6+.1*float(j),.9-.1*float(j));}}
  y+=m*.3;
  // in the spiral, a long singing line over the chords
  if(T>40.&&T<57.){
    k=floor((T-40.)/4.);t=T-40.-k*4.;
    e=fq(float[4](78.,79.,81.,76.)[int(k)%4]+(k>3.?5.:0.))*(1.+.004*sn(5.*T)*min(t,1.));
    b=(sn(e*T)+.3*sn(2.*e*T)+.1*sn(3.*e*T))*smoothstep(0.,.5,t)*smoothstep(4.,3.4,t)*.09*smoothstep(57.,56.,T);
    m+=b*vec2(.8,1);y+=b*1.5;
  }
  // --- the pulse: bass on the eighths from bar 4, kick and hats in the spiral ---
  c=floor((T-8.)/4.);
  t=mod(T,.25);
  if(T>16.&&T<56.){
    b=fq(BS[int(c)%4]);
    e=T>40.?1.-.7*exp(-mod(T,.5)*8.):1.;
    m+=(sn(b*T)+.35*sn(2.*b*T)+.12*sn(3.*b*T))*(.25+.5*exp(-t*7.))*.22*e*smoothstep(16.,18.,T);
  }
  if(T>40.&&T<56.){
    t=mod(T,.5);
    m+=sn(45.*t+18.*(1.-exp(-t*30.)))*exp(-t*7.)*.6;
    t=mod(T-.25,.5);
    m+=(hs(T*48e3)-.5)*exp(-t*70.)*.12*vec2(.7,1);
    t=mod(T-.5,1.);
    if(T>48.)m+=(hs(T*48e3+1.)-.5)*exp(-t*25.)*.3*smoothstep(48.,52.,T);
  }
  // --- the pad: a drone before the first strike, four chords, a pedal that swells into the big one, D major after it ---
  i=T<8.?0.:T<56.?1.+mod(c,4.):T<70.?5.:6.;
  e=T<8.?smoothstep(0.,6.,T):T<56.?.6+.4*smoothstep(40.,48.,T):T<70.?.5+1.3*smoothstep(56.,70.,T):smoothstep(71.,80.,T)*smoothstep(99.,90.,T);
  s=pad(CH[int(i)],T)*e*(T>8.&&T<56.?smoothstep(0.,.3,T-8.-c*4.):1.);
  if(T>8.&&T<56.)s+=pad(CH[1+int(mod(c-1.,4.))],T)*.6*smoothstep(.6,0.,T-8.-c*4.);
  m+=s*.014;
  y+=s*.03;
  // a riser while the first domino tips
  if(T>6.&&T<8.)m+=(hs(T*48e3)-.5)*pow((T-6.)/2.,3.)*.08;
  // an arc for the whole piece: the first row quiet, the spiral loudest
  e=.55+.2*smoothstep(23.,25.,T)+.25*smoothstep(39.,41.,T);
  O=vec4(m,y)*e;
}
