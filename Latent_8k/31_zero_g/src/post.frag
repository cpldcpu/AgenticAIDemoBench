#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;

float ss(float a,float b,float x){return smoothstep(a,b,x);}

void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float t=R.z,b=t*.5,g=6.28*fract(sin(dot(f+fract(t)*99.,vec2(127.1,311.7)))*43758.5),a=texture(A,q).a,ta=0.;
  vec3 c=vec3(0),l=c,CY=vec3(.08,.92,1),NR=vec3(1,.24,.06);
  for(float i=0.;i<12.;i++){
    c+=textureLod(A,q+sqrt((i+.5)/12.)*a*.009*vec2(cos(i*2.4+g),sin(i*2.4+g))*vec2(R.y/R.x,1),a).rgb;
    if(i<5.)l+=textureLod(A,q+exp2(i+2.)/R.xy*vec2(cos(g+i),sin(g+i)),i+2.).rgb;
  }
  c=(c/12.+l*.052)*(1.+exp(-mod(b,8.)*6.5)*.28)*(1.-dot(u,u)*.4);
  c=pow(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),vec3(.45))*ss(0.,.7,b)*ss(64.,62.7,b);

  vec4 bx[6]=vec4[6](vec4(.28,.52,.44,.12),vec4(.22,.08,.56,.056),vec4(.03,.055,.42,.048),vec4(.32,.88,.36,.085),vec4(.12,.11,.76,.05),vec4(.06,.045,.88,.04));
  float s0[6]=float[6](4.2,.15,8.3,16.3,32.3,48.1);
  for(int i=0;i<9;i++){
    float x=i<6?s0[i]:53.5,w=ss(x,x+.5,b)*ss(i<6?x+3.6:63.3,i<6?x+2.9:62.6,b);
    if(i<1)ta=w;
    vec4 r=bx[i<2?i:i<6?2:i-3];vec2 p=(q-r.xy)/r.zw;
    if(w>0.&&min(p.x,p.y)>0.&&max(p.x,p.y)<1.&&p.x<(i==1?ss(-.2,2.8,b):1.)){
      vec2 v=vec2(i%6<1?p.x*.5:p.x,(float(i==6?0:i>6?i-1:i)+1.-p.y)/8.);
      c=mix(c,c*.18,w*textureLod(B,v,3.).r*.85)+w*texture(B,v).r*(i%6<1?vec3(1):i==5?NR:CY);
    }
  }
  c+=ta*step(abs(u.y-.01),.0022)*step(abs(u.x),.22*ta)*mix(CY,NR,u.x/.44+.5);

  if(b>=48.&&b<52.2){
    float cp=ss(48.,50.6,b),w=ss(48.,48.3,b)*ss(52.2,51.9,b);
    int vl=int(mix(12835.,8172.,cp*cp));
    vec2 p=(q-vec2(.4,.14))/vec2(.2,.09);
    if(min(p.x,p.y)>0.&&max(p.x,p.y)<1.){
      int j=int(p.x*5.),n=(vl/int(pow(10.,float(4-j))+.5))%10;
      vec2 v=vec2(.5+(float(n)+fract(p.x*5.))*.0488,(1.-p.y)/8.);
      if(j>0||vl>=10000)c=mix(c,c*.16,w*textureLod(B,v,3.).r*.9)+w*texture(B,v).r*(vl<8192?CY:NR)*1.3;
    }
  }
  O=vec4(clamp(c+(g*.16-.5)*.018,0.,1.),1);
}
