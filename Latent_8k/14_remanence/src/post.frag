#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z,br=T/1.4,a,
        sn=(step(16.,br)*step(br,32.)+step(44.,br)*step(br,76.))*exp(-fract(br*2.+.5)*7.);
  // depth of field: eight taps on a disc as wide as the scene shader asks for;
  // the snare pulls the colours apart towards the corners
  vec2 o=u*dot(u,u)*(.002+.05*sn),d;
  float co=texture(A,q).a*R.y/1080.,l;
  vec3 c=vec3(0),b=c;
  for(l=0.;l<16.;l++){
    d=q+co*sqrt(l/16.)*vec2(cos(l*2.4),sin(l*2.4))/R.xy;
    a=log2(max(co,1.))-.5;
    c+=vec3(textureLod(A,d+o,a).r,textureLod(A,d,a).g,textureLod(A,d-o,a).b)/16.;
  }
  // glow: twelve taps on a spiral through the mip chain
  for(l=0.;l<12.;l++){
    a=1.5+l*.3;
    b+=textureLod(A,q+exp2(a)/R.xy*vec2(cos(l*2.4),sin(l*2.4)),a).rgb;
  }
  c+=b*.03;
  c*=1.-dot(u,u)*.6;
  c=pow(1.-exp(-1.8*c),vec3(.45));
  // captions: the title at the start, the credit at the end
  for(int i=0;i<2;i++){
    float x=br-float[2](.7,78.6)[i],L=float[2](5.6,4.6)[i],s=i<1?1.1:.5;
    vec2 p=vec2(u.x/s+.5,(u.y-(i<1?.02:.3))*9./s+.5);
    if(x>0.&&x<L&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      p.y=(float(i)+1.-p.y)/9.;
      c=mix(c,vec3(.95),texture(B,p).r*sat(min(x,L-x)*3.));
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.012,1);
}
