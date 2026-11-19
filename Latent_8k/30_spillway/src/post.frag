#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;

float h(vec2 p){return fract(sin(dot(p,vec2(127.,312.)))*43758.);}
float ss(float a,float b,float x){return smoothstep(a,b,x);}
vec3 ov(vec3 c,vec2 p,float r,float a){
  if(a<=0.||min(p.x,p.y)<0.||max(p.x,p.y)>1.)return c;
  vec2 v=vec2(r>=2.&&r<5.?(fract(r)+p.x*.5):p.x,(floor(r)+1.-p.y)/8.);
  return mix(c,c*.3,a*textureLod(B,v,3.).r*.7)+a*texture(B,v).r;
}
float ac[6]=float[6](1.2,8.2,16.2,28.2,36.2,44.2);

void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float t=R.z,b=t/1.875,g=6.28*h(f+fract(t)*99.),a=texture(A,q).a,k;
  vec3 c=vec3(0),l=c;
  for(float i=0.;i<12.;i++){
    c+=textureLod(A,q+sqrt((i+.5)/12.)*a*.01*vec2(cos(i*2.4+g),sin(i*2.4+g))*vec2(R.y/R.x,1),a).rgb;
    if(i<5.)l+=textureLod(A,q+exp2(i+2.)/R.xy*vec2(cos(g+i),sin(g+i)),i+2.).rgb;
  }
  c=(c/12.+l*.048)*(1.+step(8.,b)*exp(-mod(b,8.)*7.)*.45)*(1.-dot(u,u)*.5);
  c=pow(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),vec3(.45))*ss(0.,1.2,b)*ss(64.,62.,b);

  a=ss(.6,1.3,b)*ss(5.2,4.3,b);
  c=ov(c,(u+vec2(.35,-.02))/vec2(.7,.11),0.,a)+a*step(abs(u.y-.01),.002)*step(abs(u.x),.25*a)*vec3(1,.25,0);
  for(int i=0;i<6;i++){k=b-ac[i];c=ov(c,(q-vec2(.04,.06))/vec2(.22,.048),2.+float(i)*.5,ss(0.,.4,k)*ss(3.3,2.7,k));}
  a=ss(54.5,56.,b)*ss(63.6,62.,b);
  c=ov(ov(ov(c,(u+vec2(.3,-.26))/vec2(.6,.095),0.,a),(u+vec2(.36,.26))/vec2(.72,.062),5.,a),(u+vec2(.44,.34))/vec2(.88,.048),7.,a*.75);
  O=vec4(clamp(c+(h(f+t*71.)-.5)*.02,0.,1.),1);
}
