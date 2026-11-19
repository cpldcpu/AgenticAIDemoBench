#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5,o,p;
  float T=R.z,br=T/1.05,g=6.28*h1(f+fract(T)*99.),k=br>24.&&br<112.?exp(-5.*fract(br)):0.,x,a,w=0.,r;
  // every drum hit punches the lens in a little
  q=.5+u*(1.-.015*k);
  a=texture(A,q).a;
  vec3 c=vec3(0),b=c;
  // depth of field: a golden-angle disc. Alpha holds the blur radius; a tap only counts if its own blur reaches this pixel
  for(float i=0.;i<48.;i++){
    r=sqrt(i/48.)*a*.02;
    o=r*vec2(cos(i*2.4+g),sin(i*2.4+g));
    vec4 t=textureLod(A,q+o*vec2(R.y/R.x,1),a*2.);
    k=step(r,t.a*.02+1e-4)+.02;
    c+=t.rgb*k;
    w+=k;
  }
  c/=w;
  // glow from the mip chain
  for(float l=2.;l<8.;l++){
    o=exp2(l)/R.xy*vec2(cos(g+l),sin(g+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb;
  }
  c+=b*.03;
  // a flash on each cut of the dance
  x=mod(br,br<48.||br>64.&&br<96.?4.:2.);
  c*=1.+step(32.,br)*step(br,113.)*exp(-x*6.);
  c*=1.-dot(u,u)*.9;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45))*smoothstep(0.,2.,br)*smoothstep(131.,127.,br);
  // title and credits, written in embers
  k=br<60.?0.:1.;
  x=k<1.?br-1.:br-118.;
  a=k<1.?1.:.6;
  p=vec2(u.x/a+.5,(u.y+(k<1.?-.12:.34))/a/.2222+.5);
  if(x>0.&&x<(k<1.?3.:9.)&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
    p.y=(k+1.-p.y)/2.;
    a=clamp(min(x,(k<1.?3.:9.)-x)*2.,0.,1.);
    c+=a*(texture(B,p).r*vec3(1,.6,.25)*(.7+.3*h1(floor(f/3.)+floor(T*12.)))+textureLod(B,p,4.).r*vec3(.5,.12,.02));
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.03,1);
}
