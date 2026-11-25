#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float eb(float t){return -.55+1.17*smoothstep(7.2,12.,t)-1.17*smoothstep(116.4,121.7,t);}
// one line of lettering from the text texture: row, centre, height
float tx(vec2 u,vec2 c,float a,float r){
  vec2 p=(u-c)/a;
  return abs(p.x)>8.||abs(p.y)>.5?0.:texture(B,vec2(p.x/16.+.5,(r+.5-p.y)/8.)).r;
}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=(f-.5*R.xy)/R.y,o;
  float T=R.z,g=0.,l,k=0.;
  vec3 c=texture(A,q).rgb,b=vec3(0);
  // glow from the mip chain
  for(l=1.;l<8.;l++){
    o=exp2(l)/R.xy*vec2(cos(g+l),sin(g+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb*(l>3.?.006:.002);
  }
  c+=b;
  c*=1.-dot(u,u)*.7;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45));
  // lettering printed on the sheet in dark ink; it moves with the sheet
  u-=vec2(0,eb(T)+.55);
  k+=tx(u,vec2(0,.07),.18,0.)*smoothstep(.3,1.8,T)*step(T,100.);
  k+=tx(u,vec2(0,-.07),.075,1.)*smoothstep(1.8,3.2,T)*step(T,100.);
  k+=tx(u,vec2(0,-.3),.06,2.)*smoothstep(3.,4.4,T)*step(T,100.);
  k+=tx(u,vec2(0,-.37),.055,3.)*smoothstep(4.,5.4,T)*step(T,100.);
  k+=tx(u,vec2(0,.05),.17,4.)*smoothstep(119.,121.,T);
  k+=tx(u,vec2(0,-.12),.07,5.)*smoothstep(120.,122.,T);
  c=mix(c,vec3(.2,.13,.09),min(k,1.)*.92);
  c+=(h1(f+T*83.)-.5)*.03;
  O=vec4(c*smoothstep(0.,1.,T)*smoothstep(130.,126.,T),1);
}
