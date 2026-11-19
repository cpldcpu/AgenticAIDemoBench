#version 300 es
precision highp float;
precision highp int;
out vec4 O;
const float tau=6.2831853;
float hz(int n){return 440.*exp2(float(n-69)/12.);}
float grit(int i){
  uint x=uint(i);x=(x^(x>>16))*2246822519u;x=(x^(x>>13))*3266489917u;
  return float(x^(x>>16))/2147483648.-1.;
}
vec2 pan(float x,float side){return x*vec2(1.-side,1.+side);}
float env(float x,float dur,float a,float r){return smoothstep(0.,a,x)*(1.-smoothstep(dur-r,dur,x));}
// A thumbed string with a different decay for each partial.
float nylon(float f,float x,float pluck){
  float p=tau*f*x;
  return (sin(p)*exp(-2.9*x)+.44*sin(2.*p+.22)*exp(-4.7*x)+
    pluck*.32*sin(3.004*p)*exp(-5.2*x)+.22*sin(4.01*p)*exp(-8.*x)+
    .15*sin(6.*p)*exp(-13.*x))*smoothstep(0.,.004,x);
}
float ceramic(float f,float x){
  float p=tau*f*x;
  return (sin(p)*exp(-6.4*x)+.51*sin(2.62*p)*exp(-11.*x)+.27*sin(4.17*p)*exp(-17.*x))*smoothstep(0.,.002,x);
}
float bow(float f,float x,float len,float color){
  float cycle=f*x+.042*sin(32.*x+.4)*smoothstep(.11,.53,x)-.55*(1.-exp(-x*18.));
  float value=0.;
  for(int i=1;i<=8;i++){
    float h=float(i),khz=h*f*.001;
    float body=.61+.51*exp(-7.*abs(khz-.59))+.48*exp(-4.5*abs(khz-1.85));
    value+=sin(tau*h*cycle+.19*sin(h*2.1))*body*mix(color,1.,1./h)/h;
  }
  return value*env(x,len,.068,.092)*(.89+.11*sin(7.*x));
}
const int basses[8]=int[8](38,34,41,36,31,33,35,38);
const ivec4 voicing[8]=ivec4[8](ivec4(50,57,64,65),ivec4(50,57,60,65),
  ivec4(53,57,60,64),ivec4(52,55,62,67),ivec4(50,55,58,62),
  ivec4(52,55,61,64),ivec4(50,57,62,65),ivec4(50,57,62,69));
const int harmony[48]=int[48](0,0,1,5,0,1,2,5,0,1,2,3,4,0,6,5,
  1,3,2,5,0,1,4,5,1,3,2,5,0,4,1,5,7,7,0,1,6,5,0,0,0,1,2,5,0,4,7,7);
const ivec3 tune[12]=ivec3[12](ivec3(69,65,64),ivec3(62,0,0),ivec3(65,67,69),
  ivec3(70,69,67),ivec3(72,69,0),ivec3(67,64,61),ivec3(74,72,69),
  ivec3(77,76,72),ivec3(69,0,0),ivec3(64,0,0),ivec3(65,0,0),ivec3(0));
const int melody[48]=int[48](0,1,11,11,0,1,2,5,0,1,4,3,2,1,3,5,
  6,3,4,5,0,1,2,5,7,6,4,5,8,10,3,9,11,11,8,10,9,8,1,11,0,1,4,5,0,1,8,11);
void main(){
  ivec2 px=ivec2(gl_FragCoord.xy);
  int sampleIndex=px.x+px.y*4096,bar=min(47,sampleIndex/72000),inside=sampleIndex%72000;
  float t=float(sampleIndex)/48000.,z=float(inside)/48000.;
  int chord=harmony[bar],motif=melody[bar];
  bool full=bar>=8&&bar<28,late=bar>=40;
  vec2 dry=vec2(0),room=vec2(0);
  float boundary=1.-smoothstep(1.47,1.5,z);
  ivec3 on=bar%2==0?ivec3(0,3,4):ivec3(0,2,5);
  for(int j=0;j<3;j++){
    int note=tune[motif][j];float x=z-float(on[j])*.25;
    if(note==0||x<0.||late&&motif==0&&j==2)continue;
    float len=1.5-float(on[j])*.25;
    if(j<2&&tune[motif][min(2,j+1)]>0)len=float(on[min(2,j+1)]-on[j])*.25;
    float f=hz(note),stringMix=smoothstep(4.5,9.,t)*(1.-smoothstep(43.,49.,t));
    if(bar>=34&&!late)stringMix=.52;
    vec2 line=pan(nylon(f,x,1.)*(.32-.15*stringMix),-.29)+pan(bow(f,x,len,.91)*.31*stringMix,.12);
    if(bar>=16&&bar<28)line+=pan(bow(f*.5,x,len,.7)*.19,-.46);
    dry+=line*boundary;room+=line*.72*boundary;
  }
  if(full||bar>=4&&bar<8||bar>=34&&bar<46){
    for(int j=0;j<6;j++){
      if(!full&&j!=0&&j!=3)continue;
      float x=z-float(j)*.25-(j%2==1?.012:0.);
      if(x<0.)continue;
      int k=int[6](0,2,1,3,2,1)[j];
      float pl=nylon(hz(voicing[chord][k]),x,.65);
      vec2 pick=pan(pl*(full?.16:.12),.12+.08*float(k))*boundary;
      dry+=pick;room+=.48*pick;
    }
  }
  if(bar>=4&&bar<32||bar>=34&&bar<47){
    bool second=full&&z>=.75;
    float x=z-(second?.75:0.),len=full?.75:1.5;
    int note=basses[chord]+(second&&bar%2==1?7:0);
    float p=tau*hz(note)*x;
    dry+=.40*(sin(p+.85*exp(-x*9.)*sin(p))+.33*sin(2.*p)+.13*sin(3.*p))*
      env(x,len,.009,.052)*exp(-x*2.7);
  }
  // The drop hits 0.32 seconds before the next bar, in time with the ring in the tea.
  float drop=mod(z+.32,1.5);
  if(bar<32||bar>=40){
    float bowl=ceramic(hz(bar%4==3?81:86),drop)*(1.-smoothstep(69.,69.5,t));
    vec2 drip=pan(bowl*.19,-.5+.31*float(bar%4));dry+=drip;room+=drip;
  }
  if(full){
    float foot=mod(z,.75),skin=mod(z+.75,1.5),swish=mod(z,.25);
    float brush=(grit(sampleIndex)*.50+grit(sampleIndex/4)*.32)*exp(-skin*12.);
    float heel=sin(tau*(52.*foot+2.15*(1.-exp(-foot*30.))))*exp(-foot*12.)*smoothstep(0.,.004,foot);
    float wire=(grit(sampleIndex)-grit(sampleIndex-1))*.58*exp(-swish*34.);
    dry+=(.31*heel+pan(.41*brush,-.13)+pan(.14*wire,.4))*boundary;
    room+=pan(brush*.17,-.13)*boundary;
  }
  if(bar>=28&&bar<32){
    float x=float(bar-28)*1.5+z;
    vec2 overtone=pan((sin(tau*440.*x)+.36*sin(tau*660.*x))*.10,-.22)*env(x,6.,1.3,1.9);
    dry+=overtone;room+=overtone*.7;
  }
  // Friction at the foot of the cup follows the speed of the final turn.
  float slide=(t-69.65)/.60;
  if(slide>0.&&slide<1.){
    float speed=4.*slide*(1.-slide);
    float wood=.50*grit(sampleIndex/16)+.22*grit(sampleIndex/5);
    float drag=(wood+.21*sin(tau*(92.*slide+31.*slide*slide)))*(.72+.28*sin(103.*slide+1.2*sin(37.*slide)));
    vec2 scrape=pan(.32*drag*speed,.10);
    dry+=scrape;room+=.19*scrape;
  }
  O=vec4(dry,room);
}
