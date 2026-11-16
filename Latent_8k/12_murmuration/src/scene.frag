#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// MURMURATION: twelve thousand starlings over a flooded marsh at dusk.
// The flock is a metaball field shredded by noise; birds live one per hash cell,
// so the march below costs a few hash lookups per step, never per bird.
// T seconds, BR bars (one per 2 s at 120 BPM), DN nightfall, FAL the falcon attack,
// GTH gathering, SPC spectacle, RST roost, DEN bird density, PS beat pulse.
float T,BR,DN,FAL,FALT,GTH,SPC,RST,DEN,PS,SHW;
vec3 SD;

float sat(float x){return clamp(x,0.,1.);}
mat2 rot(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
float hs(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vn(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+1.),f.x),f.y),f.z);
}
// the falcon's path during the attack, u in 0..1
vec3 falconP(float u){return vec3(7.*sin(u*9.4),10.+3.*sin(u*12.6+1.2),-24.+6.*cos(u*7.1));}
// metaball murmuration field; >1 inside the cloud. The shape changes meaning with the act weights:
// scattered during the gathering, one mass for the spectacle, sunk into the reeds at the roost.
float murm(vec3 p){
  float tt=T*.9;
  vec3 q=p;
  q+=(vec3(vn(p*.13+tt*.04),vn(p*.13+37.),vn(p*.13+71.))-.5)*(1.4+.8*SPC);
  // the spectacle braids the crowd into strands: a height-sheared double scroll
  if(SPC>0.){
    q.z+=24.;
    q.xz*=rot((q.y-10.)*sin(T*.45)*SPC*.3);
    q.z-=24.;
  }
  vec3 c0=vec3(6.*sin(tt*.12),8.5+2.2*sin(tt*.16),-24.-3.*sin(tt*.1)),
       c1=vec3(5.*sin(tt*.09+2.1),8.5+2.4*sin(tt*.2+1.),-23.-3.5*sin(tt*.08+4.)),
       c2=vec3(7.*sin(tt*.07+4.2),8.+2.*sin(tt*.18+.5),-25.-3.*sin(tt*.11+2.));
  // the pour: the flocks drop out of the high sky onto the marsh, in frame,
  // and the falling crowd is a column, not a ball
  float pour=smoothstep(12.,14.,BR)*(1.-smoothstep(20.,26.,BR));
  c0.y+=pour*4.;c1.y+=pour*5.;c2.y+=pour*4.5;
  c0.xz*=1.+GTH*1.2;c1.xz*=1.+GTH*1.6;c2.xz*=1.+GTH*1.4;
  // at the roost the airborne crowd leans down towards the waterline
  c0.y=mix(c0.y,3.,RST*.7);c1.y=mix(c1.y,2.5,RST*.7);c2.y=mix(c2.y,3.5,RST*.7);
  // the spectacle is the summit of the show: higher and fatter than the pour
  c0.y+=SPC*2.5;c1.y+=SPC*2.;c2.y+=SPC*3.;
  float r0=4.6+1.4*sin(tt*.41),r1=4.2+1.3*sin(tt*.34+2.),r2=4.5+1.4*sin(tt*.27+4.);
  r0*=1.-.15*SPC;r1*=1.-.15*SPC;r2*=1.-.15*SPC;
  float f=r0*r0/dot(q-c0,q-c0)+r1*r1/dot(q-c1,q-c1)+r2*r2/dot(q-c2,q-c2);
  if(pour>.3){
    float vc=(q.y-c1.y-4.);
    f+=pour*26./((q.x-c1.x)*(q.x-c1.x)+(q.z-c1.z)*(q.z-c1.z)+vc*vc*.05+1.);
  }
  // at the roost the whole crowd settles into one dark bank along the waterline
  if(RST>0.){
    vec3 qq=q-vec3(0,2.6,-24.);qq.xz*=.22;
    f+=RST*22./dot(qq,qq);
  }
  // a funnel reaches down to the water and sucks itself back up, just before the falcon
  float FN=smoothstep(19.,21.,BR)*(1.-smoothstep(23.,26.,BR));
  if(FN>0.){
    vec3 cf=vec3(4.*sin(tt*.5),6.,-24.);
    float dy=q.y-cf.y;
    f+=FN*48./((q.x-cf.x)*(q.x-cf.x)+(q.z-cf.z)*(q.z-cf.z)+dy*dy*.12+1.);
  }
  // the falcon tears a moving hole, with a wake behind it
  if(FAL>0.){
    vec3 fp=falconP(FALT);
    f-=FAL*60./dot(q-fp,q-fp);
    fp=falconP(FALT-.05);f-=FAL*14./dot(q-fp,q-fp);
    fp=falconP(FALT-.10);f-=FAL*7./dot(q-fp,q-fp);
  }
  return f*(.85+.45*vn(q*.5+tt*.06));
}
// ray against the flock: returns the occluded fraction (starlings are dark against the sky)
float flock(vec3 ro,vec3 rd,float t0,float t1,float stp){
  float m=0.,dt=(t1-t0)/stp;
  for(int i=int(stp);i-->0;){
    float t=t0+dt*(float(i)+.5);
    if(m>.96)break;
    float f=murm(ro+rd*t);
    if(f>1.){
      vec3 p=ro+rd*t;
      float den=pow(sat((f-1.)*3.),1.5)*DEN*exp(-t*.004)*(1.+.4*PS*exp(-fract(BR*4.)*3.));
      // the panic wave: rings of density rolling out from where the falcon passed, with a trough behind them
      if(SHW>0.)den*=1.+SHW*1.4*sin(length(p-falconP(1.))*1.6-(BR-32.)*20.)*exp((32.-BR)*.25)-SHW*.15*exp((32.-BR)*.2);
      // the flock swirls around its own heart; higher layers shear a little more
      p.z+=24.;
      p.xz*=rot(T*.04+(p.y-12.)*.02*sin(T*.11));
      p.z-=24.;
      float S=t<32.?4.:7.;
      vec3 cell=floor(p*S),fp=fract(p*S);
      if(t>10.&&hs(cell+19.)<den){
        vec3 bc=.22+.56*vec3(hs(cell+3.),hs(cell+7.),hs(cell+11.));
        bc+=.09*sin(T*3.+hs(cell)*40.+vec3(0,2.1,4.2));
        // at roost the birds rain down in streaks
        bc.y-=RST*fract(T*.45+hs(cell+23.))*1.4;
        vec3 dd=(fp-bc)*vec3(1.,1.-.55*RST,1.);
        float flap=.5+.5*sin(T*75.+hs(cell)*99.);
        m+=smoothstep(.22,.04,length(dd))*den*flap*(1.-m);
      }else{
        m+=.3*den*dt*(1.-m);
      }
    }
  }
  return m;
}
// dusk sky with a low sun, thin cirrus, and stars as night falls; rl softens the sun when mirrored
vec3 sky(vec3 rd,float rl){
  float y=max(rd.y,0.),py=pow(sat(y*1.6+.02),.55);
  vec3 c=mix(mix(vec3(.72,.30,.12),vec3(.035,.05,.10),py),mix(vec3(.08,.045,.08),vec3(.006,.01,.024),py),DN);
  float s=max(dot(rd,SD),0.);
  c+=vec3(1.,.55,.28)*(pow(s,700.)*1.6+pow(s,32.)*.14+pow(s,5.)*.05)*(1.-DN*.9)*rl;
  if(DN>.25){
    vec3 g=rd*160.,cell=floor(g);float h=hs(cell);
    c+=vec3(.8,.85,1.)*smoothstep(.1,.01,length(fract(g)-.5))*sat((h-.996)*250.)*(DN-.25)*1.3*(.6+.4*sin(T*3.+h*80.));
  }
  float cir=vn(vec3(rd.x/(y+.15)*1.3,rd.z/(y+.15)*1.3,5.))-.5;
  c+=vec3(1.,.6,.4)*sat(cir)*.07*sat(y*4.)*(1.-DN)*(.3+.7*s*s);
  return c;
}
// the reed bed: a dark fringe standing in the water; it grows when the birds come down to roost
float reeds(vec3 rd){
  float u=rd.x/max(-rd.z,.02);
  float win=smoothstep(1.7,1.2,abs(u));
  if(win<=0.||rd.y<0.)return 0.;
  float top=.05+.05*vn(vec3(u*2.2,3.,7.))+.025*vn(vec3(u*9.,8.,2.));
  top*=1.+RST*1.4;
  if(rd.y>top)return 0.;
    float blades=.8+.2*hs(vec3(floor(u*260.),floor(rd.y*700.),4.));
  return mix(.3,.95,smoothstep(top,top*.5,rd.y)*blades)*win*mix(1.,.75,DN);
}
vec3 shade(vec3 ro,vec3 rd,bool full){
  vec3 c;
  if(rd.y<0.){
    // still water: reflect the sky and the flock, rippled
    float tw=-ro.y/rd.y;
    vec3 hit=ro+rd*tw;
    vec3 rr=vec3(rd.x,-rd.y,rd.z);
    rr.xz+=((vn(hit*.4+T*.12)-.5)+(vn(hit*1.1-T*.2)-.5)*.4)*.03;
    vec3 cs=sky(rr,.35*(1.-DN*.75));
    cs*=1.-flock(vec3(hit.x,.02,hit.z),rr,5.,70.,full?20.:12.)*.85;
    cs*=1.-reeds(rr)*.6;
    c=mix(cs*.6,vec3(.008,.02,.03),sat(-rd.y*1.8)*.65);
  }else{
    c=sky(rd,1.);
    c*=1.-flock(ro,rd,6.,80.,full?32.:20.);
    c*=1.-reeds(rd)*.85;
  }
  // the dart of the falcon
  if(FAL>.01&&rd.y>0.){
    // the falcon: a dart streaked along its own velocity, tapering to the head
    vec3 m0=normalize(falconP(FALT-.03)-ro),sv=rd-m0,ax=normalize(falconP(FALT+.03)-ro)-m0;
    float al=dot(sv,ax)/dot(ax,ax);
    float dd=length(sv-ax*sat(al));
    c*=1.-smoothstep(.028,.004,dd)*smoothstep(0.,.15,al)*smoothstep(1.,.85,al)*FAL*1.2;
  }
  return c;
}
void main(){
  T=R.z;BR=T*.5;
  DN=smoothstep(56.,63.5,BR);
  FAL=smoothstep(23.8,24.4,BR)*(1.-smoothstep(30.6,31.6,BR));
  FALT=sat((BR-24.)/7.);
  GTH=1.-smoothstep(6.,10.,BR);
  SPC=smoothstep(31.4,32.4,BR)*(1.-smoothstep(54.,56.5,BR));
  SHW=smoothstep(31.6,32.4,BR)*(1.-smoothstep(38.,41.,BR));
  RST=smoothstep(55.5,59.,BR);
  DEN=smoothstep(1.5,5.,BR)*(1.-smoothstep(61.5,63.8,BR))*(.45+.55*smoothstep(6.,12.,BR))*(1.+.9*SPC);
  PS=SPC;
  SD=normalize(vec3(-.12,max(.1-.0006*T,.02),-1.));
  vec2 uv=(gl_FragCoord.xy*2.-R.xy)/R.y;
  // the camera drifts slowly across the water for the whole film, and pushes in for the spectacle
  float ca=-.44+.0016*T+.05*sin(T*.021),ce=.12+.04*sin(T*.017)+.06*SPC;
  vec3 ro=vec3(0,1.7+.3*sin(T*.05),0),fw=normalize(vec3(sin(ca),ce,-cos(ca))),
       r=normalize(cross(fw,vec3(0,1,0))),col=vec3(0);
  float z0=1.9+.2*SPC+.05*sin(T*.006);
  for(int aa=0;aa<2;aa++){
    vec2 o=(float(aa)-.25)*vec2(.7,.5)/R.y;
    col+=shade(ro,normalize(fw*z0+r*(uv.x+o.x)+cross(r,fw)*(uv.y+o.y)),R.x>1500.);
  }
  O=vec4(clamp(col*.5,0.,4.),1);
}
