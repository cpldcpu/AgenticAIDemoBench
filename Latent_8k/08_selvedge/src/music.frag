#version 300 es
precision highp float;
precision highp int;
out vec4 O;
const float PI=6.2831853;
float noise(uint x){x=x*747796405u+2891336453u;x=((x>>((x>>28u)+4u))^x)*277803737u;return float((x>>22u)^x)/2147483648.-1.;}
float hz(float n){return 440.*exp2((n-69.)/12.);}
float note(int n){const float a[32]=float[32](63.,70.,65.,66.,70.,73.,72.,65.,66.,70.,75.,73.,70.,65.,63.,58.,63.,65.,70.,77.,75.,70.,66.,65.,61.,65.,68.,70.,66.,65.,63.,58.);return a[n%32];}
float root(int bar){const float a[8]=float[8](39.,39.,44.,44.,41.,41.,46.,37.);return a[(bar/2)%8];}
float voice(float t,float f,float pan){
 float v=0.;
 for(int k=1;k<=12;k++){
  float h=float(k);float form=exp(-pow((h*f-650.)/380.,2.))+.5*exp(-pow((h*f-1300.)/500.,2.));
  v+=sin(PI*f*h*t+pan*.014*h+ .018*h*sin(PI*4.7*t))*form/h;
 }
 return v;
}
vec2 music(float t,uint sampleId){
 float beat=t*2.,bar=floor(beat/4.),x=mod(beat,4.);int bi=int(bar);
 float drive=smoothstep(12.,18.,t)*(1.-smoothstep(60.,64.,t))+smoothstep(78.,82.,t)*(1.-smoothstep(110.,114.,t));
 float pulse=mod(beat,1.);float kick=sin(PI*(45.*pulse*.5+7.*(1.-exp(-pulse*22.))))*exp(-pulse*9.);
 float n=noise(sampleId);float sn=mod(beat+1.,2.);
 float clap=(n*.7+sin(PI*185.*sn*.5)*.3)*exp(-sn*18.)*smoothstep(0.,.008,sn);
 float hat=mod(beat, .5);float tick=n*exp(-hat*95.);
 // Three against the eight eighth notes: an audible shuttle rather than a constant dance kick.
 float shuttle=mod(beat,1.5);float wood=(sin(PI*920.*shuttle*.5)+.4*sin(PI*1537.*shuttle*.5))*exp(-shuttle*65.);
 vec2 outv=vec2((.34*kick+.15*clap+.035*tick)*drive);
 outv+=vec2(.06,.035)*wood*(.2+.8*smoothstep(6.,16.,t))*(1.-smoothstep(112.,120.,t));
 float btime=mod(beat,.75)*.5;float bf=hz(root(bi));
 float bass=sin(PI*bf*btime+.8*sin(PI*bf*2.*btime)*exp(-btime*10.))*exp(-btime*5.)*smoothstep(0.,.008,btime);
 outv+=bass*.23*drive;
 for(int ear=0;ear<2;ear++){
  float v=0.,p=float(ear)*2.-1.;
  // Overlapping melody and two quieter, unequal delays.
  for(int e=0;e<3;e++){
   float tm=t-float(e)*.375;int step=int(floor(max(tm,0.)*2.));float age=fract(tm*2.)*.5;
   float f=hz(note(step/2)+ (t>=80.&&t<112.?12.:0.));
   float env=(1.-exp(-age*80.))*exp(-age*7.);
   v+=voice(age,f,p)*env*(e==0?.15:.035)*(tm>0.?1.:0.);
  }
  float harmony=0.;
  for(int j=0;j<4;j++){
   float offset=j==0?12.:j==1?19.:j==2?26.:29.;
   float f=hz(root(bi)+offset)*(1.+p*.0007);
   float previous=hz(root(max(bi-1,0))+offset)*(1.+p*.0007);
   harmony+=mix(voice(t,previous,p),voice(t,f,p),smoothstep(0.,.18,x))*.035;
  }
  float breath=smoothstep(24.,42.,t)*(1.-smoothstep(61.,64.,t))+smoothstep(77.,86.,t)*(1.-smoothstep(112.,124.,t));
  v=v*(.4+.6*drive)*(1.-smoothstep(62.,66.,t)+smoothstep(76.,80.,t));
  v+=harmony*breath;
  // The canopy receives a separate long-note descant, with breath between phrases.
  const float descant[8]=float[8](82.,77.,79.,75.,80.,77.,75.,75.);
  if(t>=96.&&t<112.){
   float phrase=(t-96.)*.5,age=fract(phrase)*2.;
   float f=hz(descant[int(phrase)]);
   float envelope=smoothstep(0.,.22,age)*(1.-smoothstep(1.5,2.,age));
   v+=.13*voice(t,f,p)*envelope;
  }
  // Air arrives before the canopy, then a low skin drum marks its opening.
  float arrival=max(t-96.,0.);
  v+=.15*sin(PI*(48.*arrival+5.*(1.-exp(-arrival*14.))))*exp(-arrival*2.)*step(96.,t);
  v+=n*.035*smoothstep(94.,95.8,t)*(1.-smoothstep(95.8,96.3,t));
  // Tension: bowed friction/noise, rising into silence before the release at 80 s.
  v+=(n*.022+sin(PI*71.*t+2.*sin(PI*73.*t))*.045)*smoothstep(64.,73.,t)*(1.-smoothstep(77.,79.8,t));
  outv[ear]+=v;
 }
 float fade=smoothstep(0.,2.,t)*(1.-smoothstep(121.,128.,t));
 return tanh(outv*1.45)*.88*fade;
}
void main(){uint id=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*4096u;vec2 v=music(float(id)/48000.,id);O=vec4(v,0,1);}

