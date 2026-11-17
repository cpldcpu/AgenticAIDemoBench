#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z,br=T/1.6,l,a;
  vec3 c=vec3(0),b=c;
  float co=texture(A,q).a;
  for(l=0.;l<12.;l++){
    vec2 d=q+co*.003*vec2(cos(l*2.4),sin(l*2.4));
    a=log2(max(co*3.,1.));
    c+=textureLod(A,d,a).rgb/12.;
  }
  for(l=0.;l<10.;l++){
    a=1.5+l*.32;
    b+=textureLod(A,q+exp2(a)/R.xy*vec2(cos(l*2.4),sin(l*2.4)),a).rgb;
  }
  c+=b*.012;
  c*=1.-dot(u,u)*.5;
  c=pow(max(c,0.),vec3(.72,.7,.66));
  for(int i=0;i<2;i++){
    float x=br-float[2](.4,66.)[i],L=float[2](6.,7.)[i],s=i<1?1.15:.5;
    vec2 p=vec2(u.x/s+.5,(u.y-(i<1?.04:.3))*8./s+.5);
    if(x>0.&&x<L&&p.x>0.&&p.x<1.&&p.y>0.&&p.y<1.){
      p.y=(float(i)+1.-p.y)/8.;
      c=mix(c,vec3(1.,.9,.7),texture(B,p).r*sat(min(x,L-x)*3.));
    }
  }
  O=vec4(c+(h1(f+T*50.)-.5)*.008,1);
}
