#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z,br=T*.5,a=6.28*h1(f+fract(T)*99.);
  vec3 c=texture(A,q).rgb,b=vec3(0);
  // sun and sky glow from the mip chain
  for(float l=2.;l<7.;l++){
    vec2 o=exp2(l)/R.xy*vec2(cos(a+l),sin(a+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb;
  }
  c=mix(c,b/10.,.14);
  c*=1.-dot(u,u)*.45;
  c=pow(1.-exp(-2.*c),vec3(.45));
  // captions: rows of texture B, each with a first bar and a length
  for(int i=0;i<7;i++){
    float x=br-float[7](.6,6.,12.,24.1,32.6,56.1,60.8)[i],n=float(i),
          L=float[7](5.,4.,4.,4.,4.,4.,3.4)[i],s=i<1?2.2:1.;
    vec2 p=vec2(u.x/s+.5,(u.y-(i<1?0.:i>5?.28:-.37))*7./s+.5);
    if(x>0.&&x<L&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      p.y=(n+1.-p.y)/7.;
      c=mix(c,vec3(.93),texture(B,p).r*sat(min(x,L-x)*2.5)*.85);
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.01,1);
}
