#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// SNOW GLOBE - an 8k intro by Latent. A snow globe on a desk at night: shake it and the snow
// swirls inside the glass, the little cabin glows, and a music-box waltz plays.
// 96 BPM in 3/4: a beat is .625 s, a bar 1.875 s = 90000 samples, a sixteenth .15625 s = 7500.

float T,Z,L,SW;      // seconds, bars, local scene time, snow swirl amount
int K;               // scene
vec3 GC,LP,WD;       // globe centre, lamp position, window direction
float GR;            // globe radius

float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float h3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
vec2 rot2(vec2 p,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*p;}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float smn(float a,float b,float k);
float mapIn(vec3 q);
float ao(vec3 p,vec3 n,bool ins);
// rotate a vector into globe-local space (the shake) and back
vec3 gr(vec3 v){v.yz=rot2(v.yz,.2*SW*exp(-fract(T/.625)*3.5));v.xz=rot2(v.xz,.15*SW*sin(T*.6));return v;}
vec3 gri(vec3 v){v.xz=rot2(v.xz,-.15*SW*sin(T*.6));v.yz=rot2(v.yz,-.2*SW*exp(-fract(T/.625)*3.5));return v;}

// the dark room, seen directly and in the glass: gradient, the warm lamp, a window with the night
// sky, the moon, stars and dark mullions, and a few bokeh lights
vec3 LAMPD=normalize(vec3(-.55,.78,-.35));
vec3 room(vec3 d){
  vec3 c=mix(vec3(.010,.007,.013),vec3(.028,.019,.034),d.y*.5+.5);
  float l=max(dot(d,LAMPD),0.);
  c+=vec3(1.,.55,.25)*(pow(l,1200.)*5.+pow(l,30.)*.07+pow(l,10.)*.009);
  // the window: project the ray onto a plane in front of it
  vec3 wu=normalize(cross(vec3(0,1,0),WD)),wv=cross(WD,wu);
  float wa=dot(d,WD);
  if(wa>.2){
    vec2 wp=vec2(dot(d,wu),dot(d,wv))/wa;
    if(abs(wp.x)<.4&&wp.y>.02&&wp.y<.62){
      vec3 sky=mix(vec3(.012,.03,.08),vec3(.035,.08,.17),wp.y/.62);
      vec2 sp=floor(wp*vec2(70.,100.));
      float sh=h1(sp);
      sky+=step(.9955,sh)*vec3(.8,.9,1.)*.4*(.55+.45*sin(T*2.5+sh*40.)); // twinkling stars
      sky+=vec3(1.,.55,.25)*step(.9985,h1(sp+13.7))*.5*smoothstep(.14,.03,wp.y); // distant house lights
      float mn=length(wp-vec2(.2,.42));
      sky+=vec3(1.,.95,.8)*smoothstep(.07,.05,mn)*1.6+vec3(.3,.4,.6)*exp(-mn*9.)*.4;
      float mt=mod(T,19.);                                        // a shooting star every 19 s
      if(mt<1.1){float s=mt/1.1;vec2 d=wp-vec2(.35-.8*s,.5-.32*s);
        sky+=vec3(.9,.95,1.)*exp(-d.x*d.x*500.-pow(d.y+d.x*.55,2.)*2200.)*exp(-s*2.5)*1.4;}
      if(abs(wp.x)<.025||abs(wp.y-.32)<.025)sky*=.1;  // mullions
      c=sky*.55;
    }
  }
  for(int i=0;i<8;i++){
    vec3 b=normalize(vec3(sin(float(i)*2.17)*.9,.25+.3*sin(float(i)*1.31),-.55-.35*cos(float(i)*.83)));
    float g=max(dot(d,b),0.);
    c+=(i%2<1?vec3(1.,.6,.28):vec3(.45,.65,1.))*pow(g,180.-float(i)*22.)*1.2;
  }
  return c;
}
// light on the desk and the wooden base: the lamp, a cool fill, a little ambient
vec3 li(vec3 p,vec3 n){
  vec3 v=LP-p;
  return vec3(1.,.55,.28)*max(dot(n,normalize(v)),0.)*30./dot(v,v)
       + vec3(.25,.4,.65)*max(dot(n,normalize(vec3(.85,.35,.2))),0.)*.12
       + vec3(.3,.45,.75)*max(dot(n,WD),0.)*.10
       + vec3(.04,.036,.05);
}
// the turned wooden base of the globe
float base(vec3 p){
  float d=smn(max(length(p.xz)-2.55,abs(p.y-.12)-.12),max(length(p.xz)-2.05,abs(p.y-.48)-.3),.12);
  d=smn(d,max(length(p.xz)-2.45,abs(p.y-.8)-.09),.1);
  d=smn(d,max(length(p.xz)-1.6,p.y-1.02),.1);
  d=min(d,length(vec2(length(p.xz)-2.28,p.y-.99))-.15);
  return d;
}
// a small stack of books on the desk
float books(vec3 p){
  vec3 q=p-vec3(4.7,.0,1.4);
  float d=bx(q-vec3(0,.26,0),vec3(1.45,.26,.95));
  q.xz=rot2(q.xz,.07);d=smn(d,bx(q-vec3(0,.74,.04),vec3(1.38,.22,.9)),.06);
  q.xz=rot2(q.xz,-.11);d=smn(d,bx(q-vec3(0,1.17,.02),vec3(1.3,.2,.85)),.06);
  return d;
}
float map(vec3 p){return min(base(p),books(p));}
float tr(vec3 o,vec3 r,float m){float t=.02,d;for(int i=0;i<140;i++){d=map(o+r*t);if(d<.0015+t*.002||t>m)break;t+=d*.8;}return t;}
float smn(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
// shade the desk: dark wood, a glossy sheen, the globe's fake reflection, moonlight, lamp pool, shadows
vec3 desk(vec3 p,vec3 r){
  vec3 n=vec3(0,1,0);
  vec3 alb=vec3(.06,.04,.03)*(.75+.25*sin(p.x*3.+sin(p.z*2.)*2.5)+.15*h1(floor(p.xz*14.)));
  vec3 c=alb*li(p,n);
  c*=mix(.45,1.,smoothstep(2.,2.6,length(p.xz)));            // contact shadow under the base
  vec3 e=reflect(r,vec3(0,1,0));
  c+=room(e)*.05*pow(1.+r.y,3.);                             // sheen of the room on the varnish
  vec3 g2=vec3(GC.x,-GC.y,GC.z);
  c+=vec3(1.,.55,.25)*smoothstep(3.,1.4,length(cross(g2-p,e)))*.05; // the glowing globe mirrored in the desk
  float sh=1.-smoothstep(2.2,3.1,length(cross(GC-p,LP-p))/length(LP-p));
  c*=mix(.25,1.,sh);
  // a patch of moonlight through the window, with mullion shadows
  vec2 mp=p.xz-vec2(-4.2,-1.5);
  c+=vec3(.28,.42,.7)*exp(-(mp.x*mp.x*.8+mp.y*mp.y*1.6))*(.45+.55*sin(p.x*4.+p.z*2.)*.5+.5)*.05;
  // warm light leaking out of the globe onto the desk, pulsing on each beat
  float beat=exp(-fract(T/.625)*4.);
  c+=vec3(1.,.5,.22)*exp(-length(p.xz-GC.xz)*.38)*.028*(.5+.5*beat)*(K==6 ? .3 : 1.);
  // a caustic spot where the glass focuses the lamplight, dancing slowly
  c+=vec3(1.,.72,.42)*exp(-pow(length(p.xz-GC.xz-vec2(1.55,.85))*.75,2.))*.05*(.6+.4*sin(T*6.3+1.));
  return c;
}
// shade the base (wood) and the books; the brass plate on the front catches the lamp
vec3 obj(vec3 p,vec3 r){
  vec3 n=vec3(0),e;
  for(int j=0;j<4;j++){e=.5773*(2.*vec3((j+3)>>1&1,j>>1&1,j&1)-1.);n+=e*map(p+.003*e);}
  n=normalize(n);
  float db=base(p), dk=books(p);
  vec3 c;
  vec3 alb=dk<db?vec3(.06,.024,.02)*(.75+.25*h1(floor(p.xz*6.)+floor(p.y*8.))):vec3(.11,.07,.045)*(.7+.3*sin(length(p.xz)*16.+p.y*10.));
  c=alb*li(p,n)*ao(p,n,false);
  // brass plate
  vec3 q=p-vec3(0,.5,2.32);
  if(bx(q,vec3(1.05,.32,.05))<.02){
    c=vec3(.4,.28,.11)*li(p,n)*.5+vec3(1.,.75,.4)*pow(max(dot(n,normalize(LP-p)),0.),8.)*.25;
  }
  // rim highlight where glass meets wood
  if(abs(length(p.xz)-2.28)<.16&&abs(p.y-.99)<.16)c+=vec3(1.,.6,.3)*pow(max(dot(n,normalize(LP-p)),0.),3.)*.25;
  return c;
}

// ---------- inside the globe (local space: globe at origin, radius GR) ----------
float gh(vec2 xz){return -1.8+.05*sin(xz.x*4.1)*sin(xz.y*3.3)+.05*h1(xz*3.);}
float cn(vec3 p,vec2 xz,float y0,float y1,float r){ // rough cone
  float rr=r*(1.-clamp((p.y-y0)/(y1-y0),0.,1.));
  return max(length(p.xz-xz)-rr,max(y0-p.y,p.y-y1));
}
// the cabin's gable roof: two slanted slabs
float roof(vec3 q,float gy){
  vec3 c=q-vec3(-.7,gy+.34,.3);
  vec3 r=c-vec3(-.34,.5,0);r.xy=rot2(r.xy,.5);
  float d=bx(r,vec3(.45,.05,.46));
  r=c-vec3(.34,.5,0);r.xy=rot2(r.xy,-.5);
  return min(d,bx(r,vec3(.45,.05,.46)));
}
float mapIn(vec3 q){
  float d=q.y-gh(q.xz);
  float gy=gh(vec2(-.7,.3));
  vec3 c=q-vec3(-.7,gy+.34,.3);
  d=min(d,bx(c,vec3(.5,.34,.4)));                                    // cabin body
  d=min(d,roof(q,gy));                                               // roof
  d=min(d,bx(q-vec3(-.92,gy+.9,.3),vec3(.08,.24,.08)));              // chimney
  gy=gh(vec2(.85,-.45));
  d=min(d,max(length(q.xz-vec2(.85,-.45))-.06,abs(q.y-(gy+.25))-.25)); // trunk
  d=min(d,cn(q,vec2(.85,-.45),gy+.3,gy+1.1,.72));                    // pine tiers
  d=min(d,cn(q,vec2(.85,-.45),gy+.75,gy+1.55,.5));
  d=min(d,cn(q,vec2(.85,-.45),gy+1.25,gy+1.95,.32));
  gy=gh(vec2(-1.45,1.15));                                           // a second, smaller pine
  d=min(d,max(length(q.xz-vec2(-1.45,1.15))-.05,abs(q.y-(gy+.2))-.2));
  d=min(d,cn(q,vec2(-1.45,1.15),gy+.25,gy+.95,.55));
  d=min(d,cn(q,vec2(-1.45,1.15),gy+.65,gy+1.35,.38));
  d=min(d,max(length(q.xz-vec2(.62,-.85))-.03,q.y-gh(vec2(.62,-.85))-.5)); // lantern pole
  d=min(d,bx(q-vec3(.62,gh(vec2(.62,-.85))+.56,-.85),vec3(.07,.07,.07)));  // lantern box
  d=min(d,length(q-vec3(-.15,gh(vec2(-.15,-1.)),-1.))-.18);          // rocks
  d=min(d,length(q-vec3(1.25,gh(vec2(1.25,.8)),.8))-.13);
  return d;
}
float trIn(vec3 o,vec3 r,float m){float t=.01,d;for(int i=0;i<96;i++){d=mapIn(o+r*t);if(d<.0012+t*.002||t>m)break;t+=d*.7;}return t;}
// cheap ambient occlusion: five taps along the normal
float ao(vec3 p,vec3 n,bool ins){
  float o=0.,s=1.;
  for(float i=1.;i<6.;i++){float h=.015+i*.055;o+=(h-(ins?mapIn(p+n*h):map(p+n*h)))*s;s*=.72;}
  return clamp(1.-o*1.4,0.,1.);
}
// shade a hit inside the globe
vec3 inShade(vec3 p,vec3 r){
  vec3 n=vec3(0),e;
  for(int j=0;j<4;j++){e=.5773*(2.*vec3((j+3)>>1&1,j>>1&1,j&1)-1.);n+=e*mapIn(p+.0025*e);}
  n=normalize(n);
  vec3 lpl=gri(LP-GC);                       // lamp, in local space
  vec3 vp=lpl-p, vl=vec3(.62,gh(vec2(.62,-.85))+.56,-.85)-p;
  vec3 c=vec3(.11,.15,.24)*(.25+.75*max(n.y,0.));            // cold sky through the glass
  c+=vec3(.3,.4,.6)*max(dot(n,normalize(vec3(1.,.3,0.))),0.)*.15; // cool fill from the right
  c+=vec3(1.,.55,.28)*max(dot(n,normalize(vp)),0.)*20./dot(vp,vp); // the lamp through the glass
  c+=vec3(1.,.6,.3)*max(dot(n,normalize(vl)),0.)*1.1/(dot(vl,vl)+.5)*(.85+.15*sin(T*9.)); // the lantern
  c+=vec3(.3,.45,.75)*max(dot(n,normalize(gri(WD))),0.)*.16;    // moonlight through the glass
  if(p.y-gh(p.xz)<.06)c+=vec3(1.,.5,.22)*exp(-length(p.xz-vec2(-.7,.3))*1.15)*.25; // window light on the snow
  float gy=gh(vec2(-.7,.3));
  vec3 alb=vec3(.45,.5,.6);                                  // snow ground
  if(p.y-gh(p.xz)>-.01&&p.y-gh(p.xz)<.05){
    // sparkle on the snow
    c+=vec3(1.,.9,.8)*step(.9999,h3(floor(p*30.)))*pow(max(dot(n,normalize(vp)),0.),2.)*.6;
  }else if(bx(p-vec3(-.7,gy+.34,.3),vec3(.5,.34,.4))<.02){
    alb=vec3(.32,.2,.11)*(.8+.2*h1(floor(p.xz*9.)+floor(p.y*9.)));
    // the window glows warm, with a dark cross frame
    if(abs(p.x+.7)<.11&&p.y>gy+.26&&p.y<gy+.46&&abs(p.z-.7)<.03)
      return c+vec3(1.,.55,.22)*(abs(p.x+.7)<.02||abs(p.y-gy-.36)<.02?vec3(.05):vec3(1.4+.4*sin(T*2.3)))*(.7+.3*exp(-fract(T/.625)*2.));
  }else if(roof(p,gy)<.03){
    alb=mix(vec3(.3,.18,.1),vec3(.55,.6,.7),smoothstep(.45,.9,n.y)); // snowy roof
  }else if((length(p.xz-vec2(.85,-.45))<.8&&p.y>gh(vec2(.85,-.45))+.2)||(length(p.xz-vec2(-1.45,1.15))<.7&&p.y>gh(vec2(-1.45,1.15))+.15)){
    alb=mix(vec3(.05,.13,.06),vec3(.75,.8,.88),smoothstep(.58,.92,n.y)); // snowy pine
  }else if(bx(p-vec3(.62,gh(vec2(.62,-.85))+.56,-.85),vec3(.07,.07,.07))<.02){
    return c+vec3(1.,.62,.25)*1.5*(.85+.15*sin(T*9.));         // the lantern glass
  }else alb=vec3(.3,.3,.34);                                   // rocks
  return alb*c*ao(p,n,true);
}
// snow inside the glass: a soft volumetric cloud that swirls as a vortex with the shake and
// settles into a white bed on the ground, a few crisp glinting flakes, and the chimney smoke.
// returns rgb = in-scattered light, a = transmittance of what is behind the snow
vec4 snow(vec3 o,vec3 r,float len){
  vec3 c=vec3(0);
  float tr=1.,ds=len/50.;
  for(float k=0.;k<50.;k++){
    float s=(k+.5)*ds;
    vec3 p=o+r*s;
    float rr=length(p.xz);
    vec2 q=rot2(p.xz,SW*T*2.9/max(rr,.35));                      // differential swirl, faster near the axis
    float n=.5+.5*sin(q.x*3.1+sin(p.y*2.7+q.y*2.)*2.)*sin(p.y*3.3+sin(q.x*2.9)*2.)*sin(q.y*3.7+sin(p.y*3.1)*2.);
    float cl=smoothstep(.3,.8,h3(floor(p*1.3)));                 // cellular clumps
    float gnd=gh(p.xz);
    float d=.22*exp(-max(p.y-gnd,0.)*3.5)                        // settled bed on the ground
          +SW*(.02+.45*smoothstep(.55,.95,n)*cl)*exp(-pow((rr-1.35)/.5,2.))*exp(-pow((p.y+.1)/1.2,2.)); // vortex cloud
    d*=smoothstep(3.,2.55,length(p));                            // fade out at the glass
    vec3 vl=vec3(.62,gh(vec2(.62,-.85))+.56,-.85)-p;             // the lantern
    vec3 vw=vec3(-.7,gh(vec2(-.7,.3))+.36,.3)-p;                 // the cabin window
    vec3 lc=vec3(.30,.38,.52)+vec3(1.,.55,.25)*(2./(dot(vl,vl)+.5)+.7/(dot(vw,vw)+.6));
    c+=tr*d*ds*lc*1.2;
    tr*=exp(-d*ds*1.2);
    vec3 cell=floor(p*2.2);
    float g=h3(cell);
    if(g<.05+.12*SW){
      vec3 f=(cell+.5+(h3(cell+7.3)-.5)*.55)/2.2;
      f.xz=rot2(f.xz,SW*(T*(2.4+g*2.)+g*6.28));
      f.xz*=1.+.35*SW*sin(g*43.+T*3.);
      f.y+=2.15-mod(T*(.22+g*.25)*(1.-.85*SW)+g*9.,4.7)+SW*.45*sin(g*31.+T*5.);
      f.y=max(f.y,gh(f.xz)+.03);
      vec3 w=p-f;
      float dd=length(w-r*dot(w,r))*(.6+.25*s);
      float gl=step(.9988,h3(cell+floor(T*6.)));
      c+=tr*vec3(.85,.92,1.)*(.0048*(.5+g)*(.55+.45*sin(T*2.1+g*40.))+gl*vec3(1.,.9,.7)*.03)/(dd*dd*(24.+g*46.)+.012);
    }
    for(int j=0;j<3;j++){                                        // smoke puffs from the chimney
      float ag=fract(T*.11+float(j)*.37);
      vec3 cp=vec3(-.92,-.66,.3)+vec3(sin(ag*4.+float(j))*.3,ag*1.8,cos(ag*3.+float(j))*.3);
      vec3 w=p-cp;
      float dd=length(w-r*dot(w,r));
      c+=tr*vec3(.5,.46,.42)*exp(-ag*2.5)*.0011/(dd*dd*3.+.05+ag*.08);
    }
  }
  return vec4(c,tr);
}

void main(){
  T=R.z; Z=T/1.875;
  K=Z<8.?0:Z<16.?1:Z<32.?2:Z<40.?3:Z<56.?4:Z<64.?5:6;
  float st[7]=float[7](0.,8.,16.,32.,40.,56.,64.);
  L=T-st[K]*1.875;
  GC=vec3(0.,3.4,0.); GR=3.; LP=vec3(-6.,7.,-4.); WD=normalize(vec3(.9,.25,.3));
  SW=(K==1 ? 1. : K==4 ? .75 : 0.)*(K==1 ? exp(-fract(T/.625)*3.) : .55+.45*sin(floor(Z)*6.283))+.05;
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  vec3 ro,ta;
  if(K==0){ro=GC+vec3(0.,.7,8.4-L*.1);ta=GC+vec3(0,-.3,0);}
  else if(K==1){ro=GC+vec3(.3*sin(T*1.7),.75,8.2);ro.xz+=(vec2(h1(vec2(floor(T/.625),7.)),h1(vec2(floor(T/.625),13.)))-.5)*.16*SW;ta=GC+vec3(0,-.3,0);}
  else if(K==2){float a=L*.1;ro=GC+vec3(7.6*sin(a),.9+.5*sin(L*.23),7.6*cos(a));ta=GC+vec3(0,-.5,0);}
  else if(K==3){float s=smoothstep(0.,15.,L);ro=GC+mix(vec3(0.,.7,6.8),vec3(.4,.4,5.1),s);ta=GC+vec3(-.3,-.6,0);}
  else if(K==4){float s=smoothstep(0.,30.,L);ro=GC+mix(vec3(0.,1.6,7.2),vec3(0.,7.8,1.8),s);ta=GC+vec3(0,-.7,0);}
  else if(K==5){ro=GC+vec3(0.,2.2,7.6+L*.18);ta=GC;}
  else{ro=GC+vec3(.5*sin(T*.4),3.,8.2+L*.22);ta=GC+vec3(1.4,.4,0);}
  vec3 ww=normalize(ta-ro),xx=normalize(cross(vec3(0,1,0),ww)),rd=normalize(ww*2.2+xx*u.x+cross(ww,xx)*u.y);
  // far hit: the base, the books or the desk
  float tF=tr(ro,rd,60.);
  float tD=rd.y<-.001?-ro.y/rd.y:99.;
  float tFar=min(tF,tD);
  vec3 col;
  bool farHit=tFar<60.;
  vec3 farCol= tD<tF ? desk(ro+rd*tD,rd) : obj(ro+rd*tF,rd);
  // the glass sphere, in rotated local space
  vec3 oc=gri(ro-GC), rl=gri(rd);
  float b=dot(oc,rl), c0=dot(oc,oc)-GR*GR, hh=b*b-c0;
  float t0=-b-sqrt(max(hh,0.)), t1=-b+sqrt(max(hh,0.));
  vec3 p0=ro+rd*max(t0,0.);
  if(hh>0.&&t1>0.&&t0<tFar&&p0.y>.95){
    float te=max(t0,0.);
    vec3 pl=oc+rl*te;
    vec3 nl=normalize(pl);
    vec3 rf=refract(rl,nl,1./1.52);
    if(dot(rf,rf)<.1)rf=reflect(rl,nl);
    float len=t1-te;
    float ti=trIn(pl+rf*.02,rf,len);
    vec3 pin=pl+rf*.02+rf*ti;
    vec3 colIn= ti<len-.01 ? inShade(pin,rf) : min(room(gri(rf)),vec3(.25))*.12;
    vec4 sn=snow(pl+rf*.02,rf,len);
    vec3 nW=gr(nl);
    float fr=.04+.96*pow(1.-max(dot(-rd,nW),0.),5.);
    vec3 hv=normalize(normalize(LP-p0)-rd);
    col=colIn*exp(-len*.09)*sn.a*(1.-fr)*vec3(.97,1.,1.04)+sn.rgb+min(room(reflect(rd,nW)),vec3(.4))*fr*.18*(.8+.4*h3(vec3(floor(gl_FragCoord.xy/2.),1.)))
       +vec3(1.,.75,.45)*pow(max(dot(nW,hv),0.),500.)*1.6;
    col+=farCol*(1.-fr)*.9*exp(-len*.04);
  }else{
    col=farHit?farCol:room(rd);
  }
  col=mix(col,vec3(.008,.006,.012),1.-exp(-min(tFar,60.)*.018));
  O=vec4(clamp(col,0.,40.)*smoothstep(0.,1.,T)*smoothstep(71.5,70.5,Z),1);
}
