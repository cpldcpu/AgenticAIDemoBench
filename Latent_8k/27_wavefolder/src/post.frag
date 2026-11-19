#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5,o,p;
  float T=R.z,Z=T/2.,g=6.28*h1(f+fract(T)*99.),k=Z<40.?0.:2.,x=Z<40.?Z-1.:Z-65.,a;
  // the lens splits the colours, more so on every snare hit
  // the tape slips for a moment on each cut
  x=mod(Z,Z<40.||Z>64.?4.:2.);
  q.x+=step(8.,Z)*step(Z,68.)*step(x,.06)*(h1(vec2(floor(f.y/8.),T))-.5)*.1;
  a=.002+(Z>=16.&&Z<32.||Z>=40.&&Z<64.?.008*exp(-5.*fract(Z*2.+.5)):0.);
  vec3 c=vec3(texture(A,q-u*a).r,texture(A,q).g,texture(A,q+u*a).b),b=vec3(0);
  // glow from the mip chain
  for(float l=1.;l<8.;l++){
    o=exp2(l)/R.xy*vec2(cos(g+l),sin(g+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb
      // and the bright things draw a streak across the lens
      +(textureLod(A,q+vec2(o.x*6.,0),l)+textureLod(A,q-vec2(o.x*6.,0),l)).rgb*vec3(.3,.4,1);
  }
  c+=b*.012;
  // a flash on each cut
  c*=1.+step(8.,Z)*step(Z,68.)*exp(-x*8.);
  x=Z<40.?Z-1.:Z-65.;
  c*=1.-dot(u,u)*.8;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45))*smoothstep(0.,1.,Z)*smoothstep(72.,70.,Z);
  // title and credits in chrome: sky above the horizon line, desert below
  for(float j=0.;j<2.;j++){
    a=j+k<1.?1.5:.8;
    p=vec2(u.x/a+.5,(u.y-.12+.22*j)/a*9.+.5);
    if(x>j&&x<5.&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      o=vec2(p.x,(k+j+1.-p.y)/4.);
      c=mix(c,p.y>.5?mix(vec3(.7,.95,1),vec3(.05,.1,.8),p.y*3.-1.5):mix(vec3(.15,0,.25),vec3(1,.6,.3),1.5-3.*p.y),texture(B,o).r*clamp(min(x-j,5.-x)*2.,0.,1.))
        +textureLod(B,o,4.).r*vec3(.6,.05,.4)*clamp(min(x-j,5.-x)*2.,0.,1.);
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.03,1);
}
