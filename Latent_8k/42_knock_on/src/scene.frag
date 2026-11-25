#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// KNOCK-ON - the picture. A domino is a box that turns about its front bottom edge. Once it has struck the next one,
// its top edge slides down the back of that one, so its angle follows from the next domino's angle alone:
//   a = a1 + asin((d*cos(a1) - th)/h)      (spacing d, thickness th, height h)
// Only the front domino falls freely. All angles behind it follow from that one, by applying the rule again and again.
// Spacing .7, thickness .16, height 1: the first strike comes at 32.7 degrees, and a long row comes to rest at 76.8.
// The same times drive the soundtrack: every strike is a note there.
float T,A[16],G[12],K,C,fl;
vec3 L;
vec2 P;
int S;
const float D=.7,H=.16;
mat2 rt(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float bx(vec3 p,vec3 b){p=abs(p)-b;return length(max(p,0.))+min(max(p.x,max(p.y,p.z)),0.)-.015;}
// one domino: q relative to the middle of its back bottom edge, a = lean angle. L keeps the domino's own coordinates.
float dom(vec3 q,float a){
  q.x-=H;
  q.xy*=rt(a);
  L=q;
  return bx(q-vec3(-H*.5,.5,0),vec3(H*.5-.015,.485,.235));
}
// lean angles behind a front domino that is a fraction u of the way to its first strike; A[o]: the front one
void fill(int o,float x){
  float a=.5704*fract(x)*fract(x);
  for(int i=0;i<8;i++){A[o+i]=a;a=min(1.5708,a+asin(.7*cos(a)-.16));}
}
// angle of domino k of a row of N, x = how many dominoes have been struck (front index + fraction)
float an(float k,float x,float N,int o){
  float f=floor(x),p;
  if(k>f)return 0.;
  if(f>=N-1.){p=min(1.5708,.5704*(x-N+1.)*(x-N+1.));return k>N-1.5?p:k>N-2.5?p+asin(.7*cos(p)-.16):1.34;}
  return A[o+int(min(f-k,7.))];
}
// a row of N dominoes along +x, domino k with its back at x = k*D
float ch(vec3 q,float x,float N,int o){
  float k=clamp(floor(q.x/D),0.,N-1.),r=1e3,d,i;
  vec3 l;
  for(int j=-1;j<2;j++){
    i=k-float(j);
    if(i>=0.&&i<N){d=dom(q-vec3(i*D,0,0),an(i,x,N,o));if(d<r){r=d;l=L;K=i;}}
  }
  L=l;
  return r;
}
float zc(float x){return 1.6*(1.-cos(.11*x));}
float map(vec3 p){
  float d,e,k,i,h,j,z;
  vec3 l;
  if(S<2){
    C=0.;
    p.z-=zc(p.x);
    return ch(p,T<8.?max(T-7.,0.):(T-8.)/.125+1.,999.,0);
  }
  if(S==2){
    // two rows, struck at the same moment, the right one a little faster: they drift apart like two players phasing
    p.z-=zc(p.x);
    d=ch(p-vec3(0,0,.85),(T-24.)/.125,999.,0);
    l=L;k=K;
    e=ch(p+vec3(0,0,.85),(T-24.)/.1212,999.,8);
    C=d<e?1.:2.;
    if(d<e){L=l;K=k;}
    return min(d,e);
  }
  if(S==3){
    // an Archimedean spiral r = .191*phi, walked from the outside in
    z=length(p.xz);
    h=atan(p.z,p.x);
    h+=6.2832*round((z/.191-h)/6.2832);
    h=max(h,9.);
    C=3.;
    return ch(vec3(98.1-.0955*h*h,p.y,z-.191*h),(T-40.)/.125,128.,0)*.8;
  }
  if(S==4){
    // each domino half again as tall as the one before: .12 to 10.4
    k=clamp(floor(log2(1.+max(p.x,0.)/.1704)/.585),0.,11.);
    d=1e3;
    for(int j=-1;j<2;j++){
      i=k+float(j);
      if(i>=0.&&i<12.){
        h=.12*pow(1.5,i);
        e=dom((p-vec3(.1704*(pow(1.5,i)-1.),0,0))/h,G[int(i)])*h;
        if(e<d){d=e;l=L;K=i;}
      }
    }
    L=l;C=4.;
    return d;
  }
  // the field: 40 rows of 70, struck from the middle row outwards, two dominoes later for each row further out
  j=clamp(floor(p.z/.62+20.),0.,39.);
  d=1e3;
  for(int n=0;n<2;n++){
    z=(j-19.5)*.62;
    e=ch(vec3(p.x+24.5,p.y,p.z-z),(T-72.)/.125-2.*floor(abs(j-19.5)),70.,0);
    if(e<d){d=e;l=L;k=K;P=vec2(K*D-24.1,z);}
    j=clamp(j+(p.z>z?1.:-1.),0.,39.);
  }
  L=l;K=k;C=5.;
  return d;
}
vec3 nr(vec3 p){vec2 e=vec2(.002,-.002);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
float top(){return S==4?11.:1.05;}
// march the dominoes only; the table is the plane y = 0 and is intersected exactly
float march(vec3 o,vec3 r,float m){
  float t=0.,d,y=top();
  if(o.y>y){if(r.y>=0.)return m;t=(o.y-y)/-r.y;}
  for(int i=0;i<160;i++){
    d=map(o+r*t);
    if(d<.0005*t)return t;
    t+=d;
    if(t>m||o.y+r.y*t>y+.01&&r.y>0.)return m;
  }
  return m;
}
// the 4-2 tile of the opening, as a picture: ivory on vermilion, ink pips
vec3 pic(vec2 p){
  vec3 I=vec3(.02,.025,.04);
  vec2 q=abs(p)-vec2(19.5,9),c=vec2(p.x+10.5,p.y);
  if(length(max(q,0.))>1.5)return vec3(.75,.06,.03);
  if(abs(p.x)<.4&&abs(p.y)<8.)return I;
  if(p.x>0.){c.x-=21.;if(c.x*c.y<0.)c=vec2(9);}
  if(length(abs(c)-5.)<2.3)return I;
  return vec3(.9,.85,.72);
}
vec3 Lp,Lt;
float sh(vec3 p){
  vec3 r=normalize(Lp-p);
  float s=1.,t=.02,d,m=length(Lp-p),y=top();
  for(int i=0;i<40;i++){
    d=map(p+r*t);
    s=min(s,10.*d/t);
    t+=clamp(d,.01,.4);
    if(s<.01||t>m||p.y+r.y*t>y)break;
  }
  return clamp(s,0.,1.);
}
vec3 env(vec3 r){return vec3(1,.95,.88)*(smoothstep(.55,.85,r.y)*smoothstep(.0,.5,abs(r.x-.2)+.2)*1.2+.004*smoothstep(-.1,.3,r.y));}
// light: a warm spot over the action, with a soft cone
vec3 lit(vec3 p,vec3 n,vec3 c,float g,float s,vec3 v){
  vec3 l=Lp-p,d=normalize(l);
  float a=dot(l,l),k=max(dot(n,d),0.);
  float sp=smoothstep(fl,fl+.2,dot(-d,normalize(Lt-Lp)));
  return c*(k*sp*s*vec3(1,.88,.72)*dot(Lt-Lp,Lt-Lp)/a*1.6+vec3(.5,.6,.8)*.03*(.6+.4*n.y))
    +g*pow(max(dot(n,normalize(d-v)),0.),80.)*sp*s*3.;
}
vec3 shade(vec3 p,vec3 r,float x){
  vec3 n=nr(p),c=vec3(.88,.86,.82);
  map(p);
  int k=int(K)%12;
  if(C>4.)c=vec3(.025);
  float a=1.,i,f;
  if(L.x<-H+.01){
    // the painted back: the colour of the note this domino plays (A D E F# B as ink, vermilion, saffron, jade, rose)
    c=vec3[5](vec3(.8,.08,.03),vec3(.95,.5,.04),vec3(.02,.4,.28),vec3(.03,.09,.38),vec3(.9,.3,.4))[int[12](3,0,1,3,2,1,4,3,0,4,2,1)[k]];
    if(C>4.)c=pic(P);
    if(C<1.&&K<.5){
      // the first domino is a real one: ivory, four and two
      vec2 q=vec2(abs(L.z),L.y-.5);
      c=vec3(.9,.86,.74);
      if(abs(q.y)<.008&&q.x<.2)c=vec3(.03);
      q=L.y>.5?abs(vec2(L.z,L.y-.75)):vec2(L.z,L.y-.25);
      if(L.y<.5&&q.x*q.y<0.)q=vec2(1);
      if(length(abs(q)-.12)<.045)c=vec3(.03);
    }
  }
  for(i=1.;i<5.;i++)a-=(i*.04-map(p+n*i*.04))*.6/i;
  f=.04+.96*pow(1.-max(dot(n,-r),0.),5.);
  return lit(p,n,c,C>4.?.08:.5,x>0.?sh(p+n*.003):1.,r)*clamp(a,0.,1.)+env(reflect(r,n))*f*(C>4.?.2:.5);
}
void main(){
  T=R.z;
  vec2 u=(gl_FragCoord.xy-.5*R.xy)/R.y;
  S=T<8.?0:T<24.?1:T<40.?2:T<56.?3:T<72.?4:5;
  vec3 o,t,w,c=vec3(0),p,n;
  float f=1.8,x=0.,y,s=0.,k=0.,h=1.,lf=1.;
  vec3 lo=vec3(-2,6,-2.5);
  fl=.82;
  if(S<2){
    x=T<8.?0.:((T-8.)/.125+1.)*D;
    if(T<8.){
      s=-.65+T*.05;
      t=vec3(.1,.62,0);
      o=t+2.6*vec3(-cos(s),.13+T*.012,sin(s));
      lf=smoothstep(0.,4.,T);
    }else if(T<16.){
      t=vec3(x+.4,.3,zc(x+.4));
      o=vec3(x-1.4,.75,zc(x)-2.3);
    }else{
      t=vec3(x,.35,zc(x));
      o=vec3(x+2.8-(T-16.)*.1,1.2,zc(x+3.)+2.6);
      t=vec3(x-.6,.25,zc(x-.6));
      lo=vec3(2,6,3);
    }
  }else if(S==2){
    x=(T-24.)*(.5/.125+.5/.1212)*D;
    t=vec3(x+.5,0,zc(x));
    o=vec3(x-3.4+sin(T*.2),4.6,zc(x)-3.6);
  }else if(S==3){
    s=(T-40.)/16.;
    o=vec3(3.*cos(T*.25),15.-7.5*s*s,3.*sin(T*.25));
    t=vec3(0);
    fl=.6;
  }else if(S==4){
    // the camera backs off as fast as the dominoes grow
    for(int i=0;i<12;i++){
      y=.774*sqrt(.12*pow(1.5,float(i)));
      if(T>=56.+s){k=float(i);x=(T-56.-s)/y;}
      s+=y;
    }
    for(int i=11;i>=0;i--){
      y=float(i);
      G[i]=y>k?0.:y==k?min(1.5708,.5824*x*x):min(1.5708,G[min(i+1,11)]+asin(.79*cos(G[min(i+1,11)])-.24));
    }
    y=min(k+min(x,1.)+.5,10.8);
    h=.12*pow(1.5,y);
    y=.1704*(pow(1.5,y)-1.);
    t=vec3(y+.3*h,.5*h,0);
    o=vec3(y-2.*h,.7*h,-2.8*h);
    o+=(h1(vec2(T*60.,1))-.5)*.4*exp(-(T-70.)*4.)*step(70.,T);
  }else{
    x=(T-72.)/.125*D-24.5;
    s=smoothstep(79.,91.,T);
    t=mix(vec3(x-2.,0,-1.),vec3(0,0,-.6),s);
    o=mix(vec3(x+5.,6.,-7.),vec3(0,52,-7),s);
    f=mix(1.8,1.5,s);
    fl=mix(.82,.4,s);
  }
  if(S==2||S==5)fill(0,S==2?(T-24.)/.125:(T-72.)/.125);
  else fill(0,S<2?(T<8.?max(T-7.,0.):(T-8.)/.125+1.):(T-40.)/.125);
  if(S==2)fill(8,(T-24.)/.1212);
  Lt=t;
  Lp=t+lo*(S==4?h:S==5?4.:S==3?2.:1.);
  w=normalize(t-o);
  vec3 a=normalize(cross(vec3(0,1,0),w)),b=cross(w,a),r=normalize(u.x*a+u.y*b+f*w);
  s=o.y/max(-r.y,1e-4);
  if(r.y>=0.)s=1e3;
  x=march(o,r,s);
  if(x<s){
    c=shade(o+r*x,r,1.);
  }else if(s<1e3){
    // the table: black lacquer, with a sharp reflection of the dominoes
    p=o+r*s;
    n=vec3(0,1,0);
    k=.04+.96*pow(1.-max(-r.y,0.),5.);
    c=lit(p,n,vec3(.02,.017,.014),.0,sh(p+n*.002),r);
    r.y=-r.y;
    y=march(p,r,40.);
    c+=(y<40.?shade(p+r*y,r,0.):env(r))*(.06+.6*k);
    x=s;
  }
  c*=lf;
  // circle of confusion for the post shader: thin focus around the target, like a macro lens
  O=vec4(c,clamp(abs(x-length(t-o))/x*(S==3?.6:S==5&&T>82.?.6-.6*smoothstep(86.,90.,T):1.6),0.,1.));
}
