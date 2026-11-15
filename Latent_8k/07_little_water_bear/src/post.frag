#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5,o;
  float T=R.z,br=T/2.4,a=texture(A,q).a*.97+.03,w=0.,g=6.28*h1(f+fract(T)*99.),r,k;
  vec3 c=vec3(0),b=c;
  // depth of field: a golden-angle disc. Alpha holds the circle of confusion; a tap only counts if its own blur reaches this pixel.
  for(float i=0.;i<48.;i++){
    r=sqrt(i/48.)*a*.02;
    o=r*vec2(cos(i*2.4+g),sin(i*2.4+g));
    vec4 x=textureLod(A,q+o*vec2(R.y/R.x,1),a*2.);
    k=step(r,x.a*.02+1e-4)+.02;
    c+=x.rgb*k;w+=k;
  }
  c/=w;
  // bloom from the mip chain
  for(float l=3.;l<8.;l++){
    o=exp2(l)/R.xy*vec2(cos(g+l),sin(g+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb;
  }
  c+=b*.012;
  // rain
  k=h1(vec2(floor(q.x*400.+q.y*30.),7));
  c+=smoothstep(45.5,46.2,br)*smoothstep(53.,50.,br)*.07*step(.7,k)*smoothstep(.7,1.,fract(q.y*(.5+k)+T*(2.+3.*k)+k*9.));
  // motes drift in the light above the moss
  o=q*vec2(16,9)+T*vec2(.1,.04);
  k=h1(floor(o));
  c+=step(.88,k)*smoothstep(.08,0.,length(fract(o)-.5))*(step(br,28.)+step(46.,br))*(.1+.1*sin(T*2.+k*99.))*vec3(1,1,.6);
  // a flash on the cut into orbit; lightning at the landing
  r=max(br-46.,0.);
  c+=exp(-max(br-32.,0.)*9.)*step(32.,br)
    +step(46.,br)*(exp(-r*30.)+.7*exp(-abs(r-.12)*40.))*.6;
  c*=1.-dot(u,u)*.8;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45))*smoothstep(0.,.8,br)*smoothstep(57.3,56.,br);
  // the narrator: rows of texture B, each with a first bar and a length; row 0 is the title
  for(int i=0;i<10;i++){
    float n=float[10](0.,1.,2.,3.,4.,5.,6.,7.,0.,8.)[i],x=br-float[10](2.2,5.,20.3,24.8,26.6,33.,37.,46.3,52.6,52.6)[i],
          L=float[10](1.7,2.6,1.6,1.6,1.3,2.6,2.5,1.5,3.3,3.3)[i],s=n<1.?1.1:.62;
    vec2 p=vec2(u.x/s+.5,(u.y-(n<1.?.07:i>8?-.07:-.36))*9./s+.5);
    if(x>0.&&x<L&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      p.y=(n+1.-p.y)/9.;
      a=sat(min(x,L-x)*5.);
      c=mix(c,c*.5,sat(textureLod(B,p,3.5).r*2.)*a)+texture(B,p).r*a*vec3(1,.96,.88);
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.03,1);
}
