#version 300 es
precision highp float;
precision highp int;
out vec4 O;
const float tau=6.2831853;
float hz(int n){return 440.*exp2(float(n-69)/12.);}
float noise(int i){
  uint x=uint(i);x=(x^(x>>16))*2246822519u;x=(x^(x>>13))*3266489917u;
  return float(x^(x>>16))/2147483648.-1.;
}
vec2 pan(float x,float side){return x*vec2(1.-side,1.+side);}
float gate(float x,float lengthSec,float release){
  return 1.-smoothstep(lengthSec-release,lengthSec,x);
}
// Bass root and four upper voices. Keep common notes when the bass moves.
const int roots[8]=int[8](40,36,43,38,45,47,40,37);
const ivec4 keys[8]=ivec4[8](ivec4(55,59,62,66),ivec4(55,59,62,64),
  ivec4(54,57,59,62),ivec4(54,57,62,64),ivec4(55,59,60,64),
  ivec4(54,57,63,66),ivec4(56,59,63,66),ivec4(56,59,61,64));
const int changes[32]=int[32](0,1,0,1,2,3,4,5,1,3,5,0,0,1,4,5,
  0,2,1,5,4,1,3,4,5,6,7,3,6,7,5,6);
// Composed phrases. Zero is a rest. The first three notes are B, E, D.
const ivec4 notes[10]=ivec4[10](ivec4(71,76,74,0),ivec4(67,71,69,66),
  ivec4(76,71,69,67),ivec4(67,69,71,74),ivec4(64,67,71,69),
  ivec4(74,72,71,66),ivec4(71,76,78,0),ivec4(80,78,76,0),
  ivec4(71,0,0,0),ivec4(76,0,0,0));
const int score[32]=int[32](0,1,0,2,3,1,2,5,3,2,5,9,8,0,4,5,
  4,3,2,5,4,2,3,3,6,7,6,1,0,2,8,9);
float tine(float f,float x){
  float p=tau*f*x;
  return (sin(p+1.55*exp(-x*8.)*sin(2.*p))+.29*exp(-x*4.)*sin(4.02*p)+
    .13*exp(-x*18.)*sin(7.1*p))*exp(-x*2.05)*smoothstep(0.,.004,x);
}
float horn(float f,float x){
  float p=tau*f*x+.18*sin(x*29.)*smoothstep(.14,.46,x);
  float lip=.70+.68*exp(-x*6.);
  return (sin(p+lip*sin(p))+.21*sin(2.*p+.5*sin(p))+.12*sin(3.*p))*smoothstep(0.,.075,x);
}
// Age of the most recent hit in a 20-sixteenth, five-beat bar.
float age(int mask,int slot,float sub){
  for(int j=0;j<20;j++){
    int k=slot-j;
    if(k<0)break;
    if(((mask>>k)&1)>0)return sub+float(j)*.125;
  }
  return 8.;
}
float releaseBeforeHit(int mask,int slot,float sub){
  return ((mask>>(slot+1))&1)>0?smoothstep(0.,.018,.125-sub):1.;
}
void main(){
  ivec2 uv=ivec2(gl_FragCoord.xy);
  int sampleIndex=uv.y*4096+uv.x,bar=min(sampleIndex/120000,31),within=sampleIndex%120000;
  int slot=within/6000,chord=changes[bar],motif=score[bar],root=roots[chord];
  float t=float(sampleIndex)/48000.,xbar=float(within)/48000.,sub=float(within%6000)/48000.;
  bool night=bar>=16&&bar<22, solo=bar==11||bar==12, coda=bar>=28;
  float phraseEnd=gate(xbar,2.5,.022);
  vec2 dry=vec2(0),send=vec2(0);
  // An exposed tine opens the film. A sustained flugelhorn-like voice takes the tune.
  ivec4 onset=night?ivec4(0,3,8,14):motif==7?ivec4(0,11,15,19):
    bar%2==0?ivec4(0,4,7,14):ivec4(0,6,10,15);
  for(int j=0;j<4;j++){
    int note=notes[motif][j];if(note==0)continue;
    if(coda&&note==74)note=75;
    if(coda&&note==67)note=68;
    float x=xbar-float(onset[j])*.125;
    if(x<0.)continue;
    float duration=(j<3?float(onset[min(j+1,3)]-onset[j]):20.-float(onset[j]))*.125;
    if(motif>=8)duration=2.38;
    if(j==2&&notes[motif].w==0)duration=2.45-float(onset[j])*.125;
    float f=hz(note-(night&&bar%2==0?12:0)),env=gate(x,duration,.075);
    float brass=smoothstep(7.,15.,t)*(1.-smoothstep(69.,73.,t));
    vec2 melody=pan(tine(f,x)*(.31-.14*brass),-.21)+pan(horn(f,x)*env*brass*.235,.16);
    if(bar>=22&&bar<=27)melody+=pan(horn(hz(note-12),x)*env*.115,-.36);
    dry+=melody*phraseEnd;send+=melody*phraseEnd*.68;
  }
  // Syncopated keyboard answers. At the two stops open the voicing and let it ring.
  int pianoMask=solo||coda||bar<2?1:night?8328:8329;
  float ck=age(pianoMask,slot,sub);
  for(int j=0;j<4;j++){
    float x=ck-.013*float(j);
    if(x<0.)continue;
    float f=hz(keys[chord][j]),p=tau*f*x;
    float key=tine(f,x)*.078;
    if(solo||bar>=24)key+=sin(p+.25*sin(p*2.))*smoothstep(0.,.12,x)*exp(-1.1*x)*.045;
    vec2 voice=pan(key,(float(j)-1.5)*.34)*phraseEnd*releaseBeforeHit(pianoMask,slot,sub);
    dry+=voice;send+=voice*.72;
  }
  // Electric bass. Short passing notes lead into each chord change.
  if(bar>=2&&bar<31){
    int bassMask=solo||coda?1:night?283721:266369;
    float ageBass=age(bassMask,slot,sub);
    int onsetSlot=int(floor((xbar-ageBass)*8.+.5));
    int pitch=onsetSlot>=18?roots[changes[min(bar+1,31)]]-1:root+(onsetSlot==12?7:onsetSlot==6?12:0);
    float p=tau*hz(pitch)*ageBass;
    float bass=(sin(p+.85*exp(-ageBass*8.)*sin(p))+.38*sin(2.*p)+.14*sin(3.*p))*
      smoothstep(0.,.008,ageBass)*exp(-ageBass*(solo?1.5:4.0))*phraseEnd;
    dry+=.39*bass*releaseBeforeHit(bassMask,slot,sub);
  }
  // Rim, snare and kick leave holes for each other. The night section shifts the backbeat.
  if(bar>=2&&bar<29&&!solo){
    float drive=bar<4?.58:bar==25||bar>=28?.48:1.;
    float heel=age(night?69697:4353,slot,sub);
    float kick=sin(tau*(49.*heel+3.2*(1.-exp(-heel*39.))))*exp(-heel*11.)*smoothstep(0.,.002,heel);
    float skin=age(night?131344:65792,slot,sub);
    float snareNoise=noise(sampleIndex)*.66+noise(sampleIndex/3)*.34;
    float snare=(.74*snareNoise*exp(-skin*15.)+.48*sin(1190.*skin+2.8*exp(-skin*25.))*exp(-skin*26.))*smoothstep(0.,.002,skin);
    float hat=mod(xbar,.25);
    // Delay alternate eighths by 22 ms and ring the last offbeat open.
    hat=mod(hat-(slot%4>=2?.022:0.)+.25,.25);
    float metal=(sin(14393.*hat)*sin(21341.*hat)+noise(sampleIndex)*.40);
    float tick=metal*exp(-hat*(slot>=18?15.:53.))*smoothstep(0.,.002,hat);
    float fill=0.;
    if((bar==7||bar==15||bar==21||bar==24)&&slot>=16){
      float trip=mod(xbar-2.,1./6.);
      fill=(sin((880.-360.*(xbar-2.))*trip+2.*exp(-trip*36.))+.34*snareNoise)*exp(-trip*21.)*smoothstep(0.,.002,trip);
    }
    dry+=drive*(.58*kick+pan(.50*snare,-.13)+pan(tick*(slot%4<2?.11:.16),.40)+pan(fill*.32,-.32))*phraseEnd;
    send+=drive*(pan(snare*.19,-.13)+pan(fill*.14,-.32))*phraseEnd;
  }
  O=vec4(dry,send);
}
