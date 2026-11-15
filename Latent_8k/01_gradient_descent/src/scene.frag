#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// T time, BT beats, K orb light falloff, OR orb radius, OI orb intensity, M material of last map()
float T,BT,K,OR,OI,M;
int S;         // scene: 0 loss landscape, 1 network, 2 deep fractal, 3 the minimum
vec3 P,E,TR;   // orb position, emission at last map(), orbit trap

float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n2(vec2 p){
  vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);
}
float fbm(vec2 p){
  float a=.5,s=0.;
  for(int i=0;i<6;i++){s+=a*n2(p);p=p*mat2(1.6,1.2,-1.2,1.6);a*=.5;}
  return s;
}
// valley centre line
float px(float z){return sin(z*.11)*5.+sin(z*.27)*2.;}
// terrain height: a valley that runs downhill (scene 0) or a basin (scene 3)
float ht(vec2 p){
  float m=S==3?smoothstep(3.,16.,length(p)):smoothstep(.6,6.,abs(p.x-px(p.y)));
  return fbm(p*.22)*7.*m+n2(p*2.)*.025-(S==3?.4:.2*p.y);
}
// colour ramp shared by contour lines and weights: orange, magenta, blue with height
vec3 pal(float h){return mix(mix(vec3(1,.4,.08),vec3(1,.08,.45),sat(h*.5)),vec3(.1,.35,1),sat(h*.25-.6));}
// the weights: a field of columns that take one training step per beat
float wh(vec2 i){
  return .1+(.2+2.5*n2(i*.25)+.8*mix(h1(i+floor(BT)*7.),h1(i+floor(BT)*7.+7.),smoothstep(0.,.3,fract(BT))))*smoothstep(.5,5.,abs(i.x+.5));
}
// distance to segment from 0 to b
float sg(vec3 p,vec3 b){return length(p-b*sat(dot(p,b)/dot(b,b)));}
// the network: nodes on a grid, every node linked to its four neighbours in the layers above and below
float net(vec3 p){
  vec3 q=vec3(abs(fract(p.x+.5)-.5),1.-abs(mod(p.y,2.)-1.),abs(fract(p.z+.5)-.5));
  vec2 id=floor(p.xz+.5);
  float d=min(sg(q,vec3(.5,1,0)),sg(q,vec3(0,1,.5)))-.02,
        nd=length(q)-.13;
  E=vec3(.05,.3,1)*(.02+4.*step(.5,h1(id+3.))*exp(40.*sin(p.y*.785+T*(2.+3.*h1(id))+6.28*h1(id+7.))-40.));
  if(nd<d){
    d=nd;
    E=vec3(.02,.05,.1)+vec3(1,.35,.1)*3.*step(.85,h1(id+floor(p.y*.5+.5)*3.+floor(BT)))*exp(-3.*fract(BT));
  }
  return d;
}
// apollonian sphere packing
float apo(vec3 p){
  float s=1.;
  TR=vec3(1e3);
  for(int i=0;i<12;i++){
    p=2.*fract(.5*p+.5)-1.;
    float r=dot(p,p),k=(1.22+.12*sin(T*.2))/r;
    TR=min(TR,vec3(abs(p.x),abs(p.z),r));
    p*=k;s*=k;
  }
  return .25*abs(p.y)/s;
}
float map(vec3 p){
  float d,o=length(p-P)-OR;
  E=vec3(0);M=float(S);
  if(S==1)d=net(p);
  else if(S==2){d=apo(p);E=vec3(.1,.5,1)*pow(sat(1.-2.*TR.z),8.);}
  else if(S==6){
    vec2 q=fract(p.xz)-.5;
    vec3 b=vec3(abs(q.x)-.4,p.y-wh(floor(p.xz)),abs(q.y)-.4);
    d=min(length(max(b,0.))+min(max(b.x,max(b.y,b.z)),0.)-.03,max(.58-max(abs(q.x),abs(q.y)),p.y-4.));
  }else{
    d=(p.y-ht(p.xz))*.4;
    if(S==3&&p.y<d){d=p.y;M=4.;}
  }
  if(o<d){d=o;M=9.;}
  return d;
}
vec3 nrm(vec3 p,float e){
  vec2 k=vec2(e,-e);
  return normalize(k.xyy*map(p+k.xyy)+k.yyx*map(p+k.yyx)+k.yxy*map(p+k.yxy)+k.xxx*map(p+k.xxx));
}
float shd(vec3 p,vec3 l,float mx){
  float r=1.,t=.01;
  for(int i=0;i<48;i++){
    if(t>mx)break;
    float d=map(p+l*t);
    r=min(r,10.*d/t);
    if(r<.01)break;
    t+=clamp(d,.005,.4);
  }
  return sat(r);
}
float ao(vec3 p,vec3 n,float s){
  float a=0.,w=1.;
  for(float i=1.;i<6.;i++){a+=(i*s-map(p+n*i*s))*w;w*=.6;}
  return sat(1.-a/s*.6);
}
vec3 sky(vec3 d){
  vec2 q=d.xz/(abs(d.y)+.4)*30.;
  float s=h1(floor(q));
  return mix(vec3(.13,.06,.15),vec3(.006,.01,.03),sat(d.y*3.+.15))
    +step(.985,s)*smoothstep(.4,0.,length(fract(q)-.5))*sat(d.y*4.)*s;
}
void main(){
  T=R.z;BT=T*2.;OI=1.;
  vec2 u=(gl_FragCoord.xy*2.-R.xy)/R.y;
  vec3 ro,ta,fc=vec3(0),am,OC=vec3(1,.5,.2);
  float fv=1.5,FAR=90.,fk=.012,rl=0.,as=.15,t=T;
  if(T<32.){
    // the loss landscape: follow the orb down the valley
    S=0;
    float z=T<16.?T:16.+(T-16.)*7.,zo=z+5.;
    P=vec3(px(zo),0,zo);
    P.y=ht(P.xz)+.4+.2*abs(sin(BT*3.1416));
    ro=vec3(px(z)+sin(T*.5)*.3,1.-.2*z+2.5*smoothstep(14.,0.,T),z);
    ta=P+vec3(0,.3,0);
    rl=(cos(z*.11)+cos(z*.27))*.1;
    OI=smoothstep(9.,13.,T);
    K=.12;OR=.22*OI;
    am=vec3(.1,.14,.25);
  }else if(T<48.){
    // the weights: fly down a valley of columns
    S=6;t-=32.;
    ro=vec3(sin(t*.4)*.5,1.5+.5*sin(t*.3),t*5.);
    P=vec3(sin(t*.7)*.7,.7+.25*abs(sin(BT*3.1416)),t*5.+4.);
    ta=P;
    rl=sin(t*.4)*.2;
    K=.12;OR=.2;FAR=60.;fk=.03;
    am=vec3(.1,.14,.25);
  }else if(T<80.){
    // the network: fall through the layers, then fly along one
    S=1;t-=48.;
    if(t<16.){
      ro=vec3(.5+.05*sin(t),-3.*t,.5+.05*cos(t*1.3));
      P=ro+vec3(.12*cos(t*2.),-3,.12*sin(t*2.));
      ta=ro+vec3(sin(t*.4)*.5,-1,cos(t*.4)*.5);
      rl=t*.15;
    }else{
      ro=vec3(.5+.05*sin(t),-48,t*3.);
      P=ro+vec3(.15*sin(t*1.7),.1*cos(t*1.3),3);
      ta=ro+vec3(sin(t*.5)*.4,sin(t*.37)*.25,1);
      rl=sin(t*.3)*.4;
    }
    K=.25;OR=.1;FAR=25.;fk=.25;fv=1.1;as=.05;
    fc=vec3(0,.012,.035);
    am=vec3(.05,.1,.2);
  }else if(T<112.){
    // deep structure
    S=2;t=(t-80.)*.3+2.;
    ro=vec3(2.84*sin(.34*t+2.),.48+.15*sin(.43*t),2.84*cos(.25*t+3.71));
    ta=vec3(1.9*sin(.34*t+2.5),.4,1.9*cos(.25*t+4.1));
    P=mix(ro,ta,.3)+vec3(sin(T*.8),cos(T*.6),sin(T*.5))*.08;
    K=8.;OR=.025;FAR=12.;fk=.25;fv=1.3;as=.02;
    fc=vec3(.03,.02,.05);
    am=vec3(.12,.15,.25);
  }else{
    // the minimum
    S=3;t-=112.;
    P=vec3(0,.9-.6*smoothstep(0.,8.,t),0);
    float a=t*.1+1.,r=5.+t*.15;
    ro=vec3(sin(a)*r,1.+t*.12,cos(a)*r);
    ta=vec3(0,.6,0);
    OI=1.+2.*smoothstep(8.,8.3,t);
    K=.08;OR=.25+.2*smoothstep(8.,9.,t);fv=1.6;
    am=vec3(.1,.14,.25);
  }
  vec3 w=normalize(ta-ro),uu=normalize(cross(w,vec3(sin(rl),cos(rl),0))),
       rd=normalize(u.x*uu+u.y*cross(uu,w)+fv*w),col=vec3(0),at=vec3(1),p,n;
  for(int b=0;b<2;b++){
    float d,g=1e3,rf=0.;
    vec3 gl=vec3(0);
    t=0.;
    for(int i=0;i<300;i++){
      d=map(ro+rd*t);
      gl+=E*exp(-fk*t)/(1.+d*d*1e4);
      g=min(g,length(ro+rd*t-P));
      if(d<(S==2?.1:1.)*(8e-4*t+2e-4)||t>FAR)break;
      t+=d;
    }
    if(d>.01*t+.01)t=FAR;
    p=ro+rd*t;
    vec3 bg=S%3==0?sky(rd):fc,c=bg;
    if(t<FAR){
      float m=M,gs=32.;
      vec3 e=E,tr=TR,al=vec3(.08,.09,.12);
      if(m==9.)c=OC*3.*OI;
      else{
        n=nrm(p,S==2?.004:5e-4+5e-4*t);
        float rg=3.*OI*exp(-2.*abs(length(p-P)-fract(BT)*14.))*(1.-fract(BT));
        if(m==1.){al=vec3(.1,.12,.16);rf=.5;gs=64.;}
        else if(m==2.)al=vec3(.5,.32,.15);
        else if(m==6.){
          float h=wh(floor(p.xz-n.xz*.1));
          al=vec3(.03);rf=.3;gs=64.;
          vec2 q=abs(fract(p.xz)-.5);
          e=pal(h*1.2)*(n.y>.5?smoothstep(.3,.4,max(q.x,q.y))+rg:smoothstep(.12,0.,h-p.y))*.5;
        }else if(m==4.){
          // water: ripples from the centre
          float r=length(p.xz),q=-.2*cos(r*8.-T*3.)*exp(-r*.2);
          n=normalize(vec3(p.x/r*q+(n2(p.xz*3.+T*.3)-.5)*.06,1,p.z/r*q+(n2(p.zx*3.-T*.3)-.5)*.06));
          al=vec3(0);gs=200.;
          rf=.04+.96*pow(sat(1.+dot(rd,n)),5.);
        }else{
          // contour lines of the loss landscape, one beat-synced ring per beat expanding from the orb
          float f=abs(fract(p.y/.35)-.5)*.35/max(length(n.xz),.05),wl=.012+.0015*t,
                hv=p.y+(m==3.?.4:.2*p.z);
          e=pal(hv)*smoothstep(wl,wl*.3,f)*(.5+rg)
            *(S==0?smoothstep(0.,3.,(T-2.)*5.-t):1.);
        }
        vec3 l=P-p;
        float ld=length(l);
        l/=ld;
        float sh=(S==2?1.:shd(p+n*.004,l,ld-OR*1.5))*OI/(1.+K*ld*ld);
        c=al*(OC*4.*max(dot(n,l),0.)*sh+am*(S==2?sat(tr.z+.2):ao(p,n,as))*(.5+.5*n.y))
          +OC*pow(max(dot(n,normalize(l-rd)),0.),gs)*sh*(m==4.?8.:1.)+e;
      }
      c=mix(bg,c,exp(-fk*t));
    }
    c+=gl*.012+OC*OI*.5*pow(OR/max(g,OR),1.5);
    col+=at*c;
    if(rf<=0.)break;
    at*=rf;
    ro=p+n*.01;
    rd=reflect(rd,n);
  }
  O=vec4(clamp(col,0.,30.),1);
}
