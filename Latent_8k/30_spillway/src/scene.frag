#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;

const vec3 CY=vec3(.2,.9,1),AM=vec3(1,.5,.1);
float T,b,bt,K,N,G,L,W;
int S,Z;
vec3 D,I,C;

float ss(float a,float c,float x){return smoothstep(a,c,x);}
float cl(float x){return clamp(x,0.,1.);}
vec3 nz(vec3 p){return normalize(p);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.,312.)))*43758.);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){return n2(p)*.6+n2(p*2.1+2.)*.3+n2(p*4.3+4.)*.1;}
float bx(vec3 p,vec3 s){vec3 q=abs(p)-s;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float tr(vec3 p,vec2 t){return length(vec2(length(p.xz)-t.x,p.y))-t.y;}
vec2 mn(vec2 a,vec2 c){return a.x<c.x?a:c;}
float dZ(float x){return -.0075*x*x;}
float oY(float z){return 9.2/(1.+max(0.,z)*.1);}

vec2 map(vec3 p){
  G=1e5; vec2 r=vec2(1e5,0);
  if(S==0){
    float z=p.z-dZ(p.x),x=abs(p.x),y=oY(z),f=y+.2*sin(clamp(z,0.,35.)*2.4)*ss(2.,8.,z),u=p.x-clamp(round((p.x-3.8)/7.6)*7.6+3.8,-11.4,11.4);
    float d=min(max(max(max(-2.4-z,z-1.8-max(0.,14.-p.y)*.44),p.y-14.),-max(max(x-11.2,f-p.y),-1.6-z)),min(bx(vec3(u,p.y-10.,z-2.6),vec3(.86,6.2,4.1)),max(x-12.5,max(p.y-f,max(-z,z-32.)))));
    r=mn(vec2(d,1),vec2(length(vec3(u,p.y-16.6,z-1.2))-.4,4));
    if(x<11.5)r=mn(r,vec2(bx(vec3(p.x-clamp(round(p.x/7.6)*7.6,-7.6,7.6),p.y-11.3-L,z-.5),vec3(2.8,2.1,.25)),2));
    if(b>=50.)r=mn(r,vec2(length(vec3(p.x-clamp(round(p.x/4.2)*4.2,-33.6,33.6),p.y-14.6,z+2.5))-.25,4));
    if(L>.1&&x<11.3)r=mn(r,vec2(max(x-11.2,max(p.y-y-.2-.8*cl(L/3.5)*ss(-.8,1.5,z)-.24*sin(p.x*1.8+z*1.2-T*12.)*ss(0.,4.,z),-1.-z))*.75,3));
    if(x>26.||p.z<-24.){float a=1.-abs(n2(p.xz*.035)*2.-1.);r=mn(r,vec2((p.y-a*a*28.*ss(0.,1.2,max(0.,length(p.xz*vec2(.02,.024))-1.05))+2.)*.32,8));}
    return r;
  }
  if(S==1){
    vec2 i=round(p.xz/10.),c=p.xz-i*10.,e=(sign(D.xz)*5.-c)/(D.xz+1e-5); G=min(e.x,e.y)+.06;
    float d=18.-p.y; if(abs(i.x)<.5&&mod(i.y,2.)<.5)d=max(d,2.9-length(c));
    r=vec2(d,1);
    if(abs(i.x)>.5){vec3 q=vec3(c.x,p.y,c.y);r=mn(mn(r,vec2(min(bx(q-vec3(0,9,0),vec3(1.5,9.5,1.5))+.06*cos(q.x*5.5)*cos(q.z*5.5),bx(vec3(q.x,abs(q.y-9.)-7.6,q.z),vec3(2,1.2,2))),1)),vec2(bx(q-vec3(0,14.4,0),vec3(1.6,.12,1.6)),4));}
    return r;
  }
  if(S==2){
    float u=length(p.xz),y=mod(p.y+1.8,3.6)-1.8,v=mod(atan(p.z,p.x)+.39,.785)-.39;
    return mn(vec2(min(min(6.4-u,max(5.55-u,abs(y)-.3)),bx(vec3(cos(v)*u-6.1,0,sin(v)*u),vec3(.45,1e4,.24))),2),vec2(max(5.5-u,abs(y)-.07),4));
  }
  if(S==3){
    float u=length(p.xz),h=1.35+.5*ss(1.5,-2.,p.y),a=mod(atan(p.z,p.x)+T*2.8+ss(40.,44.,b)*3.+p.y*.28-u*.18+.26,.5236)-.26,v=mod(atan(p.z,p.x)+.13,.2618)-.13;
    r=vec2(min(min(14.-u,7.2-abs(p.y)),min(u-h,tr(vec3(p.x,abs(p.y)-1.9,p.z),vec2(4.1,.24)))),2);
    r=mn(r,vec2(min(max(bx(vec3(cos(a)*u-3.,p.y,sin(a)*u),vec3(1.65,1.85,.06))-.04,u-4.75)*.7,bx(vec3(cos(v)*u-11.8,p.y,sin(v)*u),vec3(.85,4.8,.38))),5));
    return mn(r,vec2(tr(p-vec3(0,-1.6+fract(bt)*3.2,0),vec2(2.+fract(bt)*4.6,.08+.06*K)),6));
  }
  float i=round(p.z/8.),z=p.z-i*8.; G=(sign(D.z)*4.-z)/(D.z+1e-5)+.08;
  vec3 q=vec3(abs(p.x)-4.5,p.y,z); vec2 c=vec2(length(q.xz)-.52-.2*cos(q.y*15.5),abs(q.y-5.)-2.5);
  r=mn(vec2(min(p.y,bx(q-vec3(0,1.2,0),vec3(1.15,1.2,1.15))),1),vec2((min(max(c.x,c.y),0.)+length(max(c,0.)))*.72,7));
  float g=mod(i,2.)<.5?min(bx(vec3(abs(p.x)-8.8,p.y-6.5,z),vec3(.3,6.5,.3)),bx(vec3(p.x,p.y-12.8,z),vec3(9.4,.35,.35))):1e5;
  return mn(mn(r,vec2(min(tr(q-vec3(0,7.65,0),vec2(.9,.1)),g),2)),vec2(length(vec2(abs(p.x)-4.5,p.y-8.2))-.14,5));
}

vec3 cn(vec3 p){vec3 n=vec3(0);for(int i=Z;i<4;i++){vec3 e=.577*(2.*vec3(((i+3)>>1)&1,(i>>1)&1,i&1)-1.);n+=e*map(p+e*.004).x;}return nz(n+1e-6);}
float sh(vec3 p,vec3 l){float s=1.,t=.2,o=1e10;for(int i=Z;i<14;i++){float d=map(p+l*t).x,y=d*d/(2.*o);s=min(s,8.*sqrt(max(0.,d*d-y*y))/max(1e-4,t-y));o=d;t+=clamp(d,.1,2.8);if(s<.01||t>34.)break;}return cl(s);}

vec3 sky(vec3 d){
  if(S>0&&S<4)return vec3(.01,.04,.06);
  float u=max(0.,dot(d,I)),n=ss(49.,53.,b),g=S==4?1.:0.;
  vec3 c=mix(g>.5?vec3(.8,.25,.15):mix(vec3(.6,.8,1),vec3(.2,.22,.4),n),g>.5?vec3(.1,.04,.2):mix(vec3(.1,.36,.74),vec3(.02,.04,.1),n),ss(-.02,g>.5?.35:.6,d.y))+mix(vec3(1,.8,.6),AM,g)*pow(u,10.)*.8*ss(-.05,.2,d.y)*(1.-n*.8)+ss(.998,.9995,u)*4.*(1.-n)*(1.-g);
  if(d.y>.01)c=mix(c,g>.5?AM*.6:vec3(.96),ss(.45,.84,fb(d.xz/(d.y+.22)*1.6+T*.04))*.55*ss(.01,.2,d.y)*(1.-n));
  if(g>.5)return mix(vec3(.05,.04,.1),c,ss(-.01,.01,d.y-.05-.05*abs(sin(d.x*4.+1.)*cos(d.z*3.))));
  vec3 q=floor(d*260.);
  return c+vec3(.8,.9,1)*ss(.996,.9995,h2(q.xy+q.z*vec2(17.,32.)))*ss(.08,.35,d.y)*2.4*n;
}

vec3 shd(vec3 p,vec3 n,float m,vec3 d,float f){
  vec3 a=vec3(.7),e=vec3(0); float r=.6,k=0.;
  if(m<1.5){
    float w=ss(3.,0.,abs(p.y-W)); a=(vec3(.7)+sin(p.y*9.5)*.035+(n2(p.xz*.6+p.y*.5)-.5)*.14)*mix(1.,.5,w); r=mix(.8,.25,w);
    if(S==0&&abs(p.x)<9.&&p.y>12.2&&p.y<13.8&&n.z<-.6)a=mix(a,vec3(.07),texture(B,vec2(1.-(p.x+9.)/18.,(7.-(p.y-12.2)/1.6)/8.)).r*.75);
    if(S==1)e+=CY*pow(fb(p.xz*.55+vec2(T*.4,-T*.3)+n.xz),2.4)*ss(10.,0.,p.y-W)*.75;
  }else if(m<2.5){a=vec3(.2);r=.25;k=.85;}
  else if(m<3.5){float z=p.z-dZ(p.x),w=ss(.46,.76,fb(vec2(p.x*1.8,z*.28-T*10.))+ss(4.,22.,z)*.18);a=mix(vec3(0,.3,.4),vec3(1),w);r=.25;e+=vec3(.12)*w;}
  else if(m<4.5)e=mix(AM,CY,S==0?0.:S==1?step(.5,fract(bt*.5+floor(p.z*.1)*.25)):ss(28.,36.,b))*(S==0?3.:1.4+2.5*K);
  else if(m<5.5){a=vec3(.9,.6,.25);r=.24;k=.88;}
  else if(m<6.5)e=CY*(3.5+4.5*K);
  else if(m<7.5){a=vec3(.9);r=.08;k=.4;}
  else a=mix(vec3(.2,.2,.3),vec3(.95),ss(9.,18.,p.y)*ss(.32,.68,n.y));

  vec3 l=S==1?nz(vec3(.28,1,-.15)):I,o=S==0?mix(vec3(.15,.24,.34),vec3(.04,.07,.15),ss(49.,53.,b)):vec3(.05,.07,.12);
  float s=f>.5&&(S==0||S==1||S==4)?sh(p+n*.06,l):1.,ao=cl(.35+map(p+n*.45).x*1.5);
  vec3 c=a*(C*max(0.,dot(n,l))*s+o*(.42+.58*n.y)*ao)+mix(vec3(1),a,k)*C*pow(max(0.,dot(n,nz(l-d))),90.-75.*r)*(1.4-r)*s;

  if(S==1||S==2)c+=a*(S==1?CY*.4:AM+CY*ss(30.,36.,b))*max(0.,-n.y)*ao;
  else if(S>=3){
    vec3 q=(S==3?vec3(0,sin(T*2.)*.8,0):vec3(0,7.65,round(p.z/8.)*8.))-p,u=nz(q),y=CY*(S==3?3.8+5.*K:2.8+6.5*(pow(N,1.2)+.45*K));
    c+=(a*max(0.,dot(n,u))+mix(vec3(1),a,k)*pow(max(0.,dot(n,nz(u-d))),64.)*1.8)*y/(1.+.03*dot(q,q))+(S==3&&m>4.5?a*AM*(.25+cl(length(p.xz)*.1)):vec3(0));
  }
  return c+e+k*sky(reflect(d,n))*mix(vec3(.25),a,k)*(.16+.68*pow(1.-max(0.,dot(n,-d)),4.));
}

vec2 mr(vec3 o,vec3 d,float m){float t=.04,k=0.;for(int i=Z;i<96;i++){vec2 h=map(o+d*t);if(h.x<.0035){k=h.y;break;}t+=min(h.x,G);if(t>m)break;}return vec2(t,k);}

vec3 vl(vec3 o,vec3 d,float m){
  vec3 v=vec3(0),u=nz(vec3(.24,-1,.12));
  if(S!=1&&S!=4)return v;
  float dt=min(m,S==1?85.:58.)/20.;
  for(int i=0;i<20;i++){
    vec3 q=o+d*((float(i)+.5)*dt);
    if(S==1&&q.y>W&&q.y<18.5){vec3 r=q-vec3(0,18,round(q.z/20.)*20.);float j=dot(r,u),a=2.85+max(0.,j)*.055;v+=vec3(.8,.95,1)*ss(a+.55,a-.45,length(r-u*j))*step(0.,j)*dt*.034;}
    else if(S==4&&abs(q.x)<4.7&&abs(q.y-8.1)<3.2){
      float z=round(q.z/8.)*8.,s=floor(bt*4.)+z*.37,e=1.-abs(q.x)/4.65;
      float r=length(vec2(q.y-7.65-1.15*(1.-q.x*q.x/21.)-(sin(q.x*3.4+s*9.)*.48+sin(q.x*8.9-s*17.)*.22)*e,q.z-z-sin(q.x*5.+s*13.)*.38*e));
      v+=mix(CY,vec3(1),exp(-r*18.))*(exp(-r*13.)*3.8+exp(-r*3.2)*.48)*dt*(.65+1.9*(pow(N,1.2)+.55*K));
    }
  }
  return v;
}

void main(){
  T=R.z; b=T/1.875; bt=T/.46875; Z=min(0,int(R.x)); K=exp(-fract(bt)*9.); N=exp(-fract((bt+1.)*.5)*14.);
  vec3 o,a; L=0.; W=-100.;
  S=b<16.||b>=52.?0:b<28.?1:b<36.?2:b<44.?3:4;
  I=nz(S==4||(S==0&&b>=52.)?vec3(-.3,.2,-.9):vec3(.4,.7,S==0?-.6:.3));
  C=S==0&&b>=52.?vec3(.5,.6,.9):S==4?vec3(1.5,.75,.45):vec3(1.5,1.35,1.2);
  float u=fract(b/4.);
  if(S==0){
    W=12.1; L=b>=8.&&b<16.?ss(8.,9.6,b)*3.6:0.;
    if(b<8.){o=mix(vec3(-30,19,26),vec3(5.5,14.4,10),b/8.);a=vec3(0,11.2,0);}
    else if(b<12.){o=mix(vec3(11.5,16.4,21),vec3(2.8,13.6,25),u);a=vec3(0,7.5,7);}
    else if(b<16.){float z=mix(6.,28.,u);o=vec3(sin(u*3.14)*2.4,oY(z)+3.1,z);a=vec3(0,oY(z+11.)+1.3,z+11.);}
    else{o=mix(vec3(-8,15.6,-16),vec3(-16,20.5,-35),cl((b-52.)/12.));a=vec3(0,11.9,1);}
  }else if(S==1){float v=(b-16.)/12.;W=mix(.15,1.25,v);o=vec3(sin(v*9.)*2.4,mix(7.5,W+1.55,v),mix(14.,-76.,v));a=vec3(0,mix(6.,3.2,v),o.z-24.);}
  else if(S==2){float v=(b-28.)/8.,y=-v*58.-v*v*32.,w=v*2.6;o=vec3(cos(w)*2.2,y,sin(w)*2.2);a=vec3(cos(w+.4)*.6,y-14.,sin(w+.4)*.6);}
  else if(S==3){float v=(b-36.)/8.,w=v*5.-.4;o=vec3(cos(w)*9.6,mix(4.6,-2.8,v),sin(w)*9.6);a=vec3(0,mix(-.4,1.2,v),0);}
  else{float v=(b-44.)/8.;o=vec3(sin(v*6.2)*3.5,4.+3.8*sin(v*3.14),mix(18.,-34.,v));a=vec3(0,7.3,o.z-16.);}

  float f=length(a-o),m=165.,q=m;
  vec2 uv=(gl_FragCoord.xy-.5*R.xy)/R.y;
  vec3 w=nz(a-o),x=nz(cross(w,S==2?vec3(sin(T*.3),0,cos(T*.3)):vec3(0,1,0))),d=nz(uv.x*x+uv.y*cross(x,w)+1.2*w);
  vec3 c=vec3(0),e=vec3(1),o0=o,d0=d;

  for(int i=Z;i<2;i++){
    D=d; vec2 h=mr(o,d,i==0?m:70.); float t=h.x,k=h.y,y=(W-o.y)/d.y;
    if(i==0&&(S==0||S==1)&&d.y<-1e-4&&o.y>W&&y>0.&&y<t){
      vec3 p=o+d*y;
      if(S==1||(p.z<dZ(p.x)-1.4&&abs(p.x)<58.)){
        q=y; float r=S==1?.016:b>=52.?.006:.012,s=T*(S==1?.7:.35);
        vec3 n=nz(vec3(-cos(p.x+p.z*.5+s*2.)*r,1.,-cos(p.x*2.-p.z*1.6-s*3.)*r)),g=reflect(d,n);
        float z=clamp(.08+pow(1.-max(0.,dot(n,-d)),5.),.15,.95);
        c+=e*(mix(vec3(.02,.24,.3),vec3(.01,.05,.1),ss(49.,53.,b))*(1.-z)+C*pow(max(0.,dot(g,I)),180.)*2.);
        e*=z; o=p+vec3(0,.06,0); d=g; continue;
      }
    }
    if(i==0)q=t;
    vec3 s=sky(d);
    if(k>.5)s=mix(shd(o+d*t,cn(o+d*t),k,d,i==0?1.:0.),min(s,vec3(.55,.72,.84)),clamp(1.-exp(-t*(S==0?.004:S==4?.009:.016)),0.,.92));
    c+=e*s; break;
  }
  vec3 v=vl(o0,d0,min(q,m))+(S==2?mix(AM,CY,ss(28.,36.,b))*exp(-length(uv)*6.5)*2.4:vec3(0));
  O=vec4(clamp(c+v,vec3(0),vec3(18)),cl(abs(q-f)/f*.12)*(1.-cl(length(v)*1.5)));
}
