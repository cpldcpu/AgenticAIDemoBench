#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
vec3 c;
const vec3 paper=vec3(1.,.94,.81),lime=vec3(.91,1.,.21),ink=vec3(.10,.065,.15);
vec2 uv;
void type(float row,vec2 pos,vec2 size,vec3 col,float opacity){
 vec2 p=(uv-pos)/size;
 if(!any(lessThan(p,vec2(0)))&&all(lessThan(p,vec2(1)))){
 float a=texture(B,vec2(p.x,(100.*row+100.*(1.-p.y))/2048.)).a;
 c=mix(c,col,a*opacity);
 }
}
void main(){
 uv=gl_FragCoord.xy/R.xy;
 float b=R.z*2.5;
 c=texture(A,uv).rgb;
 float dark=smoothstep(74.,92.,b)*(1.-smoothstep(162.,169.,b));
 vec3 halo=textureLod(A,uv,4.).rgb+textureLod(A,uv,6.).rgb;
 c+=dark*(halo*.24+max(halo-.6,0.)*.46);
 // A fine three-colour screen in the shadows, kept in display pixels.
 vec2 dots=mat2(.94,.34,-.34,.94)*gl_FragCoord.xy/4.;
 float lum=dot(c,vec3(.24,.56,.20));
 c*=1.-.19*(1.-smoothstep(.02,.73,lum))*smoothstep(.28,.43,length(fract(dots)-.5));
 float grain=fract(52.9829*fract(dot(gl_FragCoord.xy+floor(R.z*15.),vec2(.06711,.00584))));
 c+=(grain-.5)*.025;
 if(b<12.){
 float e=smoothstep(0.,2.,b);
 type(1.,vec2(.055,.83),vec2(.32,.036),paper,e);
 type(0.,vec2(.043,.63),vec2(.53,.195),lime,e);
 }
 if(b>=28.&&b<44.)type(2.,vec2(.05,.07),vec2(.29,.11),paper,1.);
 if(b>=92.&&b<108.){
 type(3.,vec2(.05,.74),vec2(.69,.18),paper,smoothstep(92.,93.,b));
 type(8.,vec2(.056,.707),vec2(.29,.034),lime,1.);
 }
 if(b>=174.8){
 float sweep=smoothstep(174.8,179.,b);
 float etched=dot(c,vec3(.25,.57,.18));
 c=mix(c,mix(ink,paper,etched)+.022*sin(gl_FragCoord.x*2.),sweep*.90);
 if(abs(uv.x-.607)<.001&&uv.y>.29)c=vec3(1.,.23,.16);
 if(uv.y>.93&&fract(uv.x*80.)<.085&&uv.y<.945+.015*step(.99,cos(floor(uv.x*80.)*1.25664)))c=ink;
 float panel=smoothstep(uv.y-.01,uv.y+.01,.29*sweep);
 c=mix(c,ink,panel);
 if(panel>.01){
 type(5.,vec2(.045,.162),vec2(.48,.105),lime,panel);
 type(6.,vec2(.05,.080),vec2(.355,.042),paper,panel);
 type(9.,vec2(.57,.091),vec2(.16,.071),paper,panel);
 type(4.,vec2(.81,.056),vec2(.14,.20),lime,panel);
 }
 }
 O=vec4(c,1.);
}
