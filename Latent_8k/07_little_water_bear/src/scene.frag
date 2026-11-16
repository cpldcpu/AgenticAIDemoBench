#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// T time, BR bars, L progress of the shot, WP walk phase, WK walk amount, DR dryness of the bear (1 = tun),
// DE dryness of the world, RN rain, WG wind, AL altitude in the cloud shots, HY head turn,
// M material of the last map() (0 ground, 1 blade, 2 water, 3 bear), HR radius of the hero drop
float T,BR,L,WP,WK,DR,DE,RN,WG,AL,HY,M,HR;
int E,S;                 // environment (0 moss, 1 clouds, 2 orbit), shot
vec3 BP,HD,SD,SC,HZ,RO,Q,LQ; // bear, hero drop, sun direction and colour, haze colour, camera, bear-local and blade-local position
const vec3 EC=vec3(0,-100,0),MC=vec3(-160,30,60); // earth and moon
// shots: first bar, camera from/to and target (relative to the bear)
const float SB[21]=float[21](0.,2.,4.,6.,8.,10.,12.,16.,20.,22.,24.,28.,30.,32.,36.,40.,44.,46.,48.,52.,99.);
const vec3 CA[20]=vec3[20](vec3(-15,1,-1.5),vec3(-9,.5,-.5),vec3(1.6,.8,-4.6),vec3(.9,.25,-2.7),vec3(3.4,.45,-1.2),vec3(-3,3,-2.2),vec3(2.8,.7,-2.4),vec3(4,1.2,-3),vec3(-3.2,.5,.3),vec3(.9,.7,-3.4),vec3(2.4,1.2,-2.4),
  vec3(-1,.8,-4.8),vec3(1.5,-2.6,-3),vec3(-.8,.5,-11),vec3(-2.2,.6,-2.8),vec3(5.6,-1.4,-1.6),vec3(1,3.2,-2.6),vec3(-.6,.6,-4.6),vec3(2.4,1.1,-2.6),vec3(-2,1.2,-4.5)),
 CB[20]=vec3[20](vec3(-13,1.1,-1.5),vec3(-9,.7,-1.2),vec3(1,.85,-4.4),vec3(1.4,.25,-2.5),vec3(2.9,.5,-.9),vec3(-2.6,3.4,-1.8),vec3(2.3,.75,-2),vec3(1.5,2,-4.6),vec3(-2.8,.45,.1),vec3(.6,.7,-3),vec3(2,1,-2),
  vec3(-.5,.8,-4.4),vec3(1.2,-1.8,-3.2),vec3(-.5,.4,-9),vec3(-1.2,.9,-3),vec3(5.4,-.6,-2.6),vec3(.8,2.6,-3),vec3(-.4,.6,-4.2),vec3(1.9,.9,-2.1),vec3(-3.5,2.4,-4.9)),
 CT[20]=vec3[20](vec3(-11.5,2,3.4),vec3(-8,2.6,3.4),vec3(.3,.75,0),vec3(.3,.45,0),vec3(.9,.7,0),vec3(.5,.5,0),vec3(-1.4,.75,.5),vec3(0,.7,0),vec3(0,.5,1.4),vec3(.2,.6,0),vec3(0,.45,0),
  vec3(.6,1.2,0),vec3(0),vec3(.6,-1.6,0),vec3(0),vec3(0),vec3(0),vec3(0,.7,0),vec3(0,.45,0),vec3(1,1.5,0));

float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float ns(vec2 p){vec2 i=floor(p),f=p-i;f*=f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
// stars
float sr(vec3 d){d=floor(d*300.);return step(.997,h1(d.xy+d.z*17.3))*2.;}
float fb(vec2 p){float a=.5,r=0.;for(int i=0;i<5;i++)r+=a*ns(p),p=p*2.03+7.,a*=.5;return r;}
float sm(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
mat2 rt(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
// the ground: soft hills with a pattern of plant cells
float gh(vec2 p){return .3*sin(p.x*.3+sin(p.y*.4))+.03*sin(p.x*9.)*sin(p.y*9.);}
// The water bear: feet at y=0, facing +x. Five segments, a pair of stubby legs under the first four, a snout.
// As it dries (DR) the legs and the snout retract and the body shortens into a barrel, the "tun".
float br(vec3 p){
  float d=length(p-vec3(0,.6,0))-2.1,s=1.-.5*DR;
  if(d>.4)return d;
  p.y-=.74-.24*DR;
  p.z+=.07*WK*sin(p.x*1.6-WP)-HY*.5*smoothstep(0.,1.6,p.x);
  Q=p;
  d=1e3;
  for(int i=0;i<5;i++){
    float f=float(i),a=WP+f*1.57+(p.z>0.?3.14:0.);
    vec3 q=p-vec3((f-2.)*.5*s,.03*WK*sin(WP*2.-f*1.3),0),
         k=vec3(q.x,q.y+.2,abs(q.z)-.3),
         t=vec3(.2*WK*sin(a)-(i<1?.2:0.),(.49*DR-.5)*(1.-.35*WK*max(cos(a),0.)),.12);
    d=sm(d,length(q)-mix(float[5](.37,.45,.47,.43,.35)[i],.5,DR),.07);
    if(i<4)f=sat(dot(k,t)/dot(t,t)),d=sm(d,length(k-t*f)-(.15-.05*f)*(1.-DR),.06);
  }
  d=sm(d,length(p-vec3(s+.3-.3*DR,-.05,0))-.14+.14*DR,.08);
  // the ripple and the bends make this field steeper than a true distance: scale it, or rays land inside the skin and the painted face is cut
  return (d-(.02+.02*DR)*cos(p.x/s*12.566))*.8;
}
float map(vec3 p){
  vec3 q=p-BP;
  M=3.;
  if(E>0||S==11){
    // the tun tumbles in the air and rocks in the wind
    float a=E>0?T*.4:.15*sin(T*9.)+max(BR-29.3,0.)*9.;
    q.y-=.5;q.xy*=rt(a);q.yz*=rt(E>0?T*.27:0.);q.y+=.5;
  }
  float d=br(q),e;
  if(E>0)return d;
  e=(p.y-gh(p.xz))*.8;if(e<d)d=e,M=0.;
  e=length(p-HD)-HR;if(e<d)d=e,M=2.;
  // one blade of moss per cell, behind the bear's path
  vec2 i=floor(p.xz/3.4+.5);
  float h=h1(i),H=2.2+2.3*h,y,l;
  q=p-vec3(i.x,0,i.y)*3.4;
  e=1.8-max(abs(q.x),abs(q.z)); // never step further than into the next cell
  if(i.y>0.){
    q.y-=gh(i*3.4);
    q.x-=h*.6-.3;
    q.xz*=rt(h*40.);
    q.x-=(.012+.008*sin(T*1.3+h*9.)+.02*WG*(.6+.4*sin(T*6.+p.x)))*q.y*q.y;
    y=sat(q.y/H);
    l=(length(vec3(q.x-.2*abs(q.z),max(abs(q.z)-1.5*sqrt(y)*(1.-y),0.),q.y-y*H))-.03)*.7;
    if(l<d)d=l,M=1.,LQ=vec3(q.z,q.y,h);
    // dew: one drop on the blade, one at its foot
    l=min(length(q-vec3(.13,H*.5,.1))-.2+.2*DE,length(q-vec3(.8,.25,0))-.5*h*(1.-DE));
    if(l<d)d=l,M=2.;
  }
  return min(d,e);
}
vec3 nm(vec3 p){
  vec3 n=vec3(0);
  for(int i=0;i<4;i++){vec3 e=.5773*(2.*vec3((i+3)>>1&1,i>>1&1,i&1)-1.);n+=e*map(p+e*.002);}
  return normalize(n);
}
// everything that is not marched: out-of-focus moss, sky and clouds, or stars, sun, moon and earth
vec3 env(vec3 d){
  float s=sat(dot(d,SD)),f;
  vec3 c;
  if(E>1){
    c=sr(d)+SC*(pow(s,3e3)*5.+pow(s,50.)*.05);
    for(int i=0;i<2;i++){
      vec3 o=(i>0?EC:MC)-RO,n;
      float r=i>0?97.:40.,b=dot(o,d),h=r*r-dot(o,o)+b*b;
      n=normalize(d*b-o);
      // the air above the limb
      if(i>0)c+=vec3(.15,.4,1)*exp(min(h,0.)*.02)*sat(dot(n,SD)+.35)*step(0.,b)*1.5;
      if(h>0.&&b>0.){
        n=normalize(d*(b-sqrt(h))-o);
        f=sat(dot(n,SD)*(i>0?4.:1.)+(i>0?.15:0.));
        c=i>0?(mix(vec3(.02,.07,.2),vec3(.1,.16,.05),smoothstep(.5,.6,fb(n.xz*14.)))+smoothstep(.4,.8,fb(n.xz*50.+T*.03)))*f
               +vec3(.15,.4,1)*pow(1.-sat(-dot(n,d)),3.)*(f+.05)*2.
             :vec3(.25+.5*fb(n.xy*6.))*f;
      }
    }
    return c;
  }
  if(E>0){
    f=fb(vec2(atan(d.x,d.z)*3.,d.y*4.+(S>13?-T:T)*5.)); // clouds sink past on the way up, rise past on the way down
    c=mix(vec3(.25,.5,.9)+.4*s,vec3(0,.01,.03),AL);
    c=mix(c,mix(vec3(1.1),vec3(.2,.23,.27),RN)*(.6+.4*d.y+.4*s),smoothstep(.4,.7,f)*(1.-AL)*(1.-AL));
    return c+sr(d)*pow(AL,6.)+SC*pow(s,40.)*.1;
  }
  c=mix(HZ*.15,HZ,sat(d.y*1.3+.5))+SC*(pow(s,10.)*.15+pow(s,200.)*1.5)*(1.-RN);
  // bokeh
  vec2 q=vec2(atan(d.x,d.z),d.y)*7.,i;
  q.x+=floor(q.y)*.37;i=floor(q);
  f=h1(i);
  return c+(HZ+.1)*SC*f*step(.45,f)*(.2+s*s)*smoothstep(1.,.9,length(q-i-.5-.25*(f-.5))/(.1+.2*f));
}
void main(){
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  T=R.z;BR=T/2.4;
  for(int i=0;i<20;i++)if(BR>=SB[i])S=i;
  L=(BR-SB[S])/(SB[S+1]-SB[S]);
  E=S==12||S==16?1:S>12&&S<16?2:0;
  // the story: beats walked so far (one step per beat), with a stop at the drop and a slow halt at noon
  float x=clamp(BR-22.,0.,2.5),wb=4.*(clamp(BR,4.,13.)+clamp(BR,15.,22.)-19.+max(BR-52.,0.)+x-x*x/5.)+step(44.,BR)*90.,t=0.,d,a=E>0?0.:.3,z;
  WP=wb*3.1416;
  WK=BR<14.?sat(BR*9.-36.)*sat(39.-BR*3.):BR<30.?sat(BR*3.-45.)*sat((24.5-BR)*.7):sat(BR*3.-156.);
  DR=BR<40.?smoothstep(24.3,27.,BR):1.-smoothstep(48.5,51.5,BR);
  DE=smoothstep(19.,24.,BR)*step(BR,40.);
  RN=step(40.,BR)*smoothstep(55.,50.,BR);
  WG=S==11?1.:0.;
  AL=S==12?L:1.-L;
  HY=smoothstep(13.1,13.6,BR)*smoothstep(15.2,14.8,BR);
  BP=vec3(wb*.44,0,0);BP.y=gh(BP.xz);
  HR=1.1*(1.-DE);
  HD=vec3(18.4,gh(vec2(18.4,1.4))+.75*HR,1.4);
  // the drop that wakes it
  if(S==18)HD=BP+vec3(0,1.3+8.*max(48.5-BR,0.),0),HR=.45*sat(243.5-BR*5.);
  vec3 b=E>0?vec3(0):S==6||S==8?vec3(18.4,gh(vec2(18.4,0)),0):BP,
       ro=mix(CA[S],CB[S],L)+b+.02*sin(T*vec3(.9,1.1,.7)),ta=CT[S]+b,f,r,p,n,c,al,am,rd;
  // lift-off and landing
  if(S==11)x=max(BR-29.3,0.),BP+=vec3(5,9,0)*x*x*2.,ta.y+=x*x*9.;
  if(S==17)x=BR-46.8,BP.y+=x<0.?x*x*60.:abs(sin(x*9.))*exp(-x*5.)*.6;
  if(E>0)BP=vec3(0);
  RO=ro;
  SD=normalize(E>1?vec3(.35,-.12,1):vec3(.4,.45+.5*DE,.8));
  SC=E>1?vec3(5):mix(mix(vec3(2.6,1.9,1),vec3(2.6,2.4,2),DE),vec3(.3,.42,.5),RN);
  HZ=mix(mix(vec3(.09,.17,.04),vec3(.4,.36,.2),DE),vec3(.07,.12,.13),RN);
  f=normalize(ta-ro);r=normalize(cross(vec3(0,1,0),f));
  rd=normalize(f*(S==13?1.5:2.2)+u.x*r+u.y*cross(f,r));
  for(int i=0;i<120&&t<50.;i++){d=map(ro+rd*t);if(d<.001+t*8e-4)break;t+=d;}
  float m=t<50.?M:-1.,sh=1.,s=.12,dl,fr,sp,ao,ss;
  vec3 q=Q,lq=LQ,ev[3];
  p=ro+rd*t;
  if(m>=0.){
    n=nm(p);
    // one loop, so that map() is inlined only once: soft shadow (it starts beyond the thickness of a blade,
    // so that blades can be lit from behind), then occlusion along the normal, then thickness towards the sun
    for(int i=0;i<26;i++){
      d=map(p+(i<24?SD*s:i<25?n*.2:SD*.3));
      if(i<24)sh=min(sh,6.*d/s),s+=clamp(d,.04,.5);
      else if(i<25)ao=d;
      else ss=d;
    }
    sh=sat(sh);
  }
  // the background, and for water also what it refracts and reflects
  // a drop is a ball lens: refract in, refract out at the far side, and the world appears upside down
  f=refract(rd,n,.75);
  for(int i=0;i<(abs(m-2.)<.5?3:1);i++)ev[i]=env(i<1?rd:i<2?refract(f,-reflect(n,f),1.33):reflect(rd,n));
  c=ev[0];
  if(m>=0.){
    dl=dot(n,SD);fr=pow(sat(1.+dot(n,rd)),4.);sp=sat(dot(reflect(rd,n),SD));
    // light from the sky, or from the earth below
    am=E>1?vec3(.04,.08,.16)*(1.2-n.y):HZ*(.6+.4*n.y)*sat(.3+3.*ao);
    if(m<.5){
      al=mix(mix(vec3(.04,.1,.02),vec3(.16,.24,.04),ns(p.xz*5.)),vec3(.25,.2,.08),DE*.7);
      c=al*(SC*sat(dl)*sh+am);
    }else if(m<1.5){
      // a blade: one cell thick, so it glows when the sun is behind it
      al=mix(vec3(.03,.13,.02),vec3(.16,.34,.04),ns(lq.xy*vec2(14,5)+lq.z*50.))*smoothstep(0.,.08,abs(lq.x)+.03);
      al=mix(al,vec3(.4,.34,.1),DE*.6);
      c=al*(SC*sh*(sat(dl)+sat(-dl)*vec3(1.6,2.6,.4))+am)+SC*sh*pow(sp,30.)*.15;
    }else if(m<2.5){
      // water: the world upside down, a highlight, and the light that the drop focuses on its far side
      c=ev[1]*1.2+ev[2]*(.05+sqrt(fr))+SC*sh*(pow(sp,400.)*6.+pow(sat(-dl),6.)*.6);
    }else{
      al=mix(vec3(.72,.7,.6),vec3(.36,.2,.07),DR);
      // eye spots and mouth
      q.z=abs(q.z);
      if(DR<.4&&(length(q-vec3(1.25,.1,.17))<.065&&fract(T*.23)>.04||q.x>1.41))al=vec3(length(q-vec3(1.27,.13,.14))<.02?9:0),ss=-1.;
      c=al*(SC*sat(dl*.7+.3)*sh+am.g)
        +(vec3(1,.5,.35)*SC*sat(.5+2.*ss)*.1+SC*sh*pow(sp,50.)*.5)*(1.-.8*DR)+am*fr*2.;
      // re-entry
      if(S==16)c+=vec3(4,1.2,.3)*AL*AL*sat(-n.y);
    }
    if(E<1)c=mix(ev[0],c,exp(-t*t*.0012));
    a=sat(abs(1.-length(ta-ro)/t)*(E>1?.2:1.3));
  }
  O=vec4(clamp(c,0.,20.),a);
}
