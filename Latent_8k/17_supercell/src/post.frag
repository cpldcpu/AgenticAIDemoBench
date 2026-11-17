#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z,br=T/2.,l,a;
  float ps=smoothstep(40.,44.,br)*(1.-smoothstep(45.,49.,br));
  vec3 c=vec3(0),b=vec3(0);
  float co=texture(A,q).a;
  for(l=0.;l<12.;l++){
    vec2 d=q+co*.003*vec2(cos(l*2.4),sin(l*2.4));
    a=log2(max(co*3.,1.));
    c+=textureLod(A,d,a).rgb/12.;
  }
  // rain streaks while the cell passes overhead: smear copies of the frame downward
  if(ps>0.){
    vec3 r=vec3(0);
    for(l=0.;l<4.;l++)r+=texture(A,q+vec2((h1(f+l*7.7)-.5)*.0015,-.004-.006*l)).rgb;
    c=mix(c,r*.25,sat(ps*.7));
  }
  for(l=0.;l<6.;l++){
    a=1.2+l*.45;
    b+=textureLod(A,q+exp2(a)/R.xy*vec2(cos(l*2.4),sin(l*2.4)),a).rgb;
  }
  c+=b*.02;
  c*=1.-dot(u,u)*.5;
  c=pow(max(c,0.),vec3(.7,.72,.76));
  // captions: title, two act cards, credits
  for(int i=0;i<4;i++){
    float x=br-float[4](.4,15.6,47.5,57.)[i],L=float[4](5.,2.6,2.6,6.)[i];
    float s=i<1?1.15:(i<3?.85:.6);
    vec2 p=vec2(u.x/s+.5,(u.y-.05)*8./s+.5);
    if(x>0.&&x<L&&p.x>0.&&p.x<1.&&p.y>0.&&p.y<1.){
      p.y=(float(i)+1.-p.y)/8.;
      c=mix(c,vec3(.85,.92,1.),texture(B,p).r*sat(min(x,L-x)*3.));
    }
  }
  O=vec4(c+(h1(f+T*50.)-.5)*.008,1);
}
