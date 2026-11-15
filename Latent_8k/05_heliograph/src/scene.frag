#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// A physical choreography: no fractals, no sampled assets.
float T,BR,PH,MT,ET,SHOT;
int SC;
const float PI=3.14159265;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float sat(float x){return clamp(x,0.,1.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 film(float x){return .55+.45*cos(6.28318*(x+vec3(.04,.32,.58)));}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
// A tapered, bent metal leaf in a polar sector. Twist makes successive layers interlock.
vec2 iris(vec3 p,float open){
  vec2 res=vec2(100,0);
  for(int j=0;j<3;j++){
    float f=float(j),r=length(p.xy),a=atan(p.y,p.x)+T*(.055+.017*f)+f*.71,
          num=12.+f*6.,sector=6.28318/num,
          v=mod(a+sector*.5,sector)-sector*.5,
          lo=.65+f*.32,hi=lo+(.1+(3.75-f*.42-lo)*smoothstep(0.,7.,BR)*(1.-.85*smoothstep(64.,72.,BR))),
          z=.85*sin((r-lo)*1.05+f*.7+open)*open+f*.24-.3;
    vec3 q=vec3(r-(lo+hi)*.5,r*sin(v)-.23*sin(r*1.8+f+open),p.z-z);
    float w=(.025+.27*sin(sat((r-lo)/(hi-lo))*PI))*(.7+.3*open),
          d=box(q,vec3((hi-lo)*.5,w,.028))*.48;
    if(d<res.x)res=vec2(d,2.+f);
  }
  float d=length(p)-.62;
  if(d<res.x)res=vec2(d,1);
  return res;
}
vec2 map(vec3 p){
  vec2 v=vec2(100,0);
  if(SC==0||SC==3){
    p.xz*=rot(.23*sin(T*.13));p.yz*=rot(.15*sin(T*.17));
    float opening=SC==0?mix(.12,1.25,smoothstep(1.,16.,BR)):1.5+.4*sin(T*.23)+PH*.07;
    v=iris(p,opening);
    if(SC==3){
      float r=length(p.xy),a=atan(p.y,p.x),
            tick=abs(mod(a*72./6.28318+.5,1.)-.5)*r*.0873,
            d=length(vec2(r-4.05,p.z+.65))-.025;
      d=min(d,box(vec3(tick,r-4.13,p.z+.65),vec3(.012,.11,.018)));
      if(d<v.x)v=vec2(d,5);
      // The outer armillary consists of moving, eccentric orbital bands.
      for(int j=0;j<3;j++){
        vec3 q=p;q.xz*=rot(float(j)*1.05+T*.08);q.yz*=rot(float(j)*.6+T*.09);
        float d=length(vec2(length(q.xy)-4.5-float(j)*.4,q.z))-.027;
        if(d<v.x)v=vec2(d,5);
      }
    }
  }else if(SC==1){
    // Endless lamellae. Cell guard prevents marching over a narrow fin.
    float cell=floor((p.x+1.)/2.),x=mod(p.x+1.,2.)-1.,
          h=1.5+.8*sin(p.z*.25+cell*.7+T*.16),
          bend=.55*sin(p.z*.65+T*.23+cell*.45);
    v=vec2(box(vec3(x-bend,p.y-h*.5,p.z),vec3(.032,h*.5,90.))*.55,abs(p.y-h)<.025?6.:2.+mod(cell,3.));
    v.x=min(v.x,1.-abs(x)+.012);
    float d=p.y+.25;
    if(d<v.x)v=vec2(d,0);
  }else if(SC==2){
    // A continuous double helicoid, suspended above a black mirror.
    vec3 q=p;q.xz*=rot(p.y*.8+T*.24);
    float width=1.7+.4*cos(p.y*1.4-T*.3),
          d=box(q,vec3(width,3.6,.038))*.55;
    v=vec2(d,3);
    q=p;q.xz*=rot(-p.y*.8-T*.24+1.57);
    d=box(q,vec3(width,3.6,.038))*.55;
    if(d<v.x)v=vec2(d,4);
    d=length(p.xz)-.1;
    d=max(d,abs(p.y)-3.8);
    if(d<v.x)v=vec2(d,5);
  }else{
    // Orrery: eccentric tilted ribbons carry beads along their engraved tracks.
    for(int j=0;j<7;j++){
      float f=float(j);vec3 q=p;
      q.xz*=rot(f*.52+T*.06);q.yz*=rot(.55*sin(f*1.3+T*.13));
      float r=1.2+f*.47,a=atan(q.y,q.x),
            d=length(vec2(length(q.xy)-r,q.z))-.035;
      if(d<v.x)v=vec2(d,2.+mod(f,3.));
      vec3 bp=vec3(cos(T*(.3+f*.04)+f)*r,sin(T*(.3+f*.04)+f)*r,0);
      d=length(q-bp)-(.12+.07*sin(f*4.)*.5);
      if(d<v.x)v=vec2(d,1);
    }
    float d=length(p)-.7;if(d<v.x)v=vec2(d,5);
  }
  if(SC!=1){
    vec2 q=vec2(length(p.xz)-6.1,abs(p.y+4.1)-.12);
    float d=length(max(q,0.))+min(max(q.x,q.y),0.);
    if(d<v.x)v=vec2(d,0);
  }
  return v;
}
vec3 sky(vec3 d){
  float sun=pow(max(dot(d,normalize(vec3(-.6,.3,-.8))),0.),360.);
  vec3 c=mix(vec3(.012,.026,.045),vec3(.16,.25,.29),sat(d.y*.5+.5));
  c+=vec3(1.,.67,.32)*sun*5.;
  // Broad photographic softboxes reflected in the metal.
  c+=vec3(1.2,1.05,.8)*pow(sat(1.-abs(d.x+.35)*3.),10.)*smoothstep(-.1,.4,d.y)*2.;
  c+=vec3(.1,.6,.9)*pow(max(0.,dot(d,normalize(vec3(1,.15,.4)))),28.)*2.;
  return c;
}
vec3 normal(vec3 p,float e){
  vec3 n=vec3(0);
  for(int i=0;i<4;i++){
    vec3 k=vec3((i==0||i==3)?1.:-1.,i<2?1.:-1.,(i==0||i==2)?1.:-1.);
    n+=k*map(p+k*e).x;
  }
  return normalize(n);
}
vec3 shade(vec3 p,vec3 rd,float id,float dist){
  vec3 n=normal(p,max(.001,dist*.00012)),l=normalize(vec3(-.6,1.,.7)),r=reflect(rd,n);
  float nd=max(dot(n,l),0.),fr=pow(1.-max(dot(n,-rd),0.),5.),ao=0.;
  for(int j=1;j<=3;j++){
    float f=float(j)*.11;ao+=(f-map(p+n*f).x)/exp2(float(j));
  }
  ao=sat(1.-ao*3.);
  float shadow=1.,st=.035;
  for(int j=0;j<22;j++){
    float h=map(p+l*st).x;shadow=min(shadow,12.*h/st);st+=clamp(h,.035,.35);if(st>5.)break;
  }
  shadow=.2+.8*sat(shadow);
  vec3 base=mix(vec3(.035,.24,.29),vec3(.72,.32,.07),sat((id-2.)*.45)),
       ir=film(dot(n,-rd)*1.3+length(p)*.11+T*.025),env=sky(r);
  base=mix(base,ir,SC==2?.34:.14);
  if(id<.5){base=vec3(.008,.014,.019);env*=.025;}
  if(id==1.)base=vec3(.65,.76,.78);
  vec3 c=base*(.04+nd*.8*shadow)*ao;
  c+=env*mix(base,vec3(1),.35)*(.22+.75*fr)*ao;
  c+=vec3(1.6,1.25,.7)*pow(max(dot(normalize(l-rd),n),0.),100.)*2.*shadow;
  if(id>1.5&&id<4.5){
    vec3 tangent=normalize(cross(n,abs(n.y)>.9?vec3(1,0,0):vec3(0,1,0))),halfway=normalize(l-rd);
    float brushed=pow(sat(1.-abs(dot(tangent,halfway))),48.)*pow(max(dot(n,halfway),0.),8.);
    c+=base*brushed*.6*shadow;
  }
  float etch=pow(.5+.5*sin(length(p.xy)*130.+p.z*45.),16.);
  if(id>1.5&&id<4.5)c*=.94+.06*etch;
  if(id==5.)c+=vec3(1.8,.65,.16)*(1.+PH*.7);
  if(id==6.)c+=vec3(.04,.7,.9)*1.3;
  if(id<.5){
    // Moving interference caustics on the museum plinth and the tidal floor.
    float ca=pow(.5+.5*sin(p.x*3.+sin(p.z*2.+T*.3))*sin(p.z*3.7+sin(p.x*2.-T*.23)),14.);
    c+=vec3(.015,.13,.16)*ca*(SC==1?1.:.35);
  }
  if(id==1.)c+=film(T*.03)*(.18+PH*.25);
  return c;
}
void main(){
  T=R.z;BR=T*9./14.;
  float b=BR;
  // Deliberate editing: long introductory shots, quicker intercuts in the finale.
  SHOT=floor(b/4.);
  SC=b<20.?0:b<32.?1:b<44.?2:b<64.?3:0;
  if(b>=52.&&b<64.){SHOT=floor(b/2.);SC=int[6](3,1,4,2,5,3)[int(floor((b-52.)/2.))];}
  if(b>=36.&&b<40.)SC=4;
  if(b>=40.&&b<44.)SC=5;
  float eighth=mod(b*7.,7.);
  PH=exp(-(eighth<3.?eighth:eighth<5.?eighth-3.:eighth-5.)*7.);
  float u=fract(b/4.),angle=T*.10,zoom=1.;
  vec3 ro,ta=vec3(0),up=vec3(0,1,0);
  if(SC==0||SC==3){
    float a=angle+mod(SHOT,3.)*.65;
    ro=vec3(sin(a)*15.5,2.2+1.1*sin(T*.13),cos(a)*16.5);
    if(b<8.)ro=vec3(.4+T*.05,1.8,16.-T*.12);
    if(mod(SHOT,4.)==2.){ro=vec3(2.2,1.,4.6);ta=vec3(.8,.4,0);}
    if(SC==3){float a=(T-68.4444)*.12+.2;ro=vec3(20.*sin(a),4.+sin(T*.1)*2.,20.*cos(a));zoom=.95;}
    if(b>=64.){ro=vec3(0,1.3,17.+(b-64.)*.8);zoom=1.1;}
  }else if(SC==1){
    ro=vec3(T*.17,2.3,-T*.8);ta=ro+vec3(1.,-.7,-5.);
    if(mod(SHOT,3.)==0.){ro.y=5.8;ta=ro+vec3(3.,-3.,-5.);}
  }else{
    ro=vec3(15.*sin(angle),1.5*sin(T*.12),15.*cos(angle));
    if(mod(SHOT,3.)==1.){ro*=.65;ta.y=1.1;}
    if(SC==4){ro*=1.6;ta=vec3(0);}
    up=normalize(vec3(.18*sin(T*.1),1,0));
  }
  vec2 uv=(gl_FragCoord.xy-.5*R.xy)/R.y;
  vec3 fw=normalize(ta-ro),rt=normalize(cross(fw,up)),un=cross(rt,fw),
       rd=normalize(rt*uv.x+un*uv.y+fw*1.7*zoom);
  vec3 col=mix(vec3(.003,.006,.012),vec3(.025,.065,.08),sat(rd.y*.5+.5));
  // Analytic background halo, aperture rays and suspended motes.
  vec3 sd=normalize(vec3(-.6,.3,-.8));
  float halo=pow(max(dot(rd,sd),0.),24.);
  col+=vec3(.36,.12,.025)*halo;
  if(SC==3){
    float a=atan(uv.y,uv.x),r=length(uv),
          rays=pow(.5+.5*sin(a*72.+sin(a*13.+T*.3)),18.);
    col+=vec3(.8,.27,.045)*exp(-r*6.)*(.1+rays*.18);
  }
  float travel=.02,glow=0.;vec2 hit;
  bool found=false;
  for(int i=0;i<148;i++){
    if(SC==5)break;
    hit=map(ro+rd*travel);
    if(hit.x<.0007+travel*.00015){found=true;break;}
    travel+=max(.0005,hit.x*.85);
    if(travel>65.)break;
  }
  if(found){
    vec3 p=ro+rd*travel;
    col=shade(p,rd,hit.y,travel);
    // A single secondary ray gives the polished plinth genuine reflections.
    if(hit.y<.5){
      vec3 n=normal(p,.002),rr=reflect(rd,n);float tr=.04;bool ok=false;vec2 h;
      for(int j=0;j<64;j++){
        h=map(p+rr*tr);
        if(h.x<.002){ok=true;break;}tr+=max(h.x*.9,.002);if(tr>22.)break;
      }
      vec3 ref=ok?shade(p+rr*tr,rr,h.y,tr):vec3(.004,.008,.012);
      col=mix(col,ref,.65*pow(1.-max(dot(-rd,n),0.),.35));
    }
    float fog=1.-exp(-travel*(SC==1?.025:.009));
    col=mix(col,vec3(.07,.13,.15),fog);
  }
  if(SC==5){
    // Perspective-projected luminous pen: a continuous 3D cinquefoil.
    // Analytic line integration avoids a distance-field loop for each segment.
    vec2 previous=vec2(0);float prevz=1.;
    for(int i=0;i<=192;i++){
      float a=float(i)*6.2831853/192.,phase=T*.21,
            r=2.5+.8*cos(5.*a+phase);
      vec3 p=vec3(r*cos(2.*a),r*sin(2.*a),1.4*sin(5.*a+phase));
      p.xz*=rot(T*.17);p.yz*=rot(T*.11);
      vec3 rel=p-ro;
      float z=dot(rel,fw);
      vec2 point=vec2(dot(rel,rt),dot(rel,un))*1.7*zoom/z;
      if(i>0){
        vec2 v=point-previous,w=uv-previous;
        float f=sat(dot(w,v)/max(dot(v,v),1e-8)),d=length(w-v*f),
              energy=.000014/(d*d+.000004)*length(v)*30.;
        vec3 tint=mix(vec3(.04,.6,1.2),vec3(1.5,.5,.08),.5+.5*sin(a*3.+phase));
        col+=tint*energy*(.5+.5*pow(.5+.5*sin(a*7.-T*2.),8.));
      }
      previous=point;prevz=z;
    }
  }
  // Floating dust uses projected points rather than expensive volume steps.
  for(int i=0;i<12;i++){
    float k=float(i),z=fract(k*.618-T*.009),sz=.001+z*.002;
    vec2 p=vec2(sin(k*127.1)*.9,cos(k*97.3)*.6)+vec2(sin(T*.1+k)*.025,z*.1);
    col+=vec3(.6,.4,.17)*exp(-dot(uv-p,uv-p)/(sz*sz))*.4;
  }
  float focus=SC==1?8.:length(ro);
  O=vec4(col,SC==5?0.:sat(abs(travel-focus)*.08));
}
