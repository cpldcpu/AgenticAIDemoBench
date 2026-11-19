#version 300 es
precision highp float;
uniform sampler2D A,B;
uniform vec4 R;
out vec4 O;
float cue(float t,float start,float stop){
  return smoothstep(start,start+.62,t)*(1.-smoothstep(stop-.58,stop,t));
}
void main(){
  vec2 uv=gl_FragCoord.xy/R.xy;
  float t=R.z;
  vec3 color=texture(A,uv).rgb;
  // Soft halation confined to the brightest window lights.
  color+=max(textureLod(A,uv,4.).rgb-.66,0.)*vec3(.13,.076,.035);
  float vignette=dot((uv-.5)*vec2(1.,.83),(uv-.5)*vec2(1.,.83));
  color*=1.12-.45*vignette;
  color=pow(max(vec3(0),1.-exp(-color*1.46)),vec3(.49));
  float film=fract(52.9829189*fract(dot(gl_FragCoord.xy+floor(t*24.),vec2(.06711056,.00583715))));
  color+=(film-.5)*.026;
  float blackout=smoothstep(48.5,49.5,t)*(1.-smoothstep(50.7,51.6,t));
  color*=smoothstep(0.,.95,t)*(1.-blackout)*(1.-smoothstep(71.,72.,t));
  float starts[8]=float[8](1.5,13.,22.,30.5,33.5,44.,51.7,61.5);
  float stops[8]=float[8](8.,19.5,28.5,34.1,38.8,49.,58.2,68.);
  for(int i=0;i<8;i++){
    float appear=cue(t,starts[i],stops[i]);
    if(appear<=0.)continue;
    vec2 q=vec2((uv.x-.065)*1.61,(.192-uv.y)*14.);
    color*=1.-appear*.37*(1.-smoothstep(.08,.30,uv.y));
    if(q.x>=0.&&q.x<=1.&&q.y>=0.&&q.y<1.){
      float ink=texture(B,vec2(q.x,(float(i)+q.y)/8.)).a;
      color=mix(color,vec3(1,.966,.858),ink*appear);
    }
  }
  O=vec4(color,1);
}
