#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
const float tau=6.2831853;
float hiss(float s){return fract(sin(mod(s,3191.)*1.741)*4783.)*2.-1.;}
float freq(float key){return 440.*exp2((key-69.)/12.);}
float strike(float age,float tone){
 return exp(-age*2.5)*(sin(tone*age)+.51*exp(-age*2.)*sin(tone*2.72*age)+.26*sin(tone*4.13*age)*exp(-age*5.));
}
float note(float i){return i<1.?0.:i<2.?7.:i<3.?10.:i<4.?5.:i<5.?3.:i<6.?10.:i<7.?12.:7.;}
float motif(float b,float stereo){
 float cell=floor(b*.5),ix=mod(cell,8.);
 float age=mod(b,2.)*.4;
 float root=mod(floor(cell/8.),4.);
 float pitch=58.+note(ix)+(root==1.?5.:root==3.?-2.:0.);
 float f=freq(pitch),p=tau*f*age;
 float env=(1.-exp(-age*49.))*exp(-age*4.5);
 // Two reeds beating against one another, with a fast tongue on each attack.
 return env*(sin(p+.94*sin(p*2.)*exp(-age*5.))+.36*sin(p*(1.004+stereo*.001))+.15*sin(3.*p));
}
void main(){
 float sampleNo=floor(gl_FragCoord.x)+floor(gl_FragCoord.y)*4096.;
 float t=sampleNo/48000.,b=t*2.5;
 float stepNo=floor(b*4.),step16=mod(stepNo,16.),bar=floor(b/4.);
 float tick=fract(b*4.)*.1,age=fract(b)*.4;
 float noise=hiss(sampleNo),high=noise-hiss(sampleNo-1.);
 float gate=1.-step(174.8,b);
 float rhythm=(b<92.||b>=106.?1.:.06)*gate;
 float kick=0.,snare=0.,hat=0.,bass=0.;
 // Sum the tails across six ticks so syncopations cross subdivisions cleanly.
 for(int i=0;i<6;i++){
 float n=stepNo-float(i),s=mod(n,16.),a=tick+float(i)*.1;
 if(n<0.)continue;
 bool k=s==0.||s==10.||(s==7.&&mod(bar,2.)==1.)||(s==14.&&b>108.&&mod(bar,4.)==2.);
 if(k)kick+=sin(tau*(46.*a+1.52*(1.-exp(-a*38.))))*exp(-a*14.)+.15*noise*exp(-a*170.);
 if(s==4.||s==12.||(b>44.&&s==15.&&mod(bar,2.)==1.)){
 float amp=s==15.?.31:1.;
 snare+=amp*(noise*.66*exp(-a*23.)+sin(tau*(162.*a+.68*(1.-exp(-a*58.))))*.42*exp(-a*27.));
 }
 float open=s==2.||s==11.?1.:0.;
 hat+=(high*.29+sin(12630.*a)*sin(17413.*a)*.2)*exp(-a*mix(127.,33.,open))*(.35+.55*mod(s+1.,2.));
 if(s==0.||s==3.||s==6.||s==10.||s==13.){
 float chord=mod(floor(n/64.),4.);
 float key=34.+(chord==1.?5.:chord==3.?-2.:0.)+(s==6.?7.:s==13.?10.:0.);
 float phase=tau*freq(key)*a;
 bass+=exp(-a*(s==0.?9.:16.))*(1.-exp(-a*180.))*(sin(phase+.72*sin(phase*2.)*exp(-a*14.))+.22*sin(phase*2.));
 }
 }
 float drive=smoothstep(8.,16.,b);
 float beatMix=(kick*.55+bass*.39*drive+snare*.36*smoothstep(8.,12.,b)+hat*.23)*rhythm;
 float bell=0.;
 for(int j=0;j<3;j++){
 float a=t-(92.+float(j)*2.)*.4;
 if(a>=0.)bell+=strike(a,4110.+float(j)*23.)*.29;
 }
 vec2 mixout=vec2(0);
 for(int ch=0;ch<2;ch++){
 float side=float(ch),lead=motif(b,side);
 lead+=.30*motif(max(0.,b-.75-side*.05),side)+.15*motif(max(0.,b-1.5+side*.08),side);
 float a=mod(b,16.)*.4,root=mod(floor(b/16.),4.);
 float f=freq(46.+(root==1.?5.:root==3.?-2.:0.));
 float pad=0.;
 for(int v=0;v<3;v++){
 float p=tau*f*exp2((v==1?3.:v==2?10.:0.)/12.)*a*(1.+side*.0018);
 pad+=sin(p+.48*sin(p*2.))+.26*sin(p*1.007);
 }
 pad*=.043*smoothstep(0.,.4,a)*(1.-smoothstep(5.7,6.4,a));
 float melody=smoothstep(13.,18.,b)*(1.-smoothstep(87.,92.,b))+smoothstep(111.,118.,b);
 float roll=fract(b*8.)*.05;
 float chain=.038*(high*.4+sin(roll*16120.)*sin(roll*10937.))*exp(-roll*86.)*(.4+.6*sin(b*tau)*sin(b*tau));
 float tail=max(0.,t-69.92);
 float finalBell=b>=174.8?.28*strike(tail,2.*tau*freq(70.)):0.;
 // A high answer enters for the sprint, with the left and right pipes answering off-beat.
 float reply=max(0.,b-.5-side*.25);
 float answer=motif(reply*2.,side)*.075*smoothstep(119.,126.,b);
 float outval=beatMix+bell+gate*(lead*melody*.157+pad+chain+answer)+finalBell;
 mixout[ch]=.93*tanh(outval*1.47);
 }
 O=vec4(mixout,0,1);
}
