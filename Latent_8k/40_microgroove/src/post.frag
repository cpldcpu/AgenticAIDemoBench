#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;

float ss(float a,float b,float x){return smoothstep(a,b,x);}
vec3 tx(vec3 c,vec2 u,float r,float l,vec2 p,vec2 s,float a,vec3 t){
  if(a<=.005)return c;
  vec2 q=(u-p)/s+.5;if(max(abs(q.x-.5),abs(q.y-.5))>.5)return c;
  vec2 v=vec2(r<2.5?q.x:l*.5+q.x*.5,(r+1.-q.y)/8.);
  return mix(c*(1.-.85*textureLod(B,v,2.4).a*a),t,textureLod(B,v,0.).a*a);
}

void main(){
  vec2 uv=gl_FragCoord.xy/R.xy,px;float T=R.z,BT=T/1.92,coc=clamp(textureLod(A,uv,0.).a,0.,1.);
  px=coc*6./R.xy;vec3 c=vec3(0);
  for(int i=min(0,int(R.x));i<12;i++){float f=float(i),r=sqrt((f+.5)/12.),a=f*2.4;c+=textureLod(A,uv+vec2(cos(a),sin(a))*r*px,coc*2.).rgb;}
  c/=12.;
  for(int m=1;m<6;m++)c+=textureLod(A,uv,float(m)*1.3).rgb*exp(-float(m)*.55)*.036;
  bool drp=(BT>=8.&&BT<32.)||(BT>=40.&&BT<56.);vec2 vc=uv*2.-1.;
  c*=(1.+(drp?.045:0.)*exp(-fract(BT*4.)*5.))*(1.-dot(vc,vc)*.14)*1.12;
  c=pow(clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.),vec3(.4545))*ss(0.,1.5,T)*(1.-ss(120.,122.7,T));

  float sY=R.x/R.y*.5625,ti=ss(.5,1.3,BT)*(1.-ss(3.2,3.8,BT)),cr=ss(60.,60.8,BT)*(1.-ss(63.1,63.9,BT));
  c=tx(c,uv,0.,0.,vec2(.5,.66),vec2(.82,.15*sY),ti+cr,vec3(.98,.86,.64));
  c=tx(c,uv,1.,0.,vec2(.5,.2),vec2(.84,.075*sY),cr,vec3(.96,.88,.72));
  c=tx(c,uv,2.,0.,vec2(.5,.12),vec2(.9,.068*sY),cr,vec3(.72,.84,.96));
  for(int i=0;i<6;i++){
    float a0=float[6](4.1,8.2,22.2,32.2,40.2,56.2)[i];
    c=tx(c,uv,3.+float(i>>1),float(i&1),vec2(.22,.09),vec2(.38,.068*sY),ss(a0,a0+.45,BT)*(1.-ss(a0+2.8,a0+3.4,BT)),vec3(.98,.88,.72));
  }
  O=vec4(clamp(c+(fract(sin(dot(gl_FragCoord.xy+fract(T)*17.,vec2(12.9898,78.233)))*43758.5453)-.5)/255.,0.,1.),1.);
}
