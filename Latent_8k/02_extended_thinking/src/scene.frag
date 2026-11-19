// The header (#version, precision, uniform vec4 R, out vec4 O) is added in main.js.
// T time, BT beats, M material of last map(), CM material of last cl(), D/DD distance without the cell guard,
// W walk amount, BL eye openness, LV recursion level, OI star intensity
float T,BT,M,CM,D,DD,W,BL,LV,OI,AH,FT; // AH arm lift
int S;              // scene: 0 hero + code towers, 1 subagents, 2 recursion, 3 formation, 4 tunnel
vec3 P,HP,SD,SC,HC,ZC,CP,Q; // CP/Q: Clawd-local position of the last cl()/map()
// // star position, hero position, sun direction/colour, horizon and zenith colour
vec2 CS;            // cell size of the repeated grid
const vec3 CE=vec3(3,6,1),SP=vec3(0,12.5,5); // where the inner Clawd stands inside the eye; star above the head

float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
// Clawd: 11 units wide, 9 tall, feet at y=0, facing +z. The eyes are 1x1 rooms cut into the body.
float cl(vec3 p){
  float x=abs(p.x),
        l=W*.4*max(sin(BT*3.1416)*sign(p.x)*sign(x-3.)*sign(p.z),0.),
        d=min(min(bx(p-vec3(0,5.95,0),vec3(4.4,3.1,1.5)),
                  bx(vec3(x-5.,p.y-5.9-AH,p.z),vec3(.4,.95,.9))),
              bx(vec3(abs(x-3.)-1.,p.y-1.4-l,abs(p.z)-1.),vec3(.4,1.4-l,.4)))-.1,
        e=-bx(vec3(x-3.,p.y-6.5,p.z-1.6),vec3(.5,.5*BL,1.2));
  CM=1.;CP=p;
  if(e>d){d=e;CM=2.;}
  return d;
}
// the spinner: a six-armed star
float st(vec3 p){
  float a=.6*sin(T);
  p.xz*=mat2(cos(a),sin(a),-sin(a),cos(a));
  a=mod(atan(p.y,p.x)+T*1.5,1.0472)-.5236;
  vec2 q=length(p.xy)*vec2(cos(a),sin(a));
  q.x-=clamp(q.x,0.,1.3);
  return length(vec3(q,p.z))-.18;
}
void U(float e,float m){if(e<D){D=e;M=m;Q=CP;}}
float th(vec2 i){return 6.+34.*h1(i);}
float hp(vec2 i){return 1.5*abs(sin(BT*3.1416-.4*i.y-.25*i.x));}
// The distance field. Written so that cl() and map() have few call sites: every one is inlined and costs seconds of compile time.
float map(vec3 p){
  vec2 i=floor(p.xz/CS+.5);
  vec3 q=p;
  float g=1e3,k=1.,r=length(p.xy),a=mod(atan(p.x,p.y)+p.z*.03+.3927,.7854)-.3927,e;
  bool c=true; // is there a repeated Clawd in this cell?
  D=p.y;M=0.;AH=HP.y;
  q.xz-=i*CS;
  // one call for two jobs: the outer level of the recursion, or the mask of the formation
  e=cl(S==2?CE+p/16.:vec3(i.x,4.75-i.y*.5,.8));
  if(S==2){
    // three nested levels: the one whose eye we are in, the hero, the one in its eye
    if(LV>0.){D=e*16.;M=CM;Q=CP;}
    q=(p-HP-CE)*16.-HP;k=16.;
  }else{
    // never step further than into the next cell
    g=max(min(CS.x*.5-abs(q.x),CS.y*.5-abs(q.z))+.5,p.y-45.);
    if(S==0){
      c=false;
      if(i.x!=0.)U(bx(q,vec3(4.5,th(i),4.5)),4.);
    }else if(S==4){
      // tunnel: twisted rings of eight Clawds standing on the wall
      D=24.-r;
      AH=hp(i*vec2(0,1));
      g=7.5-abs(q.z);
      q=vec3(r*sin(a),24.-AH-r*cos(a),q.z);
    }else{
      c=S==1||e<0.;
      AH=hp(i);
      // in the formation they drop in from above, back rows first
      q.y-=AH+(S==3?40.*sat(1.5+i.y*.1+h1(i)-FT):0.);
    }
  }
  if(c){
    e=cl(q)/k;U(e,CM);
    if(S<3)U(st(q-SP)/k,3.);
  }
  if(S%2==0){
    // the hero
    AH=S==4?0.:HP.y;
    q=p-HP;
    e=cl(q);U(e,CM);
    U(st(q-SP),3.);
  }
  if(S==4)D*=.8;
  DD=D;
  return min(D,g);
}
vec3 nrm(vec3 p,float e){
  vec3 n=vec3(0),k;
  for(int i=0;i<4;i++){
    k=vec3((i+3)>>1&1,i>>1&1,i&1)*2.-1.;
    n+=k*map(p+k*e);
  }
  return normalize(n);
}
float shd(vec3 p,vec3 l,float mx){
  float r=1.,t=.05;
  for(int i=0;i<60;i++){
    if(t>mx)break;
    float d=map(p+l*t);
    r=min(r,8.*DD/t);
    if(r<.01)break;
    t+=clamp(d,.05,5.);
  }
  return sat(r);
}
float ao(vec3 p,vec3 n,float s){
  float a=0.,w=1.;
  for(float i=1.;i<6.;i++){map(p+n*i*s);a+=(i*s-DD)*w;w*=.6;}
  return sat(1.-a/s*.6);
}
// a wall of code: a along the wall (0..9), y in rows, s seed
vec3 cd(float a,float y,float s){
  float h=h1(vec2(floor(y),s)),k=floor(h*4.)*.7+.5;
  return mix(vec3(1,.4,.2),vec3(.2,.7,1),step(.7,fract(h*9.)))*1.5*step(k,a)*step(a,k+1.+6.*fract(h*5.))*step(fract(y),.5)*step(.2,h);
}
// plasma on a grid of tiles
vec3 pm(vec2 u){
  vec2 f=fract(u);
  u=floor(u);
  return mix(vec3(1,.3,.08),vec3(.08,.3,1),.5+.5*sin(sin(u.x*.3272+T)+sin(u.y*.2-T*1.3)+2.*sin(length(u)*.25-T*2.)))*step(.08,min(f.x,f.y));
}
vec3 sky(vec3 d){
  float s=max(dot(d,SD),0.);
  return mix(HC*(.25+.75*s*s)+ZC*.5,ZC,pow(sat(d.y),.4))+SC*(pow(s,40.)*.15+smoothstep(.9994,.9997,s)*8.);
}
void main(){
  T=R.z;BT=T/.48;
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  vec3 ro,ta,FA=vec3(.02,.025,.035),OC=vec3(1,.6,.35),p,n,am;
  float fv=1.5,FAR=500.,fk=.0025,rl=0.,t=BT/4.,el=-1.,t0=t;
  CS=vec2(14);W=0.;LV=0.;OI=1.;HP=vec3(0);
  BL=.1+.9*smoothstep(0.,.02,abs(fract(T*.27)-.5));
  if(t<8.){
    // the prompt: Clawd asleep in the dark, the spinner lights up
    S=0;
    ro=t<4.?vec3(5,7.5,13.+t):vec3(6.*sin(T*.15),4.5,46.-2.*t);ta=vec3(0,6.5,0);
    OI=smoothstep(.5,2.,t);
    if(t<4.5)BL=.1;
  }else if(t<16.){
    // thinking: a walk between towers of code at dawn
    S=0;t-=8.;W=1.;el=t*.012;
    HP=vec3(0,.4*abs(sin(BT*3.1416)),t*18.);
    if(t<4.){ro=HP+vec3(7.-t*2.,3.,32.-t*3.);ta=HP+vec3(0,6.5,0);}
    else{ro=HP+vec3(t-10.,11.,-20.);ta=HP+vec3(1,8,8);}
  }else if(t<24.){
    // the tunnel
    S=4;t-=16.;W=1.;
    HP=vec3(0,-5,-t*60.);
    ro=HP+vec3(3.*sin(T),5.+3.*cos(T*.7),30.+8.*sin(T*.5));ta=HP+vec3(0,5,0);
    rl=T*.4;
  }else if(t<40.){
    // subagents on the dance floor
    S=1;CS.y=30.;t-=24.;el=.13;
    if(t<4.){ro=vec3(t*9.,7.,20.);ta=ro+vec3(.6,0,-1);}
    else if(t<8.){ro=vec3(4.*sin(t),2.,15);ta=vec3(0,7,0);fv=1.1;}
    else if(t<12.){ro=vec3(7.,20.,t*16.);ta=ro+vec3(.35,-.3,1);}
    else{ro=vec3(7.,4.,15.+t*60.);ta=ro+vec3(.1*sin(T),.1,1);}
  }else if(t<56.){
    // recursion: zoom by 16 every two bars into the eye, where the same scene waits
    S=2;t=t/2.-20.;LV=floor(t);el=.5;fv=2.;fk=0.;FAR=900.;
    HP.y=.6*abs(sin(BT*3.1416));
    ro=(CE+HP)*16./15.;
    ro.z+=28.*exp2(-4.*fract(t));
    ta=ro+vec3(.06*sin(T*.7),.04*sin(T*.9),-1);
    rl=.15*sin(T*.4);
  }else{
    // the subagents line up as one big Clawd
    S=3;CS=vec2(12,6);FT=t-56.;t=smoothstep(1.,7.,FT);el=.6;FA=vec3(.8,.74,.62);
    ro=mix(vec3(-10,5,78),vec3(0,100,42),t);ta=mix(vec3(0,6,48),vec3(0,0,2),t);
  }
  // zoom pumps with the kick
  if(t0>=8.)fv-=.06*exp(-4.*fract(BT));
  float dy=sat(el*2.),br=sat(el*6.+.15);
  SD=normalize(vec3(.15,el,.8));
  HC=mix(vec3(1,.35,.12),vec3(.75,.85,1),dy)*br;
  ZC=mix(vec3(.03,.04,.15),vec3(.12,.3,.75),dy)*br+vec3(.003,.004,.01);
  SC=mix(vec3(1,.4,.15),vec3(1,.92,.8),dy)*1.25*sat(el*8.);
  am=ZC*.5+HC*.2;
  P=HP+SP;
  vec3 w=normalize(ta-ro),uu=normalize(cross(w,vec3(sin(rl),cos(rl),0))),
       rd=normalize(u.x*uu+u.y*cross(uu,w)+fv*w),col=vec3(0),at=vec3(1);
  for(int b=0;b<2;b++){
    float d,g=1e3,rf=0.;
    t=0.;
    for(int i=0;i<300;i++){
      d=map(ro+rd*t);
      g=min(g,length(ro+rd*t-P));
      if(d<6e-4*t+2e-3||t>FAR)break;
      t+=d;
    }
    if(DD>.01*t+.02)t=FAR;
    p=ro+rd*t;
    vec3 bg=sky(rd),c=bg;
    if(t<FAR){
      float m=M,gs=32.,sp=.3;
      vec3 al=FA,e=vec3(0),lq=Q;
      n=nrm(p,1e-3+5e-4*t);
      if(m==3.)c=OC*5.*OI;
      else{
        if(m==1.){
          al=vec3(.62,.14,.055);
          e=sky(reflect(rd,n))*pow(sat(1.+dot(rd,n)),3.)*.3;
        }else if(m==2.){al=vec3(.004);rf=.05;gs=300.;
          // inside the head: scrolling code on the walls
          if(S==2)e=cd(abs(n.x)>.5?lq.z*7.5-3.:abs(lq.x)*9.-22.5,lq.y*14.+T*3.,7.)*step(abs(n.y),.5)*.4;
        }
        else if(m==4.){
          // lines of code, typed from the top of each tower
          vec2 i=floor(p.xz/14.+.5);
          al=vec3(.012);rf=.06;
          e=cd((abs(n.x)>.5?p.z-i.y*14.:p.x-i.x*14.)+4.5,p.y*1.2,i.x+i.y*7.)
            *step((th(i)-p.y)*1.2,(BT-32.)*5.-30.*h1(i+.5))*step(abs(n.y),.5);
        }else{
          vec2 q=abs(fract(p.xz/CS+.5)-.5)*CS;
          al*=.4+.6*smoothstep(0.,.08+.003*t,min(q.x,q.y));
          rf=.05+.7*pow(sat(1.+dot(rd,n)),5.);gs=200.;sp=2.;
          // plasma: tunnel wall and dance floor
          if(S==4)e=pm(vec2(atan(p.x,p.y)*15.28,p.z*.5))*.5;
          if(S==1)e=pm(p.xz*.5)*(.08+.3*exp(-3.*fract(BT)));
        }
        vec3 l=P-p;
        float ld=length(l);
        l/=ld;
        bool N=SC.x<=0.;
        float sh=S==2?1.:shd(p+n*.03,N?l:SD,N?ld-4.:200.),
              pl=S%4==0?OI/(1.+.004*ld*ld):0.;
        if(N)pl*=sh;
        c=al*(SC*max(dot(n,SD),0.)*sh+OC*5.*pl*max(dot(n,l),0.)+am*ao(p,n,S==2?.03*t:.3)*(.6+.4*n.y))
          +(SC*sh*pow(max(dot(n,normalize(SD-rd)),0.),gs)+OC*pl*pow(max(dot(n,normalize(l-rd)),0.),gs))*sp+e;
      }
      c=mix(bg,c,exp(-fk*t));
    }
    // light shafts: sample the sun's shadow along the view ray
    if(b==0&&S<2&&SC.x>0.){
      float v=0.,j=h1(gl_FragCoord.xy+T),tm=min(t,160.);
      for(float i=0.;i<16.;i++)v+=shd(ro+rd*tm*(i+j)/16.,SD,90.);
      c+=SC*v*tm*4e-5*(1.+6.*pow(max(dot(rd,SD),0.),6.));
    }
    if(S%4==0)c+=OC*OI*.4*pow(1.5/max(g,1.5),2.);
    col+=at*c;
    if(rf<=0.)break;
    at*=rf;
    ro=p+n*.03;
    rd=reflect(rd,n);
  }
  O=vec4(clamp(col,0.,30.),1);
}
