#version 300 es
precision highp float;
#ifdef VERTEX
  layout(location=0) in vec3 point;
  layout(location=1) in vec3 normal;
  layout(location=2) in vec4 center;
  layout(location=3) in vec4 size;
  uniform vec4 R,A[2];
  out vec3 P,N;
  out vec4 M,L,tooling;
  vec2 turn(vec2 p,float a){return cos(a)*p+sin(a)*vec2(-p.y,p.x);}
  void main(){
    float t=R.z, layer=center.y/2.8, part=size.w;
    vec3 p=point*size.xyz+normal*center.w+center.xyz,n=normal;
    tooling=vec4(p.xz-center.xz,size.xz);
    if(part<1.){
      float raise=smoothstep(3.,16.,t)*(1.-smoothstep(17.,27.,t));
      float spill=smoothstep(35.,45.,t)*(1.-smoothstep(51.,61.,t));
      float twist=raise*(layer-.4)*2.8+spill*(layer*5.4+sin(t*.7-layer*5.)*.55);
      // On the return phrase each piece also opens on its own hinge.
      float hinge=spill*(.72+.7*sin(t*2.513-layer*6.));
      p.yz=center.yz+turn(p.yz-center.yz,hinge);n.yz=turn(n.yz,hinge);
      p.xz=turn(p.xz,twist);n.xz=turn(n.xz,twist);
      p.y+=layer*(raise*2.7+spill*3.4);
      p.xz+=spill*vec2(sin(layer*7.+t*.6),cos(layer*6.+t*.6))*.55;
    }
    P=p;N=n;M=vec4(part,normal.x,normal.z,center.y);
    vec3 light=normalize(vec3(-.68,1.,.55)), across=normalize(cross(vec3(0,1,0),light));
    vec3 lp=vec3(dot(p,across),dot(p,cross(light,across)),dot(p,light));
    L=vec4(lp.xy/11.,-lp.z/22.,1.);
    float a=A[0].x,e=A[0].y;vec3 view=vec3(sin(a)*cos(e),sin(e),cos(a)*cos(e)),right=vec3(cos(a),0,-sin(a));
    vec3 q=p-A[1].xyz;
    gl_Position=R.w>.5?L:vec4(dot(q,right)/A[0].z*R.y/R.x,dot(q,cross(view,right))/A[0].z,-dot(q,view)/90.,1.);
  }
#else
uniform vec4 R,A[2];
uniform sampler2D B;
in vec3 P,N;
in vec4 M,L,tooling;
out vec4 O;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*4375.5453);}
float shadow(vec3 n,vec3 sun){
  vec3 uv=L.xyz*.5+.5;
  float visibility=0.,bias=.00020+.00065*(1.-max(0.,dot(n,sun)));
  for(int i=0;i<12;i++){
    float a=float(i)*2.4;
    vec2 jitter=vec2(cos(a),sin(a))*sqrt(float(i)+.5)*.00061;
    visibility+=step(uv.z-bias,texture(B,uv.xy+jitter).r);
  }
  return visibility/12.;
}
void main(){
  if(R.w>.5){O=vec4(1);return;}
  vec3 n=normalize(N),sun=normalize(vec3(-.68,1,.55));
  float t=R.z,night=smoothstep(35.,40.,t)*(1.-smoothstep(53.,60.,t));
  float a=A[0].x,e=A[0].y;
  vec3 eye=vec3(sin(a)*cos(e),sin(e),cos(a)*cos(e)),ref=reflect(-eye,n);
  float radius=length(P.xz),phi=atan(P.z,P.x);
  vec3 ivory=vec3(.8,.76,.60),brass=vec3(.79,.44,.14),jade=vec3(.13,.48,.44);
  vec3 red=vec3(.87,.074,.026),blue=vec3(.019,.12,.44),base;
  float metal=.08,rough=.5;
  if(M.x<.5){
    // Enamel on the two reading faces. Every cut has a raw brass edge.
    base=mix(brass,red,smoothstep(.28,.95,abs(M.z)));
    base=mix(base,blue,smoothstep(.28,.95,abs(M.y)));
    float edge=1.-smoothstep(.76,.998,max(abs(M.z),abs(M.y)));
    metal=mix(.13,.82,edge);rough=.24;
    base*=.95+.05*cos(M.w*37.);
    if(edge>.75&&min(tooling.z,tooling.w)>.094){
      vec2 bore=abs(tooling.xy)-max(vec2(0),tooling.zw-.105);
      float d=length(bore);
      base*=1.-.74*(1.-smoothstep(.027,.037,d));
      base+=vec3(.21,.14,.07)*(1.-smoothstep(.003,.009,abs(d-.042)));
    }
  }else if(M.x<1.5){
    float contact=1.-.25*exp(-max(0.,radius-4.3)*2.5);
    base=mix(vec3(.54,.70,.66),vec3(.014,.035,.059),night)*contact;
    // Painted radial index around the turntable.
    float rings=1.-smoothstep(.008,.018,min(abs(radius-4.93),abs(radius-5.24)));
    float tick=abs(fract(phi*57.2958/5.+.5)-.5);
    rings=max(rings,(1.-smoothstep(.009,.035,tick))*step(4.94,radius)*(1.-step(5.04+.16*step(.93,cos(phi*12.)),radius)));
    base=mix(base,jade*.48,rings*.58);
  }else if(M.x<2.5){
    base=mix(vec3(.06,.105,.12),vec3(.16,.19,.17),smoothstep(.1,.9,sin(phi*256.)));
    rough=.32;metal=.54;
  }else if(M.x<3.5){
    base=brass;metal=.77;rough=.24;
  }else{
    base=ivory;
    if(n.y>.5){
      float marks=step(4.18,radius)*(1.-smoothstep(.05,.14,abs(fract(phi*57.2958/5.+.5)-.5)));
      base=mix(base,vec3(.10,.18,.18),marks*.74);
      float index=abs(P.x)+max(0.,4.37-P.z)*.52;
      if(P.z>4.03&&index<.13)base=red;
    }
  }
  float visible=shadow(n,sun),ndl=max(dot(n,sun),0.);
  vec3 ambient=mix(vec3(.32,.39,.44),vec3(.59,.63,.60),.5+.5*n.y);
  vec3 lighting=base*(ambient+visible*ndl*vec3(.76,.65,.50));
  vec3 softbox=normalize(vec3(-.48,.78,.36));
  float panel=smoothstep(.40,.82,dot(ref,softbox))+.6*smoothstep(.80,.86,dot(ref,normalize(vec3(.7,.4,-.6))));
  lighting+=mix(vec3(.10),base,metal)*panel*(metal+.15);
  lighting+=vec3(1,.81,.61)*pow(max(0.,dot(ref,sun)),mix(150.,16.,rough))*visible*(.2+metal);
  lighting+=base*.09*pow(1.-max(dot(n,eye),0.),3.);
  if(night>0.){
    vec3 dark=lighting*vec3(.072,.095,.16);
    if(M.x<.5){
      // A moving band of light traces the 10 eighth notes of a bar across the cut edges.
      float eighth=mod(floor(t*4.),10.),height=abs(M.w/2.8-(eighth+.5)*.10);
      float ping=exp(-14.*fract(t*4.))*exp(-height*17.);
      float grazing=pow(1.-abs(dot(n,eye)),3.);
      dark+=base*(.12+.66*grazing)+vec3(.96,.44,.11)*ping*(.35+grazing);
      dark+=vec3(.12,.40,.59)*pow(max(0.,dot(ref,normalize(vec3(.8,.3,-.5)))),8.);
    }else if(M.x>1.5){dark+=base*.10;}
    lighting=mix(lighting,dark,night);
  }
  if(M.x> .5&&M.x<1.5){
    lighting*=.92+.08*smoothstep(-3.,9.,P.x+.56*P.z);
    lighting=mix(lighting,mix(vec3(.68,.79,.76),vec3(.018,.044,.067),night),smoothstep(6.,35.,radius)*.85);
  }
  O=vec4(lighting*(.991+.018*hash(floor(P.xz*460.))),1);
}
#endif
