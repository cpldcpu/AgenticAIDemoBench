#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
float T; int S;
float capsule(vec3 p,vec3 a,vec3 b,float radius){vec3 v=b-a,w=p-a;return length(w-v*clamp(dot(w,v)/dot(v,v),0.,1.))-radius;}
float canopy(vec2 p){float a=atan(p.y,p.x),r=length(p);return 3.4-.072*r*r+.55*exp(-r*r*.12)+.24*sin(a*12.+T*.8)*pow(r/5.8,2.)+.16*sin(p.x*.9+T*.7)*sin(p.y*.8);}

mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
// Inverse deformation of a suspended textile; conservative stepping handles the slope.
vec3 fabric(vec3 p,float id){
 p.x-=id*3.25;
 p.z+=abs(id)*1.1;
 p.y-=S==4?1.2:0.;
 p.xz=rot(.22*p.y+id*.32+.12*sin(T*.23))*p.xz;
 p.z-=.65*sin(p.x*2.+T*.65+id)+.15*sin(p.y*3.-T*.8+id);
 p.z-=.10*p.y*p.y;
 return p;
}
vec2 field(vec3 p){
 vec2 d=vec2(p.y+3.25,0.);
 if(S==0 || S==5){
  float grow=S==0?smoothstep(0.,12.,T):1.-smoothstep(112.,125.,T);
  vec3 q=p; if(S==5)q.y+=1.25*smoothstep(112.,120.,T); q.y-=.45*sin(q.x*1.8-T*.7)*grow; q.z-=.32*cos(q.x*1.4+T*.4)*grow;
  float strand=10.;
  vec2 braid=rot(p.x*38.-T)*q.yz;
  for(int j=0;j<3;j++){vec2 off=.026*vec2(cos(float(j)*2.0944),sin(float(j)*2.0944));strand=min(strand,length(braid-off)-.023);}

  d=vec2(min(d.x,max(strand,S==5?max(-3.8-p.x,p.x-7.):abs(p.x)-7.)),1.);
  if(d.x==p.y+3.25)d.y=0.;
  // The final thread returns to a ceramic bobbin instead of simply vanishing.
  if(S==5){
   vec3 spool=p-vec3(-3.8,-2.17,0.);
   float reveal=smoothstep(112.,116.,T);
   float roll=max(length(spool.xy)-.92*reveal,abs(spool.z)-.55*reveal);
   float flange=max(length(spool.xy)-1.08*reveal,abs(abs(spool.z)-.59*reveal)-.055*reveal);
   flange=max(flange,.17*reveal-length(spool.xy));
   if(roll<d.x)d=vec2(roll,7.);
   if(flange<d.x)d=vec2(flange,8.);
  }
 }else if(S==6){
  float radius=5.8*smoothstep(95.5,99.,T)*(1.-.92*smoothstep(109.,112.,T));
  float dd=max(abs(p.y-canopy(p.xz))-.028,length(p.xz)-radius*(1.-.025*cos(atan(p.z,p.x)*12.)));
  if(dd<d.x)d=vec2(dd,4.);
  float angle=6.2831853/12.;
  float sector=floor(atan(p.z,p.x)/angle+.5)*angle;
  vec2 rim=vec2(cos(sector),sin(sector))*radius;
  vec3 top=vec3(rim.x,canopy(rim),rim.y);
  float cord=capsule(p,vec3(.25*sin(T),-2.5,.2*cos(T)),top,.018);
  if(cord<d.x)d=vec2(cord,2.);
 }else if(S==1){
  vec3 q=p; float id=floor(q.x/.22+.5);q.x-=id*.22;
  q.z-=.09*cos(p.y*14.28+id*3.14159);
  float warp=max(length(q.xz)-.047,abs(p.y)-2.8);
  warp=max(warp,abs(p.x)-4.5);
  vec3 v=p; float row=floor(v.y/.22+.5);v.y-=row*.22;v.z+=.09*cos(p.x*14.28+row*3.14159);
  float weft=max(length(v.yz)-.05,abs(p.x)-4.5);
  weft=max(weft,p.y-mix(-2.8,2.8,smoothstep(16.,38.,T)));
  float dd=min(warp,weft);
  if(dd<d.x)d=vec2(dd,warp<weft?2.:1.);
  float frame=min(box(p-vec3(0.,3.,0.),vec3(4.8,.11,.16)),box(p+vec3(0.,3.,0.),vec3(4.8,.11,.16)));
  frame=min(frame,box(vec3(abs(p.x)-4.7,p.y,p.z),vec3(.09,3.1,.14)));
  if(frame<d.x)d=vec2(frame,6.);
  vec3 shuttle=p-vec3(3.9*sin(T*6.2831853),mix(-2.8,2.8,smoothstep(16.,38.,T)),.2);
  float shuttleD=box(shuttle,vec3(.48,.06,.12));
  if(shuttleD<d.x)d=vec2(shuttleD,1.);
 }else{
  for(int j=-2;j<=2;j++){
   if(S!=4 && j!=0)continue;
   float id=float(j);vec3 q=fabric(p,id);
   float width=(S==4?1.65:3.5)*(1.-.12*sin(q.y*.7));
   float edge=width-abs(q.x);
   if(S==3){
    float strip=floor(q.x*7./3.14159265+.5);
    q.z+=smoothstep(66.,78.,T)*.5*sin(strip*7.1+T*2.+q.y)*pow(clamp((q.y+2.65)/5.3,0.,1.),2.);
   }
   float tear=S==3?smoothstep(64.,78.,T):S==4?0.:0.;
   float split=abs(sin(q.x*7.+.3*sin(q.y*3.)))-tear*.72;
   float dd=max(abs(q.z)-.025,max(abs(q.y)-(S==4?4.1:2.65),-edge));
   dd=max(dd,-split*.17);
   // Fine loose warp ends continue below the hem, swaying independently.
   float bottom=S==4?4.1:2.65;
   vec3 fringe=q;float thread=floor(fringe.x*24.+.5);
   fringe.x-=thread/24.+.025*sin(T*2.+thread+q.y*6.);
   float tail=.15+.18*(.5+.5*sin(thread*13.));
   float loose=max(length(fringe.xz)-.009,max(q.y+bottom,-q.y-bottom-tail));
   loose=max(loose,-edge);
   dd=min(dd,loose);
   if(dd<d.x)d=vec2(dd,3.+id*.1);
  }
 }
 return d;
}
vec3 shade(vec3 ro,vec3 rd,out float depth){
 depth=40.;
 vec3 bg=vec3(.57,.53,.47)*(1.-.28*max(rd.y,0.));
 if(S==3)bg=vec3(.035,.029,.035);
 float t=0.;vec2 h;
 for(int i=0;i<200;i++){h=field(ro+rd*t);if(h.x<.0015 || t>35.)break;t+=max(h.x*.32,.001);}
 if(t>35. || h.x>=.0015){
  t=(-3.25-ro.y)/rd.y;
  if(t<0. || t>500.)return bg;
  h=vec2(0.);
 }
 depth=t;
 vec3 p=ro+rd*t,n=vec3(0.);
 for(int i=0;i<4;i++){vec3 e=.0015*(2.*vec3(float((i+3)/2%2),float(i/2%2),float(i%2))-1.);n+=e*field(p+e).x;}
 n=normalize(n);
 vec3 light=normalize(vec3(-.6,1.,-.8));
 float shadow=1.,a=.03;
 for(int i=0;i<24;i++){float dd=field(p+light*a).x;shadow=min(shadow,12.*dd/a);a+=clamp(dd,.035,.35);}
 shadow=clamp(shadow,.16,1.);
 float occlusion=0.;
 for(int j=1;j<=4;j++){float offset=float(j)*.075;occlusion+=(offset-field(p+n*offset).x)/exp2(float(j));}
 float ao=clamp(1.-occlusion*4.,.2,1.);
 vec3 color=vec3(.73,.69,.62);
 float fiber=1.; float silk=0.;
 if(h.y>.5 && h.y<5.){
  vec3 q=p;
  if(h.y>2.5 && S!=6){float id=S==4?clamp(floor(p.x/3.25+.5),-2.,2.):0.;q=fabric(p,id);}
  if(S==6){q=vec3(atan(p.z,p.x)*3.,length(p.xz),p.y);}
  float check=sin(q.x*180.)*sin(q.y*180.);
  float detail=1.-smoothstep(.5,2.5,max(fwidth(q.x*180.),fwidth(q.y*180.)));
  vec3 fuzz=vec3(cos(q.x*180.)*sin(q.y*180.),sin(q.x*180.)*cos(q.y*180.),0.);
  n=normalize(n+fuzz*.13*detail);
  silk=pow(max(dot(reflect(rd,n),light),0.),24.);
  fiber=.82+.18*check;
  float red=h.y<1.5?1.:h.y<2.5?0.:smoothstep(.12,.16,cos(q.x*1.5+q.y*.5));
  if(S==6)red=smoothstep(-.06,.06,cos(q.x*4.));
  color=mix(vec3(.87,.81,.69),vec3(.43,.008,.035),red);
  // Close-range fibre twist, filtered out as the pixel footprint grows.
  float filt=detail;
  color*=mix(1.,fiber,filt);
  if(h.y>2.5){
   float diamond=abs(fract((q.x+q.y)*3.)-.5)+abs(fract((q.x-q.y)*3.)-.5);
   float brocade=smoothstep(.34,.37,diamond)*(1.-smoothstep(.41,.44,diamond));
   color=mix(color,color*1.5,brocade*.45);
   float seam=1.-smoothstep(.012,.035,abs(sin(q.x*(S==6?4.:1.5)+ (S==6?0.:q.y*.5))));
   float stitch=smoothstep(.3,.5,sin(q.y*90.));
   color=mix(color,vec3(.92,.76,.52),seam*stitch*.65);
  }
 }
 if(h.y>5.)color=vec3(.035,.028,.03);
 if(h.y>6.5){
  color=h.y<7.5?vec3(.43,.008,.035):vec3(.86,.8,.67);
  if(h.y<7.5){
   float ridge=.5+.5*sin(p.z*190.+atan(p.y+2.17,p.x+3.8)*2.);
   color*=.6+.4*ridge;
  }else silk=pow(max(dot(reflect(rd,n),light),0.),48.);
 }
 float diffuse=max(dot(n,light),0.);
 float sheen=pow(1.-abs(dot(n,-rd)),3.);
 float rim=pow(max(dot(n,normalize(vec3(1.,.5,1.))),0.),2.);
 vec3 col=color*(.13*ao+diffuse*shadow*1.8)+vec3(.85,.72,.57)*sheen*.42+color*rim*.45;
 col+=vec3(.45,.32,.25)*silk*shadow*.28;
 col+=color*.16*pow(max(dot(rd,light),0.),5.);
 if(h.y>2.5 && h.y<5.){
  float transmission=pow(max(dot(-n,light),0.),2.);
  col+=color*transmission*.55;
 }
 // Narrow studio softbox reflection gives the floor a grounded, satin finish.
 if(h.y<.5){vec3 reflected=reflect(rd,n);col+=.09*exp(-pow((reflected.x+.4)*3.,2.)-pow((reflected.z+.6)*2.,2.))*shadow;}

 if(h.y<.5)col*=.88;
 return mix(col,bg,1.-exp(-.009*t));
}
void main(){
 T=R.z;S=T<16.?0:T<40.?1:T<64.?2:T<80.?3:T<96.?4:T<112.?6:5;
 vec2 uv=(2.*gl_FragCoord.xy-R.xy)/R.y;
 vec3 ro,ta=vec3(0.);
 float local=mod(T,8.)/8.;
 if(S==0){ro=vec3(1.2*sin(T*.13),.2+smoothstep(5.,14.,T),1.1+5.*smoothstep(5.,14.,T));ta=vec3(0.,0.,0.);}
 else if(S==1){
  float shot=floor((T-16.)/8.);
  ro=shot<1.?vec3(1.2,.1,1.6+local):shot<2.?vec3(5.,2.,6.):vec3(-1.,.5,8.-local);
 }else if(S==2){
  if(T<48.)ro=vec3(4.*sin((T-40.)*.09),1.2,8.);
  else if(T<56.){ro=vec3(-2.2+local,.2,2.8);ta=vec3(.3,0.,.5);}
  else {ro=vec3(2.,5.5,7.);ta=vec3(0.,0.,.5);}
 }
 else if(S==3){ro=vec3(-4.+local,1.,6.);}
 else if(S==4){
  float shot=floor((T-80.)/8.);
  ro=shot<1.?vec3(10.,3.,12.):shot<2.?vec3(-7.+local*3.,.2,5.):shot<3.?vec3(1.,7.,14.):vec3(10.-local*3.,1.5,12.);
  ta=vec3(0.,.7,0.);
 }else if(S==6){
  float a=(T-96.)*.13;
  if(T<104.)ro=vec3(10.*cos(a),5.5,10.*sin(a)+8.);
  else ro=vec3(8.*cos(a),-1.7,8.*sin(a));
  ta=vec3(0.,1.,0.);
 }else ro=vec3(0.,1.5,7.);
 vec3 f=normalize(ta-ro),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec3 col=vec3(0.);float depth=0.;
 for(int aa=0;aa<4;aa++){
  vec2 sub=uv+(vec2(float(aa%2),float(aa/2))-.5)/R.y;
  vec3 rd=normalize(f*1.65+r*sub.x+u*sub.y);
  float d;col+=shade(ro,rd,d)*.25;depth+=d*.25;
 }
 // World-space cotton lint: perspective, depth occlusion and a soft defocus halo.
 vec3 centerRay=normalize(f*1.65+r*uv.x+u*uv.y);
 for(int k=0;k<28;k++){
  float seed=float(k);
  vec3 mote=vec3(sin(seed*127.1)*7.,mod(seed*.73+T*.075,7.)-2.5,cos(seed*71.7)*5.);
  mote.x+=.22*sin(T*.4+seed);mote.z+=.2*cos(T*.3+seed);
  vec3 delta=mote-ro;float along=dot(delta,centerRay);
  if(along>0. && along<depth){
   float distanceToRay=length(delta-centerRay*along);
   float size=.012+.004*abs(along-length(ta-ro));
   col+=vec3(.15,.12,.085)*exp(-distanceToRay*distanceToRay/(size*size))*.4;
  }
 }
 float focus=length(ta-ro);
 float blur=clamp(abs(depth-focus)/max(depth,.1)*9.,0.,8.);
 if(!((S==0&&T<8.)||(S==1&&T<24.)||(S==2&&T>=48.&&T<56.)))blur=0.;
 O=vec4(col,blur);
}
