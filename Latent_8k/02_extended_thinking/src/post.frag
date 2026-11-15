#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,u=f/R.xy-.5,v=u,q;
  float T=R.z,br=T/1.92,z=br-68.;
  vec3 c=vec3(0),b=c;
  // "compacting": the picture collapses to a line, then to a dot
  if(z>0.){v.y/=max(1.-z*10.,.004);v.x/=max(min(2.-z*10.,1.),.003);}
  // glitch: rows slip sideways on every cut
  if(br>=8.&&z<0.)v.x+=(h1(vec2(floor(u.y*30.),floor(T*30.)))-.5)*.2*exp(-fract(br/4.)*40.);
  q=v+.5;
  // chromatic aberration
  for(int i=0;i<3;i++)c[i]=texture(A,.5+v*(1.-.004*float(i))).rgb[i];
  // bloom from the mip chain, 4 taps per level
  for(float l=2.;l<8.;l++){
    float a=6.28*h1(f+l*7.+T*91.);
    vec2 o=exp2(l)/R.xy*1.2*vec2(cos(a),sin(a)),p=vec2(-o.y,o.x);
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)+textureLod(A,q+p,l)+textureLod(A,q-p,l)).rgb;
  }
  c+=b*(br<24.?.007:.003);
  if(z>0.)c*=(1.+z*40.)*step(max(abs(v.x),abs(v.y)),.5)*smoothstep(.45,.3,z);
  // flash on scene cuts
  if(br>=8.&&br<64.)c+=exp(-fract(br/4.)*24.)*.3;
  c*=1.-dot(u,u)*.9;
  // terminal lines: 8 rows in texture B, each with a start bar and a length
  for(int i=0;i<8;i++){
    float x=br-float[8](.5,4.,24.,40.,66.,8.,58.,68.4)[i],L=float[8](3.5,3.8,4.,4.,2.,4.,6.,3.4)[i],s=i==5?1.5:.85;
    vec2 p=vec2((u.x+.44)/s,(u.y+.4)*9./s);
    if(x>0.&&x<L&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      float a=clamp(min(x,L-x)*6.,0.,1.);
      c*=1.-.8*a;
      // the prompt is typed
      if(i==0)a*=step(p.x,.031+.0172*floor(x*17.));
      p.y=(float(i)+1.-p.y)/8.;
      c+=(texture(B,p).r+textureLod(B,p,3.).r*.25)*a*(i>0&&i<5?vec3(1,.5,.35)*(.8+.4*sin(p.x*30.-T*5.)):vec3(1,.95,.85));
    }
  }
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45));
  c+=(h1(f+T*83.)-.5)*.03;
  O=vec4(c*smoothstep(72.,71.6,br),1);
}
