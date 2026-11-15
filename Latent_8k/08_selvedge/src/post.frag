#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float text(vec2 uv,float row,vec2 at,vec2 size){vec2 p=(uv-at)/size;if(any(lessThan(p,vec2(0)))||any(greaterThan(p,vec2(1))))return 0.;return texture(B,vec2(p.x,(row+1.-p.y)/10.)).a;}
void main(){
 vec2 uv=gl_FragCoord.xy/R.xy;float t=R.z;
 vec4 base=texture(A,uv);vec3 c=base.rgb;float weight=1.;
 for(int i=0;i<20;i++){
  float angle=float(i)*2.399963,rad=sqrt((float(i)+.5)/20.);
  vec2 offset=vec2(cos(angle),sin(angle))*rad*max(base.a,2.)/R.xy;
  vec4 tap=texture(A,uv+offset);
  float w=smoothstep(rad*max(base.a,2.)-.8,rad*max(base.a,2.)+.8,tap.a);
  c+=tap.rgb*w;weight+=w;
 }
 c/=weight;
 c+=.035*textureLod(A,uv,5.).rgb;
 c=pow(max(c,0.),vec3(.4545));
 c*=1.-.16*dot(uv-.5,uv-.5);
 float row=t<16.?1.:t<40.?2.:t<64.?3.:t<80.?8.:t<112.?4.:5.;
 float tx=text(uv,row,vec2(.045,.075),vec2(.7,.035));
 float title=(smoothstep(3.,5.,t)*(1.-smoothstep(12.,14.,t))+smoothstep(116.,119.,t));
 tx+=title*text(uv,0.,vec2(.05,.77),vec2(.9,.11));
 tx+=smoothstep(118.,120.,t)*text(uv,6.,vec2(.25,.19),vec2(.6,.026));
 tx+=smoothstep(120.,122.,t)*text(uv,7.,vec2(.25,.15),vec2(.6,.026));
 c=mix(c,vec3(.14,.055,.075),clamp(tx,0.,1.));
 if(t>=64.&&t<80.)c=mix(c,vec3(.9,.84,.74),clamp(tx,0.,1.));
 c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
 c*=smoothstep(0.,2.,t)*(1.-smoothstep(125.,128.,t));
 if(uv.y<.045||uv.y>.955)c=vec3(.025);
 O=vec4(c,1.);
}
