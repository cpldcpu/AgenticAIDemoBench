#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// TURBO BOOST - the picture. A black car with a red scanner in its nose, a desert highway at night that the TV crew
// has wetted down, an LED dashboard with a voice box, a green vector screen and a tunnel of scanner lights.
// 128 BPM: a beat is .46875 s, a bar 1.875 s, a sixteenth .1171875 s.
float T,Z,J,Q,V,N,K,E,D,F,L,G,W;  // seconds, bars, jump height, pitch, speed, dawn, shot, headlights, distance driven, barricade z, local time
vec3 C,P,MD;                  // car offset, the last car point in car space, moon direction
int M;                        // material of the last car point: 0 paint, 1 glass, 2 tyre
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
// the same integer hash as in music.frag, so the voice box shows the syllables the voice sings
float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
mat2 rt(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
// the scanner head: one sweep per beat, slowing at the ends; music.frag pans its whoosh the same way
float sx(float t){return -.36*cos(t*6.702);}
// an LED of the scanner at x: lit by the head and by where the head was a moment ago
float sl(float x){float b=0.;for(float k=0.;k<8.;k++)b=max(b,exp(-k*.55)*smoothstep(.07,.035,abs(x-sx(T-k*.035))));return b;}
// the voice: one syllable per sixteenth in the talking bars, the same as in music.frag
float vo(){
  int i=int(T/.1171875),b=i/16;
  float x=fract(T/.1171875);
  return (b>=16&&b<20||b>=32&&b<36)&&i%16<12&&hs(i)>.3?sin(3.14*x)*(.5+.5*hs(i*7)):0.;
}
float car(vec3 p){
  p-=C;
  p.y-=J;
  p.yz*=rt(Q);
  vec3 w=vec3(abs(p.x)-.8,p.y-.31,abs(p.z+.05)-1.4);
  // body: a wedge, lower at the nose; cabin with raked glass; arches; wheels
  float b=max(max(bx(p-vec3(0,.48,0),vec3(.82,.2,2.25))-.12,p.y-.77+max(p.z-.3,0.)*.16),-max(length(w.yz)-.37,.55-abs(p.x))),
        c=max(max(max(bx(p-vec3(0,.88,-.8),vec3(.68,.2,1.3))-.05,(p.y-1.08)*.92+(p.z+.05)*.4),(p.y-1.08)*.96-(p.z+.95)*.27),abs(p.x)-.72+(p.y-.75)*.4),
        t=max(length(w.yz)-.3,abs(w.x)-.13);
  P=p;
  M=t<min(b,c)?2:c<b&&p.y>.8&&p.y<1.05?1:0;
  return min(min(b,c),t);
}
float map(vec3 p){
  float d=K==4.?99.:car(p);
  // telephone poles on the left every 40 m
  vec3 q=p;
  q.z=mod(q.z+D,40.)-20.;q.x+=K==6.?99.:9.5;
  d=min(d,min(max(length(q.xz)-.14,q.y-9.),bx(q-vec3(0,8.3,0),vec3(1.3,.08,.08))));
  // the barricade: a striped beam on two legs across the road
  q=p-vec3(-1.8,.9,F);
  d=min(d,min(bx(q,vec3(3.8,.3,.08)),bx(vec3(abs(q.x)-3.,q.y+.45,q.z),vec3(.08,.45,.08))));
  // in the break a single street lamp
  q=p-vec3(3.2,0,-1);
  if(K==8.)d=min(d,min(max(length(q.xz)-.12,q.y-6.),bx(q-vec3(-.8,6.,0),vec3(1.,.08,.12))));
  // at dawn a semi-trailer waits with its ramp down
  q=p-vec3(0,.65,22.75);q.yz*=rt(-.28);
  if(K==11.)d=min(d,min(min(max(bx(p-vec3(0,2.6,32),vec3(1.3,1.35,7)),-bx(p-vec3(0,2.6,31.9),vec3(1.2,1.25,7.1))),bx(p-vec3(0,.5,35),vec3(1.2,.5,1.2))),bx(q,vec3(1.1,.04,2.35))));
  return d;
}
float tr(vec3 o,vec3 r,float m){
  float t=.01,d;
  for(int i=0;i<120;i++){d=map(o+r*t);if(d<.001*t||t>m)break;t+=d*.9;}
  return t;
}
// light arriving at p with normal n: moon, two headlights, the scanner head, the street lamp
vec3 li(vec3 p,vec3 n){
  vec3 c=vec3(.25,.33,.6)*(.15+.85*max(dot(n,MD),0.))*(.3+.1*N)+vec3(.15,.2,.4)*max(dot(n,normalize(vec3(1,.7,-.4))),0.)+vec3(1,.5,.25)*N*max(dot(n,normalize(vec3(.3,.25,1))),0.)*.6+vec3(.5,.6,1)*W*(.1+.1*n.y),v;
  for(float s=-1.;s<2.;s+=2.){
    v=p-C-vec3(.62*s,.3+J,2.4);
    c+=vec3(1,.85,.65)*E*smoothstep(.88,.97,dot(normalize(v),vec3(0,-.06,1)))*max(dot(n,-normalize(v)),0.)*60./dot(v,v);
  }
  v=p-C-vec3(sx(T),.36+J,2.45);
  c+=vec3(1,.04,.01)*max(dot(n,-normalize(v)),0.)*step(0.,v.z)*1.5/(dot(v,v)+.05);
  v=p-vec3(2.4,5.9,-1);
  if(K==8.)c+=vec3(1,.45,.1)*max(dot(n,-normalize(v)),0.)*smoothstep(.5,.8,-v.y/length(v))*15./dot(v,v);
  return c;
}
vec3 sky(vec3 d){
  float a=atan(d.x,d.z),y=d.y,h=.012+.05*sat(sin(a*3.+sin(a*7.)+1.)*3.-1.)+.004*sin(a*41.);
  vec3 c=vec3(.003,.005,.016)*(1.-N)+vec3(.04,.06,.15)*exp(-max(y,0.)*5.)+N*(vec3(1,.35,.08)*exp(-max(y,0.)*7.)*.7+vec3(.2,.3,.6)*.2);
  // stars and the moon
  c+=step(.996,h1(floor(vec2(a,y)*600.)))*sat(y*8.)*(1.-N)*.5*G
    +(smoothstep(.9994,.9996,dot(d,MD))*vec3(1,.95,.8)*4.+vec3(.2,.25,.4)*exp((dot(d,MD)-1.)*30.)*.3)*(1.-.7*N);
  // in the chorus a storm over the mesas flashes on every orchestra stab, a bolt somewhere new each time
  a+=1.5-3.*h1(vec2(floor(Z*4.)));
  c+=W*(vec3(.1,.12,.2)*exp(-max(y,0.)*3.)+vec3(.8,.85,1)*.003/(abs(a+.05*sin(y*40.+Z)+.02*sin(y*130.))+.003)*step(y,.4));
  // the mesas: flat tops, steep cliffs, black against the sky
  if(y<h)c=vec3(.004,.004,.008)+N*vec3(.05,.025,.02);
  // a town far out in the desert glitters along the horizon, with a glow above it
  h=h1(floor(vec2(a*500.,y*1500.)));
  c+=(step(.93,h)*step(y,.006)*step(0.,y)*mix(vec3(1,.5,.15),vec3(.8,.9,1),fract(h*37.))*(.6+.4*sin(T*9.+h*99.))*3.+vec3(1,.4,.15)*.03*exp(-max(y,0.)*40.))*sat(sin(a*2.+1.)*4.-2.)*(1.-N);
  return c;
}
// the ground: wet asphalt with a dashed yellow centre line and white edges, sand beyond
vec3 gr(vec3 p){
  float x=abs(p.x+1.8),z=p.z+D,s=length(max(abs(p.xz-C.xz)-vec2(.7,2.1),0.));
  vec3 c=x<3.8?vec3(.03)+vec3(.5,.33,.03)*smoothstep(.08,.06,abs(x-.0))*step(.45,fract(z/12.))+.4*smoothstep(.08,.06,abs(x-3.6)):
               vec3(.1,.08,.06)*(.7+.3*sin(p.x*.7+sin(z*.3)));
  // cat's eyes on the centre line light up in the headlights
  return c*li(p,vec3(0,1,0))*(.3+.7*sat(s*1.5))+vec3(1,.7,.3)*smoothstep(.12,.0,length(vec2(x,fract(z/12.+.25)*12.-6.)))*E*.6;
}
// shading of a hit on the car, a pole, the barricade or the lamp
vec3 ob(vec3 p,vec3 r){
  vec3 n=vec3(0),e,c;
  for(int j=0;j<4;j++){e=.5773*(2.*vec3((j+3)>>1&1,j>>1&1,j&1)-1.);n+=e*map(p+.002*e);}
  n=normalize(n);
  float d=car(p),f;
  e=reflect(r,n);
  f=.04+.96*pow(1.-max(dot(n,-r),0.),5.);
  c=e.y>0.?sky(e):gr(p-e*p.y/e.y);
  if(d<.01){
    // black lacquer and glass mirror the night; tyres do not
    c=M==2?length(vec2(P.y-.31,abs(P.z+.05)-1.4))<.18?.1*li(p,n)+c*.12:li(p,n)*.02:.01*li(p,n)+c*(M==1?.4+f:f*2.+.15)+pow(max(dot(e,MD),0.),300.)*4.+pow(max(dot(e,normalize(vec3(1,.7,-.4))),0.),40.)*vec3(.4,.5,1)*.5;
    // the scanner, the headlights and the tail lights
    if(P.z>2.2&&abs(P.y-.36)<.035&&abs(P.x)<.42)c+=vec3(1,.03,.01)*(sl((floor(P.x*10.)+.5)/10.)*12.+.04)*step(.12,fract(P.x*10.));
    if(P.z>2.2&&abs(P.y-.27)<.045&&abs(abs(P.x)-.66)<.13)c+=vec3(1,.9,.7)*E*8.;
    if(P.z<-2.2&&abs(P.y-.56)<.05&&abs(P.x)<.78)c+=vec3(1,.05,.02)*(.6+step(.5,fract(P.x*8.)));
    if(K==6.)c=vec3(.1,1,.3)*(pow(1.-abs(dot(n,r)),4.)*1.5+smoothstep(.04,.0,abs(fract(P.z*3.)-.5)-.45)+smoothstep(.04,.0,abs(fract(P.y*6.)-.5)-.45)*.5+.01);
  }else{
    // poles are grey wood, the barricade has red and white stripes and two blinking lamps
    c=li(p,n)*(p.z>F-.2&&p.z<F+.2?.4*step(.5,fract((p.x+p.y)*1.2))*vec3(1,.7,.7)+vec3(.15,0,0):vec3(.08));
    if(abs(p.z-F)<.2&&abs(p.y-1.25)<.1&&abs(abs(p.x+1.8)-3.)<.15)c+=vec3(1,.5,.05)*step(.5,fract(T*2.133))*20.;
    if(K==8.&&p.y>5.8&&p.y<6.&&abs(p.x-2.4)<.5)c+=vec3(1,.5,.15)*30.;
    // the trailer is lit inside
    if(K==11.&&p.z>25.&&abs(p.x)<1.25&&p.y>1.2&&p.y<3.9)c+=vec3(1,.75,.45)*(.3+.6*exp(-abs(p.z-32.)*.3));
  }
  return c;
}
// lamps seen along a ray up to distance m: oncoming cars on the other lane, and the scanner head
vec3 gw(vec3 o,vec3 r,float m){
  vec3 c=vec3(0),h;
  float d,a;
  for(float i=0.;i<9.;i++){
    // during the turbo boost the same lamps are sparks streaming from the exhaust
    a=fract(T*.7+i*.125);
    h=(i>7.?C+vec3(sx(T),.36+J,2.45):K==10.?C+vec3((h1(vec2(i,floor(T*.7+i*.125)))-.5)*4.*a,.45+J+(h1(vec2(floor(T*.7+i*.125),i))-.4)*6.*a-a*a*3.,-2.7-a*7.):vec3(-3.6+mod(i,2.)*1.3-.65,.6,150.-mod(T*50.+floor(i/2.)*43.,170.)))-o;
    d=dot(h,r);
    if(d>0.&&d<m&&(i<8.?V>1.&&K<10.||K==10.:K!=4.))d=length(h-r*d),c+=(i>7.?vec3(1,.03,.01):K==10.?vec3(.5,.7,1)*3.*(1.-a):vec3(1,.9,.7))*.0025/(d*d+.0004);
  }
  return c;
}
// the dashboard: panel, a bar-graph speedometer, rows of buttons, and the voice box in the middle
vec4 da(vec2 u){
  float y=u.y+.25-.06*u.x*u.x,a=max(vo(),step(40.,Z)*exp(-fract(Z*4.)*5.)),s,c;
  vec3 k=vec3(.012,.012,.016)*(1.+u.y);
  if(u.y>.82||abs(u.x)>1.45-u.y*.3)return vec4(k*.4,1);
  if(y>0.)return vec4(0);
  // voice box: three columns of red segments that grow from the middle
  vec2 q=vec2(abs(u.x),u.y+.62);
  s=floor(q.x/.16+.5);
  c=abs(q.y);
  if(s<2.&&abs(q.x-s*.16)<.055)k+=vec3(1,.05,.02)*(step(c,a*(.34-s*.12)+.02)*3.+.03)*step(.4,fract(c*18.))*step(c,.34-s*.1);
  // speedometer: a row of segments from green to red, and rows of little lamps that blink with the beat
  q=u-vec2(-1.08,-.42);
  if(abs(q.y)<.06&&abs(q.x)<.42)k+=mix(vec3(.1,1,.2),vec3(1,.1,0),q.x*1.2+.5)*(step(q.x+.42,V/60.*.84)*2.+.02)*step(.3,fract(q.x*25.));
  q=u-vec2(1.05,-.5);
  if(abs(q.x)<.36&&abs(q.y)<.16){
    q=floor(q*vec2(11,6));
    k+=vec3[3](vec3(1,.6,0),vec3(.1,.9,.2),vec3(1,.1,0))[int(h1(q)*3.)]*step(.6,h1(q+floor(T*2.133)))*1.5*step(.25,fract(u.x*30.5))*step(.3,fract(u.y*37.5));
  }
  return vec4(k,1);
}
void main(){
  T=R.z;Z=T/1.875;
  float s=floor(Z/2.),t,d,i;
  K=float(int[34](0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,2,3,4,5,7,3,5,2,11,11,0,0)[int(min(s,33.))]);
  L=T-floor(Z/4.)*7.5;
  N=smoothstep(54.,62.,Z);
  E=step(8.,Z)*(K>0.&&K!=6.?1.:0.);
  V=Z<8.||K==8.||K==11.?0.:K==4.?40.+Z*.3:30.;
  D=V*T;
  J=Q=G=0.;C=vec3(0);F=999.;
  d=mod(Z*16.,32.);
  W=Z>=40.&&Z<56.?exp(-min(min(d,abs(d-6.)+99.*step(d,6.)),abs(d-28.)+99.*step(d,28.))*1.5):0.;
  MD=normalize(vec3(-.5,.3,1));
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  vec3 ro,ta,col;
  float z=2.;
  if(K<1.){ro=vec3(.5*sin(T*.3),.5,3.4);ta=vec3(0,.36,2.3);z=3.;}
  else if(K<2.){ro=vec3(1.5+L*.35,.55+L*.04,4.+L*.7);ta=vec3(0,.6,0);}
  else if(K<3.){ro=vec3(4.2,.45,1.5*sin(L*.3));ta=vec3(0,.65,.3);}
  else if(K<4.){ro=vec3(1.2*sin(L*.25),.3,9.);ta=vec3(0,.6,0);z=3.4;}
  else if(K<5.){ro=vec3(.3,1.,-.2);ta=ro+vec3(-.06,-.05,1);z=1.2;}
  else if(K<6.){d=L*.2+s;ro=vec3(3.+5.*cos(d),8.,8.*sin(d));ta=vec3(0,.5,0);}
  else if(K<7.){d=L*.5;ro=vec3(6.*sin(d),2.,6.*cos(d));ta=vec3(0,.4,0);}
  else if(K<9.){d=L*.12+2.;ro=vec3(6.*sin(d),1.3,6.*cos(d));ta=vec3(0,.8,0);}
  else if(K<10.){ro=vec3(1.,.9,-7.);ta=vec3(0,.8,10);F=170.-L*21.;}
  else if(K<11.){
    // turbo boost, in slow motion: the car leaps the barricade
    d=(L-3.75)/3.;
    J=max(2.5*(1.-d*d),0.);Q=.18*clamp(d,-1.,1.);
    F=-15.*d;D=15.*d;
    ro=vec3(7.5,1.,-2.*d);ta=vec3(0,1.+J*.6,0);
  }else{C.z=min(8.+L*L*.7,31.);J=sat((C.z-20.5)/4.5)*1.3;Q=C.z>20.5&&C.z<25.?-.28:0.;ro=vec3(-1.7,1.2,13.);ta=vec3(0,1.9,26);}
  if(K==7.){
    // inside the scanner: rings of red lamps rush past, each one sweeping like the car's nose
    d=atan(u.y,u.x)/3.1416;
    t=.5/length(u)+T*3.;
    i=floor(t*2.);
    vec2 q=fract(vec2(d*16.,t*2.))-.5;
    col=vec3(1,.04,.01)*(smoothstep(.35,.2,length(q))*(exp(-abs(floor(abs(d)*16.)/16.*.84-.42-sx(T-i*.05)*1.17)*9.)*8.+.03)+.01)*sat(length(u)*1.5)*(1.+2.*exp(-fract(Z*2.)*6.));
  }else{
    vec3 w=normalize(ta-ro),x=normalize(cross(vec3(0,1,0),w)),r=normalize(w*z+x*u.x+cross(w,x)*u.y),p;
    if(K==6.)r=normalize(w*z*(1.-.08*dot(u,u))+x*u.x+cross(w,x)*u.y);
    t=tr(ro,r,200.);
    p=ro+r*t;
    bool hh=t<200.;
    if(hh)col=ob(p,r);
    else if(r.y<0.){
      t=-ro.y/r.y;
      p=ro+r*t;
      col=gr(p);
      // the road is wet: the car, its lights and the sky lie on it
      if(abs(p.x+1.8)<3.8){
        vec3 e=reflect(r,normalize(vec3(.02*sin(p.z*7.+D*7.),1,.01*sin(p.x*13.))));
        d=tr(p,e,60.);
        col+=(d<60.?ob(p+e*d,e):sky(e)+gw(p,e,d))*(.06+.9*pow(1.+r.y,8.));
      }
    }else{G=1.;col=sky(r);}
    if(hh||r.y<0.)col=mix(col,vec3(.015,.025,.06)+N*vec3(.25,.1,.04),1.-exp(-min(t,400.)*.006));
    // haze: the headlight beams in the night air
    d=0.;
    for(i=0.;i<32.;i++){
      p=ro+r*min(t,80.)*(i+.5)/32.-C-vec3(0,.3+J,2.4);
      p.x=abs(p.x)-.62;
      d+=smoothstep(.9,.98,p.z/length(p))/(dot(p,p)+4.);
    }
    col+=vec3(1,.85,.65)*E*d*min(t,80.)*.003;
    // halos of the lamps, the boost flame
    col+=gw(ro,r,t);
    vec3 h;
    if(K==10.){h=C+vec3(0,.45+J,-2.6)-ro;d=length(h-r*max(dot(h,r),0.));col+=vec3(.4,.6,1)*.02/(d*d+.002)*sat(1.-abs(L-3.75)*.5);}
    if(K==6.)col=hh?col:vec3(.1,1,.3)*(.01+.03*step(.97,fract(length(u)*4.))+smoothstep(.003,.0,abs(u.x)*abs(u.y))*.2+.4*pow(fract(atan(u.y,u.x)/6.283-T*.5),40.));
    if(K==4.){vec4 g=da(u);col=mix(col,g.rgb,g.a);}
  }
  O=vec4(clamp(col,0.,40.)*smoothstep(0.,1.,T),1);
}
