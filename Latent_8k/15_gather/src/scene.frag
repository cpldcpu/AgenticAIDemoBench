#version 300 es
precision highp float;
// GATHER: a night shift in a glassworks. Six shots, cut every 14 bars.
// 0 furnace hall  1 the gather  2 the pipe, turning  3 the annealer, a grid of
// bowls cooling  4 the showroom, finished glass under one lamp  5 the yard at dawn.
// 150 BPM, one bar = 1.6 s. The same bar clock drives the music.
uniform vec4 R;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float sm(float a,float b,float k){float h=sat(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1.-h);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}

// a finished piece of glass: bowl, bottle or sphere, picked by id
float ware(vec3 p,float id,float sc){
  p/=sc;
  float k=mod(id,3.);
  float d=length(vec3(p.x,p.y*1.6,p.z))-.8;          // bowl
  if(k>1.)d=max(length(p.xz)-.28,abs(p.y)-.9);        // bottle
  else if(k>.5)d=length(p)-.55;                        // sphere
  d+=.02*sin(atan(p.x,p.z)*8.+id);
  return d*sc;
}

float map(vec3 p,float br,int S){
  float d=p.y+1.;
  if(S==0){
    // furnace hall: walls close in, a row of big pots, fire in each
    d=min(d,1.6-abs(p.x));
    d=min(d,2.2-p.y);
    d=min(d,8.-abs(p.z));
    vec3 q=vec3(p.x,p.y+.1,mod(p.z+1.5,2.4)-1.2);
    d=min(d,box(q,vec3(.55,.45,.55)));
    float pot=length(q.xz)-.3;
    d=min(d,max(pot,q.y-.35));
    // molten glass: a raised disc in each pot, brighter than the iron
    d=min(d,max(length(q.xz)-.22,abs(q.y-.62)-.05));
  }else if(S==1){
    // the bench: one gather on a pipe, the pipe clearly crossing the frame
    vec3 v=p-vec3(0,.2,0);v.xz*=rot(br*.9);
    // the gather is worked through this shot: sphere, then neck, then blown wide
    float w=sat((br-14.)/8.);
    float g=length(vec3(v.x,v.y*(1.+2.4*w),v.z))-.4-.7*w;
    g+=.03*sin(atan(v.x,v.z)*(8.+6.*w));
    // a neck rises out of the top as it is pulled
    g=sm(g,max(length(v.xz)-(.06+.12*w),abs(v.y-.35)-.45*w),.1);
    d=min(d,g);
    // pipe: a long thin cylinder on the y axis of the gather, running off to the right
    d=min(d,max(length(p.yz-vec2(.2,0))-.025, -p.x));
    d=min(d,max(length(p.yz-vec2(.2,0))-.025, p.x-2.4));
  }else if(S==2){
    // the turning yard: a ring of gathers, each on its own pipe, all spinning
    for(int i=0;i<6;i++){
      float a=float(i)*1.047+br*.5;
      vec3 c=vec3(cos(a)*1.6,.1,sin(a)*1.6);
      vec3 v=p-c;v.xz*=rot(a);
      d=min(d,length(v)-.32);
      d=min(d,max(length(v.yz)-.02,abs(v.x)-.8));
    }
  }else if(S==3){
    // the annealer: shelves of bowls receding, a corridor of them
    d=min(d,1.8-abs(p.x));
    d=min(d,2.4-p.y);
    vec3 q=vec3(p.x,p.y,mod(p.z,1.6)-.8);
    d=min(d,ware(q-vec3(0,.15,0),floor(p.z),1.));
    d=min(d,box(q-vec3(0,-.5,0),vec3(1.4,.08,.6)));
  }else if(S==4){
    // showroom: finished ware on plinths, one lamp
    for(int i=0;i<6;i++){
      float a=float(i)*1.047;
      vec3 c=vec3(cos(a)*1.8,-.2,sin(a)*1.8);
      d=min(d,ware(p-c,float(i),1.));
      d=min(d,box(p-c-vec3(0,-.8,0),vec3(.2,.5,.2)));
    }
  }else{
    // the yard at dawn: rows of crated glass, the sky
    vec3 q=p;q.x=mod(q.x,1.6)-.8;
    d=min(d,box(q-vec3(0,-.4,0),vec3(.5,.4,.5)));
    d=min(d,4.-p.y);
  }
  return d;
}

vec3 sky(vec3 rd,int S,float br){
  vec3 c=vec3(.02,.014,.012);
  if(S==0){
    // fire in the wall: a row of mouths
    float m=exp(-abs(fract(rd.x*2.)-.5)*18.)*step(rd.z,0.)*step(abs(rd.y-.1),.3);
    c+=vec3(1.,.4,.05)*m*1.6;
  }else if(S==5){
    c=mix(vec3(.05,.06,.1),vec3(.7,.45,.3),sat(rd.y*2.+.2));
    c+=vec3(1.,.6,.3)*exp(-length(rd.xy-vec2(.3,.2))*8.)*.8;
  }else if(S==4){
    c+=vec3(1.,.9,.7)*exp(-length(rd.xy-vec2(0,.4))*10.)*.6;
  }else{
    c+=vec3(.5,.2,.05)*exp(-abs(rd.y)*6.)*.2;
  }
  return c;
}

void main(){
  float T=R.z,br=T/1.6;
  int S=int(clamp(floor(br/14.),0.,5.));
  vec2 q=(gl_FragCoord.xy*2.-R.xy)/R.y;
  // a camera per shot, drifting forward so the cut is a new place, not a new angle
  // one fixed camera per shot, far enough back that the subject is in front of it
  vec3 ro=vec3(float[6](0.,1.4,0.,0.,0.,-1.2)[S],
               float[6](1.1,.9,2.6,1.0,1.6,.7)[S],
               float[6](-4.,2.2,0.,-2.5,3.2,-2.)[S]);
  vec3 ta=vec3(float[6](0.,0.,0.,0.,0.,0.)[S],
               float[6](.3,.3,.2,.3,.2,.2)[S],
               float[6](0.,0.,0.,2.,0.,1.)[S]);
  // a slow push and a rise through each shot, so a cut is not a frozen frame
  float u=fract(br/14.);
  ro+=vec3(sin(br*.15)*.12,u*.35,(u-.5)*.8);
  vec3 f=normalize(ta-ro),ri=normalize(cross(vec3(0,1,0),f)),up=cross(f,ri);
  vec3 rd=normalize(f+q.x*ri+q.y*up);
  float t=0.,d;vec3 p;bool hit=false;
  for(int i=0;i<70;i++){
    p=ro+rd*t;d=map(p,br,S);
    if(d<.004){hit=true;break;}
    if((t+=d)>24.)break;
  }
  vec3 col=sky(rd,S,br);
  if(hit){
    float e=.006;
    vec3 n=normalize(vec3(map(p+vec3(e,0,0),br,S)-map(p-vec3(e,0,0),br,S),
                          map(p+vec3(0,e,0),br,S)-map(p-vec3(0,e,0),br,S),
                          map(p+vec3(0,0,e),br,S)-map(p-vec3(0,0,e),br,S)));
    float nd=sat(dot(n,normalize(vec3(-.3,.8,.4))));
    // the molten surface in a pot is a thin disc near y=.5; it should burn, not reflect
    float melt=S==0&&abs(p.y-.52)<.1?1.:0.;
    float heat=melt>0.?.0:(S<2?1.:S==2?.7:S==3?sat(1.-(p.z+6.)/12.):.05);
    vec3 glow=mix(vec3(1.,.4,.05),vec3(.55,.75,1.),1.-heat);
    float fr=pow(1.-sat(dot(n,-rd)),3.);
    // one reflection march: the glass shows the room, not a flat colour
    vec3 rf=reflect(rd,n),rp=p+n*.03;float rt=0.;bool rh=false;
    for(int j=0;j<28;j++){float rd2=map(rp+rf*rt,br,S);if(rd2<.01){rh=true;break;}if((rt+=rd2)>16.)break;}
    vec3 refl=sky(rf,S,br);
    if(rh)refl=mix(refl,glow,heat*.6)+vec3(.05,.04,.03);
    col=refl*(fr*.9+.08);
    col+=glow*heat*(.1+.35*nd);
    col+=vec3(1.,.95,.85)*pow(nd,40.)*.55;
    col+=vec3(.03,.025,.02)*(1.-heat);
    col+=vec3(1.,.55,.08)*melt*1.6;
  }
  O=vec4(max(col,0.),sat(t*.02));
}
