#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5,o,p;
  float T=R.z,Z=T/1.875,g=0.,a,l;
  vec3 c=texture(A,q).rgb,b=vec3(0);
  // glow from the mip chain, and a long horizontal streak from the bright lamps, as an anamorphic lens draws it
  for(l=1.;l<8.;l++){
    o=exp2(l)/R.xy*vec2(cos(g+l),sin(g+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb*.012
      +(textureLod(A,q+vec2(o.x*3.,0),l)+textureLod(A,q-vec2(o.x*3.,0),l)+textureLod(A,q+vec2(o.x*6.,0),l)+textureLod(A,q-vec2(o.x*6.,0),l)).rgb*vec3(.5,.6,1)*.004
      // and, like the star filter of a 1982 TV camera, a short vertical spike
      +(textureLod(A,q+vec2(0,o.y*4.),l)+textureLod(A,q-vec2(0,o.y*4.),l)).rgb*.003;
  }
  c+=b;
  // a flash on the drop, and a pulse on each beat while the drums play
  c*=1.+3.*exp(-abs(Z-40.)*4.)*step(39.9,Z)+(Z>8.&&Z<32.||Z>40.&&Z<64.?.12*exp(-fract(Z*4.)*6.):0.);
  c*=1.-dot(u,u)*.9;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45))*smoothstep(0.,1.,T)*smoothstep(68.,67.,Z);
  // a television of 1982: faint scanlines
  c*=.94+.06*sin(f.y*2.1);
  // the lettering: red LED dot matrix, 16 dots high
  u=(f-.5*R.xy)/R.y;
  for(int i=0;i<9;i++){
    vec4 m=vec4[9](vec4(4.5,8,0,.04),vec4(5.5,8,0,-.15),vec4(16.5,20,0,-.91),vec4(24.5,28,-1.05,.82),vec4(48,50,0,-.91),vec4(33,36,0,-.8),vec4(60,64,0,-.8),vec4(64.3,67.5,0,0),vec4(40,41.5,0,.68))[i];
    a=float[9](.24,.07,.045,.05,.045,.06,.06,.22,.16)[i];
    p=(u-m.zw)/a;
    l=float(i%8);
    if(Z>m.x&&Z<m.y&&abs(p.y)<.5&&abs(p.x)<8.){
      p=vec2(p.x/16.+.5,(l+.5-p.y)/8.);
      o=floor(p*vec2(256,128))+.5;
      a=texture(B,o/vec2(256,128)).r;
      c=mix(c,vec3(1,.08,.02)*(a>.4?1.:.06)*(i>7?step(.5,fract(Z*4.)):1.)*(.5+exp(-abs(p.x-.5-.45*cos(T*6.702))*12.)*2.),smoothstep(.48,.3,length(fract(p*vec2(256,128))-.5))*min(1.,(m.y-Z)*2.))
        +textureLod(B,p,3.).r*vec3(.5,.02,0)*.4;
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.03,1);
}
