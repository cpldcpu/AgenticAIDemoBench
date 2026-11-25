#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// DECKLE - the picture: a stack of cut-paper layers. Each layer is a 2D distance field; it throws a soft shadow on the
// layers behind it, has a bright cut edge and paper grain. The camera follows a paper boat; layers move with their own depth.
// Time is counted in bars of 2.4 s (100 BPM). Phases: dusk 0-12, night 12-24, storm 24-32, calm 32-38, dawn 38-48, desk 44-50.
// Palette rows: horizon, sky top, sea; columns: dusk, night, storm, dawn (sRGB-ish, squared when drawn)
const vec3 PA[12]=vec3[12](vec3(1,.62,.42),vec3(.3,.42,.62),vec3(.42,.46,.52),vec3(1,.8,.6),
  vec3(.3,.22,.5),vec3(.05,.07,.22),vec3(.16,.17,.22),vec3(.4,.62,.9),
  vec3(.16,.2,.45),vec3(.04,.09,.24),vec3(.1,.17,.22),vec3(.12,.45,.6));
const float AM[4]=float[4](1.,.6,.7,1.);
float T,Z,S,Nx,K,Fl,PX,cx,tl,Am;
vec3 C;
float h(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float no(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
mat2 rt(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 pl(int o){int i=int(K);return mix(PA[o+i],PA[o+min(i+1,3)],fract(K));}
// convex polygons (counter-clockwise) as the max of their edge distances
float ee(vec2 p,vec2 a,vec2 b){vec2 e=normalize(b-a);return dot(p-a,vec2(e.y,-e.x));}
float tr(vec2 p,vec2 a,vec2 b,vec2 c){return max(max(ee(p,a,b),ee(p,b,c)),ee(p,c,a));}
float qd(vec2 p,vec2 a,vec2 b,vec2 c,vec2 d){return max(max(ee(p,a,b),ee(p,b,c)),max(ee(p,c,d),ee(p,d,a)));}
float sb(vec2 p,vec2 s){p=abs(p)-s;return length(max(p,0.))+min(max(p.x,p.y),0.);}
// draw one paper layer: d distance (negative inside), ds the same for the shadow, c colour, q for the grain, w the shadow reach
void lay(float d,float ds,vec3 c,vec2 q,float w){
  C*=1.-.55*smoothstep(w,-.004,ds);
  c*=c*Am;
  c*=1.+(no(q*300.)-.5)*.1+(no(q*vec2(30,400))-.5)*.07;
  c+=c*.3*smoothstep(-.008,0.,d);
  C=mix(C,c,smoothstep(PX,-PX,d));
}
// height of sea layer j at x; the storm lifts the waves
float ed(float x,float j){
  float a=(.008+.006*j)*(1.+.9*S*(.6+.15*j)),f=(3.4+1.5*j)*(1.-.4*S);
  return -.03-.062*j+a*(sin(x*f+T*(.5+.15*j)+j*2.)+.3*sin(x*f*2.3-T*.8+j*5.));
}
float cl(vec2 q,float b,float s,float m){
  float i=floor(q.x/s),x=q.x-(i+.5)*s,r=h(vec2(i,s*17.)),w=s*m;
  return max(min(min(length(vec2(x-.1*s*r,(q.y-b-.03*r)*1.3))-w*(.2+.1*r),length(vec2(x+.2*s*(1.-r),(q.y-b)*1.5))-w*.17),length(vec2(x+.34*s*r,(q.y-b)*1.8))-w*.1),b-q.y);
}
// the paper boat, in its own units: hull and sail
float hu(vec2 b){return qd(b,vec2(-.08,-.058),vec2(.08,-.058),vec2(.115,0),vec2(-.115,0))*1.35;}
float sl(vec2 b){return tr(b,vec2(-.1,.004),vec2(.1,.004),vec2(0,.2))*1.35;}
// a crane seen from behind, wings flapping with f
float crd(vec2 b,float f){
  b.x=abs(b.x);
  float e=.028+.03*f;
  return min(min(qd(b,vec2(0,.02),vec2(0,-.02),vec2(.05,e-.013),vec2(.05,e+.013)),tr(b,vec2(.05,e+.013),vec2(.05,e-.013),vec2(.11,.01+.045*f))),min(length(b*vec2(1,.6))-.014,min(length(b-vec2(0,.028))-.008,tr(b,vec2(-.008,-.02),vec2(.008,-.02),vec2(0,-.048)))));
}
// a field of rising paper lanterns, cell size s
void lan(vec2 q,float s,float amt){
  q.y-=T*.2*s;
  vec2 g=floor(q/s);
  float r=h(g);
  if(r>.62&&amt>0.){
    vec2 e=q-(g+.5+(vec2(h(g+3.1),h(g+7.7))-.5)*.4)*s,f=abs(q/s-g-.5);
    e.x+=.006*sin(T*1.3+r*30.);
    e*=rt(.1*sin(T*.9+r*40.));
    float u=.075*s,y=e.y/u,d=sb(vec2(e.x/(1.+.3*cos(y*1.1)),e.y),vec2(u*.55,u*.8))-u*.45,l=exp(-length(e-vec2(0,-.4*u))/u);
    vec3 c=vec3(1,.42,.1)*(.35+1.5*l)*(1.-.3*smoothstep(.3,.5,abs(fract(e.x/u*1.4)-.5)))*(abs(y)>1.05?.3:1.);
    C+=vec3(1,.45,.12)*exp(-length(e)/(s*.13))*.3*amt*(1.-smoothstep(.3,.5,f.x))*(1.-smoothstep(.3,.5,f.y));
    vec3 o=C;
    lay(d,d,sqrt(c),q,.02);
    C=mix(o,C+vec3(1,.4,.1)*l*smoothstep(PX,-PX,d)*.6,min(amt*3.,1.));
  }
}
float eb(float t){return -.55+1.17*smoothstep(7.2,12.,t)-1.17*smoothstep(116.4,121.7,t);}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*R.xy)/R.y,pc,q,u,v;
  vec3 c;
  float j,k,d,a,bi=0.,ss,zm,Lx,Lh,dp;
  int i;
  T=R.z;Z=T/2.4;
  S=smoothstep(21.,24.5,Z)*(1.-smoothstep(30.5,33.,Z));
  Nx=smoothstep(10.,15.,Z)*(1.-smoothstep(35.,41.,Z));
  K=smoothstep(10.,16.,Z)+smoothstep(20.,25.,Z)+smoothstep(31.,41.,Z);
  // lightning, on the bars of the storm
  Fl=0.;
  for(i=0;i<6;i++){
    d=T-float[6](25.,26.5,28.,28.25,29.75,31.)[i]*2.4;
    if(d>0.&&d<2.){a=exp(-d*7.)*(.6+.4*sin(d*70.));if(a>Fl)bi=float(i);Fl=max(Fl,a);}
  }
  Am=mix(AM[int(K)],AM[min(int(K)+1,3)],fract(K))+Fl*1.5;
  cx=T*.07;
  dp=(Z-30.2)/.4;
  dp=exp(-dp*dp);
  tl=.12*smoothstep(36.,46.,Z)-.03*S-.09*dp;
  ss=mix(1.,.62,smoothstep(44.,48.5,Z));
  zm=1.+1.6*(1.-smoothstep(3.5,10.,Z))+.6*smoothstep(15.,18.,Z)*(1.-smoothstep(19.,21.,Z))+.25*S+.15*dp;
  pc=(p/ss-vec2(0,-.2))/zm+vec2(0,-.2);
  pc=rt(.06*S*sin(T*.8))*pc+S*.005*vec2(sin(T*33.),sin(T*29.))*(1.+Fl*2.);
  PX=1.3/R.y/zm/ss;
  // sky, with a glow round the sun
  v=vec2(.24,Z<20.?mix(.03,-.23,smoothstep(0.,14.,Z)):mix(-.23,.08,smoothstep(37.,47.,Z)));
  C=mix(pl(0),pl(4),smoothstep(-.03,.62,pc.y+tl*.3));
  C+=pl(0)*(exp(-length(pc-v)*3.)*.5+.25*smoothstep(.2,.9,sin(atan(pc.y-v.y,pc.x-v.x)*9.+T*.15))*exp(-length(pc-v)*2.))*(1.-S)*(1.-Nx);
  C*=C;
  C*=1.+(no(pc*300.)-.5)*.08;
  // stars: diamonds cut out of the dark sheet, lit from behind
  u=pc*60.;
  q=floor(u);
  d=h(q);
  if(d>.9)C+=vec3(1,.95,.8)*smoothstep(.12,.0,(abs(fract(u.x)-.5-(h(q+3.)-.5)*.5)+abs(fract(u.y)-.5-(h(q+7.)-.5)*.5))*.7)*(.5+.5*sin(T*2.+d*90.))*Nx*(1.-S)*smoothstep(-.02,.15,pc.y)*2.;
  // lightning bolt
  a=h(vec2(bi,5.))-.5;
  C+=vec3(.7,.8,1.)*smoothstep(.007,0.,abs(pc.x-a*.8-.05*sin(pc.y*38.+bi)-.035*sin(pc.y*91.)))*step(-.03,pc.y)*step(pc.y,.55)*Fl*6.;
  // sun: three paper discs
  for(i=0;i<3;i++){
    d=length(pc-v)-.17+.05*float(i);
    lay(d,d,vec3(1,.5+.17*float(i),.2+.15*float(i)),pc,.03);
  }
  // moon: a crescent
  v=vec2(-.36,mix(-.25,.22,smoothstep(10.,17.,Z))-.6*smoothstep(35.,40.,Z));
  d=max(length(pc-v)-.075,-(length(pc-v-vec2(.03,.02))-.065));
  lay(d,d,vec3(.95,.93,.8),pc,.03);
  C+=vec3(.5,.6,.9)*exp(-length(pc-v)*7.)*.25*Nx;
  // two banks of clouds, low and thick in the storm
  for(i=0;i<2;i++){
    k=.1+.1*float(i);
    q=vec2(pc.x+cx*k+float(i)*.7,pc.y+tl*k);
    a=.55+.25*float(i);
    d=cl(q,.13-.05*float(i)-.1*S,a,1.+.2*S);
    lay(d,d,mix(pl(0),pl(4),.45+.15*float(i))*.9,q,.05);
  }
  // mountains
  for(i=0;i<2;i++){
    k=.18+.12*float(i);
    q=vec2(pc.x+cx*k,pc.y+tl*k);
    d=q.y+.04-(.11+.04*float(i))*max(1.-abs(sin(q.x*(2.2+1.5*float(i))+float(i)*2.)),.7*(1.-abs(sin(q.x*(4.+2.*float(i))+1.5))));
    lay(d,d,mix(pl(0),pl(8),.4+.2*float(i))*(.9-.1*float(i)),q,.03);
  }
  // the lighthouse on its rock: stripes, a lamp and a beam that sweeps from side to side
  Lh=smoothstep(9.,13.,Z);
  q=vec2(pc.x+cx*.65,pc.y+tl*.65)-vec2(2.27,0);
  d=q.y+.1-.1*exp(-q.x*q.x/.06);
  lay(d,d,mix(pl(8),vec3(0),.5),q,.03);
  d=qd(q,vec2(-.036,.02),vec2(.036,.02),vec2(.022,.19),vec2(-.022,.19));
  lay(d,d,mix(vec3(.95,.92,.85),vec3(.8,.2,.14),mod(floor((q.y-.02)*26.),2.)),q,.03);
  d=qd(q,vec2(-.034,.19),vec2(.034,.19),vec2(.034,.2),vec2(-.034,.2));
  lay(d,d,vec3(.2,.17,.16),q,.01);
  d=qd(q,vec2(-.016,.2),vec2(.016,.2),vec2(.016,.226),vec2(-.016,.226));
  lay(d,d,vec3(1,.9,.6),q,.01);
  C+=vec3(1,.8,.4)*smoothstep(PX,-PX,d)*2.*Lh;
  d=tr(q,vec2(-.022,.226),vec2(.022,.226),vec2(0,.25));
  lay(d,d,vec3(.7,.15,.1),q,.01);
  v=q-vec2(0,.213);
  a=cos(T*1.1);
  d=max(v.x*sign(a),0.);
  C+=vec3(1,.82,.45)*(smoothstep(0.,.04,d)*exp(-abs(v.y+.03*d)/(.004+.07*d)-d*1.3)*abs(a)*1.4+exp(-length(v)*30.)*1.5)*Lh*(1.-.6*S);
  // the sea, seven layers; the boat rides on layer 3
  Lx=max(smoothstep(14.5,17.,Z)*(1.-smoothstep(23.,25.,Z)),.5*smoothstep(39.,41.,Z)*(1.-smoothstep(47.,48.,Z)));
  for(j=0.;j<7.;j++){
    k=.25+.25*j;
    q=vec2(pc.x+cx*k,pc.y+tl*k);
    if(j==2.)lan(vec2(pc.x+cx*.8,pc.y+tl*.8),.2,Lx);
    if(j==3.){
      // the great wave: a spiral band of paper that curls over, in three shades, with foam at the lip
      a=.42*smoothstep(22.,26.,Z)*(1.-smoothstep(29.5,32.,Z));
      if(a>.01){
        v=pc-vec2(.2-.015*(Z-24.),-.02);
        d=mod(atan(v.y,v.x)+.9,6.2832);
        u.x=a*exp(-.16*d);
        u.y=max(min(d-4.7,6.2832-d)*length(v),0.);
        for(i=0;i<3;i++){
          k=abs(length(v)-u.x+a*.12*float(i)*(1.-d/4.7))-a*.5*pow(max(1.-d/4.7,0.),1.2)*(1.-.28*float(i))-.004;
          k=max(k,u.y);
          lay(k,k,mix(pl(8),vec3(.5,.9,.9),.4*float(i)),pc,.03);
        }
        d=9.;
        for(i=0;i<8;i++){
          k=3.+float(i)*.25+.05*sin(T*3.+float(i));
          d=min(d,length(pc-vec2(.2-.015*(Z-24.),-.02)-vec2(cos(k-.9),sin(k-.9))*(a*exp(-.16*k)+.025*sin(float(i)*5.)))-.014-.03*h(vec2(i,2)));
        }
        lay(d,d,vec3(.97),pc,.01);
        k=.25+.25*j;
      }
    }
    d=q.y-ed(q.x,j);
    c=mix(mix(pl(0),pl(8),.3+.1*j)*(1.-.04*j),vec3(.8,.9,1),S*.7*smoothstep(-.014,-.002,d));
    lay(d,d,c,q,.03);
    if(j==3.){
      // the boat: coral hull, cream sail with a fold down the middle, a lantern at the bow
      a=ed(cx,3.)+.024;
      k=atan(ed(cx+.06,3.)-ed(cx-.06,3.),.12)*.8+S*.22*sin(T*1.9)+Fl*.05;
      u=rt(k)*(q-vec2(cx,a))/1.35;
      v=u-vec2(.005,-.005)/1.35;
      c=vec3(.9,.3,.22)*(u.x<0.?1.:.8)*(.75+.25*smoothstep(-.058,0.,u.y));
      lay(hu(u),hu(v),c,q,.03);
      c=vec3(.97,.93,.85)*(u.x<0.?1.:.76)*(1.-.12*smoothstep(.01,0.,abs(u.x)));
      lay(sl(u),sl(v),c,q,.03);
      d=length(u-vec2(.118,.014))*1.35;
      a=.25+Nx*1.2+S*.8;
      C+=vec3(1,.5,.15)*(smoothstep(.012,.006,d)*2.+exp(-d*14.)*.35*smoothstep(PX,-PX,min(hu(u),sl(u))))*a;
    }
    if(j==4.)lan(vec2(pc.x+cx*1.3,pc.y+tl*1.3),.42,Lx);
  }
  // a flock of cranes at dawn
  a=smoothstep(37.5,47.,Z);
  if(a>0.&&Z<49.)for(i=0;i<7;i++){
    d=float((i+1)/2)*(i%2<1?-1.:1.);
    k=mix(1.3,.5,a);
    v=(pc-mix(vec2(-.6,-.1),vec2(.45,.33),a)-vec2(d*.11,-abs(d)*.075+.01*sin(T+d))*k)/k;
    j=sin(T*6.+float(i)*1.7);
    lay(crd(v,j)*k,crd(v-vec2(.01,-.01),j)*k,vec3(.98,.95,.9)*(.85+.15*j),v,.02);
  }
  // rain
  if(S>0.){
    for(i=0;i<2;i++){
      u=vec2(pc.x*(70.+50.*float(i))+pc.y*14.,pc.y*1.8+T*(3.+float(i)));
      a=h(vec2(floor(u.x),float(i)));
      C=mix(C,vec3(.7,.8,1.)*.45,step(.46,fract(u.x))*step(fract(u.x),.54)*step(fract(u.y+a*9.),.12)*step(.5,a)*S*.5);
    }
  }
  C=mix(C,vec3(.9,.95,1),.35*dp*dp*dp*dp);
  // the diorama stands on a kraft-paper desk at the end, in a mat
  v=vec2(.889,.5)*ss;
  c=vec3(.6,.45,.3);
  c*=c*(1.+(no(p*500.)-.5)*.1+(no(p*vec2(8,700))-.5)*.08)*(1.-.5*dot(p,p));
  c*=1.-.5*smoothstep(.06,-.01,sb(p-vec2(.012,-.02),v+.03));
  c=mix(c,vec3(.9,.86,.76)*vec3(.9,.86,.76),smoothstep(PX*zm,-PX*zm,sb(p,v+.03)));
  C=mix(c,C,smoothstep(PX*zm,-PX*zm,sb(p,v)));
  // the sheet: pulled up at the start and let down at the end
  d=eb(T)-p.y+(no(vec2(p.x*60.,3.))-.5)*.006+(no(vec2(p.x*9.,1.))-.5)*.02;
  PX=1.3/R.y;
  Am=1.;
  lay(d,d,vec3(.96,.92,.84),p,.07);
  O=vec4(C,1);
}
