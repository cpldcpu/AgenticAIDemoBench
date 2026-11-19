#version 300 es
precision highp float;
uniform vec4 R;          // width, height, seconds, bar (fractional, follows the rubato)
uniform sampler2D A,B;   // A: title texture; B: the 88 strings (struck, ringing, damper/key, seconds since struck)
out vec4 O;
// UNA CORDA - the picture. Units are metres. Inside a concert grand: strings run along +z at y=0, key k
// (0 = A0 .. 87 = C8) at x=(k-43.5)*S; hammers strike them from below at z=0, dampers sit on them at z=.055.
const float S=.0141;
float T,Bz,E,I,PX,M,KD; // seconds, bar, outside view (lid, legs, stage), endless strings, pixel angle, material, key depth
vec3 Lp,Lc;
const float WK[7]=float[7](0.,2.,3.,5.,7.,8.,10.); // semitones of the white keys from A             // spotlight position and colour
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n2(vec2 x){vec2 i=floor(x),f=x-i;f*=f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
vec4 key(float k){return texelFetch(B,ivec2(k,0),0);}
float len(float k){return I>0.?1e3:2.*exp(-.03*k)+.03;}   // speaking length to the bridge
float box(vec3 p,vec3 b){p=abs(p)-b;return length(max(p,0.))+min(max(p.x,max(p.y,p.z)),0.);}
// the rim in plan view: straight on the bass side, the bentside follows the bridge
float ol(vec2 q){float a=abs(q.x)-.72,b=(q.y-max(len(q.x/S+43.5),.5)-.13)*.3,h=max(.1-abs(a-b),0.);return max(max(a,-.36-q.y),max(a,b)+h*h*2.5);}
// the cast-iron plate in plan view: frame, the band over the pin block, two struts, a brace; round holes
float pl(vec2 q){
  float o=ol(q),x=abs(abs(q.x-.02)-.31),d=min(min(abs(o+.07)-.045,max(q.y+.035,-.33-q.y)),min(x-.017,abs(q.y-.8+.4*q.x)-.026));
  d=max(d,-length(vec2(x,mod(q.y,.09)-.045))+.009);
  d=max(d,-length(vec2(mod(q.x,.1)-.05,q.y+.15))+.016*step(.32,abs(q.x)));
  return max(d,o+.025);
}
float map(vec3 p){
  float k=clamp(floor(p.x/S+44.),0.,87.),x=p.x-(k-43.5)*S,d,e,j;
  vec4 s=key(k);
  M=1.;
  // soundboard, and the bridge that carries the strings' far ends
  d=max(abs(p.y+.085)-.01,ol(p.xz));
  e=p.x/S+43.5;
  j=-.06*exp(-.03*e)/S;
  e=max(max(abs(p.z-len(e))/sqrt(1.+j*j)-.011,abs(p.y+.04)-.034),abs(p.x)-.62);
  if(e<d)d=e,M=3.;
  if(I>0.)return min(p.y+.07,d);
  // the plate, gold
  e=max(pl(p.xz),abs(p.y+.03)-.013)-.003;
  if(e<d)d=e,M=0.;
  // capo bar across the strings
  e=max(length(p.yz-vec2(.012,-.06))-.01,abs(p.x)-.63);
  if(e<d)d=e,M=0.;
  // tuning pins, three per key in two staggered rows
  for(j=-1.;j<2.;j++){
    e=max(length(vec2(x-j*.0045,p.z+.2+.05*mod(j+k,2.)))-.0032,abs(p.y-.008)-.027);
    if(e<d)d=e,M=5.;
  }
  // dampers sit on the strings, lifted by the key or by the pedal
  if(k<68.){e=box(vec3(x,p.y-.022-.009*min(s.b,1.),p.z-.056),vec3(S*.34,.016,.022))-.0015;if(e<d)d=e,M=4.;}
  // hammers: felt head and shank, thrown up against the strings
  j=s.r*.014-.024;
  e=min(box(vec3(x,p.y-j,p.z),vec3(S*.36,.009,.008))-.004,max(length(vec2(x,p.y-j+.01))-.0025,abs(p.z+.1)-.1));
  if(e<d)d=e,M=6.;
  // the rim: lacquered outside, wood inside
  e=max(abs(ol(p.xz)+.025)-.025,abs(p.y+.14)-.19);
  if(e<d)d=e,M=2.;
  if(E>0.){
    // the keyboard; white key w, black keys between
    e=max(max(abs(p.x)-.66,abs(p.z+.445)-.085),abs(p.y+.15)-.03);
    if(e<d)d=e,M=2.;
    e=max(abs(abs(p.x)-.645)-.02,max(abs(p.z+.44)-.09,abs(p.y+.11)-.05));
    if(e<d)d=e,M=2.;
    float w=clamp(floor((p.x+.611)/.0235),0.,51.),m=21.+12.*floor(w/7.)+WK[int(mod(w,7.))];
    KD=step(1.5,key(m-21.).b);
    e=box(vec3(p.x+.611-(w+.5)*.0235,p.y+.112+KD*.007,p.z+.44),vec3(.0105,.009,.08))-.001;
    if(e<d)d=e,M=7.;
    w=floor((p.x+.611)/.0235+.5);m=21.+12.*floor((w-1.)/7.)+WK[int(mod(w-1.,7.))];
    j=mod(w-1.,7.);
    KD=step(1.5,key(m-20.).b);
    e=box(vec3(p.x+.611-w*.0235,p.y+.1+KD*.007,p.z+.405),vec3(.0065,.008,.047))-.0012;
    if(j!=1.&&j!=4.&&abs(p.x)<.6&&e<d)d=e,M=8.;
    // the lid, hinged on the straight side and propped open
    vec2 q=mat2(.83,-.56,.56,.83)*(p.xy-vec2(-.72,.06));
    e=max(abs(q.y-.008)-.008,ol(vec2(q.x-.72,p.z)));
    if(e<d)d=e,M=2.;
    e=max(length(p.xz-vec2(.6-.05*p.y,.4))-.008,abs(p.y-.5)-.45);
    if(e<d)d=e,M=2.;
    // legs, the floor of the stage and the curtain behind
    e=max(min(length(vec2(abs(p.x)-.6,p.z+.2)),length(p.xz-vec2(-.5,1.9)))-.05-.015*sin(p.y*30.),abs(p.y+.63)-.32);
    if(e<d)d=e,M=2.;
    e=p.y+.95;
    if(e<d)d=e,M=9.;
    e=4.-p.z+.12*sin(p.x*7.+sin(p.x*3.))+.04*sin(p.x*23.);
    if(e<d)d=e,M=10.;
  }
  return d;
}
vec3 nor(vec3 p){vec3 n=vec3(0);for(int i=0;i<4;i++){vec3 e=.5773*(2.*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.);n+=e*map(p+e*2e-4);}return normalize(n);}
// light of the stage spot reaching p (cone and distance)
vec3 spot(vec3 p){vec3 l=Lp-p;return Lc*max(smoothstep(.75,.95,dot(normalize(-l),normalize(vec3(0,-.1,.5)-Lp))),I)/dot(l,l);}
// the strings, worked out exactly instead of marched: every one is a cylinder along z, so a ray meets the
// few that cross the band |y|<.006 in key order. Coverage is the overlap of the pixel with the string
// (or with the blur of a vibrating one); returns premultiplied colour and alpha
vec4 str(vec3 o,vec3 d,float tm){
  vec4 c=vec4(0),K;
  float dy=abs(d.y)<1e-5?1e-5:d.y,t0=(-.006-o.y)/dy,t1=(.006-o.y)/dy,a,b,k,n,r,L,x,tc,z,u,w,q,y;
  a=max(min(t0,t1),0.);b=min(max(t0,t1),tm);
  if(a>=b)return c;
  t0=floor((o.x+d.x*a)/S+44.);t1=floor((o.x+d.x*b)/S+44.);
  n=min(abs(t1-t0),12.);
  for(float i=0.;i<13.;i++){
    if(i>n)break;
    k=t0+i*sign(t1-t0);
    if(I>0.)k=mod(k,88.);
    if(k<0.||k>87.)continue;
    K=key(k);
    L=len(k);
    q=k<20.?1.:k<28.?2.:3.;
    r=k<20.?.0024-k*4e-5:k<28.?.0014:.00055;
    for(float j=0.;j<3.;j++){
      if(j>=q)break;
      x=(t0+i*sign(t1-t0)-43.5)*S+(j-(q-1.)*.5)*.0042;
      vec2 e=vec2(x,0)-o.xy;
      tc=dot(e,d.xy)/dot(d.xy,d.xy);
      z=o.z+d.z*tc;
      if(tc<0.||tc>tm||z<-.2-.05*mod(j-1.+k,2.)||z>L+.06)continue;
      u=sat((z+.06)/(L+.06));
      w=tc*PX+1e-4;
      // a ringing string is a blur between its turning points
      y=r+K.g*.0022*sin(3.14*u)*(1.-.5*I);
      e-=d.xy*tc;
      b=length(e);
      a=max(0.,min(b+w,y)-max(b-w,-y))/(2.*w)*(r+.3*(y-r))/y;
      // hair-like highlight of a wire (Kajiya-Kay), copper wound in the bass
      vec3 l=normalize(Lp-vec3(x,0,z)),h=k<28.?vec3(.95,.5,.25):vec3(.8,.82,.85);
      float tl=l.z,tv=-d.z;
      h*=spot(vec3(x,0,z))*(.15*sqrt(1.-tl*tl)+pow(max(sqrt((1.-tl*tl)*(1.-tv*tv))-tl*tv,0.),90.))+.002;
      // and the light of the note: a glow while it rings, a flash that runs along the string when struck
      z=I>0.?z-o.z+1.:z;
      vec3 m=mix(vec3(1,.45,.15),vec3(.8,.85,1),sat(k/88.+I*.4))*(K.g*sin(3.14*u)*3.+K.r*8.*exp(-abs(z-K.a*(2.+12.*I))*8.))*(1.+I);
      c+=(1.-c.a)*a*vec4(h+m,1);
      // with a halo around it
      c.rgb+=(1.-c.a)*m*exp(-b*250.)*.5;
    }
  }
  return c;
}
void main(){
  T=R.z;Bz=R.w;
  vec2 f=gl_FragCoord.xy,uv=(2.*f-R.xy)/R.y;
  float b=Bz,u,c=floor(b),fo=0.,ap=.002,fov=1.6,sh,t,d,m,ref=1.;
  vec3 ro,ta,up=vec3(0,1,0),col=vec3(0),acc=vec3(0);
  E=0.;I=0.;
  Lp=vec3(.5,3.,-1.);Lc=vec3(1,.82,.62)*12.;
  // ---------------- shots, cut on the phrases of the music ----------------
  if(b<2.){u=b/2.;ro=vec3(-.2+.06*u,.05,-.02);ta=ro+vec3(1,-.28,.3);fo=.12;ap=.012;}
  else if(b<6.){u=(b-2.)/4.;ro=vec3(-.5+.5*u,.3,-.32);ta=vec3(-.35+.5*u,0,.3);ap=.006;}
  else if(b<10.){u=(b-6.)/4.;ro=vec3(.1-.15*u,.11,-.04+.08*u);ta=ro+vec3(-.1,-.16,1);fo=.3;ap=.008;}
  else if(b<14.){u=(b-10.)/4.;ro=vec3(.25-.3*u,.2,-.55);ta=vec3(.15-.3*u,-.02,-.15);ap=.008;}
  else if(b<18.){u=(b-14.)/4.;ro=vec3(.1,1.7+.5*u,.9);ta=vec3(0,0,.9);up=vec3(sin(u*.5-1.4),0,cos(u*.5-1.4));fov=2.;ap=0.;}
  else if(b<26.){u=fract(b/2.);
    if(b<20.){ro=vec3(.45-.3*u,.12,-.15);ta=vec3(-.2,0,.5);fo=.4;ap=.006;}
    else if(b<22.){ro=vec3(-.2+.1*u,.1,-.09);ta=ro+vec3(.15,-.12,.14);up=vec3(.3,1,0);fo=.15;ap=.01;}
    else if(b<24.){ro=vec3(.1-.1*u,.08,-.3);ta=vec3(-.05-.1*u,0,-.2);fo=.13;ap=.01;}
    else{u=u*1.2-.6;ro=vec3(1.3*sin(u),.9,.6-1.3*cos(u));ta=vec3(0,-.05,.7);ap=.003;}}
  else if(b<32.){I=1.;u=b-26.;ro=vec3(.3*sin(c*2.),.04+.04*fract(c*.37)+max(b-30.,0.)*max(b-30.,0.)*.3,T*1.5);ta=ro+vec3(.3*sin(c*5.),-.12+max(b-30.,0.)*.3,1);up=vec3(.2*sin(c*3.+u),1,0);fo=1.;ap=.004;
    Lp=ro+vec3(0,2,20);Lc=vec3(.6,.7,1)*400.;}
  else if(b<36.){E=1.;u=(b-32.)/4.;ro=vec3(2.1-.4*u,.1,-1.9+.3*u);ta=vec3(0,-.15,.6);ap=.006;}
  else if(b<40.){E=1.;u=(b-36.)/4.;ro=vec3(-1.+.25*u,.14,-.95);ta=vec3(.1,-.11,-.4);ap=.008;}
  else if(b<44.){u=(b-40.)/4.;ro=vec3(.15,.4+.8*u,.25);ta=vec3(.25,0,.3);up=vec3(-1,0,0);ap=.003;}
  else{E=1.;u=(b-44.)/2.;ro=vec3(1.6+.5*u,2.4+u,-1.6);ta=vec3(0,-.3,.8);ap=.0;}
  vec3 w=normalize(ta-ro),cx=normalize(cross(up,w)),cy=cross(w,cx),rd=normalize(uv.x*cx+uv.y*cy+fov*w);
  PX=1.4/R.y/fov;
  fo=fo>0.?fo:length(ta-ro);
  // ---------------- march, then one reflection ----------------
  for(int bo=0;bo<2;bo++){
    t=bo>0?.003:.0;
    for(int i=0;i<160;i++){d=map(ro+rd*t);if(abs(d)<t*PX*.5||t>30.)break;t+=d*.8;}
    vec3 p=ro+rd*t,n=vec3(0,1,0),cc=I>0.?vec3(.02,.03,.08)*(1.-rd.y)+vec3(1,.6,.3)*.3*exp(-abs(rd.y)*40.)+step(.997,h1(floor(rd.xy*400.)))*vec3(.6)*sat(rd.y*8.):vec3(.3,.25,.2)*smoothstep(.8,.9,dot(rd,normalize(vec3(-.6,1,.4))))+vec3(.006,.008,.012)*sat(rd.y),al,sp;
    float r=0.,g=40.,o=1.,kd=1.;
    m=M;
    if(t<30.){
      n=nor(p);vec3 l=normalize(Lp-p),h;
      // materials: albedo, how much it mirrors, how sharp its highlight is
      vec4 K=key(clamp(floor(p.x/S+44.),0.,87.));
      if(m<.5){al=vec3(.85,.52,.17);r=.3+.1*n2(p.xz*300.);g=50.;kd=.35;
        // the maker's name, cast into the plate
        vec2 q=vec2(p.x*1.6+.5,(p.z+.14)*7.+.5);
        if(abs(q.x-.5)<.5&&abs(q.y-.5)<.5){u=texture(A,vec2(q.x,(4.-q.y)*.25)).r;al*=1.-.6*u;}
      }
      else if(m<1.5){al=vec3(.55,.36,.18)*(.7+.3*sin(p.x*300.+6.*n2(p.xz*vec2(20,3))));}
      else if(m<2.5){al=vec3(.004);r=.08+.5*pow(1.-abs(dot(n,rd)),4.);g=300.;
        if(ol(p.xz)<-.03&&p.y<.04)al=vec3(.12,.05,.02),r=.04;}
      else if(m<3.5){al=vec3(.5,.28,.12);}
      else if(m<4.5){al=p.y<.016+.009*min(K.b,1.)?vec3(.01):vec3(.09,.045,.02);r=.03;}
      else if(m<5.5){al=vec3(.5);r=.5;g=60.;kd=.2;}
      else if(m<6.5){al=p.y<-.02+K.r*.014?vec3(.6,.1,.06):vec3(.8,.77,.68);}
      else if(m<7.5){al=vec3(.8,.78,.7);r=.05;g=200.;}
      else if(m<8.5){al=vec3(.01);r=.1;g=200.;}
      else if(m<9.5){al=vec3(.05,.025,.012)*(.6+.4*n2(p.xz*vec2(2,30)));r=.08;g=200.;}
      else {al=vec3(.12,.006,.008)*(.5+.5*sin(p.x*23.+sin(p.x*7.)));}
      // soft shadow towards the spotlight
      sh=1.;
      for(float s=.004;s<1.5;){d=map(p+n*.001+l*s);sh=min(sh,12.*d/s);s+=max(d,.006);if(sh<.01)break;}
      sh=sat(sh);
      // and the strings' own shadows, worked out where the light ray crosses their plane
      if(p.y<-.001){u=-p.y/l.y;vec2 q=p.xz+l.xz*u;d=q.x/S+43.5;
        sh*=1.-.6*(1.-I)*step(q.y,len(d))*step(-.2,q.y)*smoothstep(.3*S,0.,abs(fract(d)-.5)*S-.003)*smoothstep(1.5,.1,u);}
      h=normalize(l-rd);vec3 Li=spot(p)*sh;
      sp=mix(vec3(.04),al,1.-kd);
      cc=al*kd*Li*max(dot(n,l),0.)+sp*Li*pow(max(dot(n,h),0.),g)*(g+8.)/25.+al*vec3(.04,.045,.06)*(.6+.4*n.y)*o;
      // a cool light from behind the stage draws the outline
      l=normalize(vec3(-.4,.5,.9));h=normalize(l-rd);
      cc+=E*step(m,8.5)*vec3(.25,.3,.4)*(al*max(dot(n,l),0.)*kd+sp*pow(max(dot(n,h),0.),g)*(g+8.)/25.);
      // the strings light what is under them
      cc+=(m<.5||m>3.&&m<7.?al:al*.4)*vec3(1,.5,.2)*K.g*exp(min(p.y,0.)*40.)*step(p.z,len(clamp(floor(p.x/S+44.),0.,87.)))*(1.-E*.5);
      if(I>0.){cc=vec3(.001)+.02*vec3(.4,.6,1)*smoothstep(-1.,1.,p.z-ro.z);r=.7;}
    }
    vec4 sc=str(ro,rd,t);
    cc=mix(cc,sc.rgb/max(sc.a,1e-4),sc.a);
    // haze: the beam of the spotlight, with dust turning in it
    if(bo<1){
      float e=t>30.?30.:t;
      for(float s=0.;s<1.;s+=1./32.){vec3 q=ro+rd*e*(s+h1(f)/32.);
        acc+=spot(q)*(.0008+.08*pow(n2(q.xy*30.+T*.1+q.z*17.),12.))*e/32.*(.5+E);}
      O.a=min(abs(1.-fo/t)*ap*300.,4.);
    }
    col+=cc*ref+acc*ref;acc=vec3(0);
    ref*=r;
    if(ref<.01||t>30.)break;
    ro=p+n*.002;rd=reflect(rd,n);
  }
  O.rgb=min(col,40.);
}
