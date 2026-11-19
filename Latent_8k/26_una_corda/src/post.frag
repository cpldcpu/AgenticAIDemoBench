#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
// UNA CORDA - lens, film and titles. A: the scene with its blur radius in alpha (mipmapped); B: the text
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5,o,p;
  float b=R.w,g=6.28*h1(f+fract(R.z)*99.),a=texture(A,q).a,w=0.,r,k,x;
  vec3 c=vec3(0),l=c;
  // depth of field: a golden-angle disc; a tap counts only if its own blur reaches this pixel
  for(float i=0.;i<48.;i++){
    r=sqrt(i/48.)*a*.012;
    o=r*vec2(cos(i*2.4+g),sin(i*2.4+g));
    vec4 t=textureLod(A,q+o*vec2(R.y/R.x,1),a*.7);
    k=step(r,t.a*.012+1e-4)+.03;
    c+=t.rgb*k;
    w+=k;
  }
  c/=w;
  // glow from the mip chain
  for(float i=2.;i<9.;i++){
    o=exp2(i)/R.xy*vec2(cos(g+i),sin(g+i));
    l+=(textureLod(A,q+o,i)+textureLod(A,q-o,i)).rgb;
  }
  c+=l*.012;
  c*=1.-dot(u,u)*1.1;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  // fade in, a breath of black between the big parts, fade out
  x=fract(b/4.);
  c=pow(c,vec3(.45))*smoothstep(0.,1.5,b)*smoothstep(46.,44.5,b)*min(smoothstep(31.9,32.1,b)+smoothstep(31.9,31.7,b),1.);
  // title over the opening, credits over the end
  for(float i=0.;i<3.;i++){
    k=i<1.?sin(3.14*clamp((b-.4)/2.3,0.,1.)):i<2.?sin(3.14*clamp((b-.9)/1.8,0.,1.)):sin(3.14*clamp((b-42.)/3.5,0.,1.));
    p=vec2(u.x/(i<1.?.62:.55)+.5,(u.y-(i<1.?.08:i<2.?-.06:-.3))/(i<1.?.62:.55)*R.y/R.x*8.+.5);
    if(k>0.&&abs(p.x-.5)<.5&&abs(p.y-.5)<.5){
      p.y=(i+1.-p.y)/4.;
      c+=k*(texture(B,p).r*vec3(1,.88,.7)+textureLod(B,p,3.).r*vec3(.3,.15,.05));
    }
  }
  O=vec4(c+(h1(f+R.z*83.)-.5)*.02,1);
}
