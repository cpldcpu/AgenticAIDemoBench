#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// One level of the world: a red wooden house with a window; inside, a snow globe on
// the sill; inside the globe, a village. The next level down is this same function,
// shrunk by SC about the fixed point F so that its house stands in the middle of the
// globe's village. The camera only ever moves along F + v*r.
const float SC=.05;
const vec3 F=vec3(0,1.8421,1.4868),C=vec3(0,1.75,1.35),G=vec3(0,2.35,1.35),
  M=vec3(.33,.55,.77),LP=vec3(-3.,3.2,-4.),SL=vec3(.3,1.96,1.67),C0=vec3(0,0,-1.25);
float T,B,NU;
// Each level n differs a little: mirrored on odd n, its own house paint, a candle that has
// burnt a little further down every level further out, and someone watching the globe.
float xs(float n){return mod(n,2.)>.5?-1.:1.;}
vec3 fp(float n){return vec3(-1.45,1.37+.14*mod(-n,4.)+.24,2);}
float sm(float a,float b){float h=max(.12-abs(a-b),0.)/.12;return min(a,b)-h*h*.03;}
float cap(vec3 p,vec3 a,vec3 b,float r){p-=a;b-=a;return length(p-b*clamp(dot(p,b)/dot(b,b),0.,1.))-r;}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
mat2 rt(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float hs(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float nz(vec3 p){
  vec3 i=floor(p),f=fract(p),e=vec3(1,0,0);f*=f*(3.-2.*f);
  return mix(mix(mix(hs(i),hs(i+e),f.x),mix(hs(i+e.yxy),hs(i+e.xxy),f.x),f.y),mix(mix(hs(i+e.yyx),hs(i+e.xyx),f.x),mix(hs(i+e.yxx),hs(i+1.),f.x),f.y),f.z);
}
vec2 U(vec2 a,float d,float m){return d<a.x?vec2(d,m):a;}
float tree(vec3 q,float h){
  float y=q.y/h;
  return max((length(q.xz)-h*.4*(1.-y)*(1.15-.45*fract(y*3.)))*.6,abs(q.y-h*.5)-h*.5);
}
float hut(vec3 q){
  return min(bx(q-vec3(0,.06,0),vec3(.08,.06,.1)),max(max(.6*abs(q.x)+.8*q.y-.14,.1-q.y),abs(q.z)-.12));
}
vec2 L(vec3 p,float n){
  p.x*=xs(n);
  float k=mod(n+1.,4.);
  vec3 q=p-vec3(0,2.5,-1.25),c=p-C,h=c-vec3(-.48,0,-.3),j=c-vec3(.45,0,-.42),f=fp(n),b=p-vec3(-1.3,0,-.4);
  vec2 r=vec2(max(max(max(bx(q,vec3(4.35,2.85,4.1)),-bx(q,vec3(4,2.5,3.75))),-bx(p-vec3(0,2.6,2.7),vec3(1.6,1.3,.6))),-bx(p-vec3(2.75,1.3,2.85),vec3(.55,1.3,.12))),1.);
  float pr=.53*abs(p.x)+.848*p.y-6.78;
  r=U(r,max(max(pr,4.75-p.y),abs(q.z)-4.1),1.);
  r=U(r,max(max(max(pr,-pr-.35),4.75-p.y),abs(q.z)-4.4),2.);
  r=U(r,bx(p-vec3(2.3,6.8,-2.6),vec3(.35,1.3,.35)),1.);
  r=U(r,min(bx(p-vec3(0,3.25,2.68),vec3(1.6,.05,.07)),bx(p-vec3(0,1.22,1.7),vec3(2.1,.08,.95))),3.);
  r=U(r,max(length(p.xz-G.xz)-.88+(p.y-1.3)*.2,abs(p.y-1.52)-.22),4.);
  float gb=length(p-G)-1.;
  if(gb<.1){
    r=U(r,max(gb+.03,c.y),5.);
    r=U(r,min(min(tree(c-vec3(.62,0,.05),.32),tree(c-vec3(-.62,0,.12),.36)),min(tree(c-vec3(.12,0,-.68),.26),tree(c-vec3(-.2,0,-.66),.3))),6.);
    h.xz*=rt(.5);j.xz*=rt(-.4);
    r=U(r,min(min(hut(h),hut(j)),max(length(c.xz-vec2(.3,.32))-.006,abs(c.y-.1)-.1)),7.);
  }else r=U(r,gb,0.);
  r=U(r,max(length(p.xz-vec2(-1.45,2))-.07,abs(p.y-.615-f.y*.5)-f.y*.5+.685),3.);
  r=U(r,min(min(length(p-SL)-.018,length(p-LP)-.22),length((p-f)/vec3(.03,.07,.03))*.03-.03),8.);
  if(k<2.5){
    vec3 e=k>1.5?vec3(.62,3.,.2):vec3(.42,1.95,.2);
    float d=sm(sm(cap(b,vec3(0,1.,0),vec3(0,2.4,0),.3),cap(b,vec3(-.3,2.55,0),vec3(.3,2.55,0),.14)),cap(b,vec3(0,2.6,0),vec3(0,2.95,.03),.09));
    d=sm(d,length((b-vec3(0,3.17,.04))/vec3(.95,1.15,1.))*.95-.21);
    d=sm(d,min(min(cap(b,vec3(-.36,2.55,0),vec3(-.43,1.9,.1),.08),cap(b,vec3(-.43,1.9,.1),vec3(-.3,1.35,.35),.07)),
      min(cap(b,vec3(.36,2.55,0),e,.08),cap(b,e,k>1.5?vec3(.72,3.7,.3):vec3(.3,1.35,.35),.07))));
    r=U(r,d,11.);
  }
  vec3 cq=vec3(abs(p.x)-2.2,p.y-3.15,p.z-2.3+.07*sin(abs(p.x)*22.));
  r=U(r,bx(cq,vec3(.45,1.8,.03))*.7,10.);
  // icicles along the eaves, their lengths different in every level
  vec3 ic=vec3(abs(p.x)-4.85,p.y-4.76,mod(p.z,.35)-.175);
  float il=.15+.4*hs(vec3(floor(p.z/.35),n,1));
  r=U(r,max(max(length(ic.xz)-.06*(ic.y+il)/il,-ic.y-il),max(ic.y,abs(q.z)-4.3))*.7,12.);
  vec2 a=vec2(abs(p.x),p.y)-vec2(4.8,5),dr=vec2(-.848,.53);
  float s=(floor(clamp(dot(a,dr),0.,5.6)/.47)+.5)*.47;
  r=U(r,length(vec3(a-dr*s,p.z-3.25))-.09,9.);
  return r;
}
vec2 map(vec3 p){
  vec2 r=vec2(1e9,0),d;
  float k=1./SC;
  for(int i=0;i<4;i++){
    vec3 q=F+(p-F)/k;
    float b=length(q-vec3(0,4,-1.25))-8.;
    d=i>1&&b>.5?vec2(b,0):L(q,NU+1.-float(i));
    d.x*=k;
    if(d.x<r.x)r=vec2(d.x,d.y+float(i)*16.);
    k*=SC;
  }
  return r;
}
// Snow inside the globe of one level: a jittered grid that falls and turns with the water.
vec3 snow(vec3 ro,vec3 rd,float tm,float k){
  vec3 o=F+(ro-F)/k,oc=o-G;
  float b=dot(oc,rd),h=b*b-dot(oc,oc)+.92;
  if(h<0.)return vec3(0);
  h=sqrt(h);
  float t0=max(-b-h,0.),t1=min(-b+h,tm/k),a=.08*T+7.*max(0.,1.-exp(-max(B-32.,0.)*.3)),
    fl=.05*T-1.4*max(0.,1.-exp(-max(B-32.,0.)*.4)),acc=0.,cs=.07,
    dens=(.3+.6*exp(-max(B-32.,0.)*.25)*step(32.,B))*(1.-smoothstep(56.,63.,B)*.8);
  for(int i=0;i<30;i++){
    float t=t0+float(i)*cs;
    if(t>t1)break;
    vec3 p=o+rd*t-G;
    p.xz*=rt(a);
    // every column of cells falls at its own speed, every flake drifts on its own
    float v=.5+hs(vec3(floor(p.xz/cs),1));
    p.y+=fl*v;
    vec3 id=floor(p/cs),f=(id+.1+.8*vec3(hs(id),hs(id+7.),hs(id+13.)))*cs;
    f.xz+=.015*sin(T*vec2(1.3,1.1)+hs(id)*vec2(9,7));
    f.y-=fl*v;f.xz*=rt(-a);f+=G;
    float d=length(cross(f-o,rd)),w=.003+.005*hs(id+3.)*hs(id+3.);
    acc+=smoothstep(w,w*.2,d)*smoothstep(.05,.25,t)*step(hs(id+5.),dens)*step(length(f-G),.95)*step(C.y,f.y);
  }
  return vec3(.75,.82,1.)*acc;
}
// moonlight hanging in the room's air where it falls through the window
float beam(vec3 ro,vec3 rd,float t,float g,float n){
  vec3 o=F+(ro-F)/g,x=vec3(xs(n),1,1),a,c;o*=x;rd*=x;
  a=(vec3(-4,0,-5)-o)/rd;c=(vec3(4,5,2.5)-o)/rd;
  vec3 lo=min(a,c),hi=max(a,c);
  float t0=max(max(max(lo.x,lo.y),lo.z),0.),t1=min(min(min(hi.x,hi.y),hi.z),t/g),s=0.,d=(t1-t0)/16.;
  for(int i=0;i<16;i++){
    vec3 w=o+rd*(t0+d*(float(i)+hs(vec3(gl_FragCoord.xy,i))));
    w+=M*((2.6-w.z)/M.z);
    s+=d*smoothstep(.1,0.,max(abs(w.x)-1.6,abs(w.y-2.6)-1.3));
  }
  return t1>t0?s:0.;
}
vec3 glow(vec3 ro,vec3 rd,float t,vec3 w,float g,vec3 I){
  w-=ro;float a=dot(w,rd);w-=rd*a;
  return a>0.&&a<t+.03*g?I/(dot(w,w)/(g*g)*4e3+1.):vec3(0);
}
void main(){
  T=R.z;B=T/1.875;
  vec2 uv=(2.*gl_FragCoord.xy-R.xy)/R.y;
  float u=1.5*smoothstep(8.,32.,B)-2.*smoothstep(32.,48.,B)+2.5*smoothstep(48.,60.,B),
    r=.5*exp(fract(u)*log(1./SC)),
    fk=1.+.15*sin(T*13.+sin(T*7.)),
    sh=(exp(-max(B-32.,0.)*1.5)+.35*exp(-fract(B)*9.)*step(32.,B)*step(B,48.))*step(31.9,B),
    rl=.3*sin(B*.37)*smoothstep(32.,36.,B)*(1.-smoothstep(54.,60.,B));
  NU=floor(u);
  vec3 v=normalize(vec3(.25+.08*sin(T*.21),.22,1)),
    ro=F+v*r+.012*r*sh*sin(vec3(37,41,29)*T),
    ww=normalize(F+vec3(0,.2,-.28)*r-ro),
    uu=normalize(cross(ww,vec3(sin(rl),cos(rl),0))),
    rd=normalize(uv.x*uu+uv.y*cross(uu,ww)+1.7*ww);
  float t=0.;
  vec2 h;
  for(int i=0;i<220;i++){
    h=map(ro+rd*t);
    if(h.x<.0004*t||t>600.)break;
    t+=h.x*.9;
  }
  vec3 p=ro+rd*t,col=vec3(0);
  float lv=floor(h.y/16.),m=h.y-lv*16.,k=pow(SC,lv-1.);
  vec2 e=vec2(.0003*t,0);
  vec3 n=normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x)),
    q=F+(p-F)/k,c,FL,X;
  float nl=NU+1.-lv,xm=xs(nl),hk=mod(nl+1.,4.);
  q.x*=xm;n.x*=xm;c=q-C;FL=fp(nl);X=rd;X.x*=xm;
  bool ins=bx(q-vec3(0,2.5,-1.25),vec3(4,2.5,3.75))<.02;
  float on=(smoothstep(7.6,8.,B)*(1.-smoothstep(62.,63.5,B))+.15)*(1.+.4*smoothstep(47.8,48.,B)*(1.-smoothstep(55.,56.,B))),
    ao=clamp(map(p+n*.05*k).x/(.05*k),0.,1.)*.5+.5*clamp(map(p+n*.2*k).x/(.2*k),0.,1.),
    sn=0.;
  bool ou=m<5.&&!ins;
  vec3 al=vec3(.8,.84,.9),em=vec3(0),wm=vec3(1,.55,.25);
  float sp=0.,gl=12.;
  vec3 hc=hk<.5?vec3(.4,.06,.04):hk<1.5?vec3(.42,.27,.05):hk<2.5?vec3(.07,.12,.26):vec3(.05,.17,.09),sc=vec3(1);
  if(m==1.){
    if(ins){
      float pl=floor(q.x*2.);
      // wide floor planks with grain and gaps, glossy; patterned wallpaper on the walls
      al=n.y>.5?vec3(.27,.14,.07)*(.7+.3*hs(vec3(pl,floor(q.z*.4+pl*.37),1)))*(.75+.25*nz(vec3(q.x*30.,q.z*1.5,pl)))*smoothstep(.0,.03,abs(fract(q.x*2.)-.5)-.47+.5)
        :mix(vec3(.4,.29,.19),vec3(.48,.37,.24),smoothstep(.2,.3,abs(sin((q.x+q.z)*14.+sin(q.y*14.)*.9)*sin(q.y*14.))))*(.9+.1*smoothstep(.0,.05,abs(fract((q.x+q.z)*1.5)-.5)));
      sp=n.y>.5?.5:0.;gl=50.;
    }else{
      // painted siding: every board its own shade, grain showing through
      float bd=floor(q.y*3.);
      al=hc*(.9+.1*hs(vec3(bd,floor((q.x+q.z)*.3+bd*.37),hk)))*(.85+.15*nz(vec3((q.x+q.z)*2.,q.y*45.,bd)))*(.75+.25*smoothstep(0.,.06,abs(fract(q.y*3.)-.5)));
      sp=.15;
    }
    if(!ins&&q.z>2.4&&abs(q.x)<1.85&&abs(q.y-2.6)<1.55)al=vec3(.75),sp=.3;
    // the front door, set into the wall beside the window
    if(!ins&&q.z>2.6&&abs(q.x-2.75)<.56&&q.y<2.62)al=vec3(.13,.07,.04)*(.7+.6*nz(q*vec3(4,30,4))),sp=.3;
    sn=ins?0.:smoothstep(.6,.8,n.y);
  }
  if(m==2.){al=vec3(.1,.06,.05)*(.7+.6*nz(q*vec3(3,40,3)));sn=smoothstep(.25,.5,n.y);}
  if(m==3.){al=vec3(.75);sp=.25;gl=30.;if(length(q.xz-FL.xz)<.08)em=wm*.5*fk*smoothstep(.4,0.,FL.y-q.y);}
  if(m==4.){
    // lacquered wood with a polished brass band
    bool br=abs(q.y-1.65)<.03;
    al=br?vec3(.7,.45,.15):vec3(.1,.05,.03)*(.6+.8*nz(vec3(q.x*4.,q.y*70.,q.z*4.)));
    sp=br?1.5:.5;gl=br?40.:90.;sc=br?al:sc;
  }
  if(m==6.){al=vec3(.03,.1,.06)*(.6+.8*nz(q*vec3(90,25,90)));sn=smoothstep(.5,.9,n.y)*.7;}
  if(m==11.){al=q.y>3.22?vec3(.05,.03,.02):q.y>2.95?vec3(.3,.18,.13):(hk<.5?vec3(.22,.18,.13):hk<1.5?vec3(.25,.04,.03):vec3(.04,.12,.08))*(.85+.3*nz(q*vec3(40,60,40)));em=wm*.12*on*pow(1.-abs(dot(n,X)),3.);}
  if(m==10.)al=vec3(.12,.25,.12)*(.6+.2*step(.5,fract(q.y*6.))+.2*step(.5,fract((q.x+q.z)*6.)));
  if(m==7.){
    al=hs(floor(q*9.))>.5?vec3(.35,.22,.08):vec3(.08,.12,.25);sn=smoothstep(.3,.6,n.y);
    if(n.y<.3&&c.y>.025&&c.y<.085&&sin(dot(c.xz,vec2(80)))>.2)em=wm*3.*on;
  }
  if(m==8.)em=wm*(length(q-FL)<.1?6.:2.5*on);
  if(m==9.){float hb=hs(floor(q*2.1)+vec3(sign(q.x)));em=(.6+.6*cos(6.28*(hb+vec3(0,.33,.67))))*4.*smoothstep(15.5,16.,B)*(1.-smoothstep(61.,62.,B))*(B>32.&&B<56.?.15+.85*step(.5,fract(floor(B*3.)*.5+hb)):1.);}
  if(m==12.)al=vec3(.6,.7,.85),sp=1.5,gl=60.;
  if(m==5.)sn=1.;
  // wind-packed snow: a little relief and a little unevenness
  if(sn>.3)n=normalize(n+.3*sn*(vec3(nz(q*30.),nz(q*30.+7.),nz(q*30.+13.))-.5));
  al=mix(al,vec3(.85,.9,1.)*(.92+.08*nz(q*6.)),sn);
  // moonlight comes in through the window; indoors only where the window lets it fall
  vec3 w=q+M*((2.6-q.z)/M.z);
  float mv=ins&&(m<3.||m>10.)?smoothstep(.1,0.,max(abs(w.x)-1.6,abs(w.y-2.6)-1.3)):1.,
    d1=length(q-LP);
  vec3 sl=(ou?C0+(SL*vec3(-1,1,1)-C)/SC:SL)-q,wl=(ou?vec3(0,2.6,3):C+SC*(vec3(0,2.6,3)-C0))-q;
  float d2=length(sl)*(ou?SC:1.),d3=length(wl)*(ou?1.:1./SC);
  col=al*(vec3(.02,.025,.05)*ao+vec3(.45,.55,1.)*.9*max(dot(n,M),0.)*mv*(.4+.6*ao)
    +(ins||m>2.?wm*7.*on/(1.+d1*d1)*max(dot(n,normalize(LP-q)),.2)*ao:vec3(0))
    +(ins||m>2.?wm*.12*fk/(dot(q-FL,q-FL)+.01)*max(dot(n,normalize(FL-q)),.15):vec3(0))
    +wm*.0012*on/(d2*d2+.0004)*max(dot(n,normalize(sl)),.1)
    +(!ins?wm*1.8*on/(1.+d3*d3)*max(dot(n,normalize(wl)),0.):vec3(0)))+em;
  vec3 rf=reflect(X,n);
  col+=sp*sc*(vec3(.45,.55,1.)*mv*pow(max(dot(rf,M),0.),gl)+(ins||m>2.?wm*(7.*on/(1.+d1*d1)*pow(max(dot(rf,normalize(LP-q)),0.),gl)+.12*fk/(dot(q-FL,q-FL)+.01)*pow(max(dot(rf,normalize(FL-q)),0.),gl)):vec3(0)));
  if(sn>.5&&hs(floor(q*600.))>.985)col+=vec3(.6,.7,1.)*2.*pow(max(dot(reflect(X,n),M),0.),4.);
  col=mix(col,vec3(.005,.008,.02),1.-exp(-t*.003));
  // glass globes of every level, and the snow inside the nearest two
  float g=1./SC;
  for(int i=0;i<4;i++){
    vec3 oc=ro-F-(G-F)*g;
    float b=dot(oc,rd),hh=b*b-dot(oc,oc)+g*g*.98;
    if(hh>0.)for(int j=-1;j<2;j+=2){
      float ti=-b+float(j)*sqrt(hh);
      if(ti>0.&&ti<t){
        vec3 nn=normalize(oc+rd*ti);
        float fr=.04+.96*pow(1.-abs(dot(nn,rd)),5.);
        vec3 rf=reflect(rd,nn);
        col=col*.96+fr*vec3(.1,.12,.2)+vec3(.8,.9,1.)*pow(max(dot(rf,M),0.),300.)*3.+wm*on*pow(max(dot(rf,normalize(LP-G)),0.),60.)*.5;
      }
    }
    if(i<3){
      // a frosted pane in every window, the frost growing in from the corners
      vec3 po=F+(ro-F)/g;
      float pz=(2.68-po.z)/rd.z;
      po+=rd*pz;
      if(pz>0.&&pz*g<t&&abs(po.x)<1.6&&abs(po.y-2.6)<1.3)
        col=mix(col,vec3(.55,.6,.75),.04+.6*smoothstep(.45,.1,min(1.6-abs(po.x),1.3-abs(po.y-2.6))*2.+.6*nz(po*7.)+.3*nz(po*23.)-.5));
      col+=snow(ro,rd,t,g)+vec3(.45,.55,1.)*.02*beam(ro,rd,t,g,NU+1.-float(i));
      float nn=NU+1.-float(i);
      vec3 x=vec3(xs(nn),1,1);
      // smoke from the chimney, puffs rising and drifting with the wind
      for(int j=0;j<5;j++){
        float f=fract(T*.15+float(j)*.2);
        vec3 c=F+(vec3(2.3+f*2.5+.3*sin(T+float(j)),8.2+f*3.5,-2.6)*x-F)*g-ro;
        float a=dot(c,rd),r=g*(.3+f*.9);
        c-=rd*a;
        col=mix(col,vec3(.32,.34,.4),a>0.&&a<t&&bx(F+(ro+rd*a-F)/g-vec3(0,2.5,-1.25),vec3(4.4,2.9,4.2))>0.?.5*(1.-f)*exp(-dot(c,c)/(r*r)):0.);
      }
      col+=glow(ro,rd,t,F+(fp(nn)*x-F)*g,g,wm*.35*fk)+glow(ro,rd,t,F+(SL*x-F)*g,g,wm*.2*on);
    }
    g*=SC;
  }
  O=vec4(col,1);
}
