#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
// rows of the text texture: 0 title, 1 subtitle, 2 credit, 3 last line
float tx(vec2 u,vec2 c,vec2 s,float row){
  vec2 q=(u-c)/s+.5;
  return q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.?texture(B,vec2(q.x,(row+1.-q.y)/4.)).r:0.;
}
void main(){
  vec2 u=gl_FragCoord.xy/R.xy;
  float b=R.z/1.875;
  // a little lens fringing towards the edges, as through old glass
  vec2 d=(u-.5)*.002;
  vec3 c=vec3(texture(A,u+d).r,texture(A,u).g,texture(A,u-d).b);
  for(int i=0;i<27;i++){float l=float(i/9*2+3);c+=.011*textureLod(A,u+vec2(i%3-1,i/3%3-1)*exp2(l)/R.xy,l).rgb;}
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(clamp(c,0.,1.),vec3(.4545));
  c+=(exp(-max(b-32.,0.)*2.5)*step(31.97,b)+.3*exp(-max(b-48.,0.)*3.)*step(47.97,b))*vec3(.6,.7,.9);
  c*=1.-.35*pow(length(u-.5)*1.3,2.);
  c+=(fract(52.98*fract(dot(gl_FragCoord.xy+mod(R.z*60.,97.),vec2(.0671,.0058))))-.5)*.03;
  float a=R.x/R.y,ti=smoothstep(2.,3.,b)*(1.-smoothstep(6.5,7.5,b)),cr=smoothstep(57.,58.,b)*(1.-smoothstep(62.5,63.5,b));
  c=mix(c,vec3(1,.93,.82),tx(u,vec2(.19,.86),vec2(.6,.6*a/8.),0.)*ti+tx(u,vec2(.19,.79),vec2(.4,.4*a/8.),1.)*ti*.8
    +tx(u,vec2(.5,.16),vec2(.6,.6*a/8.),2.)*cr+tx(u,vec2(.5,.08),vec2(.45,.45*a/8.),3.)*cr*.8);
  c*=smoothstep(0.,3.,R.z)*(1.-smoothstep(64.6,66.,b));
  O=vec4(c,1);
}
