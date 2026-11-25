#version 300 es
precision highp float;
out vec4 O;
// A waltz in D minor for a music box, 96 BPM in 3/4: one bar is 1.875 s, one eighth .3125 s.
// The 16-bar theme is played four times: alone, with harp and strings, shaken (drums and
// sleigh bells), and alone again. A D major chord closes it.
const float E=.3125,P=6.2831853;
const int M[96]=int[96](
  69,0,74,0,77,76, 74,0,0,0,70,74, 79,0,77,0,74,77, 76,0,0,0,73,76,
  81,0,77,0,74,77, 79,0,77,76,77,79, 82,0,79,0,74,76, 74,0,0,0,0,69,
  74,77,82,0,81,79, 77,0,72,0,77,81, 79,76,72,0,76,79, 77,0,0,0,72,77,
  82,0,79,0,74,79, 81,0,77,0,74,77, 76,0,79,0,73,76, 74,0,0,0,0,0);
const int RT[16]=int[16](50,46,43,45,50,41,43,50,46,41,48,41,43,50,45,50);
float hz(float n){return 440.*exp2((n-69.)/12.);}
float ns(float x){uint u=uint(x);u=(u^(u>>15u))*2246822519u;u=(u^(u>>13u))*3266489917u;return float(u^(u>>16u))/2147483648.-1.;}
// the climax (bars 48-55) is a whole tone up, in E minor
int kt(int b){return b>47&&b<56?2:0;}
int tn(int b,int i){int r=RT[b%16];return r+kt(b)+(i==1?(r==50||r==43?3:4):i==2?7:i==3?12:0);}
// A steel tine: fundamental plus the comb's inharmonic modes, which die fast.
float tine(float t,float n){
  float a=P*hz(n)*t;
  return t<0.?0.:(sin(a)+.18*sin(2.*a)*exp(-4.*t)+.45*sin(6.27*a)*exp(-9.*t)+.1*sin(17.5*a)*exp(-30.*t))*exp(-2.4*t)*(1.-exp(-900.*t));
}
float bell(float t,float n){
  float a=P*hz(n)*t;
  return t<0.?0.:sin(a+.8*exp(-5.*t)*sin(3.5*a))*exp(-3.*t)*(1.-exp(-300.*t));
}
float mel(float s,float tr){
  float e=s/E,o=0.;
  int i=int(e);
  for(int j=0;j<7;j++){
    int k=i-j;
    if(k<0)break;
    if(k<384&&M[k%96]>0)o+=tine((e-float(k))*E,float(M[k%96]+kt(k/6))+tr);
  }
  return o;
}
float arp(float s){
  float e=s/E,o=0.;
  int i=int(e),pt[6]=int[6](0,2,1,3,2,1);
  for(int j=0;j<4;j++){
    int k=i-j;
    if(k<0)break;
    o+=bell((e-float(k))*E,float(tn(k/6,pt[k%6]))+24.);
  }
  return o;
}
vec2 pad(float s,float br){
  vec2 o=vec2(0);
  int b=int(s/1.875);
  for(int j=0;j<2;j++){
    int k=b-j;
    if(k<0)break;
    float tb=s-float(k)*1.875,env=smoothstep(0.,.7,tb)*exp(-max(tb-1.85,0.)*4.);
    for(int v=1;v<4;v++){
      float f=hz(float(tn(k,v))+12.);
      for(int h=1;h<8;h++){
        float w=env*smoothstep(br+1.,br,float(h))/float(h);
        o+=w*vec2(sin(P*f*float(h)*s*1.0025+float(v)),sin(P*f*float(h)*s*.9975));
      }
    }
  }
  return o;
}
// a cello under the waltz: chord third, then fifth, a half bar each (a hemiola against the 3/4)
float vc(float s){
  float tb=mod(s,1.875),u=mod(tb,.9375),a=P*hz(float(tn(int(s/1.875),tb<.9375?1:2)))*(u+.002*sin(P*5.5*u)),o=0.;
  for(int h=1;h<7;h++)o+=sin(float(h)*a)/float(h);
  return o*smoothstep(0.,.15,u)*exp(-.9*u);
}
vec2 song(float s,float si){
  float B=s/1.875,tb=mod(s,1.875),te=mod(s,E),bt=mod(s,.625),
    nz=ns(si)-ns(si-1.),dr=step(32.,B)*(1.-smoothstep(55.,56.,B)),
    pl=smoothstep(7.5,8.5,B)*(1.-smoothstep(55.,63.,B)*.7),ar=smoothstep(15.5,16.5,B)*(1.-smoothstep(55.,57.,B));
  int b=int(B);
  // the music box and its echo off the glass
  vec2 o=vec2(.22*mel(s,0.)+.06*mel(s-.47,0.),.22*mel(s,0.)+.1*mel(s-.94,0.));
  o+=step(32.,B)*(1.-step(56.,B))*.1*vec2(mel(s,12.),mel(s-.47,12.));
  // harp arpeggio, strings, waltz bass
  float a=arp(s)*.07*ar;
  o+=vec2(a*.6,a);
  o+=pad(s,2.+4.*smoothstep(40.,48.,B)*(1.-smoothstep(54.,58.,B)))*.06*pl*(1.+.5*dr);
  float ba=P*hz(float(RT[b%16]-(RT[b%16]>47?12:0)+kt(b)))*tb;
  o+=.2*pl*(sin(ba)+.3*sin(2.*ba)*exp(-3.*tb))*exp(-1.2*tb)*(1.-exp(-200.*tb))*(B<64.?1.:0.);
  o+=vec2(.8,1)*vc(s)*.09*smoothstep(15.5,16.5,B)*(1.-smoothstep(55.,57.,B))*(1.+.5*smoothstep(47.,48.,B));
  // the mechanism ticks every eighth
  o+=.05*nz*exp(-te*700.)*(1.-.6*dr)*(B<64.?1.:0.);
  // shaken: kick on one, brush and sleigh bells on two and three
  float k=sin(P*(46.*tb+6.*(1.-exp(-25.*tb))))*exp(-6.*tb),
    jb=bt-(bt>.3125?.3125:0.),
    jn=(sin(P*5310.*s)+sin(P*6820.*s)+sin(P*8130.*s)+sin(P*9470.*s))*ns(si*.37)*exp(-jb*18.)*(bt>.3125?.5:1.);
  o+=dr*(.34*k+vec2(.05,.035)*nz*exp(-bt*20.)*step(.6,tb)+vec2(.05,.07)*jn*step(.6,tb));
  // the shake itself: a rising wash, then a low blow and a crash of glass
  float x=max(s-60.,0.);
  o+=.06*nz*smoothstep(30.,32.,B)*step(B,32.)+step(32.,B)*(.4*sin(P*(38.*x+4.*(1.-exp(-8.*x))))*exp(-2.*x)+.08*vec2(nz,ns(si+9.))*exp(-1.5*x));
  // the second build: a swell into bar 48 and a crash on it
  x=max(s-90.,0.);
  o+=.07*vec2(nz,ns(si+5.))*(smoothstep(46.,48.,B)*step(B,48.)+step(48.,B)*exp(-1.2*x));
  // a D major chord to close
  x=s-120.;
  if(x>0.)for(int i=0;i<4;i++)o+=.16*tine(x-float(i)*.16,float(i==0?62:i==1?66:i==2?69:74))+.05*bell(x-.64,86.);
  return o;
}
void main(){
  float si=floor(gl_FragCoord.x)+4096.*floor(gl_FragCoord.y),s=si/48e3;
  O=vec4(.9*tanh(1.3*song(s,si))*smoothstep(0.,.01,s),0,1);
}
