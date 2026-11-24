#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}

void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z,Z=T/1.875;
  // chromatic aberration growing to the edges, like looking through curved glass
  float ab=.0022*dot(u,u);
  vec3 c=vec3(texture(A,q+u*ab*vec2(1,0)).r,texture(A,q).g,texture(A,q-u*ab*vec2(1,0)).b);
  // glow from the mip chain
  vec3 b=vec3(0);
  for(float l=1.;l<8.;l++){
    vec2 o=exp2(l)/R.xy;
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb*.011
      +(textureLod(A,q+o*vec2(3,1),l)+textureLod(A,q-o*vec2(3,1),l)).rgb*vec3(.6,.7,1)*.005;
  }
  c+=b;
  c*=1.-dot(u,u)*.85;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45))*smoothstep(0.,1.,T)*smoothstep(71.5,70.5,Z);
  c=c*vec3(1.04,1.,.94)+vec3(.004,.003,.007); // night grade
  c+=vec3(1.,.88,.7)*pow(max(c.r,0.),3.)*.025; // warm highlights
  // the lettering, warm white with a soft halo, one line per scene window
  u=(f-.5*R.xy)/R.y;
  float z0[7]=float[7](.5,3.5,8.,16.,40.,56.,64.);
  float z1[7]=float[7](3.5,8.,16.,24.,48.,62.,72.);
  int ln[7]=int[7](1,0,2,3,4,5,6);
  float sc[7]=float[7](.045,.1,.1,.065,.085,.042,.11);
  for(int i=0;i<7;i++)if(Z>=z0[i]&&Z<z1[i]){
    float fade=smoothstep(z0[i],z0[i]+.5,Z)*smoothstep(z1[i],z1[i]-.5,Z);
    vec2 p=u/sc[i];
    if(abs(p.y)<.5&&abs(p.x)<12.){
      vec2 uv=vec2(p.x/24.+.5,(float(ln[i])+.5-p.y)/8.);
      float a=texture(B,uv).r,g=textureLod(B,uv,2.).r;
      c+=vec3(1.,.85,.62)*(a*1.4+g*.45)*fade;
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.028,1);
}
