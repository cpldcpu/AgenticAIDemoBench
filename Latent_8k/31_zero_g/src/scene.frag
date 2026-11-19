#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;

const vec3 CY=vec3(.08,.92,1),NR=vec3(1,.24,.06),VL=vec3(.65,.24,1);
float T,BR,BT,PU,YW,ID,LV,CP,BL;
int S,Z;
vec3 Q,TO;

float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
mat2 rt(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float tr(vec3 p,vec2 t){return length(vec2(length(p.xz)-t.x,p.y))-t.y;}
float rg(vec3 p,float a,float b,float r){p.xy*=rt(a);p.yz*=rt(b);return tr(p,vec2(r,.06));}
float sg(vec3 p,vec3 a,vec3 b){vec3 u=p-a,v=b-a;return length(u-v*clamp(dot(u,v)/max(dot(v,v),1e-5),0.,1.));}
vec2 mn(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec3 pl(vec3 p,float s,float r,float o){float a=atan(p.z,p.x)+o;ID=floor(a/s+.5);return Q=vec3(length(p.xz)-r,p.y,(mod(a+s*.5,s)-s*.5)*r);}
float st(vec3 p,float r){p.xz*=rt(YW);p.yz*=rt(sin(T*.9)*.16);vec3 q=abs(p);return min(q.x+2.75*q.y+2.15*q.z-r,q.y+2.75*q.x+2.15*q.z-r)*.275-.026*r;}
vec3 sp(int i){float f=float(i),a=f*1.047+T*.34;return vec3(cos(a)*4.6,sin(f*2.09+T*.6)*1.7,sin(a)*4.6);}

vec2 map(vec3 p){
  vec2 d=vec2(1e4,0);vec3 q=p;
  if(S==0){
    vec2 i=floor((p.xz+1.2)/2.4),u=mod(p.xz+1.2,2.4)-1.2,g=1.38-abs(u);
    float h=hs(i),l=max(0.,LV*1.4-length(i)*.05-h*.2)*step(2.5,length(i))*step(p.z,4.2);
    q.xz=u;q.y+=2.2-l*l*(2.6+h*3.2);if(l>.01)q.xy*=rt(l*(h-.5)*3.);
    d=mn(vec2(min(bx(q,vec3(1.06,.16,1.06))-.03,min(g.x,g.y)),1),vec2(st(p-vec3(0,.65+LV*1.2+.2*sin(T*1.8),0),1.5+.15*PU),2));
    d=mn(d,vec2(tr(p-vec3(0,-1.8+LV*1.4,0),vec2(smoothstep(3.,7.5,BR)*18.,.07)),3));
  }else if(S==1){
    d=mn(vec2(st(p-TO,1.25+.1*PU),2),vec2(st(p+TO,1.25+.1*PU),3));
    d=mn(d,mn(vec2(rg(p,T*.35,.6,3.7),2),mn(vec2(rg(p,1.1,-T*.4,4.6),3),vec2(rg(p,-.85,T*.3,5.5),4))));
    q=pl(p,.5236,7.8,T*.2);q.y-=sin(ID*2.3+T)*1.8+1.1;q.xy*=rt(T*.7+ID);
    d=mn(d,vec2(bx(q,vec3(.16,.52+.25*sin(ID*3.),.16))-.02,1));
  }else if(S==2){
    q=pl(p,.7854,8.2,-T*.12);q.y-=1.5+.32*sin(ID*1.9+T*.9);
    d=mn(vec2(st(p-vec3(0,1.5+.2*sin(T*1.5),0),1.15+.1*PU),2),vec2(bx(q,vec3(.07,1.15,1.85))-.02,5));
    float r=length(p.xz),f=clamp(floor((r-1.35)/1.3),0.,2.),w=sin(atan(p.z,p.x)*(6.+f*4.)+T*(3.5-f))*(.14+.28*PU);
    d=mn(d,vec2(length(vec2(r-(2.+f*1.3),p.y+1.45-w))-(.075-f*.01),f<.5?3.:f<1.5?2.:4.));
  }else if(S==3){
    q=pl(p,1.047,4.6,-T*.34);q.y-=sin(ID*2.09+T*.6)*1.7;q.xz*=rt(T*1.1+ID);q.xy*=rt(T*.6);
    float m=mod(ID+6.,3.),s=m<.5?dot(abs(q),vec3(.577))-.52:m<1.5?min(tr(q,vec2(.56,.08)),length(q)-.25):min(bx(q-vec3(.22,0,0),vec3(.2)),bx(q+vec3(.22,0,0),vec3(.2)))-.03;
    d=mn(vec2(st(p,1.35+.18*PU),2),vec2(s,m<.5?2.:m<1.5?3.:4.));
  }else if(S==4){
    float r=mix(7.6,1.05,CP*CP);
    q.xz*=rt(T*(1.2+CP*2.8)+length(p)*.22);q=pl(q,.628,r,0.);q.y-=sin(ID*2.1+T*3.)*(1.-CP*.7)*2.;q.xy*=rt(T*2.4+ID);
    d=mn(vec2(st(p,mix(1.15,1.85,CP)+.12*PU),CP>.75?2.:3.),vec2(bx(q,vec3(.22,.5,.22)*(1.-CP*.45))-.02,1));
    d=mn(d,mn(vec2(rg(p,T*2.2,T*1.7,r*.92),2),vec2(rg(p,T*1.4,-T*2.6,r*1.15),3)));
  }else{
    float u=smoothstep(52.,53.5,BR);
    d=mn(vec2(bx(p-vec3(0,.2+.1*sin(T),0),vec3(2.25*u,1.02*u,.07))-.03,6),vec2(st(p-vec3(0,2.05+.14*sin(T*1.3),0),1.05+.35*BL),2));
    d=mn(d,vec2(rg(p-vec3(0,.2,0),0.,.16,3.55),4));
  }
  return d;
}

vec3 bg(vec3 r){
  vec2 u=vec2(atan(r.z,r.x),r.y*1.5)*32.,f=fract(u)-.5;float s=hs(floor(u));
  return vec3(.01,.015,.035)+vec3(.015,0,.025)*r.y+mix(CY*.5,VL,sin(u.x*.06+T*.2)*.5+.5)*exp(-abs(r.y)*5.5)*.18+(s>.92?mix(CY,NR,fract(s*37.))*exp(-dot(f,f)*48.)*(.5+.5*sin(T*3.+s*60.))*1.4:vec3(0));
}

float rsg(vec3 a,vec3 b,vec3 o,vec3 d,float m){
  vec3 u=b-a,w=o-a;float f=dot(u,d),dw=dot(d,w),s=clamp((f*dw-dot(u,w))/max(dot(u,u)-f*f,1e-4),0.,1.);
  return length(a+u*s-(o+d*clamp(f*s+dw,0.,m)));
}

void main(){
  Z=min(0,int(R.x));T=R.z;BR=T*.5;BT=T*2.;PU=exp(-fract(BT)*5.5);
  LV=smoothstep(4.,7.8,BR);CP=smoothstep(48.,51.75,BR);BL=exp(-abs(BR-62.5)*8.);
  TO=vec3(cos(T*.78)*1.95,.35*sin(T*1.4),sin(T*.78)*1.95);
  S=BR<8.?0:BR<16.?1:BR<32.?2:BR<48.?3:BR<52.?4:5;

  vec3 ro,ta=vec3(0);float fv=1.35,v,a,r;
  if(S==0){ro=vec3(sin(T*.15)*3.4,mix(.7,3.3,LV),mix(7.4,8.2,LV));ta.y=.55+LV*1.1;}
  else if(S==1){a=T*.28;ro=vec3(cos(a)*8.2,2.*sin(T*.22),sin(a)*8.2);}
  else if(S==2){v=smoothstep(24.,31.5,BR);a=T*.2;r=mix(6.2,5.1,v);ro=vec3(cos(a)*r,mix(.5,2.4,v),sin(a)*r);ta.y=mix(.6,.1,v);}
  else if(S==3){a=T*.34;r=10.2+sin(T*.4);ro=vec3(cos(a)*r,2.3*sin(T*.3)+.5,sin(a)*r);}
  else if(S==4){a=T*(1.1+CP*1.4);ro=vec3(cos(a)*mix(11.,6.2,CP),mix(2.5,.6,CP),sin(a)*mix(11.,6.2,CP));fv=mix(1.25,1.45,CP);}
  else{v=smoothstep(52.,63.5,BR);ro=vec3(sin(T*.15)*1.4,.9+v*.2,mix(6.8,8.4,v));ta.y=.85;}
  YW=atan(ro.x,ro.z)+sin(T*.7)*.2;

  vec2 uv=(gl_FragCoord.xy-.5*R.xy)/R.y;
  vec3 fw=normalize(ta-ro),ri=normalize(cross(vec3(0,1,0),fw)),rd=normalize(fw*fv+ri*uv.x+cross(fw,ri)*uv.y),c=bg(rd);
  float t=.05,m=0.,fc=length(ro);
  for(int i=Z;i<84;i++){vec2 h=map(ro+rd*t);if(h.x<.0025*(1.+t*.12)){m=h.y;break;}t+=h.x*.86;if(t>42.)break;}

  if(m>.5){
    vec3 p=ro+rd*t,n=vec3(0),k;
    for(int i=Z;i<4;i++){k=vec3((i+3)>>1&1,i>>1&1,i&1)*2.-1.;n+=k*map(p+k*.003).x;}
    n=normalize(n);vec3 rf=reflect(rd,n),ld=normalize(vec3(2,5,4)-p);
    float df=max(dot(n,ld),0.),fr=pow(1.-max(dot(-rd,n),0.),4.),s=pow(max(dot(rf,ld),0.),42.);
    if(m<1.5){
      vec2 u=abs(mod(p.xz+1.2,2.4)-1.2);
      c=vec3(.02,.03,.07)*(.3+.7*df*(.5+.5*n.y))+bg(rf)*(.35+.65*fr)+s*.9+CY*smoothstep(1.1,1.18,max(u.x,u.y))*.38*step(float(S),.5)+CY*(.2+.5*fr)/(1.+dot(p,p)*.08);
    }else if(m<4.5){
      float cr=pow(max(dot(-rd,n),0.),1.6);
      c=(m<2.5?CY:m<3.5?NR:VL)*(.45+1.35*cr+.7*s)+pow(cr,3.5)+bg(rf)*fr*.6;
    }else if(m<5.5){
      pl(p,.7854,8.2,-T*.12);vec2 u=vec2(Q.z/1.85,(Q.y-1.5-.32*sin(ID*1.9+T*.9))/1.15),g=u*vec2(8,5);int j=int(mod(ID+8.,3.));
      c=vec3(.02,.03,.07)+bg(rf)*fr*.45+CY*(s*.5+exp(-abs(u.x-sin(T*1.7+ID)*.85)*26.)*1.6+smoothstep(.9,.97,max(abs(u.x),abs(u.y)))*1.2);
      if(j<1)c+=CY*exp(-abs(u.y-.4*sin(u.x*5.+T*2.))*24.)*1.4;
      else if(j<2){float w=sin(length(u)*18.-T*5.);c+=mix(NR,VL,w*.5+.5)*smoothstep(.4,.9,w)*1.1;}
      else c+=mix(CY,NR,step(.5,hs(floor(g)+ID)))*step(.2,fract(g.x))*step(.2,fract(g.y))*.8;
    }else{
      vec2 u=(p.xy-vec2(0,.2+.1*sin(T)))/vec2(2.25,1.02);
      float w=floor((u.y+.72)*5.),l=.35+.45*hs(vec2(w,3));
      c=vec3(.02,.03,.07)+bg(rf)*(.3+.5*fr)+(w>5.5?NR:CY)*step(abs(fract((u.y+.72)*5.)-.5),.12)*step(abs(u.x+.8-l),l)*step(abs(u.y),.68)*1.15+CY*smoothstep(.93,.98,max(abs(u.x),abs(u.y)))*1.35+s*.5;
    }
    c=mix(c,bg(rd),1.-exp(-t*.026));
  }

  vec3 re=ro+rd*t,g=vec3(0);
  if(S==1)g=(CY*exp(-sg(TO,ro,re)*1.3)+NR*exp(-sg(-TO,ro,re)*1.3))*(.55+.25*PU);
  else if(S==3){
    g=CY*exp(-sg(vec3(0),ro,re)*1.3)*(.5+.35*PU);
    for(int k=Z;k<6;k++){
      vec3 p1=sp(k),p2=sp((k+2)%6);
      g+=(k%3<1?CY:k%3<2?NR:VL)*exp(-rsg(p1,p2,ro,rd,t)*6.)*(.6+.9*PU)*1.4+exp(-sg(mix(p1,p2,fract(BT*.5+float(k)*.17)),ro,re)*5.5)*1.4+VL*exp(-rsg(vec3(0),p1,ro,rd,t)*8.)*(.45+.65*PU);
    }
  }else{
    v=S==0?LV:S==4?CP:BL;
    g=(S==0?mix(VL,CY,v):S==4?mix(NR,CY,v):S==5?mix(CY,vec3(1),v):CY)*exp(-sg(vec3(0,S==0?.65+v*1.2:S==2?1.5:S==5?2.05:0.,0),ro,re)*1.2)*(S==2?.5:S==4?.55+1.1*v*v:S==5?.48+1.6*v:.4+.55*v+.35*PU);
  }

  c+=g+mix(CY,vec3(1),.6)*exp(-abs(BR-52.)*18.)*1.5;
  O=vec4(max(c,0.),clamp(abs(t-fc)/fc*.8,0.,1.));
}
