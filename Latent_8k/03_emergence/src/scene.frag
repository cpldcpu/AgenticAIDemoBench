#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

const vec3 CY=vec3(.08,.8,1),GD=vec3(1,.55,.2),NV=vec3(.015,.03,.08);
float T,BT,BR,M,OI;
int S;
vec3 P,E;
vec2 TR;

float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float smin(float a,float b,float k){float h=sat(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1.-h);}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float gy(vec3 p){return dot(sin(p),cos(p.yzx));}
vec3 film(float x){return .5+.5*cos(6.2832*(x+vec3(0,.33,.67)));}
vec2 pth(float z,float k){return vec2(sin(z*.09/k)*2.4*k,cos(z*.07/k)*1.7*k);}

float core(vec3 p,float sc){
  vec3 q=p/sc,qc=q,g=q;
  qc.xz*=rot(T*.7);qc.xy*=rot(T*.45);
  g.xy*=rot(T*.9);g.yz*=rot(.5*sin(T*.4));
  float d=length(q)-.34,
        cr=max((abs(qc.x)+abs(qc.y)+abs(qc.z)-1.05)*.577,bx(qc,vec3(.78))),
        rg=min(length(vec2(length(g.xz)-1.22,g.y)),length(vec2(length(g.yz)-1.52,g.x)))-.04;
  M=9.;if(cr<d){d=cr;M=8.;}if(rg<d){d=rg;M=7.;}
  return d*sc;
}

float map(vec3 p){
  float d=1e3,m=1.,pulse=exp(-3.5*fract(BT)),r=length(p.xz);
  E=vec3(0);TR=vec2(1e3);

  if(S==0||S==6){
    d=p.y+.02*sin(r*3.-T*2.5)*exp(-r*.1);m=4.;
    if(S==0){
      vec3 sv=sin(p*9.);
      float rad=mix(2.6,.95,smoothstep(2.,8.,BR)),fl=1e3,spk=sv.x*sv.y*sv.z*.025;
      for(int i=0;i<6;i++){
        float fi=float(i),a=T*(.7+.15*fi)+fi*1.05;
        fl=smin(fl,length(p-P-vec3(cos(a)*rad,sin(a*1.3+fi)*rad*.55,sin(a*.8+fi*2.)*rad))-.34-spk,.48);
      }
      if(fl<d){d=fl;m=5.;}
    }
  }else if(S==1){
    vec3 gp=p*.52;
    d=-smin(-(abs(gy(gp))-.22)*.7+abs(gy(gp*2.))*.06,length(p.xy-pth(p.z,1.))-2.3,.65);
    E=mix(CY,GD,.5+.5*sin(p.z*.15))*smoothstep(.16,.02,abs(gy(gp*3.)))*(.25+.9*pulse);
  }else if(S==2){
    d=p.y+4.2;m=4.;
    float pz=p.z+7.,cx=pth(p.z,1.5).x,zid=floor(pz/14.);
    vec3 q=vec3(abs(p.x-cx)-9.5,p.y-4.+.6*sin(BT*.785+zid*1.7),mod(pz,14.)-7.);
    float city=bx(q,vec3(4.8,18,4.8)),s=1.;
    for(int i=0;i<4;i++){vec3 a=abs(1.-3.*abs(mod(q*.2*s,2.)-1.)),m=max(a,a.yzx);s*=3.;city=max(city,(min(m.x,min(m.y,m.z))-1.)/(s*.2));}
    city=min(city,bx(vec3(p.x-cx,p.y-12.5,mod(p.z+14.,28.)-14.),vec3(7,1.1,1.6)));
    if(city<d){
      d=city;m=2.;float h=h1(floor(p.xz*1.5)+zid);
      E=mix(CY,GD,step(.5,fract(h*9.)))*(step(.7,fract(p.y*2.2))*step(.45,h)*(.3+.7*pulse)+exp(-abs(fract(p.y*.12-T*.4)-.5)*24.)*.35);
    }
  }else if(S==3){
    vec2 tp=p.xy-pth(p.z,2.2);float tr=length(tp),cm=abs(sin(atan(tp.y,tp.x)*4.+p.z*.22));
    d=min(6.4-tr,max(min(abs(mod(p.z,3.2)-1.6)-.32,cm-.18),5.45-tr))*.82;m=3.;
    E=mix(CY,vec3(1,.2,.8),.5+.5*sin(p.z*.12+T))*smoothstep(.12,0.,cm)*(.4+2.2*exp(-abs(fract(p.z*.08-BT*.25)-.5)*16.));
  }else if(S==4){
    d=length(p)-1.35;m=2.;float disk=max(abs(p.y)-.055,max(2.15-r,r-9.8));
    if(disk<d){
      d=disk;m=6.;float ang=atan(p.z,p.x)+7.5/max(r,1.)-T*1.6;
      E=mix(GD,CY+vec3(.5),.5-.5*p.z/max(r,.01))*(1.4+.8*sin(ang*3.+r*2.2)*cos(ang*5.-r*1.5))*smoothstep(9.8,3.5,r)*sat((r-2.1)*2.);
    }
  }else{
    vec3 q=p*.18;float s=1.;
    for(int i=0;i<9;i++){q=2.*fract(.5*q+.5)-1.;float rr=dot(q,q),k=(1.2+.08*sin(T*.35))/rr;TR=min(TR,vec2(abs(q.x),rr));q*=k;s*=k;}
    d=max(abs(q.y)/s*1.39,3.9-length(p));m=5.;
    E=film(TR.x*1.5+T*.06)*pow(sat(1.-2.1*TR.y),8.)*(.7+1.1*pulse);
  }

  float cd=S==4?1e3:core(p-P,S==0||S==5?.85:S==6?1.4:.58);
  if(cd<d){d=cd;m=M;}M=m;
  return d;
}

vec3 nrm(vec3 p,float e){vec3 n=vec3(0),k;for(int i=0;i<4;i++){k=vec3((i+3)>>1&1,i>>1&1,i&1)*2.-1.;n+=k*map(p+k*e);}return normalize(n);}
float shd(vec3 p,vec3 l,float mx){float r=1.,t=.05;for(int i=0;i<36;i++){if(t>mx)break;float d=map(p+l*t);r=min(r,10.*d/t);if(r<.01)break;t+=clamp(d,.04,3.);}return sat(r);}
float ao(vec3 p,vec3 n,float s){float a=0.,w=1.;for(float i=1.;i<6.;i++){a+=(i*s-map(p+n*i*s))*w;w*=.6;}return sat(1.-a/s*.6);}

vec3 sky(vec3 d){
  float s=max(dot(d,normalize(vec3(0,.14,-.98))),0.);
  vec2 st=d.xz/(abs(d.y)+.45)*55.;float sh=h1(floor(st));
  vec3 bg=NV*mix(1.,.25,sat(abs(d.y)*2.5))+step(.986,sh)*smoothstep(.35,0.,length(fract(st)-.5))*sat(d.y*3.)*sh;
  if(S==6){
    bg+=mix(CY,vec3(.4,.2,1),.5+.5*sin(d.x*6.+T*.4))*smoothstep(.4,.05,abs(d.y-.22-.06*sin(d.x*4.+T*.3)))*.28
       +mix(GD,vec3(1),.3)*(pow(s,32.)*.35+pow(s,180.)*1.5+(smoothstep(.996,.999,s)-smoothstep(.997,.998,s))*12.);
  }else if(S==4)bg+=NV*4.*pow(sat(1.-abs(d.y)),4.);
  return bg;
}

void main(){
  T=R.z;BT=T*2.13333;BR=BT*.25;
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  S=BR<8.?0:BR<18.?1:BR<28.?2:BR<38.?3:BR<48.?4:BR<62.?5:6;
  OI=1.;vec3 ro,ta,OC=CY;
  float t=(BR-float[7](0.,8.,18.,28.,38.,48.,62.)[S])*1.875,fv=1.55,FAR=95.,fk=.016,rl=0.;

  if(S==0){
    OI=smoothstep(.3,2.,BR);P=vec3(0,2.2+.25*sin(T),0);
    float a=T*.22-.4,r=mix(3.4,7.,BR/8.);ro=vec3(sin(a)*r,1.2+.18*BR,cos(a)*r);ta=P-vec3(0,.35,0);OC=mix(CY,GD,smoothstep(4.,8.,BR));
  }else if(S==1||S==3){
    bool b=S==3;float z=t*(b?13.:5.5),k=b?2.2:1.;
    P=vec3(pth(z+(b?7.:5.5),k),z+(b?7.:5.5));
    ro=vec3(pth(z,k),z)+(b?vec3(1.6*cos(t*.9),1.4*sin(t*.7),0):vec3(.35*sin(t*.7),.25*cos(t*.5),0));
    ta=P+vec3((b?.4*cos(t*.6):.3*sin(t*.4)),(b?.4*sin(t*.5):.2*cos(t*.3)),b?2.:1.5);
    rl=b?t*.28:(BR<13.?.12:-.22)*sin(t*.4);fk=b?.022:.024;
  }else if(S==2){
    float z=t*8.5,cx=pth(z,1.5).x;bool c=BR>=23.;
    ro=vec3(cx+sin(t*.5)*(c?1.6:.8),c?1.6+t*.2:-2.2,z);ta=vec3(pth(z+11.,1.5).x,c?2.4:-.8,z+11.);rl=c?-.18*sin(t*.4):0.;
    P=vec3(pth(z+6.5,1.5).x,-1.+1.2*sin(t*.9),z+6.5);OC=GD;
  }else if(S==4||S==5){
    bool b=S==5;float a=b?t*.24:t*.22+1.2,r=b?3.:mix(14.5,10.4,smoothstep(0.,9.,BR-38.));
    ro=vec3(sin(a)*r,b?1.1*sin(t*.3):1.4+.6*sin(t*.25),cos(a)*r);
    P=vec3(0);ta=b?vec3(cos(a)*.45,.15,-sin(a)*.45):P;rl=b?.18*sin(t*.35):0.;
    OC=b?mix(CY,GD,.5+.5*sin(T*.5)):GD;
    FAR=55.;if(!b)fk=.004;
  }else{
    P=vec3(0,3.1+.25*sin(T*.7),0);ro=mix(vec3(0,1.4,8.5),vec3(4.2,3.4,15),smoothstep(0.,18.,t));ta=vec3(0,2.7,-4);OC=mix(GD,vec3(1),.3);fk=.008;FAR=130.;fv=1.65;
  }
  if(BR>=8.&&BR<62.)fv-=.055*exp(-4.*fract(BT));

  vec3 w=normalize(ta-ro),uu=normalize(cross(w,vec3(sin(rl),cos(rl),0))),rd=normalize(u.x*uu+u.y*cross(uu,w)+fv*w),col=vec3(0),at=vec3(1),p,n;
  for(int b=0;b<2;b++){
    float d=0.,g=1e3,rf=0.,m=1.;t=0.;vec3 gl=vec3(0),rp=ro;
    for(int i=0;i<220;i++){
      d=map(rp);
      if(S==4){float r2=dot(rp,rp),stp=min(d,max(.05,.13*sqrt(r2)));rd=normalize(rd-rp*(2.1*stp/(r2*sqrt(r2)+.35)));rp+=rd*stp;t+=stp;}
      else{t+=d;rp=ro+rd*t;}
      gl+=E*exp(-fk*t)/(1.+d*d*(S==4?8e2:4e3));
      g=min(g,length(rp-P));if(d<(S==5?.2:1.)*1e-3*t+3e-4||t>FAR)break;
    }
    if(d>.02*t+.02&&S!=4)t=FAR;
    p=rp;m=M;vec3 bg=sky(rd),c=bg;
    if(t<FAR){
      float gs=80.;vec3 e=E,al=vec3(.08,.12,.18);vec2 tr=TR;
      if(m==9.)c=OC*4.*OI;
      else if(m==6.)c=e*2.2;
      else if(S==4&&m==2.)c=vec3(0);
      else{
        n=nrm(p,S==5?1e-3:6e-4+5e-4*t);float fr=pow(sat(1.+dot(rd,n)),5.);
        vec3 ir=film(dot(n,-rd)*1.6+tr.x);
        if(m<4.)rf=.15+.45*fr;
        else if(m==4.){al=NV;rf=.08+.88*fr;gs=220.;n=normalize(n+vec3(sin(p.x*14.+T*2.),0,cos(p.z*15.-T*1.9))*.02);}
        else if(m==5.){al=mix(GD*.4,ir,.6);rf=.2+.4*fr;gs=140.;}
        else{al=m==7.?GD:mix(CY,ir,.7);rf=.45+.45*fr;gs=220.;}
        vec3 l=P-p;float ld=length(l)+1e-4;l/=ld;
        float sh=(S==5||S==4)?1.:shd(p+n*.02,l,ld-.6),occ=S==5?sat(tr.y+.15):ao(p,n,.25),att=OI/(1.+.025*ld*ld);
        c=al*(OC*3.5*max(dot(n,l),0.)*sh*att+float(S==1||S==6)*max(dot(n,vec3(.4,.6,.7)),0.)*.5+vec3(.08,.12,.18)*.7*occ*(.5+.5*n.y))
          +OC*pow(max(dot(n,normalize(l-rd)),0.),gs)*sh*att*(m==4.?6.:1.4)+e;
      }
      c=mix(bg,c,exp(-fk*t));
    }
    if(b==0&&S<2)c+=OC*OI*min(t,45.)*.01/(1.+.06*g*g);
    if(S!=4)c+=gl*(S==5?.011:.018)+OC*OI*.42*pow(.45/max(g,.45),1.6);
    else if(t>=FAR||m!=2.)c+=gl*.016+GD*.45*pow(1.42/max(g,1.42),10.);
    col+=at*c;if(rf<=.02)break;at*=rf;ro=p+n*.025;rd=reflect(rd,n);
  }
  O=vec4(clamp(col,0.,30.),1);
}
