#version 300 es
precision highp float;
out vec4 O;
// EMERGENCE - 128 BPM Cyber-Symphonic Breakbeat & Acid Soundtrack

float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float fq(float s){return 410.9605*exp2(s/12.);}
float ev(float t,float d){return exp(-t*d)*min(t*600.,1.);}
float saw(float p){return sin(p)+.5*sin(p*2.)+.25*sin(p*3.)+.12*sin(p*4.);}
int act(int b){return b<8?0:b<18?1:b<28?2:b<38?3:b<48?4:b<62?5:6;}

const int CH[45]=int[45](
  0,15,19,22,26, -4,15,19,22,24, -7,12,15,20,27, -5,14,17,22,26,
  3,15,19,22,26, -2,14,17,22,24, -4,12,15,20,24, -2,14,19,22,26,
  0,16,19,23,26);

float ch(int n,int v){
  int b=n/90000,a=act(b);
  return float(CH[a==6?40+v:n/180000%4*5+v+(a==3||(a==5&&b>=56)?20:0)]);
}

const int ML[32]=int[32](
  19,22,24,0,27,26,24,0, 22,24,22,0,19,17,15,0,
  17,20,24,0,29,27,24,0, 26,27,26,0,22,19,14,0);

vec2 wet(int n){
  vec2 o=vec2(0);int b=n/90000;
  if(n<0||b>=72)return o;
  int a=act(b),sl=a==0?11250:a==4?22500:5625,s=n/sl,k=s%16,q=n/22500,m=ML[q&31];
  if(!(a==6&&s%3>0)){
    float t=float(n-s*sl)/48e3,dur=float(sl)/48e3,
          ph=t*fq(ch(n,int[8](1,2,3,4,2,3,4,1)[k%8])+float((a==3||a==5?12:0)+(k>=12&&a!=6?12:0))),
          pan=.5+.4*sin(float(k)*1.1);
    o+=(sin(ph+(.9+.25*float(a))*exp(-t*14.)*sin(ph*2.75))+.25*sin(ph*2.)*exp(-t*14.))*ev(t,a==0||a==4||a==6?3.8:11.)*smoothstep(dur,dur*.82,t)*vec2(pan,1.-pan)*(a==0||a==6?.26:.17);
  }
  if(a>0&&a<6&&a!=4&&m>0){
    float t=float(n-q*22500)/48e3,
          ph=t*fq(float(m+12))+.28*sin(t*32.)*min(t*2.,1.),
          s1=sin(ph+sin(ph*2.)*exp(-t*4.)*1.4)+.4*sin(ph*1.003)+(a==5?.32*sin(ph*2.):0.);
    o+=s1*ev(t,2.8)*smoothstep(.47,.42,t)*.15*vec2(1,.85);
  }
  return o;
}

void main(){
  int n=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096,b=n/90000,a=act(b),s=n/5625,st=s%16;
  float ts=float(n%5625)/48e3,tc=float(n%180000)/48e3,ta=float(n%90000)/48e3,ke=0.;
  vec2 o=vec2(0),ns=vec2(hs(n*2),hs(n*2+1))-.5;
  bool hk=a>0&&a<6&&a!=4;

  for(int k=0;k<3;k++){
    int si=s-k,bi=si/16,ai=act(bi),
        km=(ai==1||ai==3)?(bi%2==1?17473:1089):(ai==2||ai==5)?(bi%4==3?20753:4369):0;
    if(si>=0&&((km>>(si%16))&1)>0){
      float tk=float(n-si*5625)/48e3;
      o+=tanh(2.3*(sin(tk*345.+42.*(1.-exp(-tk*32.)))*ev(tk,8.)+sin(tk*1800.)*exp(-tk*140.)*.35))*.54;ke=max(ke,exp(-tk*11.));
    }
  }
  float pm=hk?1.-.72*ke:1.,root=ch(n,0);

  if(hk||(b>43&&b<48)){
    int sub=b%4==3&&st>=14?1875:5625;
    float th=float(n-n/sub*sub)/48e3,m=0.;
    for(int i=0;i<5;i++)m+=sin(th*1288.*exp2(float(i)*.48));
    o+=(m*.16+(hs(n)-hs(n-1))*.55)*ev(th,st%4==2?24.:65.)*(st%4==2?.15:.05)*(a==5&&st%2==0?1.25:1.)*(a==4?.125*float(b-43):1.)*vec2(1,.82);
  }
  if(a>0&&a<6){
    int sm=b>=46||(b%4==3&&st>=8)?21845:a==2?4112:37520;
    if(!(a==4&&b<46)&&((sm>>st)&1)>0){
      float vel=(st==4||st==12)?1.:(b%4==3&&st>=8)||b>=46?.55+.35*float(st-8)/8.:.22;
      if(b>=46)vel*=float(b-46)*.5+ta/3.75;
      o+=(sin(ts*1050.*exp(-ts*18.))*ev(ts,22.)*.65+((hs(n)-hs(n-1))*ev(ts,28.)+.5*ns.x*ev(ts,14.))*.8)*vel*.26;
    }
  }
  if(a==2&&(st==2||st==11))o+=sin(ts*1950.+2.8*exp(-ts*25.)*sin(ts*2760.))*ev(ts,16.)*.13*vec2(.6,1);

  if(a<6||b<66){
    float rn=a==0?smoothstep(1.,6.,float(n)/9e4):a==4?.45:a==6?exp(-float(b-62)*.5-ta/3.75):1.;
    vec2 dp=tc*fq(root+12.)*vec2(1.005,.995);
    o+=vec2(saw(dp.x),saw(dp.y))*.1*rn*(a==0||a==4?.6:pm)+sin(tc*fq(root))*.25*rn*(hk?pm:.85);
  }
  if(a==2||a==5){
    int v=st&3;
    float ac=float(st%3==0),
          ba=fq(ch(n,v)-(v>0?12.:0.)+12.*float((st&7)==3||(st&7)==6)),
          cf=2.+(10.+8.*ac)*exp(-ts*(12.-5.*ac)),
          aph=ts*ba;
    o+=tanh((saw(aph)*.55+sin(aph*cf)*exp(-ts*14.)*(1.+ac))*(1.8+ac))*ev(ts,11.)*smoothstep(.12,.1,ts)*(ac>.5?.22:.15)*pm*vec2(.9,1);
  }

  float pe=smoothstep(0.,.45,tc)*(a<6?smoothstep(3.75,3.2,tc):exp(-tc*.35))*min(float(n)/27e4,1.)*pm*.062;
  for(int j=0;j<5;j++){
    float fn=ch(n,j);vec2 p=tc*fq(fn)*vec2(1.004,.996)+float(j)*.7;
    o+=(sin(p+.5*sin(p*2.+tc*2.))*.65+sin(tc*fq(fn+7.))*exp(-.1*float(j))*.22)*pe;
  }
  if(a==4){
    float w=smoothstep(38.,39.5,float(n)/9e4)*smoothstep(48.,46.5,float(n)/9e4);
    for(int j=0;j<4;j++){float x=float((n+j*180000)%720000)/72e4;o+=sin(fq(0.)*69.25*(1.-exp2(-5.*x))+vec2(0,1.2))*pow(sin(3.1416*x),2.)*.042*w;}
  }
  for(int k=0;k<4;k++){
    vec2 w=wet(n-k*16875)*exp2(-float(k));
    o+=k%2==0?w:w.yx;
  }

  if(a>0&&a<6&&b%10==8)o+=ns*exp(-ta*2.2)*.24;
  if(b<48&&b%20>5&&b%20<8)o+=ns*pow(float(b%20-6)*.5+ta/3.75,2.)*.22;
  if(b>=62&&b<64){float t=float(b-62)*1.875+ta;o+=tanh(2.5*sin(185.*t+55.*(1.-exp(-t*10.))))*exp(-t*2.2)*.48+ns*exp(-t*1.8)*.2;}
  O=vec4(tanh(o*1.1)*smoothstep(138.2,132.5,float(n)/48e3),0,1);
}
