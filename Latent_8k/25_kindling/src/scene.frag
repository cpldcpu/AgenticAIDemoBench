#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// KINDLING - the picture. Units are metres. The fire burns at the origin of a clearing; the trunks stand on
// rings around it, so the shadow a trunk throws into the mist can be worked out without marching.
float T,Z,F,H,D,M,P,S,Q,G,K,V,W,U,Y; // seconds, bars, fire strength, flame height, dawn, material, drum pulse, spark formation and how tight, fire whirl, dancers, flame noise, the dancers' turn, age of a spark burst, moonlight
vec3 L,C,E;              // light position, flame colour, light colour
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n(vec3 x){
  vec3 i=floor(x),f=x-i;f*=f*(3.-2.*f);
  vec2 p=i.xy+i.z*vec2(37,17);
  return mix(mix(mix(h1(p),h1(p+vec2(1,0)),f.x),mix(h1(p+vec2(0,1)),h1(p+1.),f.x),f.y),
             mix(mix(h1(p+vec2(37,17)),h1(p+vec2(38,17)),f.x),mix(h1(p+vec2(37,18)),h1(p+vec2(38,18)),f.x),f.y),f.z);
}
// trunk j on ring k: centre (xy) and radius (z)
vec3 tr(float k,float j){
  float c=5.+3.*k,h=h1(vec2(k,mod(j,c))),a=(j+.3+.4*h)*6.283/c;
  return vec3(cos(a),sin(a),0)*(3.2+2.4*k+.6*fract(h*9.))+vec3(0,0,.15+.17*fract(h*5.));
}
// how much of the fire a point sees: one trunk per ring can stand in the way, and the stones shade the ground behind them
float sh(vec3 p){
  vec2 d=p.xz-L.xz;
  float l=length(d),a=atan(d.y,d.x),s=1.,t,w;
  d/=l;
  for(float k=0.;k<6.;k++){
    vec3 c=tr(k,floor(a/6.283*(5.+3.*k)));
    c.xy-=L.xz;
    t=dot(c.xy,d);
    w=.02+.03*(l-t);
    if(t<l-c.z)s*=smoothstep(-w,w,abs(c.x*d.y-c.y*d.x)-c.z);
  }
  a+=.3*sin(a*2.+1.);
  return s*(1.-smoothstep(-.3,.3,cos(a*9.))*smoothstep(.85,1.,l)*smoothstep(.1,-.1,p.y-L.y+.3*l));
}
float map(vec3 p){
  float r=length(p.xz),a=atan(p.z,p.x),k=max(floor((r-3.5)/2.4),0.),d=9.,e,s;
  vec3 c,q;
  // trunks: the two nearest rings, the two nearest trunks on each
  for(int i=0;i<4;i++){
    e=k+float(i&1);
    c=tr(e,floor(a/6.283*(5.+3.*e)-.5)+float(i/2));
    // every trunk leans a little and tapers
    d=min(d,length(p.xz-c.xy-(c.z-.23)*p.y*.4)-c.z*(1.-.05*p.y));
  }
  // root flare and furrowed bark
  d=(d-.1*exp(-p.y*3.)-.12*abs(n(p*vec3(7,1.2,7))-.5))*.6;
  M=1.;
  // the forest floor, with pebbles strewn over it
  s=p.y-.15*n(vec3(p.xz*.8,0));
  if(s<d)d=s,M=0.;
  k=h1(floor(p.xz*1.3));
  e=(length(vec3(fract(p.x*1.3)-.3-.4*k,s*2.-.02,fract(p.z*1.3)-.3-.4*fract(k*7.)))-.15*k*k*k)/1.3;
  if(e<d)d=e,M=2.;
  // the fireplace, and nothing about it is regular: stones of all sizes in a rough ring
  a+=.3*sin(a*2.+1.);
  s=round(a*1.4324);
  e=a-s/1.4324;
  k=h1(vec2(mod(s,9.),3));
  q=vec3(r*cos(e)-.7-.25*k,p.y-.04,r*sin(e));
  e=(length(q*vec3(1,1.2+k,.8))-.07-.14*fract(k*7.)-.05*n(p*7.))*.55;
  if(e<d)d=e,M=2.;
  // and five logs of different lengths thrown together, one of them fallen
  s=round(a/1.2566);
  e=a-s*1.2566;
  k=h1(vec2(mod(s,5.),5));
  q=vec3(r*cos(e)-.35-.2*k,p.y-.03,r*sin(e)-.05);
  c=vec3(.1*fract(k*9.)-.35-.2*k,.12+.45*fract(k*3.),.1*k-.1);
  e=length(q-c*sat(dot(q,c)/dot(c,c)))-.035-.02*fract(k*7.);
  if(e<d)d=e,M=3.;
  return d;
}
// flame density
float fl(vec3 q){
  float v=q.y/H,a=q.y*4.-T*7.;
  q.xz-=G*.3*sqrt(abs(v))*vec2(sin(a),cos(a));
  q.xz+=(vec2(n(q*1.7-vec3(0,T*1.6,0)),n(q*1.7-vec3(5,T*1.6,9)))-.5)*v*.5;
  V=n(q*vec3(5,2.5,5)-vec3(0,T*5.,0));
  return q.y<0.?0.:sat((1.-v-length(q.xz)/(.2+.3*F)+(V-.5)*(.5+1.5*v))*3.);
}
// distance to a limb
float lb(vec3 p,vec3 a,vec3 b){p-=a;b-=a;return length(p-b*sat(dot(p,b)/dot(b,b)));}
// seven spirits of flame in skirts of flame dance in a ring around the fire, hand in hand: distance to the nearest
float dn(vec3 q){
  float a=mod(atan(q.z,q.x)+W,.8976)-.4488,r=length(q.xz),z=1.+1.5*G,c=(.3+1.4*smoothstep(32.,34.,Z))/z;
  // in the last bars they grow into giants
  q=vec3(r*cos(a)/z-c,(q.y-.1*P)/z,abs(r*sin(a))/z);
  return z*min(min(min(lb(q,vec3(0,.6,0),vec3(0,1.02,0))-.09,max(length(q.xz)-(.8-q.y)*.4,.3-q.y)),length(q-vec3(0,1.28,0))-.11),
             min(lb(q,vec3(0,1,.1),vec3(-.1*c,1.2+.12*sin(T*5.98),.434*c))-.04,
                 lb(q,vec3(0,.6,.07),vec3(.25*sign(a)*sin(T*5.98),0,.16))-.05));
}
// spark i at age u, or a moment o earlier: it rises and swirls, or takes its place in a formation
vec3 sp(float i,float u,float o){
  u=(U<0.?u:U*.3)-o;
  float h=h1(vec2(i,7)),w=i*2.4+u*(3.+5.*h)+T*.4,v=i/96.,g=floor(v*4.),y=2.*v-1.;
  return mix(U>=0.?vec3(sin(w),1.+h,cos(w))*u*(2.+4.*h)*(Z>9.?3.:1.)+vec3(0,.1-9.*u*u,0)                            // struck from the flint, or blown out of the fire at the end
   :vec3(sin(w),0,cos(w))*(.06+u*(.4+h))+vec3(0,H*.4+u*(3.+5.*h),0),
    S<1.?vec3(sin(v*12.57+i*3.1416+T*.3),0,cos(v*12.57+i*3.1416+T*.3))*sqrt(v)*3.+vec3(0,4.5,0)                                 // a galaxy under the canopy
   :S<2.?vec3(sin(v*12.57+i*3.1416+T*2.)*.8,v*3.2+.6,cos(v*12.57+i*3.1416+T*2.)*.8)                 // double helix around the flames
   :S<3.?vec3(sin(i*.2618+T*(g-1.5)),0,cos(i*.2618+T*(g-1.5)))*(.6+.3*g+.3*P)+vec3(0,.5+.7*g,0)     // four rings, a cone of light
   :vec3(sin(i*2.4+T)*sqrt(1.-y*y),y,cos(i*2.4+T)*sqrt(1.-y*y))*(1.1+.3*P)+vec3(0,2.5,0),          // a sphere above the fire
   Q);
}
void main(){
  T=R.z;Z=T/1.05;
  float s=min(floor(Z<48.?Z/4.:Z<64.?Z/2.-12.:Z<96.?Z/4.+4.:Z<112.?Z/2.-20.:Z/8.+22.),37.),len=Z<48.||Z>64.&&Z<96.?4.:Z<112.?2.:8.,x=mod(Z,len),t=0.,d,i,w,k=fract(Z)*7.,j=h1(gl_FragCoord.xy+fract(T)*61.);
  P=Z>24.&&Z<112.?(exp(-k*.6)+(k>3.?.6*exp(2.7-k*.9):0.)+(k>5.?.8*exp(4.5-k*.9):0.))*(Z>64.&&Z<80.?.3:1.):0.;
  F=max(Z<2.?0.:Z<8.?.25*exp(-6.*fract(Z)):.12+.88*smoothstep(8.,30.,Z)-.3*smoothstep(62.,66.,Z)+.8*smoothstep(78.,81.,Z)-1.7*smoothstep(110.,124.,Z)+.15*P,0.);
  G=smoothstep(103.,105.,Z)*smoothstep(112.,110.,Z);
  H=(.1+1.2*F)*(1.+.25*P+1.5*G);
  D=smoothstep(112.,128.,Z);
  W=Z*.6+max(Z-80.,0.)*.6+.15*sin(Z*6.283);
  Y=max(1.-F*3.,0.);
  U=Z<2.?-1.:Z<8.?fract(Z):Z>112.&&Z<115.?(Z-112.)*.5:-1.;
  // sparks fall into formation: a galaxy in the break, then helix, rings, sphere in the climax, and let go again at the end
  S=Z<80.?0.:Z<92.||Z>104.?1.:Z<100.?2.:3.;
  Q=sat(min(Z-66.,78.-Z))+sat(min(Z-84.,110.-Z));
  K=smoothstep(32.,33.,Z)*smoothstep(66.,64.,Z)+smoothstep(80.,81.,Z)*smoothstep(112.,110.,Z);
  C=Z<8.?vec3(.5,.6,1):vec3[3](vec3(1,.33,.06),vec3(.12,1,.3),vec3(.4,.25,1))[int(Z<88.||Z>112.?0.:Z<96.?1.:Z<104.?2.:mod(floor(Z),3.))];
  L=vec3(n(vec3(T*6.,0,0))-.5,2.+3.*F,n(vec3(0,T*6.,0))-.5)*.12+P*.35*vec3(cos(floor(Z)*2.4),0,sin(floor(Z)*2.4));
  E=C*F*(.6+.8*n(vec3(T*9.,5,5)));
  // camera: a kind of shot per cut (distance, height, height of the target), circling the fire
  vec3 cp=vec3[8](vec3(7.1,1.3,1.4),vec3(4.7,1,.8),vec3(2.4,.8,.5),vec3(1.35,.32,.3),vec3(1,.3,6),vec3(.6,8.5,0),vec3(4.7,.35,1.2),vec3(2.3,3.5,.3))
    [int[38](0,2,3,2, 1,6,7,0, 1,7,6,2, 5,1,2,7,0,6,3,1, 4,0,6,3, 1,7,6,5, 2,0,4,1,0,6,1,5, 1,2)[int(s)]];
  w=(cp.x>6.?(mod(s,3.)-1.)*2.435:cp.x>4.?s*1.2566:s*2.4)+(mod(s,2.)-.5)*(x-len/2.)*(.1+.3*step(32.,Z)*step(Z,112.))*(cp.x>6.?.3:1.);
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  vec3 ro=vec3(cos(w)*cp.x,cp.y+.04*x,sin(w)*cp.x),
       fw=normalize(vec3(0,cp.z,0)+.3*cp.x*(h1(vec2(s,1))-.5)*vec3(-sin(w),0,cos(w))-ro)+.012*sin(T*vec3(1.3,1.7,1.1)+s),
       rt=normalize(cross(fw,vec3(0,1,0))),
       rd=normalize(fw*1.5+rt*u.x+cross(rt,fw)*u.y),
       col,fg=vec3(.012,.025,.05)*(1.+9.*D),p,q,e,nr=vec3(0);
  // nothing stands above nine metres: there the trunks end in the canopy
  k=rd.y>.02?min((9.-ro.y)/rd.y,40.):40.;
  for(i=0.;i<120.;i++){
    d=map(ro+rd*t);
    if(d<7e-4*t||t>k)break;
    t+=d;
  }
  p=ro+rd*t;
  if(t<k){
    // normal, then one occlusion sample along it, then the material
    for(int i=0;i<6;i++){
      e=i<4?.5773*(2.*vec3(((i+3)>>1)&1,(i>>1)&1,i&1)-1.):i<5?normalize(nr)*99.:vec3(0);
      d=map(p+.002*e);
      if(i<4)nr+=e*d;
      else if(i<5)k=sat(d/.2);
    }
    nr=normalize(nr);
    for(int i=0;i<3;i++)nr[i]+=.6*n(p*23.+float(i)*7.)-.3;
    nr=normalize(nr);
    w=n(p*vec3(7,1.2,7));
    col=M<1.?mix(vec3(.12,.07,.03),vec3(.4,.26,.13),w)*(.6+2.*pow(n(p*45.),3.)):
        M<2.?vec3(.3,.2,.14)*(.1+3.*abs(w-.5)):
        M<3.?vec3(.3):vec3(.03);
    q=L-p;
    d=dot(q,q);
    w=length(p.xz)-1.7;
    x=sh(p)*2.5/(1.+d*.25);
    // firelight, cool moonlight from behind, the glow under the dancers, and a wet glint on the stones
    col*=E*max(dot(nr,q)/sqrt(d)*.8+.2,0.)*x+(fg*(.3+.7*nr.y)+vec3(.02,.04,.09)*(max(nr.x*.6+nr.y*.5-nr.z*.6,0.)+3.*Y*smoothstep(.3,-.7,w-.13*p.y)*nr.y))*k+C*K*.5*exp(-w*w*4.-p.y*3.);
    if(M>1.&&M<3.)col+=E*x*.3*pow(max(dot(reflect(rd,nr),q)/sqrt(d),0.),16.);
    // embers: the charred logs and the bed between them
    w=n(p*25.+T*.3);
    w*=w*w*smoothstep(8.,10.,Z)*(.6+.4*sin(T*3.+p.x*20.));
    d=length(p.xz);
    // under the dancers the ground burns in a seven-pointed star, a point at every dancer's feet
    x=abs(d-1.7);
    for(int i=0;i<7;i++)x=min(x,abs(p.x*cos(float(i)*.8976+.4488-W)+p.z*sin(float(i)*.8976+.4488-W)-1.06));
    col+=C*K*step(M,.5)*step(d,1.75)*exp(-x*40.)*(.5+P+9.*w)
        +vec3(1,.25,.03)*w*(M>2.?40.*w*w:M<1.?9.*smoothstep(.5,.1,d):0.)
    // a ring of light runs out over the floor and up the trunks on every bar, once the dance is in full swing
        +C*(.1+w)*(Z>48.&&Z<64.||Z>80.&&Z<112.?2.:0.)*exp(-abs(d-9.*fract(Z))*4.);
  }else{
    t=40.;
    col=fg;
    if(rd.y>.02){
      // the canopy: a ragged hole above the clearing, lit from below; stars, the moon and a northern light through it
      d=(9.-ro.y)/rd.y;
      u=ro.xz+rd.xz*d;
      w=length(u);
      k=n(vec3(u*.5,1))*.6+n(vec3(u*2.,2))*.4;
      col=mix(mix(vec3(.015,.03,.07),vec3(.3,.4,.5),D)+(1.-D)*pow(h1(floor(u*20.)),300.)*smoothstep(.5,0.,length(fract(u*20.)-.5))*9.+(1.-D)*(smoothstep(.35,.3,length(u-vec2(1.2,.6)))*vec3(1.6,1.8,2)+vec3(.1,.6,.4)*pow(n(vec3(u.x*.8+T*.2,u.y*.15,T*.1)),4.)),
              E*(.2+k*k)*3./(20.+w*w)+fg*.3*k,smoothstep(0.,.15,k+w*.07-.75));
    }
  }
  // mist: it lies below five metres, and light shines into it
  d=(5.-ro.y)/rd.y;
  w=exp(-.05*(rd.y>0.?clamp(d,0.,t):t-clamp(d,0.,t)));
  col=col*w+fg*(1.-w);
  d=min(t,22.)/24.;
  e=vec3(0);
  for(i=0.;i<24.;i++){
    q=ro+rd*d*(i+j);
    nr=q-L;
    w=n(q*.7+vec3(T*.3,0,0));
    e+=sat(1.-q.y/3.5)*(.15+1.6*w*w)*exp(-.05*d*i)*vec3(sh(q)*smoothstep(.5,3.,length(q.xz))/(1.+dot(nr,nr)*.12),smoothstep(2.,1.,length(q.xz-.13*q.y)),0);
  }
  // the fire's light, and a shaft of moonlight that falls through the gap in the canopy
  col+=E*e.x*d*.16+vec3(.02,.05,.11)*e.y*d*Y;
  x=0.;
  // flames: emission along the ray inside a sphere around the fire
  q=ro-vec3(0,H*.6,0);
  k=dot(q,rd);
  w=k*k-dot(q,q)+H*H*1.3+.3+5.*K+8.*G+12.*D;
  if(w>0.){
    w=sqrt(w);
    s=max(-k-w,0.);
    d=(min(w-k,t)-s)/(24.+24.*K+32.*G);
    if(d>0.)for(i=0.;i<24.+24.*K+32.*G;i++){
      q=ro+rd*(s+d*(i+j));
      w=fl(q);
      w=max(w,K*(.8-.4*G)*sat((.05-dn(q-vec3(0,.3*V*V,0)))*14.+V-.5));
      x+=w*d*4.;
      // when the fire is down, a thread of smoke stands in the first light
      col+=(C+.6*(C+vec3(.5,.4,.2))*w*w*w)*w*d*2.8+fg*D*sat(1.-length(q.xz-.15*sin(q.y*2.+T))/(.06+.1*q.y))*sat(q.y*3.-1.)*V*d*4.;
    }
  }
  // sparks: short streaks, each a segment between two moments of one spark
  // The last forty lights are fireflies, adrift between the trees
  for(i=0.;i<136.;i++){
    w=h1(vec2(i,7));
    k=fract(T*(.12+.2*w)+w*31.);
    p=(i<96.?sp(i,k,0.):vec3(sin(i*2.4)*(1.5+7.*w)+.4*sin(T*.3+i),.3+2.*fract(w*7.)+.2*sin(T*.5+i),cos(i*2.4)*(1.5+7.*w)))-ro;
    q=i<96.?sp(i,k,.012)-ro:p;
    d=dot(p,fw);
    if(d>.1&&length(p)<t){
      p=p/d-rd/dot(rd,fw);
      q=q/dot(q,fw)-rd/dot(rd,fw)-p;
      w=sat(-dot(p,q)/(dot(q,q)+1e-9));
      p+=q*w;
      col+=(i<96.?(C+vec3(.6,.4,.2))*(U<0.?F*(1.+2.*P)*(1.-w)*mix((1.-k)*(1.-k),1.,Q):exp(-3.*U)*(Z>9.?6.:1.)):vec3(.5,1,.2)*pow(.5+.5*sin(T*(1.+k)+i),4.))*exp(-dot(p,p)*d*d*5e4/(1.+20.*(i<96.?Q:1.)+d*d*.05));
    }
  }
  // alpha: the blur radius for the depth of field; the lens is focused on the fire
  O=vec4(min(col,9.),sat(.7*abs(1./t-1./max(length(ro),cp.z)))*(1.-sat(x)));
}
