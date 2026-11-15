#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// T seconds, BT beats (144 BPM), M material of the last map(), HU/GV random numbers of the current shot, PW bulb power
// S scene family: 0 mandelbulb, 1 beams, 2 gyroid, 3 ocean + bulb. V shot id (S = V&3), Q orbit trap of the last map()
float T,BT,M,HU,GV,PW,GD;
int S,V;
vec3 Q,LD,SC,HC,ZC,BC;
const int K[44]=int[44](0,0,0,0, 1,5,9,13, 2,2,18,18, 3,3,3,3, 5,26,4,7,9,10,12,11, 12,12,12,12, 13,8,1,18, 5,4,9,26,17,8,1,10, 0,0,0,0);

float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
vec3 pal(float x){return .5+.5*cos(6.2832*(x+vec3(.5,.1,0)));}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}

// mandelbulb
float bu(vec3 p){
  vec3 z=p;float dr=1.,r=0.;Q.x=9.;
  for(int i=0;i<7;i++){
    r=length(z);if(r>2.)break;
    float th=acos(z.y/r)*PW,ph=atan(z.z,z.x)*PW;
    dr=pow(r,PW-1.)*PW*dr+1.;
    z=pow(r,PW)*vec3(sin(th)*cos(ph),cos(th),sin(th)*sin(ph))+p;
    Q.x=min(Q.x,dot(z,z));
  }
  return .5*log(r)*r/dr;
}
// beams: folded space with thin boxes
float kf(vec3 p){
  p.xy*=rot(p.z*.04*(GV-.5)+T*.05);
  float d=1e3,s=1.,e,g,z=mod(p.z,2.)-1.;
  vec2 o=vec2(1.+.5*GV,.8+.4*HU);
  Q=vec3(0);GD=1e3;
  for(int i=0;i<6;i++){
    p.xy=abs(p.xy)-o;
    p.xy*=rot(.55+.5*GV+sin(T*.1)*.1);
    e=length(p.xy);
    g=length(vec2(e-.3,z*s))/s-.015;
    e=min((e-.02)/s,g);
    GD=min(GD,e);
    if(e<d){d=e;Q=vec3(i,1,0);}
    p.xy*=1.45;o*=.7;s*=1.45;
  }
  return d;
}
// gyroid shell, as a ball or as an endless lattice
float gy(vec3 p){
  float k=(V>>2&1)==1?1.:1.6+GV;
  vec3 q=p*k;
  float d=(abs(dot(sin(q),cos(q.zxy)))-.3-.2*sin(T*.5+p.y))/k*.7;
  return (V>>2&1)==1?d:max(d,length(p)-2.6);
}
float wv(vec2 p){return .13*sin(p.x*1.3+T*.9+sin(p.y*.7))+.08*sin(p.y*2.1-T*1.1+p.x*.5)+.04*sin(dot(p,vec2(3.1,2.3))+T*1.7);}

float map(vec3 p){
  float d,w;M=0.;GD=1e3;
  if(S==1){d=kf(p);M=2.;}
  else if(S==2){d=gy(p);M=3.;}
  else{
    vec3 q=p;
    if(S==3){q-=BC;q.xz*=rot(T*.2);q/=1.3;}
    d=bu(q)*(S==3?1.3:1.);
    if(S==3){w=(p.y-wv(p.xz))*.7;if(w<d){d=w;M=1.;}}
  }
  if(S!=1)GD=d;
  return d;
}
vec3 nrm(vec3 p,float e){
  vec3 n=vec3(0);
  for(int i=0;i<4;i++){vec3 k=.5773*(2.*vec3((i+3)>>1&1,i>>1&1,i&1)-1.);n+=k*map(p+k*e);}
  return normalize(n);
}
float ao(vec3 p,vec3 n){
  float o=0.,s=1.;
  for(int i=0;i<5;i++){float h=.02+.12*float(i);o+=(h-map(p+n*h))*s;s*=.6;}
  return sat(1.-o*1.5);
}
float shd(vec3 p,vec3 l){
  float r=1.,t=.02,d;
  for(int i=0;i<28;i++){d=map(p+l*t);r=min(r,8.*d/t);t+=clamp(d,.02,.5);if(d<.0005||t>12.)break;}
  return sat(r);
}
vec3 sky(vec3 d){
  float s=max(dot(d,LD),0.);
  vec3 c=mix(HC,ZC,sqrt(sat(d.y)))+SC*(pow(s,400.)*8.+pow(s,60.)*.5+pow(s,6.)*.1);
  if(S!=3){
    vec3 q=d*80.,i=floor(q);
    c+=step(.97,h1(i.xy+i.z*7.3))*smoothstep(.4,0.,length(fract(q)-.5))*(.5+.5*sin(T*3.+i.x))*2.;
    c+=pal(d.x*.7+d.y*.4+HU)*pow(.5+.5*sin(d.x*5.+sin(d.y*7.+T*.1)*2.),4.)*.06;
    if(S>0)c+=pal(d.y*1.3+d.x*.7+HU)*smoothstep(.7,1.,sin(d.y*7.+d.x*5.+T*.3))*.5;
  }
  return c;
}

void main(){
  vec2 u=(gl_FragCoord.xy-.5*R.xy)/R.y;
  T=R.z;BT=T*2.4;
  float br=BT/4.;
  // shots: 2 bars each, 1 bar in the last drop (bars 64-72)
  float q=br<64.?br/2.:br<72.?br:(br-72.)/2.;
  int i=int(min(br<64.?q:br<72.?q-32.:q+40.,43.));
  V=K[i];S=V&3;
  float cut=i>0&&K[i-1]!=V?exp(-fract(q)*30.):0.;
  HU=h1(vec2(V,7));GV=h1(vec2(V,9));
  bool dr=br>=6.&&br<24.||br>=32.&&br<48.||br>=56.&&br<72.;
  float pump=dr?exp(-4.*fract(BT)):0.,fv=1.6-.12*pump,roll=0.,GK=6.,GI=.03,FS=.8,FA=1.;
  vec3 ro,ta;
  PW=6.+2.*sin(T*.35+HU*6.);
  LD=normalize(vec3(.5,.7,-.4));SC=vec3(1,.8,.6);HC=vec3(.01,.005,.03);ZC=vec3(0,0,.02);BC=vec3(0);
  if(S==0){
    float a=T*.2+HU*6.,e=.35*sin(T*.17+GV*6.),r=V>0?(V==12?2.6*exp(-(T-80.)*.15):2.2+.5*sin(T*.5)):(T<30.?4.2-1.2*smoothstep(0.,13.,T):3.+1.3*smoothstep(120.,133.,T));
    ro=r*vec3(sin(a)*cos(e),sin(e),cos(a)*cos(e));ta=vec3(0);
    FS=.7;GK=5.;GI=.02;SC=vec3(1,.55,.25);LD=normalize(vec3(sin(a+.9),.8,cos(a+.9)));
  }else if(S==1){
    float sp=5.+4.*GV;
    ro=vec3(.25*sin(T*.7+float(V)),.2*cos(T*.5),T*sp);ta=ro+vec3(.3*sin(T*.4),.2*cos(T*.3),1);
    roll=T*.3*(GV-.5)*2.;GK=14.;GI=.012;FS=.6;
    HC=ZC=vec3(.01,.01,.04);
  }else if(S==2){
    if((V>>2&1)==1){ro=vec3(sin(T*.3)*1.5,cos(T*.23),T*.9);ta=ro+vec3(sin(T*.5),.3*cos(T),1);}
    else{float a=T*.25+HU*6.;ro=4.2*vec3(sin(a),.4*sin(T*.3),cos(a));ta=vec3(0);}
    GK=8.;GI=.05;FS=.6;HC=ZC=vec3(.01,.02,.05);
  }else{
    ro=vec3(sin(T*.2)*.8,1.+.2*sin(T*.4),T*2.5);ta=ro+vec3(sin(T*.15)*.5,.06,1);
    BC=vec3(0,1.9,ro.z+9.);
    LD=normalize(vec3(.1,.07,1));SC=vec3(1,.55,.25);HC=vec3(.5,.11,.07);ZC=vec3(.01,.02,.12);
    GI=.03;
  }
  vec3 f=normalize(ta-ro),r=normalize(cross(vec3(sin(roll),cos(roll),0),f)),
       rd=normalize(u.x*r+u.y*cross(f,r)+fv*f),col=vec3(0),thr=vec3(1);
  for(int k=0;k<2;k++){
    float t=0.,d=1.;
    vec3 gl=vec3(0);
    for(int j=0;j<130;j++){
      d=map(ro+rd*t);
      gl+=pal(Q.x*.25+HU+t*.02)*exp(-max(GD,0.)*GK)*d*FS;
      if(d<2e-4*(t+.1)||t>60.)break;
      t+=d*FS;
    }
    col+=thr*gl*GI*(1.+pump);
    if(d>2e-4*(t+.1)){col+=thr*sky(rd);break;}
    vec3 p=ro+rd*t,n=nrm(p,7e-4*(t+.2));
    map(p);
    float aoo=ao(p,n),fr=pow(1.-sat(dot(n,-rd)),4.),sh=S==0||S==3?shd(p+n*.01,LD):1.,
          df=sat(dot(n,LD))*sh;
    vec3 alb=vec3(.1),em=vec3(0),L=SC*df*4.5+vec3(.03,.08,.2)*(.6+.4*n.y)+vec3(.2,.7,1)*fr*3.,c;
    float rf=.1;
    if(M==0.){float x=sqrt(Q.x);alb=mix(vec3(.02,.12,.35),vec3(1,.4,.1),sat(x*x*1.2-.1));em=vec3(.9,.3,1)*pow(sat(1.-x*1.5),3.);rf=.15;}
    else if(M==1.){alb=vec3(.003,.012,.03);rf=.04+.96*fr;}
    else if(M==2.){alb=pal(Q.x*.3+HU)*.15;{vec3 e=pal(Q.x*.15+HU+t*.12);em=e*e*1.8*exp(-t*.06);}rf=.25;L=vec3(sat(dot(n,-rd))/(1.+t*t*.03))*2.;}
    else{alb=vec3(.02);rf=.4+.6*fr;L=vec3(sat(dot(n,-rd))*.8);em=pal(dot(n,rd)*1.5+HU)*.2;}
    c=alb*L*aoo+em*aoo;
    c=mix(c,HC,1.-exp(-t*(S==3?.03:.05)));
    col+=thr*c;
    thr*=rf*(.5+aoo*.5);
    ro=p+n*.01;rd=reflect(rd,n);
  }
  O=vec4(min(col,30.),cut);
}
