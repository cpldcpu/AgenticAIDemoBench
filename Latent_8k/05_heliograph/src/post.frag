#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/R.xy,p=uv-.5;
  float T=R.z,b=T*9./14.;
  vec3 c=vec3(0),bloom=vec3(0);
  // Gentle lens dispersion; the framing is stable and free of glitch overlays.
  for(int j=0;j<3;j++)c[j]=textureLod(A,.5+p*(1.+float(j-1)*.00065),texture(A,uv).a*2.).rgb[j];
  // Edge-directed antialiasing preserves the fine clockwork and luminous filaments.
  vec4 lum;
  for(int j=0;j<4;j++)lum[j]=dot(textureLod(A,uv+vec2(j%2*2-1,j/2*2-1)/R.xy,0.).rgb,vec3(.299,.587,.114));
  vec2 dir=vec2(-(lum.x+lum.y-lum.z-lum.w),lum.x+lum.z-lum.y-lum.w);
  dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+.05),-4.,4.)/R.xy;
  c=mix(c,(texture(A,uv+dir*.33).rgb+texture(A,uv-dir*.33).rgb)*.5,.65);
  for(float l=2.;l<8.;l++){
    vec2 d=exp2(l)/R.xy;
    bloom+=(textureLod(A,uv+vec2(d.x,d.y),l).rgb+textureLod(A,uv-d,l).rgb
          +textureLod(A,uv+vec2(d.x,-d.y),l).rgb+textureLod(A,uv+vec2(-d.x,d.y),l).rgb);
  }
  c+=bloom*.012;
  // A photographic shutter briefly closes at major scene edits, locked to the score.
  float shutter=1.;
  for(int j=0;j<6;j++){
    float d=abs(b-float[6](20.,32.,36.,40.,44.,64.)[j]);
    shutter*=.2+.8*smoothstep(0.,.09,d);
  }
  c*=shutter;
  c*=1.-dot(p,p)*.7;
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(max(c,0.),vec3(.4545));
  // A quiet gallery caption and title at each major structural change.
  for(int j=0;j<10;j++){
    float start=float[10](8.,1.,20.,32.,44.,65.,68.,11.,36.,40.)[j],
          len=j==0?4.:j==6?3.8:3.,t=b-start,
          a=sat(t*2.)*sat((len-t)*2.);
    if(j==0&&b>68.)a=sat(b-68.)*sat((72.-b)*2.);
    vec2 q=vec2((uv.x-.08)/.84,(uv.y-.10)/.047);
    if(j==0)q=vec2((uv.x-.18)/.72,(uv.y-.18)/.065);
    if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.&&a>0.){
      q.y=(float(j)+1.-q.y)/10.;
      float tx=texture(B,q).r;
      c=mix(c,vec3(.97,.91,.78),tx*a);
    }
  }
  // Fine film grain, rounded anamorphic frame and a clean end card fade.
  c+=(noise(gl_FragCoord.xy+floor(T*24.)*17.)-.5)*.013;
  c*=smoothstep(.075,.078,uv.y)*(1.-smoothstep(.922,.925,uv.y));
  c*=smoothstep(0.,1.7,T)*(1.-smoothstep(109.,112.,T));
  O=vec4(c,1);
}
