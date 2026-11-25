#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5,p,o;
  float T=R.z,k=texture(A,q).a*4.,a,l,g;
  vec3 c=vec3(0),b=vec3(0);
  // depth of field: eight taps on a sunflower spiral, read from the mip level that matches their spacing
  // a tap counts only as much as it is out of focus itself, so sharp dominoes do not bleed into the blurred room behind
  a=.05;c=texture(A,q).rgb*a;
  for(l=0.;l<12.;l++){o=q+vec2(cos(l*2.4),sin(l*2.4))*sqrt(l+.5)*exp2(k)*.6/R.xy;g=clamp(textureLod(A,o,0.).a*4.,.03,1.);c+=textureLod(A,o,k).rgb*g;a+=g;}
  c/=a;
  for(l=3.;l<9.;l++)b+=textureLod(A,q,l).rgb;
  c+=b*.012;
  c*=1.-dot(u,u)*1.1;
  c+=step(70.,T)*exp(min(70.-T,0.)*8.)*.12;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45,.46,.5))*smoothstep(0.,.5,T)*smoothstep(98.,95.,T);
  // captions, set in a serif on the left, the title in the middle
  u=(f-.5*R.xy)/R.y;
  for(int i=0;i<9;i++){
    vec4 m=vec4[9](vec4(1.5,6.5,0,.37),vec4(2.5,6.5,0,.28),vec4(10,14.5,-.27,-.38),vec4(27,31.5,-.27,-.38),vec4(43,47.5,-.27,-.38),vec4(57,61.5,-.27,-.38),vec4(88,99,0,.41),vec4(89,99,0,-.39),vec4(90,99,0,-.44))[i];
    a=float[9](.12,.04,.04,.04,.04,.04,.07,.03,.025)[i];
    l=float[9](0.,1.,2.,3.,7.,4.,0.,5.,6.)[i];
    p=(u-m.zw)/a;
    if(T>m.x&&T<m.y&&abs(p.y)<.5&&abs(p.x)<8.){
      o=vec2(p.x/16.+.5,(l+.5-p.y)/8.);
      c=mix(c,vec3(.95,.92,.86),texture(B,o).r*smoothstep(m.x,m.x+.6,T)*smoothstep(m.y,m.y-.6,T));
    }
  }
  O=vec4(c+(h1(f+T*71.)-.5)*.025,1);
}
