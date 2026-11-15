#version 300 es
precision highp float;
out vec4 O;
// One pixel = one stereo sample at 48 kHz. 90 BPM: 16th = 8000 samples, beat = 32000, bar = 128000.
// 50 bars = 6,400,000 samples. Lo-fi hip-hop that switches to drum'n'bass (180 BPM on the same grid) for bars 22-38.
// D minor, one chord per bar: Dm9 Bbmaj9 Gm9 A7b9. Electric piano, upright-ish bass, reese bass, breathy lead, vinyl.

float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28)+4u))^x)*277803737u;return float((x>>22)^x)/4294967296.;}
float nz(int n){return hs(n)*2.-1.;}
float w(float m){return 6.2832*440.*exp2((m-69.)/12.);}
const ivec4 CH[4]=ivec4[4](ivec4(53,57,60,64),ivec4(50,53,57,60),ivec4(53,57,58,62),ivec4(52,55,58,61));
const int RT[4]=int[4](38,34,31,33);
// lead, eighth notes over 8 bars: 0 rest, 1 hold, else MIDI note
const int ML[64]=int[64](
  69,1,72,1,74,1,1,1, 77,1,76,74,1,1,72,1, 74,1,1,1,70,1,69,1, 67,1,69,1,73,1,1,0,
  69,1,72,1,74,1,77,1, 79,1,1,77,76,1,74,1, 77,1,1,74,1,72,70,1, 69,1,1,1,1,1,0,0);
int N;
float sat(float x){return clamp(x,0.,1.);}
float G;
bool dnb(int b){return b>=22&&b<38;}
bool drm(int b){return b>=4&&b<20||b>=22&&b<46;}
// tape wow, applied to everything tonal
float tw(float t){return t+.0011*sin(t*3.1)+.00012*sin(t*41.);}

// electric piano: two-operator FM with a short metallic tine
float ep(float t,float m,float v){
  float p=w(m)*t;
  return (sin(p+(.6+1.3*v)*exp(-t*3.)*sin(p))*exp(-t*(.8+(m-50.)*.04))+.25*v*sin(p*7.03)*exp(-t*15.))*(1.-exp(-t*400.))*v;
}
// comping hits on 16ths 0, 7, 10 (only the downbeat in the intro and the outro)
float hit(int s){int b=s>>4,p=s&15;return p==0?1.:(b>=4&&b<46&&b!=21)&&(p==7||p==10)?(p==7?.55:.7):0.;}
vec2 keys(){
  int s=N/8000;vec2 r=vec2(0);float fd=1.;int c=0;
  for(int j=0;j<17&&c<2;j++){
    int k=s-j;float v=hit(k);
    if(k<0)break;
    if(v==0.)continue;
    int b=k>>4;if(b>=47)continue;
    for(int i=0;i<4;i++){
      float t=tw(G)-tw(float(k*8000+i*180)/48e3);
      if(t<0.)continue;
      float pn=.5+.4*sin(G*28.3+float(i)*1.7);
      r+=ep(t,float(CH[b&3][i]),v)*fd*vec2(1.-pn,pn);
    }
    fd=exp(-float(N-k*8000)/48e3*18.);
    c++;
  }
  return r*.16;
}
// bass: plucked, root/octave/seventh pattern
vec2 bass(){
  int s=N/8000,b=s>>4;
  if(!drm(b)||dnb(b))return vec2(0);
  for(int j=0;j<8;j++){
    int k=s-j,p=k&15,o=p==0||p==7?0:p==10?12:p==14?10:-1;
    if(o<0)continue;
    float t=tw(G)-tw(float(k*8000)/48e3),m=float(RT[(k>>4)&3]+o),q=w(m)*t;
    float x=(sin(q)+.4*sin(2.*q)*exp(-t*4.))*exp(-t*2.5)*(1.-exp(-t*300.));
    return vec2(tanh(x*1.6)*.42);
  }
  return vec2(0);
}
// reese: two detuned band-limited saws with a moving filter, plus sub
vec2 reese(){
  int b=N/128000;
  if(!dnb(b))return vec2(0);
  float m=float(RT[b&3]+12),t=G-float(b)*2.6667,f=w(m),cf=.25+.2*sin(G*1.3),y=0.,z=0.;
  for(int h=1;h<9;h++){float a=exp(-float(h)*cf*1.5)/float(h);y+=sin(float(h)*f*G*1.004)*a;z+=sin(float(h)*f*G*.996)*a;}
  float e=min(1.,t*30.)*min(1.,(2.6667-t)*30.);
  return (vec2(y+.3*z,z+.3*y)*.55+sin(f*G*.5)*.5)*e*.32;
}
// breathy lead with vibrato
float lead(int n){
  if(n<0)return 0.;
  int e=n/16000,b=n/128000;
  if(!(b>=12&&b<20||b>=30&&b<46))return 0.;
  int k=((e-96)%64+64)%64,j=0,l=1;
  for(;j<8;j++)if(ML[(k-j+64)%64]!=1)break;
  int m=ML[(k-j+64)%64];
  if(m==0)return 0.;
  for(int q=1;q<8;q++){if(ML[(k+q)%64]!=1)break;l++;}
  float tn=float(n-(e-j)*16000)/48e3,te=float((e+l)*16000-n)/48e3,
        p=w(float(m))*tn+.9*sin(31.4*tn)*smoothstep(.15,.6,tn),
        v=sin(p)+.3*sin(2.*p)+.1*sin(3.*p)+(nz(n)+nz(n-1))*.05*(1.+2.*exp(-tn*20.));
  return v*(1.-exp(-tn*22.))*sat(te*25.)*(.85+.15*exp(-tn*2.));
}
float kick(float t){return sin(6.2832*(48.*t+3.4*(1.-exp(-t*30.))))*exp(-t*5.)+.3*exp(-t*300.);}
float snare(float t,int n){return (sin(6.2832*190.*t)*exp(-t*22.)*.6+nz(n)*(exp(-t*14.)+.18*exp(-t*4.)))*(1.-exp(-t*900.));}
float hat(float t,int n,float d){return (nz(n)-nz(n-1))*exp(-t*d);}

void main(){
  N=int(gl_FragCoord.y)*4096+int(gl_FragCoord.x);
  G=float(N)/48e3;
  int s=N/8000,b=s>>4;
  vec2 o=keys()+bass()+reese();
  float lp=lead(N);
  o+=vec2(lp+.35*lead(N-24000),lp+.35*lead(N-48000))*.15;
  float dr=0.,sn=0.,hh=0.,pm=1.;
  if(drm(b)){
    bool D=dnb(b);
    for(int j=0;j<8;j++){
      int k=s-j,p=k&15,q=k&7;
      float t=float(N-k*8000)/48e3;
      bool K=D?q==0||q==5:p==0||p==7||p==10,S=D?q==2||q==6:p==4||p==12,Gh=D?q==7:p==15&&(k>>4&1)==1;
      if(K&&dr==0.){dr=kick(t);pm=1.-.6*exp(-t*9.);}
      if((S||Gh)&&sn==0.)sn=snare(t,N)*(S?1.:.25);
    }
    // hats: swung 16ths in half time, straight 16ths and 32nds in drum'n'bass
    int hs16=D?N/4000:s,hn=D?4000:8000,st=hs16*hn+(D?0:(hs16&1)*1700);
    if(N<st){hs16--;st=hs16*hn+(D?0:(hs16&1)*1700);}
    float th=float(N-st)/48e3;
    hh=hat(th,N,(hs16&3)==2&&D?14.:55.)*((hs16&1)==0?1.:.55);
  }
  // snare roll and noise riser into the drop at bar 22
  if(b==21){
    float x=float(N-21*128000)/128000.;
    int rr=x<.5?8000:4000,k=N/rr;
    sn+=snare(float(N-k*rr)/48e3,N)*x*.8;
    o+=nz(N)*x*x*.12;
  }
  o*=pm;
  o+=dr*.9+sn*.42+vec2(.8,1.)*hh*.1;
  // vinyl: crackle and hiss
  int c=N>>6;
  float cr=step(.996,hs(c))*nz(c+7)*exp(-float(N&63)*.25)*.12+nz(N)*.005;
  o+=vec2(cr,step(.996,hs(c+3))*nz(c+9)*exp(-float(N&63)*.25)*.12+nz(N+1)*.005);
  o*=smoothstep(133.3,126.,G)*min(1.,G*4.);
  O=vec4(tanh(o*1.1)*.92,0,1);
}
