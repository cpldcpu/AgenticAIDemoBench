#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
void main(){
  vec2 uv=gl_FragCoord.xy/R.xy,pixel=1./R.xy;
  vec3 c=texture(A,uv).rgb;
  // Filter only high-contrast silhouettes.
  vec3 horizontal=texture(A,uv+vec2(pixel.x,0)).rgb+texture(A,uv-vec2(pixel.x,0)).rgb;
  vec3 vertical=texture(A,uv+vec2(0,pixel.y)).rgb+texture(A,uv-vec2(0,pixel.y)).rgb;
  vec3 avg=(horizontal+vertical)*.25;
  c=mix(c,avg,.40*smoothstep(.04,.35,length(c-avg)));
  c=pow(c/(.83+.25*c),vec3(.455));
  float t=R.z;
  float title=smoothstep(.25,1.25,t)*(1.-smoothstep(3.7,4.8,t));
  float credit=smoothstep(72.,74.,t)*(1.-smoothstep(78.,79.5,t));
  vec2 xy=vec2(uv.x,1.-uv.y);
  float band=1.-smoothstep(.0,.46,uv.y);
  c*=1.-band*.72*max(title,credit);
  vec2 label=(xy-vec2(.052,.655))*vec2(1.4,3.15);
  if(label.x>=0.&&label.x<1.&&label.y>=0.&&label.y<.72)
    c=mix(c,vec3(1,.97,.86),texture(B,label).a*title);
  label=(xy-vec2(.052,.86))*vec2(1.4,3.15)+vec2(0,.72);
  if(label.x>=0.&&label.x<1.&&label.y>=.72&&label.y<1.)
    c=mix(c,vec3(1,.97,.86),texture(B,label).a*credit);
  float grain=fract(52.9829189*fract(dot(gl_FragCoord.xy+floor(t*24.),vec2(.06711056,.00583715))));
  O=vec4(c*(1.-.064*dot(uv-.5,uv-.5))+(grain-.5)*.014,1.);
}
