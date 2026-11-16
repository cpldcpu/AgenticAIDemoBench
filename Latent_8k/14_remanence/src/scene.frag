#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// REMANENCE: a pool of ferrofluid in a round room with three neon tubes. A magnet below the pool raises
// crowns of spikes; the fluid lifts off as a ball, grows spines, and falls back.
// One bar is 1.4 s (171 BPM); every envelope is written in bars.
float T,BR,WB,KK,SN,LA,SPK,BA,RB,G,RIP,SAT,MO;
float sat(float x){return clamp(x,0.,1.);}
float S(float a,float b){return smoothstep(a,b,BR);}
vec3 C,L,D,M[3];
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float sm(float a,float b,float k){float h=sat(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1.-h);}
// a lamp that is on from bar a to bar b and flickers when it starts
float lt(float a,float b){return step(a,BR)*step(BR,b)*(1.-step(BR,a+.4)*step(.5,fract(BR*13.)));}
float map(vec3 p){
  float d=D.y<0.?(3.7-p.y)/D.y:99.,f=0.,i=0.,r,e;
  // the pool: a hexagonal lattice of spikes, as high as the field below it is strong
  if(p.y<3.8){
    for(;i<3.;i++){
      r=length(p.xz-M[int(i)].xy);
      f+=M[int(i)].z*exp(-r*r*.9);
    }
    vec2 s=vec2(1,1.732),q=p.xz*(2.2-G),a=mod(q,s)-s*.5,b=mod(q+s*.5,s)-s*.5;
    r=max(1.-2.*sqrt(min(dot(a,a),dot(b,b))),0.);
    f=min(f,1.);
    i=length(p.xz);
    e=min(f+G*exp(-i*i*.012),1.2)*SPK*(1.-.5*f*G);
    d=(p.y-f*(.35+3.9*G*f*f)-e*r*r*(2.-r)*(.85+.15*sin(i*5.-T*7.))
       -RIP*.07*sin(i*5.-(BR-77.3)*14.)*exp(-i*.2))/(1.+e*6.5+6.*G*f);
  }
  // the ball, with spines in staggered rings around its own tumbling axis
  vec3 v=p-C;
  v.xy*=rot(T*.31);
  v.yz*=rot(T*.23);
  r=length(v);
  // ... which for a while is a ring
  e=mix(r-RB,length(vec2(length(v.xz)-RB*1.5,v.y))-RB*.3,MO);
  if(e<BA+.2){
    vec3 n=v/r;
    float th=acos(n.y)*3.82,w=floor(th)+.5,c=sin(w/3.82),k=max(1.,floor(c*24.+.5));
    vec2 u=vec2((fract(atan(n.z,n.x)/6.2832*k+w*.5+T*.05*(mod(w,2.)-.5))-.5)*c*24./k,fract(th)-.5);
    f=max(1.-2.*length(u),0.);
    e=(e-BA*(1.-.5*MO)*f*f*(2.-f)*(.75+.25*sin(w*2.-T*9.)))/(1.+BA*6.);
  }
  // three satellites that leave the ball and return to it
  for(i=0.;i<3.;i++){
    r=i*2.1+T*1.6;
    e=sm(e,length(v-SAT*vec3(cos(r),.4*sin(r*.7),sin(r)))-.16,.12);
  }
  return sm(d,e,.35);
}
// the room is a black drum, 14 across the radius. three neon tubes stand along its wall, one of
// them lime, and travel around; a strip of light runs along the foot of the wall; a soft white
// disc hangs from the ceiling
vec3 env(vec3 p,vec3 d){
  float b=dot(p.xz,d.xz),k=dot(d.xz,d.xz);
  vec3 w=p+d*(sqrt(b*b+k*(196.-dot(p.xz,p.xz)))-b)/k,c=vec3(0);
  b=atan(w.z,w.x)/2.0944+LA;
  if(w.y>0.)
    c=(mod(b,3.)<1.?vec3(.7,1,.05)*L.y:vec3(.8,.9,1)*L.z)*(9.*smoothstep(.012,.005,abs(fract(b)-.5))*smoothstep(5.,4.,w.y)+.6*smoothstep(.3,.1,w.y)+.5*pow(abs(sin(3.1416*b)),8.)*exp(-w.y*.35))+.04*exp(-w.y*.35),
    b=length((p+d*(6.-p.y)/d.y).xz),
    c+=vec3(.9,.95,1)*3.5*L.x*smoothstep(2.5,1.5,b);
  return c;
}
void main(){
  T=R.z;BR=T/1.4;
  float bb=fract(BR),st=bb*16.,t,d,dep,thr,h,a,
        dr=step(16.,BR)*step(BR,32.)+step(44.,BR)*step(BR,76.);
  WB=.5-.5*cos(6.2832*fract(bb*float[8](4.,4.,8.,4.,4.,6.,8.,16.)[int(BR)%8]));
  KK=dr>0.?exp(-(st<10.?st:st-10.)*.5):exp(-fract(BR*4.)*4.)*(S(8.,15.)-S(31.,32.)+S(40.,43.)-S(75.,76.));
  SN=dr*exp(-fract(BR*2.+.5)*7.);
  LA=BR*(.05+.3*dr);
  L=vec3(lt(1.,83.),lt(5.,81.)*mix(.7,.3+SN,dr),lt(3.,82.));
  // the ball rises out of the pool in the breakdown, sways through the second drop, and falls at the end
  h=S(76.6,77.8);
  C=vec3(0,-1.6+4.2*S(32.5,37.)-4.8*h*h+1.9*S(68.,70.)+.1*sin(T*1.1),0);
  C.xz=.9*vec2(sin(T*.7),cos(T*.9))*(S(48.,50.)-S(75.,76.));
  MO=S(60.,62.)-S(66.,68.);
  RB=.85+.3*S(68.,70.)+.4*MO+.05*KK*dr;
  BA=(S(43.8,44.2)-S(76.,76.6))*(.2+.25*WB)+.05*S(40.,44.)*(1.-S(43.8,44.2));
  SAT=1.3*(S(52.,54.)-S(59.,60.));
  // magnets under the pool: one in the middle that goes wandering, two that orbit it
  h=S(24.,25.5)-S(31.,32.5);
  M[0]=vec3(1.7*vec2(sin(T*.9),sin(T*1.3))*h+C.xz,(S(8.,13.)-.7*S(32.,36.)+.5*S(43.5,44.5))*(1.-S(76.,77.)));
  M[1]=vec3(3.2*vec2(cos(T*.5),sin(T*.5)),h);
  M[2]=vec3(-M[1].xy,h);
  SPK=mix(.4+.6*KK,.55+.45*WB+.2*KK,dr)*(S(8.5,10.5)-S(32.,33.)+S(43.5,44.5));
  G=S(68.,70.)-S(76.,76.8);
  RIP=S(77.3,77.6)*(1.-S(79.,83.));
  // camera: a new position every four bars
  vec2 uv;
  int s=int(BR/4.);
  a=float(s)*2.1+T*.07;
  d=float[21](7.,6.,3.,4.,2.8,3.,6.,5.,5.,3.5,4.5,3.5,6.,3.5,3.2,7.,6.,5.,7.,6.,7.)[s];
  vec3 ca=vec3(sin(a)*d,float[21](1.,3.,.5,1.5,.7,3.,2.5,.6,1.2,2.,.8,3.2,1.,4.5,2.6,.5,2.4,1.6,3.,2.,1.)[s],cos(a)*d),
       ta=mix(vec3(M[0].x*.3,.6,M[0].y*.3),C,S(33.,37.)-.4*S(68.,69.)+.4*S(76.,77.)),
       fw=normalize(ta-ca),ri=normalize(cross(fw,vec3(0,1,0))),ro,p,n,c=vec3(0);
  // four samples per pixel; each is a primary ray and two reflections: the fluid is a black mirror
  for(int k=0;k<4;k++){
    ro=ca;
    uv=(gl_FragCoord.xy*2.+vec2(k&1,k/2)-.5-R.xy)/R.y+vec2(.3*fract(float(s)*.61)-.15,0);
    D=normalize(fw*(1.2+fract(float(s)*.37)*1.2)+ri*uv.x+cross(ri,fw)*uv.y);
    thr=1.;
    for(int b=0;b<3;b++){
      t=0.;
      for(int i=0;i<(R.x>1500.?300:200);i++){
        d=map(ro+D*t);
        if(d<.00015*t||t>30.)break;
        t+=d;
      }
      if(b+k<1)dep=t;
      // rays that graze a spike and run out of steps count as misses
      if(t>30.||d>.01)break;
      p=ro+D*t;
      n=vec3(0);
      for(int i=0;i<4;i++){
        vec3 e=.577*(2.*vec3((i+3>>1)&1,i>>1&1,i&1)-1.);
        n+=e*map(p+.003*e);
      }
      n=normalize(n);
      thr*=(.08+.92*pow(1.-sat(dot(n,-D)),5.))*smoothstep(30.,12.,t);
      D=reflect(D,n);
      ro=p+n*.02;
    }
    // lamps seen directly are dimmed: the fluid is the subject
    c+=min(thr*env(ro,D)*(thr<1.?1.:.25),4.)/4.;
  }
  // alpha: the radius of the blur in pixels, for the depth of field in the post shader
  O=vec4(c,min(abs(1.-length(ta-ca)/dep)*15./length(ta-ca),6.));
}
