#version 300 es
precision highp float;
out vec4 O;
const float Z=6.2831853;
float b;
float h(uint n){n=n*747796405u+2891336453u;n=((n>>((n>>28u)+4u))^n)*277803737u;return float((n>>22u)^n)/2147483648.-1.;}
float nz(int s,int k){return (h(uint(s))-h(uint(s-k)))*.5;}
float mf(float m){return 440.*exp2((m-69.)/12.);}
float ss(float a,float c,float x){return smoothstep(a,c,x);}
float B(float x,float y){return step(x,b)*step(b,y);}
float sw(float p,float c){float s=0.;for(float k=1.;k<6.;k++)s+=sin(p*k)/(k*(1.+k*k*c));return s*.66;}

vec4 ch[4]=vec4[4](vec4(50,53,57,64),vec4(46,50,53,57),vec4(48,52,55,62),vec4(45,48,52,55));
int ml[16]=int[16](171017,166016,14345,164140,402439,410048,7177,302084,475153,468352,19472,393680,307214,402656,12297,407568);

void main(){
  int s=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096;
  float t=float(s)/48e3,bt=float(s)/22500.; b=bt*.25;
  float u=B(16.,28.),p=B(28.,36.),g=B(44.,52.),w=step(52.,b),dr=(B(8.,28.)+B(36.,52.))*(1.-B(35.5,36.));
  int md=B(24.,28.)+g>.5?1:0,s16=int(mod(floor(bt*4.),16.)),s8=int(mod(floor(bt*2.),32.));
  vec4 c=ch[(int(floor(b))+md)&3];
  float bT=fract(bt)*.46875,eF=fract(bt*2.),sT=fract(bt*4.)*.117,snT=fract((bt+1.)*.5)*.9375;

  float kO=dr*step(b,51.8),dt,f,v,sn=0.,kk=kO*(sin(Z*(44.*bT+3.*(1.-exp(-bT*38.))))*exp(-bT*10.5)+nz(s,3)*exp(-bT*220.)*.2)*.37,sc=1.-.45*kO*exp(-bT*12.);
  float rl=B(32.,35.5),rt=exp2(floor(b-31.)),st=rl>.5?fract(bt*rt*.5)*(.9375/rt):snT;
  v=rl>.5?ss(32.,35.5,b)*.48:((B(12.,28.)+B(36.,52.))*dr>.5?.54:0.);
  if(st<.25)sn=(sin(1320.*st)*exp(-st*24.)*.3+nz(s,3)*exp(-st*18.)*.75+nz(s,1)*exp(-st*12.)*1.2)*v;

  float ht=dr>.5?(nz(s,1)*exp(-sT*48.)*(s16%4==2?1.:.45)+nz(s,1)*exp(-fract(bt+.5)*6.6))*.48:(b<8.||p>.5)?nz(s,1)*exp(-sT*52.)*.25:0.;
  f=mf(c.x-12.+(s16%4>=2?12.:0.));
  float bs=sw(Z*f*t,mix(.08,.02,B(36.,52.)))*exp(-sT*7.)*.28*(ss(3.5,8.,b)*step(b,28.)+B(36.,52.))*(1.-B(35.5,36.))*sc;

  vec2 p2=vec2(0),l2=p2,f2=p2;
  rt=w>.5?2.:4.; float pn=.5+.4*sin(float(s16)); dt=fract(bt*rt)*(.46875/rt);
  int n=int(bt*rt),ix=(n*3+n/4)&3; f=mf(c[ix]+12.+(B(36.,52.)>.5&&ix==3?12.:0.));
  vec2 a2=vec2(1.-pn,pn)*sin(Z*f*dt+2.3*exp(-dt*15.)*sin(Z*f*2.*dt))*exp(-dt*(w>.5?4.5:10.5))*ss(.4,2.8,b)*step(b,61.5)*(.36+.08*(step(b,8.)+p))*sc;

  v=ss(0.,4.,b)*ss(64.,59.5,b)*(.18+.15*(u+p+B(36.,44.))+.23*(g+w));
  float ct=mix(.22,.04,min(1.,u*.6+B(36.,52.)+ss(32.,35.5,b)*.7));
  for(int k=0;k<3;k++){f=mf(c[k]+(k==0?0.:12.));p2+=vec2(sw(Z*f*1.003*t,ct),sw(Z*f*.997*t,ct));}
  p2*=v*.3*sc;

  if((u+B(36.,52.))*dr>.5){
    int cr=0,ag=0;
    for(int k=0;k<8;k++){int q=(s8-k+32)%32,m=(ml[md*8+(q>>2)]>>((q&3)*5))&31;if(m>0){cr=m+60;ag=k;break;}}
    if(cr>0){
      dt=(float(ag)+eF)*.234375; f=mf(float(cr)+g*12.); pn=.5+.24*sin(b*1.5);
      l2=vec2(1.-pn*.5,.5+pn*.5)*(sw(Z*f*t,.008)+g*sw(Z*mf(float(cr)+7.)*t,.02)*.34)*min(1.,dt*99.)*exp(-dt*2.1)*.52*sc;
    }
  }
  if(p>.5){dt=(b-28.)/8.;f=mix(110.,960.,dt*dt);f2+=sin(Z*f*t*.5)*.1*dt+nz(s,1)*dt*dt*.28;}
  if(g>.5&&snT<.16)f2+=vec2(1,.8)*nz(s,1)*exp(-snT*24.)*.5;

  O=vec4(vec2(kk+bs+sn*.7+ht*.85)+a2*.6+p2*.5+l2*.8+f2*.7,vec2(sn*.45+ht*.2)+a2*.95+p2*.85+l2*.85+f2*.55)*ss(0.,.15,t)*ss(64.2,61.,b)*step(b,64.);
}
