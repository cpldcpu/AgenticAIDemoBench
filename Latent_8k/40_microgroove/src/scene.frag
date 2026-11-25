#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;

float T,BT,PHI,GM;
vec4 AU;
int ST;
const int SQ[32]=int[32](0,0,0,0,1,1,1,1,1,1,1,2,2,2,3,3,1,1,1,1,1,1,0,0,2,3,1,1,0,0,0,0);

float sat(float x){return clamp(x,0.,1.);}
float ss(float a,float b,float x){return smoothstep(a,b,x);}
float ex(float x){return exp(clamp(x,-80.,0.));}
mat2 rt(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float cy(vec3 p,float r,float h){return max(length(p.xz)-r,abs(p.y)-h);}
float cap(vec3 p,vec3 a,vec3 b,float r){p-=a;b-=a;return length(p-b*sat(dot(p,b)/dot(b,b)))-r;}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float ri(float t,float a,float b){float u=sat((t-a)/(b-a));return .5*u*u*(b-a)+max(0.,t-b);}
vec4 aud(float s){return textureLod(B,vec2(clamp(s/122.88,.005,.992),.5),0.);}
void U(inout float d,float e,float m){if(e<d){d=e;GM=m;}}

vec3 env(vec3 r,float m){
  vec3 c=vec3(.006,.009,.016)+vec3(.015,.012,.022)*sat(r.y*.7+.3);
  return min(c+vec3(1.,.82,.55)*pow(max(dot(r,normalize(vec3(-.35,.82,.45))),0.),9.)*.75+vec3(.3,.58,1.)*pow(max(dot(r,normalize(vec3(.78,.28,-.55))),0.),7.)*.58,vec3(m));
}

float map(vec3 p){
  float d=1e5;GM=0.;
  if(ST==0){
    U(d,bx(p-vec3(0,-.14,0),vec3(2.35,.13,1.88))-.015,1.);
    float r=length(p.xz),dy=0.;
    U(d,cy(p-vec3(0,.07,0),1.56,.068)-.008,2.);
    U(d,cy(p-vec3(-1.38,.08,1.24),.075,.08)-.008,abs(p.y-.11)<.018?6.:4.);
    if(BT>=44.&&BT<48.&&r>.51&&r<1.48){
      vec4 a=aud(T-(1.5-r)*4.);
      dy=(.13*a.g+.08*abs(a.r))*(.45+.55*abs(sin(r*42.-T*4.)))*ss(44.,44.6,BT)*(1.-ss(47.4,48.,BT));
    }
    U(d,cy(p-vec3(0,.16+dy*.5,0),1.5,.018+dy*.5)*.55,r<.485?9.:3.);
    U(d,cy(p-vec3(0,.23,0),.025,.09),4.);
    float ar=mix(1.36,.58,sat(BT/58.)),lf=BT<4.?1.-ss(3.1,4.,BT):ss(61.,62.4,BT);
    vec3 tp=vec3(ar*.62,.178+lf*.12,ar*.78),h0=tp+vec3(.05,.08,-.12);
    U(d,min(cy(p-vec3(1.75,.22,-1.15),.14,.22),min(cap(p,h0,vec3(1.75,.33,-1.15),.024),cap(p,tp+vec3(0,.03,0),h0,.036))),4.);
    U(d,max((abs(p.x-tp.x)+abs(p.z-tp.z))*.9+(p.y-tp.y-.02)*.5-.026,tp.y-p.y),5.);
  }else if(ST==1){
    float px=p.x+sin(p.z*.08)*.35,pg=2.2,gc=floor(px/pg+.5),amp=BT>=32.&&BT<40.?.26:.62,dv=-1e4;
    for(int k=-1;k<2;k++){
      float gk=gc+float(k);vec4 a=aud(T+p.z*.048+gk*1.6);
      dv=max(dv,(p.y+.6+a.g*.52*amp-abs(px-(gk*pg+a.r*amp)))*.7071);
    }
    U(d,-smin(-p.y,-dv,.08)*.72,3.);
    vec3 tp=vec3(AU.r*amp,-(.6+AU.g*.52*amp)+.16,0),q=p-tp;
    U(d,max(max((abs(q.x)*.92+abs(q.z)*.92+abs(q.y-.26)*.54)-.24,q.y-.52),-q.y),5.);
    U(d,cap(p,tp+vec3(0,.44,-.04),vec3(0,1.35,-3.6),.11),4.);
  }else if(ST==2){
    U(d,p.y+1.25,1.);
    U(d,bx(vec3(abs(p.x)-1.8,p.y+.6,p.z+2.2),vec3(.75,.65,.7))-.05,2.);
    vec3 tp=vec3(abs(p.x)-1.35,p.y,p.z);
    U(d,cy(tp+vec3(0,1.06,0),.78,.2),9.);
    U(d,max(max(max(abs(length(tp.xz)-.45)-.04,abs(tp.y-.1)-.78),abs(tp.z)-.36),-max(abs(tp.z)-.18,abs(tp.y-.1)-.58)),1.);
    U(d,max(abs(length(tp.xz)-.25)-.015,max(abs(tp.y-.1)-.72,abs(fract(tp.y*9.)-.5)-.22)),7.);
    U(d,cy(tp-vec3(0,1.08,0),.52,.025),4.);
    U(d,max(length(tp.xz-vec2(.04*sin(tp.y*18.),.04*cos(tp.y*18.)))-.05,abs(tp.y-.1)-.82),6.);
  }else{
    vec3 mp=vec3(abs(p.x)-1.65,p.y-.05,p.z);
    U(d,max(bx(p-vec3(0,0,-.3),vec3(4.2,2.2,.3)),-bx(mp-vec3(0,0,-.04),vec3(1.24,.8,.28))),2.);
    U(d,max(bx(mp,vec3(1.3,.86,.04)),-bx(mp,vec3(1.22,.78,.08))),7.);
    U(d,bx(mp-vec3(0,0,-.31),vec3(1.25,.81,.03)),8.);
    float ch=p.x<0.?AU.b+AU.r*.15:AU.a-AU.r*.15;
    vec2 np=vec2(p.x-sign(p.x)*1.65,p.y-.05)-vec2(0,-.78);np*=rt(mix(.52,-.58,sat(ch)));
    U(d,min(cap(vec3(np,p.z),vec3(0,.1,-.18),vec3(0,1.34,-.18),.016),max(length(mp.xy-vec2(0,-.74))-.18,abs(p.z+.18)-.05)),10.);
    U(d,length(vec3(p.x-sign(p.x)*1.65-.92,p.y+.39,p.z+.18))-.055,6.);
  }
  return d;
}

vec3 nor(vec3 p){
  vec3 n=vec3(0);
  for(int i=min(0,int(R.x));i<4;i++){vec3 e=.5773*(2.*vec3(((i+3)>>1)&1,(i>>1)&1,i&1)-1.);n+=e*map(p+e*1.5e-3);}
  return normalize(n);
}

void main(){
  T=R.z;BT=T/1.92;
  PHI=1.7+3.5*ri(T,.2,4.)-2.9*ri(T,61.4,64.)+4.1*ri(T,74.,76.8)-4.7*ri(T,117.,122.);
  AU=aud(T);
  ST=SQ[clamp(int(BT*.5),0,31)];

  vec3 ro,ta,up=vec3(ST==1&&BT>=40.?(BT<52.?.16:-.14)*sin(T*2.8):0.,1,0);float u;
  if(ST==0){
    float ar=mix(1.36,.58,sat(BT/58.));vec3 tp=vec3(ar*.62,.18,ar*.78);
    if(BT<4.){u=BT*.25;ro=mix(vec3(-2.,.45,2.),vec3(-.95,.72,1.9),u);ta=mix(vec3(-.7,.12,.8),vec3(0,.18,.2),u);}
    else if(BT>=44.&&BT<60.){u=fract((BT-44.)*.25);float a=BT<48.?-.6+u*1.35:-.25+u*.5,r=BT<48.?2.35:1.5;ro=vec3(sin(a)*r,1.45-.15*u,cos(a)*r);ta=vec3(0,.16,0);}
    else{u=fract(BT*.25);ro=tp+vec3(-.36+.1*u,.16+.06*u,.38);ta=tp+vec3(.04,.04,0);}
  }else if(ST==1){
    int sh=int(BT*.25);u=fract(BT*.25);
    if(BT>=32.&&BT<40.){u=(BT-32.)*.125;ro=vec3(-1.5+2.6*u,1.15+.25*sin(u*3.14),-2.3);ta=vec3(0,-.3,2.2);}
    else if((sh&1)==1){ro=vec3(1.5-2.4*u,.85,2.9-u*.6);ta=vec3(0,-.33,-.2);}
    else{ro=vec3(1.6*cos(u*1.4+float(sh)),1.05,-2.2+u*.5);ta=vec3(0,-.35,2.);}
  }else if(ST==2){
    bool cl=BT>=25.&&BT<28.;u=BT<40.?fract((BT-22.)/3.):(BT-48.)*.5;
    ro=vec3(sin(u*.9-.4)*(cl?2.5:3.6),.45+.25*u,cl?2.6:3.9);ta=vec3(cl?-.6:0.,.15,0);
  }else{u=BT<40.?(BT-28.)*.25:(BT-50.)*.5;ro=vec3(-.45+.9*u,.18+.06*sin(u*3.14),3.9-.3*u);ta=vec3(0,.02,-.2);}

  float fo=ST==1&&(BT<12.||BT>=16.&&BT<44.)?2.6:length(ta-ro);
  vec3 w=normalize(ta-ro),cx=normalize(cross(w,up)),cy=cross(cx,w);
  vec2 uv=(2.*gl_FragCoord.xy-R.xy)/R.y;
  vec3 rd=normalize(uv.x*cx+uv.y*cy+1.7*w),ro0=ro,rd0=rd;
  vec3 col=vec3(0),att=vec3(1),lp=ST==0?vec3(-1.8,3.2,2.2):ST==1?vec3(-2.,4.5,3.5):ST==2?vec3(2.,3.,3.):vec3(0,1.2,4.8);
  float t0=1e4;

  for(int bo=min(0,int(R.x));bo<2;bo++){
    float t=.01,d=1.,mx=bo>0?12.:35.;
    for(int i=min(0,int(R.x));i<96;i++){if(bo>0&&i>=44)break;d=map(ro+rd*t);if(abs(d)<.0005*t+.0003||t>mx)break;t+=d*.85;}
    if(bo==0)t0=t;
    if(t>=mx){col+=att*env(rd,bo>0?1.4:8.);break;}
    vec3 p=ro+rd*t,n=nor(p),l=normalize(lp-p),al=vec3(.04),em=vec3(0);
    float m=GM,sp=.3,gl=40.,refl=0.;
    if(m<1.5){al=vec3(.025)*(.85+.25*sin(p.x*16.+sin(p.z*7.)));sp=.2;gl=28.;if(ST==2)em+=vec3(.35,.12,.02)/(1.+dot(vec2(abs(p.x)-1.35,p.z),vec2(abs(p.x)-1.35,p.z))*2.);}
    else if(m<2.5){al=(ST==0?vec3(.08):ST==3?vec3(.14,.11,.08):vec3(.23))*(.9+.1*sin(p.x*140.+p.z*20.));sp=.6;gl=80.;refl=ST==3?.16:.42;}
    else if(m<3.5){
      al=vec3(.004);sp=1.1;gl=200.;refl=.52;
      float r=length(p.xz),gr=ST==0?sin(r*420.+sin(atan(p.z,p.x)+PHI)*2.):sin(p.y*240.+p.z*2.),df=ST==0?abs(dot(normalize(vec3(p.x,0,p.z)),rd))*2.5:(abs(n.x)*.7+abs(rd.z)*.5)*2.8+T*.15;
      if(ST>0||r>.52&&r<1.48&&abs(p.y-.16)<.16){
        n=normalize(n+(ST==0?vec3(p.x,0,p.z)/max(r,.01)*gr*.045:vec3(gr*.05,gr*.03,0)));
        em+=vec3(.5+.5*cos(6.283*(df+vec3(0,.33,.67))))*pow(sat(1.-abs(dot(n,rd))),2.)*(ST==0?(BT>=44.&&BT<48.?.32:.08):.16*pow(abs(gr),3.));
      }
    }
    else if(m<4.5){al=vec3(.045);sp=1.4;gl=180.;refl=.82;}
    else if(m<5.5){al=vec3(.018);sp=2.4;gl=260.;refl=.88;em+=vec3(.35,.72,1.25)*pow(1.-abs(dot(n,rd)),3.)*.55+vec3(1.,.48,.16)*pow(max(dot(reflect(rd,n),l),0.),18.)*.85;}
    else if(m<6.5){em=ST==0?vec3(2.8,.75,.1)*(.45+.8*(.5+.5*cos(6.283*fract(T*2.)))):ST==2?vec3(4.2,1.55,.32):vec3(2.6,.12,.06)*ss(.55,.85,p.x<0.?AU.b:AU.a)+vec3(.12,.02,.01);al=vec3(.08);}
    else if(m<7.5){al=vec3(.75,.38,.14)*(.85+.15*sin((p.x+p.y)*180.));sp=1.1;gl=130.;refl=.38;}
    else if(m<8.5){
      vec2 mp=vec2(p.x-sign(p.x)*1.65,p.y-.05)-vec2(0,-.78);
      float mr=length(mp),ang=atan(mp.x,mp.y),tk=max(ss(.022,.006,abs(mr-1.16)),ss(.018,.004,abs(fract(ang*7.5)-.5)/7.5)*step(1.06,mr)*step(mr,1.18));
      al=mix(vec3(.96,.78,.46),ang>.16?vec3(.75,.08,.05):vec3(.04),tk);em=al*.88;sp=.15;
    }
    else if(ST==0){
      float r=length(p.xz);al=abs(r-.44)<.012||abs(r-.32)<.006||abs(r-.15)<.01?vec3(.88,.68,.24):vec3(.32,.04,.06);sp=.12;gl=20.;
    }else if(ST==2){al=vec3(.5);sp=.2;}
    else{al=vec3(.92,.12,.06);sp=.4;gl=60.;}

    if(ST==0&&m>1.5&&m<2.5&&length(p.xz)>1.5&&abs(p.y-.07)<.055)
      em+=vec3(1.2,.35,.04)*ss(.26,.16,length(vec2(fract((atan(p.z,p.x)+PHI)*28.647)-.5,fract(p.y*58.)-.5)))*(.35+.65*max(0.,dot(normalize(vec3(-1.38,.09,1.26)-p),n)));

    float sh=1.,ao=1.,s=.03;
    for(int i=min(0,int(R.x));i<9;i++){
      float ds=map(p+(i<1?n*.12:n*.005+l*s));
      if(i<1)ao=clamp(ds/.12,.25,1.);else{sh=min(sh,10.*ds/s);s+=clamp(ds*.8,.03,.26);}
    }
    sh=sat(sh);

    vec3 h=normalize(l-rd),Lcol=ST==0?vec3(1.,.9,.78)*1.35:ST==1?(BT>=32.&&BT<40.?vec3(.55,.78,1.1)*1.15:vec3(.95,.92,1.)*1.45):ST==3?vec3(1.,.9,.76)*.75:vec3(1.,.88,.72)*1.3;
    vec3 lit=al*(vec3(.025,.03,.042)*ao+Lcol*max(dot(n,l),0.)*sh)+sp*Lcol*pow(max(dot(n,h),0.),gl)*(gl+8.)/28.*sh;
    col+=att*(lit+em);
    if(bo>0||refl<.03)break;
    att*=refl*(.04+.96*pow(1.-max(dot(n,-rd),0.),4.));ro=p+n*.003;rd=reflect(rd,n);
  }

  if(ST==1&&BT>=32.&&BT<40.){
    float bk=ss(32.,33.2,BT)*(1.-ss(39.2,40.,BT));
    for(int i=0;i<12;i++){
      float fi=float(i);
      vec3 dp=vec3(sin(fi*2.7+T*.35)*1.9,-.1+.58*sin(fi*1.9+T*.5)+.3*cos(fi),mod(fi*1.7-T*.45,10.)-3.)-ro0;
      float dt=dot(dp,rd0),d2=dot(dp-rd0*dt,dp-rd0*dt);
      if(dt>.2&&dt<t0)col+=mix(vec3(.35,.82,1.2),vec3(1.,.72,.35),fract(fi*.618))*(ss(.09,.015,sqrt(d2))+exp(-d2*140.)*.45)*bk;
    }
  }
  if(ST==2){
    for(int s=-1;s<=1;s+=2){
      float cx0=float(s)*1.35,ch=s<0?AU.b:AU.a;vec2 oc=ro0.xz-vec2(cx0,0),d2=rd0.xz;
      float A2=dot(d2,d2),B2=dot(oc,d2),D2=B2*B2-A2*(dot(oc,oc)-.5476);
      if(D2>0.){
        float sq=sqrt(D2),tA=(-B2-sq)/A2,tB=(-B2+sq)/A2,lIn=max(0.,min(tB,t0)-max(tA,0.));
        vec3 gm=ro0+rd0*.5*(max(tA,0.)+min(tB,t0)),gp=ro0+rd0*tA;
        if(lIn>0.&&gm.y>-.85&&gm.y<1.05)
          col+=vec3(.14,.42,1.65)*lIn*pow(max(0.,1.-dot(gm.xz-vec2(cx0,0),gm.xz-vec2(cx0,0))/.5476),1.6)*(.12+1.25*pow(sat(ch),1.3))*ss(-.85,-.2,gm.y)*(1.-ss(.65,1.02,gm.y));
        if(tA>0.&&tA<t0&&gp.y>-.9&&gp.y<1.12){
          vec3 gn=normalize(vec3(gp.x-cx0,max(0.,gp.y-.72),gp.z));
          col=col*.95+env(reflect(rd0,gn),1.4)*(.05+.9*pow(1.-abs(dot(gn,rd0)),4.));
        }
      }
    }
  }

  col=mix(col,vec3(.006,.009,.016),1.-ex(-t0*.02));
  O=vec4(clamp(col,0.,12.),clamp(abs(t0-fo)/max(fo*1.1,.4),0.,1.));
}
