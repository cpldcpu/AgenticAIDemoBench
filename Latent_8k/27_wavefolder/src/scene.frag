#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// WAVEFOLDER - the picture. A neon grid whose mountains are two sine waves pushed through a wavefolder:
// the harder the music drives it, the more often the wave folds back and the more jagged the range.
float T,Z,P,D,A,K,C,Y,G,E,U,S; // seconds, bars, kick pulse, drive of the folder, mountain height, shape of the chrome thing, camera z, sun height, gates, height of the sky that folds over, towers, chord stab
vec3 H,CA,CB,CS;         // where the chrome thing flies, the two line colours, the horizon colour
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
mat2 rt(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
// the wavefolder: whatever exceeds +-1 is folded back
float fo(float s){return abs(mod(s+1.,4.)-2.)-1.;}
// height of a grid vertex; the road in the middle stays flat
float g(vec2 c){return (.5+.5*fo(D*(sin(c.x*.31+2.*sin(c.y*.13))+sin(c.y*.23+c.x*.17))))*min(max(abs(c.x)-3.,0.)*.7,5.)*A;}
// the terrain: straight edges between the vertices
float hf(vec2 p){vec2 i=floor(p),f=p-i;return mix(mix(g(i),g(i+vec2(1,0)),f.x),mix(g(i+vec2(0,1)),g(i+1.),f.x),f.y);}
// the chrome thing: a sphere, an octahedron or a wheel-shaped station
float ob(vec3 q){
  // in the chorus a whole convoy of them flies down the road
  if(G>0.)q.z=mod(q.z+8.,16.)-8.;
  q.xz*=rt(T*.7);q.xy*=rt(T*.4);
  return K<1.?length(q)-1.3:K<2.?(abs(q.x)+abs(q.y)+abs(q.z)-1.9)*.577:
    min(min(length(vec2(length(q.xy)-2.2,q.z))-.25,length(q)-.6),max(min(length(q.xz),length(q.yz))-.07,length(q.xy)-2.2));
}
// in the last chorus the world itself is folded: a second range hangs upside down above the first
vec3 fd(vec3 p){return p.y>E*.5?vec3(p.x,E-p.y,p.z+50.):p;}
// towers of light on both sides of the road, a spectrum analyser that takes a new reading on every sixteenth
float tw(vec3 p){
  float c=floor(p.z/2.);
  // the step is kept short next to a tower, as its neighbour may be taller
  return U<0.?9.:max(abs(abs(p.x)-4.)-.25,max(abs(p.z-c*2.-1.)-.5,p.y>3.?p.y-3.:min(p.y-(.3+2.2*h1(vec2(c,floor(Z*16.))))*(.6+.6*P),.4)));
}
// the glowing grid at p; w is the size of a pixel there, along x and z. On each beat a wave of light runs out from the camera
vec3 gc(vec3 p,vec2 w){
  vec2 l=.5-abs(fract(p.xz)-.5),m=smoothstep(w,vec2(0),l)*min(vec2(1),.03/w)+exp(-l*12.)*.04;
  return mix(CA,CB,sat(p.y*.3))*(m.x+m.y)*(.6+4.*P*exp(-abs(p.z-C-fract(Z*4.)*50.)*.2))+CB*.015*p.y;
}
// sky: a gradient, stars, the striped sun, and around it an oscilloscope ring that shows the folded wave
vec3 sky(vec3 d){
  vec2 q=d.xy/max(d.z,.05)-vec2(0,Y);
  float r=length(q);
  vec3 c=CS*(.008+exp(-abs(d.y)*12.))+pow(h1(floor(d.xy/(abs(d.z)+.3)*300.)),400.)*sat(d.y*5.)*step(.5,r)*step(.21,length(q+vec2(.9,-.35)));
  if(d.z>0.)c+=smoothstep(.31,.3,r)*smoothstep(0.,.05,sin(q.y*60.-T*2.)+q.y*5.+.9)*mix(vec3(1,.05,.3),vec3(1,.7,.1),q.y*1.6+.5)*1.5
    +CS*exp(-r*3.)
    +CA*exp(-abs(r-.45-.06*(.2+P)*fo(D*2.*sin(atan(q.y,q.x)*8.+T*3.)))*60.)
    // a ringed planet, high to the left
    +CB*(smoothstep(.2,.19,length(q+vec2(.9,-.35)))*sat(.5+q.x*3.+q.y*3.+1.65)+.6*exp(-abs(length((q+vec2(.9,-.35))*vec2(1,4))-.36)*40.));
  return c;
}
void main(){
  T=R.z;Z=T/2.;
  // a cut every four bars, every two in the chorus
  float s=floor(Z<40.?Z/4.:Z<64.?Z/2.-10.:Z/4.+6.),k=float(int[24](0,2,1,3, 0,3,1,5, 2,3, 0,3,1,5,2,3,0,4,1,3,5,2, 0,2)[int(min(s,23.))]),
        t=0.,d,e,h,w,i,v=0.;
  P=Z>=8.&&Z<32.||Z>=40.&&Z<68.?exp(-4.*fract(Z*4.)):0.;
  D=.3*smoothstep(0.,8.,Z)+.7*smoothstep(8.,16.,Z)-.5*smoothstep(31.,33.,Z)+smoothstep(39.,41.,Z)-1.4*smoothstep(64.,72.,Z)+.15*sin(T*.4);
  A=smoothstep(2.,12.,Z)*(1.+.15*P);
  C=T*16.;
  Y=.05+.3*smoothstep(0.,8.,Z)-.35*smoothstep(64.,72.,Z);
  K=Z<24.?0.:Z<32.?1.:Z<56.?2.:mod(s,3.);
  G=Z>=40.&&Z<64.?1.:0.;
  U=Z>=24.&&Z<32.||Z>=48.&&Z<64.?1.:-1.;
  // the chorus stabs its chords in a 3-3-2 rhythm
  S=9.;
  for(i=3.;i-->0.;)if((18761>>int(mod(Z*16.-i,16.))&1)>0)S=fract(Z*16.)+i;
  E=Z<56.||Z>64.?999.:12.+60.*smoothstep(58.,56.,Z)+60.*smoothstep(63.,64.,Z);
  H=vec3(sin(T*.5),Z<12.?-99.:3.5+sin(T*.7),C+(k<3.?10.:16.));
  int j=int(Z<32.?0.:Z<40.?1.:Z<56.?2.:Z<64.?mod(s,3.):0.)*3;
  CA=vec3[9](vec3(.02,.5,1),vec3(1,.05,.5),vec3(.45,.03,.3), vec3(.05,.15,1),vec3(.1,1,.6),vec3(.03,.1,.4), vec3(1,.08,.35),vec3(1,.5,.05),vec3(.6,.1,.05))[j];
  CB=vec3[9](vec3(.02,.5,1),vec3(1,.05,.5),vec3(.45,.03,.3), vec3(.05,.15,1),vec3(.1,1,.6),vec3(.03,.1,.4), vec3(1,.08,.35),vec3(1,.5,.05),vec3(.6,.1,.05))[j+1];
  CS=vec3[9](vec3(.02,.5,1),vec3(1,.05,.5),vec3(.45,.03,.3), vec3(.05,.15,1),vec3(.1,1,.6),vec3(.03,.1,.4), vec3(1,.08,.35),vec3(1,.5,.05),vec3(.6,.1,.05))[j+2];
  // camera: along the road, skimming it, high above it, or around the chrome thing
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  w=T*.4+s*2.;
  if(k==1.)u*=rt(.25*cos(w));
  vec3 ro=k<1.?vec3(1.5*sin(w),1.2,C):k<2.?vec3(2.5*sin(w),.45,C):k<3.?vec3(0,9,C):
          H+(k<4.?vec3(5.*sin(w),1.5,5.*cos(w)):k<5.?vec3(-1.5,-2,-6):vec3(1.5*sin(w),-2,-3)),
       fw=normalize(k<3.?vec3(k<2.?-.2*sin(w):0.,k<2.?.14:-.35,1):H-ro),
       cx=normalize(cross(vec3(0,1,0),fw)),
       rd=normalize(fw*1.4+cx*u.x+cross(fw,cx)*u.y),p,n,r=rd,col=vec3(0);
  for(i=0.;i<160.;i++){
    vec3 m=fd(ro+rd*t);
    h=(m.y-hf(m.xz))*.3;
    e=ob(ro+rd*t-H);
    v=tw(m);
    d=min(min(h,e),v);
    if(d<.001*t||t>150.)break;
    t+=max(d,t*.005);
  }
  p=ro+rd*t;
  w=1.;
  if(t<150.){
    if(v<min(h,e)){
      // a tower: segments of light
      p=fd(p);
      w=0.;
      col=mix(CA,CB,p.y*.4)*(.1+step(.3,fract(p.y*4.))*1.5);
    }else if(e<h){
      // chrome: it mirrors the sky above and the grid below
      n=vec3(0);
      for(int j=0;j<4;j++){r=.5773*(2.*vec3(((j+3)>>1)&1,(j>>1)&1,j&1)-1.);n+=r*ob(p+.002*r-H);}
      n=normalize(n);
      r=reflect(rd,n);
      col=CB*pow(1.+dot(rd,n),4.);
      w=.9;
      if(r.y<0.)w=0.,col+=mix(gc(p-r*p.y/r.y,vec2(.05)),CS,exp(r.y*6.));
    }else{
      // the ground is glossy: sun and sky lie on the road
      vec3 q=rd;
      if(p.y>E*.5)q.y=-q.y;
      p=fd(p);
      d=hf(p.xz);
      n=normalize(vec3(d-hf(p.xz+vec2(.01,0)),.01,d-hf(p.xz+vec2(0,.01))));
      r=reflect(q,n);
      w=.3*pow(1.+dot(q,n),3.)*exp(-p.y*3.);
      d=length(p.xz-H.xz);
      col=gc(p,.012+t*.0012*vec2(1,1./(abs(q.y)+.05)))+CB*.3*exp(-d*d*.2)*step(-9.,H.y);
    }
    v=t;
  }else v=0.;
  col=mix(CS*.25,col+sky(r)*w,exp(-v*.008));
  // gates of light over the road, one for every other beat
  for(i=-2.;i<5.;i++){
    h=floor(ro.z/16.)+i;
    d=(h*16.-ro.z)/rd.z;
    if(d>0.&&d<t){
      u=abs(ro.xy+rd.xy*d-vec2(0,2))-vec2(4.5,5);
      e=abs(max(u.x,u.y));
      col+=G*(mod(h,2.)<1.?CA:CB)*(exp(-e*30.)*2.+.03/(.03+e*e))*exp(-d*.02)*(.3+2.*exp(-S*.5));
    }
  }
  // and the wave itself stands over the middle of the road, running out to the sun
  d=-ro.x/rd.x;
  p=ro+rd*d;
  e=abs(p.y-1.-.8*(.4+P)*fo(D*2.*sin((p.z-C)*.6-T*6.283)));
  if(d>0.&&d<t&&(Z>=16.&&Z<32.||Z>=48.&&Z<68.))col+=CB*(exp(-e*25.)+.003/(.01+e*e))*exp(-d*.03);
  O=vec4(min(col,9.),1);
}
