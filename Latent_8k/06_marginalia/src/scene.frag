#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// The scene shader does not output colour. It writes what a draughtsman needs to know:
// r = tone (0 black .. 1 paper), g = depth (negative = wash only, no lines), b = indigo pigment, a = vermilion pigment.
// T seconds, TL seconds into the shot, F family (0 hills, 1 sea, 2 arcade, 3 reeds, 4 ink in water), W variant
float T,TL,HU,GV,M;
int F,W;
vec3 LD,LK;
const int K[32]=int[32](0, 1,2,3,8,9,10,11,16,4, 2,1,10,3,0,9,18,11,17,2,4,10,19,8,1,12, 16,9,3,2,1,0);

float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
float fb(vec2 p){float h=0.,a=.5;for(int i=0;i<5;i++){h+=a*ns(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return h;}
float bx(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}

// ridged hills
float hl(vec2 p){
  float h=0.,a=1.;p*=.05;
  for(int i=0;i<6;i++){h+=a*(1.-abs(ns(p)*2.-1.));p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.45;}
  return h*h*3.5-3.;
}
// sea: four cusped swells
float wv(vec2 p){
  float h=0.,a=1.,f=.22;vec2 d=vec2(.8,.6);
  for(int i=0;i<4;i++){h+=a*pow(1.-abs(sin(dot(d,p)*f+TL*f*4.)),2.);d=mat2(.6,.8,-.8,.6)*d;a*=.45;f*=2.1;}
  return h-1.2;
}
float map(vec3 p){
  M=0.;
  if(F==0)return (p.y-hl(p.xz))*.3;
  if(F==1){M=1.;return (p.y-wv(p.xz))*.5;}
  if(F==2){
    vec3 q=p;q.xz=mod(q.xz+2.,4.)-2.;
    float d=bx(q-vec3(0,1.6,0),vec3(.32,1.6,.32));
    d=min(d,max(max(max(abs(p.y-3.9)-.45,min(abs(q.x),abs(q.z))-.3),1.68-length(vec2(2.-abs(q.x),q.y-1.9))),1.68-length(vec2(2.-abs(q.z),q.y-1.9))));
    d=min(d,bx(q-vec3(0,.1,0),vec3(.5,.1,.5)));
    if(p.y<d){d=p.y;M=2.;}
    return d;
  }
  // reeds in still water, with a clear lane along x for the camera
  vec2 c=floor(p.xz/1.1),l=mod(p.xz,1.1)-.55-(vec2(h1(c),h1(c+3.))-.5)*.6;
  float hr=2.5+3.*h1(c+9.);
  l.x+=sin(T*1.3+c.x*.7+c.y)*.012*p.y*p.y+(h1(c+11.)-.5)*.2*p.y;
  float r=(.01+.014*h1(c+5.))*(1.-.8*sat(p.y/hr)),d=abs(c.y+.5)<1.||h1(c+8.)<.55?.6:length(l)-r*(1.+.4*smoothstep(.06,0.,abs(fract(p.y*.8+h1(c))-.5)-.42));
  d=max(d,p.y-hr);
  d=min(d*.8,.4);
  if(p.y<d){d=p.y;M=1.;}
  return d;
}
vec3 nrm(vec3 p,float e){
  vec3 n=vec3(0);
  for(int i=0;i<4;i++){vec3 k=.5773*(2.*vec3((i+3)>>1&1,i>>1&1,i&1)-1.);n+=k*map(p+k*e);}
  return normalize(n);
}
// sky: empty paper, a vermilion sun
vec2 sky(vec3 d){
  float s=dot(d,LD),r=.9975-.0006*ns(vec2(atan(d.x,d.z),d.y)*300.);
  return vec2(1,smoothstep(r,r+.0004,s));
}

void main(){
  vec2 u=(gl_FragCoord.xy-.5*R.xy)/R.y;
  T=R.z;
  // shots: 4 bars, then 2-bar shots, 1-bar shots in the drum'n'bass part (bars 22-38), 2-bar shots after
  float br=T*.375,q=br<4.?br/4.:br<22.?(br-4.)/2.+1.:br<38.?br-12.:(br-38.)/2.+26.,
        sl=br<4.?4.:br>=22.&&br<38.?1.:2.,ts=fract(q);
  int i=int(min(q,31.)),V=K[i];
  F=V&7;W=V>>3;
  HU=h1(vec2(i,7));GV=h1(vec2(i,9));
  TL=ts*sl*2.6667+HU*20.;
  if(F==4){
    // ink dropped into water: four drops per shot, the third one vermilion
    vec2 p=u*1.7;
    float k=0.,v=0.,e=0.;
    for(int j=0;j<4;j++){
      float a=ts*4.-float(j)*.9+.3;
      if(a<0.)continue;
      vec2 c=(vec2(h1(vec2(i,j)),h1(vec2(j,i)+3.))-.5)*vec2(1.8,.9),
           w=p-c+.35*vec2(fb(p*1.7+a*.15+float(j)),fb(p*1.7-a*.15+7.))*sqrt(a);
      float x=length(w)/(.08+.45*sqrt(a))+.6*fb(w*3.+float(j))-.3,
            g=smoothstep(1.,.2,x)*(.35+.9*fb(w*6.-a*.2))*1.4/(1.+a*.5);
      if(j==2)e+=g;else k+=g;
    }
    O=vec4(1.-sat(k),-1,.15*sat(k),sat(e));
    return;
  }
  vec3 ro,ta;
  float sh=1.;
  LD=normalize(vec3(.3*(GV-.5),.09,1));
  if(F==0){
    ro=vec3(HU*60.,0,TL*2.);ro.y=max(hl(ro.xz),1.)+3.+1.2*float(W);
    ta=ro+vec3(.3*sin(TL*.1),-.1-.1*float(W),1);
  }else if(F==1){
    ro=vec3(TL*.6+HU*40.,W==1?1.:W==2?4.5:2.,TL*2.5);
    ta=ro+vec3(.2*sin(TL*.2),W==2?-.5:-.12,1);
    LD=normalize(vec3(.2,.07,1));
  }else if(F==2){
    ro=W==2?vec3(TL*1.2+2.,2.2,TL*1.2):W==1?vec3(TL*1.3,.6,2.):vec3(2.+.3*sin(TL*.3),1.7,TL*1.4);
    ta=ro+(W==2?vec3(1,.1,1):W==1?vec3(1,.4,.7):vec3(.4*sin(TL*.2),.12,1));
    LD=normalize(vec3(.8,.42,.5-GV));
  }else{
    ro=vec3(TL*.7+HU*30.,W==1?.5:W==2?.22:.8,.1*sin(TL*.4));
    ta=ro+(W==1?vec3(1,.3,.7):vec3(1,.04,.25*sin(TL*.2)));
    LD=normalize(vec3(1,.07,.2*(GV-.5)));
  }
  vec3 f=normalize(ta-ro),r=normalize(cross(vec3(0,1,0),f)),
       rd=normalize(u.x*r+u.y*cross(f,r)+1.5*f);
  // the key light comes from over the draughtsman's left shoulder; the sun is only drawn
  LK=normalize(vec3(0,.9,0)-.7*r-.5*f);
  float tone=0.,dep=200.,ind=0.,red=0.,thr=1.;
  for(int k=0;k<2;k++){
    float t=.01,d=1.,mx=F==0?150.:60.;
    for(int j=0;j<170;j++){
      d=map(ro+rd*t);
      if(abs(d)<1e-3*t||t>mx)break;
      t+=d;
    }
    if(t>mx){vec2 s=sky(rd);tone+=thr*s.x;red+=thr*s.y;if(k==0)dep=200.;break;}
    vec3 p=ro+rd*t,n=nrm(p,.001*t);
    map(p);
    float m=M,o=0.,dif=max(dot(n,LK),0.);
    // ambient occlusion
    for(int a=1;a<5;a++){float h=.12*float(a);o+=(h-map(p+n*h))/h*.25;}
    map(p);
    // soft shadow
    float st=.05;sh=1.;
    for(int a=0;a<40;a++){float h=map(p+n*.01+LK*st);sh=min(sh,10.*h/st);st+=clamp(h,.04,.6);if(h<1e-3||st>25.)break;}
    sh=sat(sh);
    float c=(.4+.6*dif*sh)*(1.-.5*sat(o));
    if(m==2.)c*=.85+.15*step(0.,sin(p.x*1.5708)*sin(p.z*1.5708));
    // atmosphere: distance fades to paper, low mist in the hills and reeds
    float fg=1.-exp(-t*(F==0?.02:F==1?.025:.06));
    if(F==0)fg=max(fg,smoothstep(2.,-2.,p.y)*.95);
    if(F==3)fg=max(fg,smoothstep(1.5,0.,p.y)*.5);
    if(k==0)dep=t;
    if(m==1.){
      // water: indigo body, foam on the crests, the second pass adds the reflection
      float fo=F==1?smoothstep(.15,.6,p.y+.3*ns(p.xz*3.)):0.,fr=F==3?.7:.04+.96*pow(1.-sat(dot(n,-rd)),5.);
      c=mix(c*.6,1.,fo);
      ind+=thr*(1.-fo)*(1.-fg)*.8;
      tone+=thr*(1.-fr*(1.-fo))*mix(c,1.,fg);
      thr*=fr*(1.-fo);
      ro=p+n*.02;rd=reflect(rd,n);
      continue;
    }
    tone+=thr*mix(c,1.,fg);
    if(m==2.)ind+=thr*.25*(1.-fg);
    break;
  }
  O=vec4(sat(tone),dep,sat(ind),sat(red));
}
