#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z;
  vec3 c=vec3(0),b=c;
  // chromatic aberration
  for(int i=0;i<3;i++)c[i]=texture(A,.5+u*(1.-.004*float(i))).rgb[i];
  // bloom from the mip chain, 4 taps per level
  for(float l=2.;l<8.;l++){
    float a=6.28*h1(f+l*7.+T*91.);
    vec2 o=exp2(l)/R.xy*1.2*vec2(cos(a),sin(a)),p=vec2(-o.y,o.x);
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)+textureLod(A,q+p,l)+textureLod(A,q-p,l)).rgb;
  }
  c+=b*.012;
  // flash on scene cuts
  if(T>=32.&&T<128.)c+=exp(-fract(T/16.)*64.)*.4;
  // titles: 4 rows in texture B
  for(int i=0;i<4;i++){
    float x=T-vec4(3,9.5,121,127.5)[i],s=i<2?1.:.5,y=(u.y-.2)*4.5/s+.5;
    vec2 p=vec2(u.x/s+.5,(float(i)+1.-y)/4.);
    if(x>0.&&x<5.5&&y>0.&&y<1.&&p.x>0.&&p.x<1.){
      float a=clamp(min(x,5.5-x),0.,1.);
      c+=(texture(B,p).r*step(h1(floor(f/3.)+float(i)),a*1.1)+textureLod(B,p,4.).r*a*.4)*vec3(1,.9,.8);
    }
  }
  c*=1.-dot(u,u)*.9;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45));
  // start as pure noise and denoise in 16 steps, one per beat
  float n=pow(1.-min(floor(T*2.)/16.,1.),2.);
  c=c*(1.-n)+vec3(h1(f+T*61.),h1(f+T*67.+9.),h1(f+T*71.+5.))*n*.8;
  c+=(h1(f+T*83.)-.5)*.03;
  O=vec4(c*smoothstep(136.,131.,T),1);
}
