#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
const float tau=6.2831853;
float chip;
float hash(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float clouds(vec2 p){return noise(p)*.55+noise(p*2.04+.7)*.28+noise(p*4.13+2.3)*.17;}
float band(float d,float softness){return 1.-smoothstep(-softness,softness,d);}
float ring(vec2 p,float r){return length(p)-r;}
float damage(vec3 p){
  vec3 q=(p-vec3(-.19,1.052,.59))*vec3(1.,1.4,.9);
  return length(q)-(.016+chip*(.138+.011*sin(p.x*56.)*sin(p.y*87.)));
}
vec2 cup(vec3 p){
  float radial=length(p.xz),radius=.54+.072*clamp(p.y,0.,1.);
  vec2 profile=vec2(radial-radius,abs(p.y-.52)-.465);
  float shell=length(max(profile,0.))+min(max(profile.x,profile.y),0.)-.038;
  shell=max(shell,min(radius-.032-radial,p.y-.07));
  float lip=length(vec2(radial-.617,p.y-1.01))-.035;
  float cut=damage(p);
  vec2 hit=lip<shell?vec2(max(lip,-cut),2):vec2(max(shell,-cut),1);
  if(max(shell,-cut)<hit.x)hit=vec2(max(shell,-cut),1);
  vec2 h=(p.xy-vec2(.64,.55))/vec2(.38,.34);
  float handle=max(length(vec2((length(h)-1.)*.34,p.z))-.062,.585-p.x);
  if(handle<hit.x)hit=vec2(handle,1);
  float foot=length(vec2(radial-.515,p.y-.055))-.038;
  if(foot<hit.x)hit=vec2(foot,2);
  float tea=max(radial-.557,abs(p.y-.828)-.005);
  if(tea<hit.x)hit=vec2(tea,3);
  return hit;
}
vec3 normal(vec3 p){
  vec2 e=vec2(.0014,0);return normalize(vec3(cup(p+e.xyy).x-cup(p-e.xyy).x,cup(p+e.yxy).x-cup(p-e.yxy).x,cup(p+e.yyx).x-cup(p-e.yyx).x));
}
// Several city elevations stand behind the wet pane, each at its own depth.
vec3 street(vec3 ro,vec3 rd,float t,float warmth){
  vec2 skyUV=rd.xy/max(.15,-rd.z);
  float cloud=clouds(skyUV*vec2(2.4,5.)+vec2(t*.018,0));
  vec3 sky=mix(vec3(.32,.52,.56),vec3(.033,.093,.155),smoothstep(-.1,1.1,skyUV.y)+.53*(cloud-.5));
  sky=mix(sky,mix(vec3(1.34,.61,.25),vec3(.29,.37,.58),smoothstep(.03,.9,skyUV.y)),warmth*.74);
  for(int i=0;i<3;i++){
    float layer=float(i),depth=-34.+layer*10.;
    vec2 q=(ro+rd*((depth-ro.z)/rd.z)).xy;
    float width=4.8-layer*.56,id=floor(q.x/width),x=fract(q.x/width);
    float rand=hash(vec2(id,layer+7.)),roof=-1.6+rand*3.5+(2.-layer)*.7;
    float ridge=roof+.28*(1.-abs(x*2.-1.));
    bool chimney=abs(x-.24)<.041&&q.y<roof+.85;
    bool aerial=(abs(x-.71)<.003&&q.y<roof+1.2)||(abs(x-.71)<.061&&abs(q.y-roof-.96)<.018);
    if(q.y<ridge||chimney||aerial){
      vec3 brick=mix(vec3(.053,.10,.12),vec3(.26,.115,.075),rand*.83+warmth*.13);
      vec2 tile=vec2(x*5.,(q.y-roof)/.83);
      vec2 cell=fract(tile);float tileId=hash(floor(tile)+vec2(id*17.,layer*34.));
      float mortar=step(.955,fract(q.y*7.4))*step(.03,cell.y);
      brick*=.87+.13*noise(q*vec2(3,8))+.10*mortar;
      if(cell.x>.18&&cell.x<.79&&cell.y>.21&&cell.y<.79&&q.y<roof-.24){
        brick=mix(vec3(.045,.09,.11),vec3(1.25,.53,.17),smoothstep(.69,.86,tileId));
        if(abs(cell.x-.48)<.036||abs(cell.y-.52)<.033)brick*=.37;
      }
      if(abs(q.y-ridge)<.060)brick*=1.8;
      sky=mix(brick,sky, .20+(2.-layer)*.19);
    }
  }
  return sky;
}
// Droplets live on the glass in world space. A thin tail follows the moving bead.
vec3 drops(vec2 pos,float time){
  vec2 cell=floor(pos);float seed=hash(cell);
  vec2 q=fract(pos)-.5;q.x-=(seed-.5)*.62;
  float level=.32*sin(time*(.36+seed)+seed*50.);
  q.y-=level;q.x+=.019*sin((q.y+level)*26.+seed*17.);
  vec2 v=q*vec2(1.,1.55);
  float radius=.047+.092*seed,m=band(length(v)-radius,.014)*step(.29,seed);
  float track=exp(-abs(q.x)*55.)*smoothstep(0.,.045,q.y)*(1.-smoothstep(.10,.32,q.y))*step(.58,seed);
  return vec3(v*m/radius,m+.22*track);
}
vec3 windowView(vec3 ro,vec3 rd,float t,float warmth){
  vec2 q=(ro+rd*((-1.25-ro.z)/rd.z)).xy;
  float wetTime=t-2.*max(0.,t-34.);
  vec3 bead=drops(q*vec2(5.,2.7),wetTime)+.62*drops(q*vec2(12.,8.)+5.1,wetTime*.74);
  vec3 view=normalize(rd+vec3(bead.xy*.095,0));
  // Finite aperture while focus is on the enamel. Rack focus to the rain at the cut.
  float blur=mix(.0032,.0012,step(12.,t)*(1.-step(21.,t)));
  vec3 city=vec3(0);
  for(int j=0;j<5;j++){
    float a=float(j)*2.4;
    city+=street(ro,view+vec3(cos(a),sin(a),0)*blur*sqrt(float(j)),t,warmth)*.2;
  }
  city=mix(city,vec3(.47,.64,.64),.06+.11*clouds(q*vec2(4,9)));
  city+=vec3(.76,.83,.80)*bead.z*pow(max(0.,dot(normalize(vec3(bead.xy,.7)),normalize(vec3(-.6,.8,.3)))),5.);
  city*=1.-.22*clamp(bead.z,0.,1.);
  // Worn, putty-glazed sash, including the shadow from the raised moulding.
  float gap=min(min(abs(q.x+1.66),abs(q.x-1.47)),min(abs(q.y-.09),abs(q.y-1.91)));
  float shadow=exp(-gap*14.);city*=1.-.37*shadow;
  if(gap<.069||q.y<.075){
    float bevel=smoothstep(.045,.066,gap),grain=noise(q*vec2(83.,67.));
    city=mix(vec3(.084,.165,.159),vec3(.55,.54,.42),bevel)*(.75+.25*grain);
    city+=.16*exp(-abs(gap-.034)*340.);
  }
  return city;
}
vec3 sill(vec3 p,float dark){
  float grain=clouds(p.xz*vec2(1.8,31.)+.65*noise(p.xz*2.));
  float scratch=pow(noise(p.xz*vec2(6.,75.)),10.);
  vec3 wood=mix(vec3(.09,.145,.125),vec3(.29,.32,.22),grain);
  wood=mix(wood,vec3(.43,.31,.16),smoothstep(.67,.86,grain)*.66+scratch*.37);
  float shadow=exp(-dot((p.xz-vec2(.22,.19))*vec2(.93,1.45),(p.xz-vec2(.22,.19))*vec2(.93,1.45))*1.3);
  float contact=exp(-max(0.,length(p.xz)-.49)*9.);
  float frameShadow=exp(-abs(p.x+p.z*.54+1.05)*11.)+.7*exp(-abs(p.x+p.z*.54-2.)*11.);
  wood*=(1.-.38*shadow)*(1.-.72*contact)*(1.-.22*frameShadow);
  float edge=smoothstep(.93,.96,p.z);
  wood=mix(wood,wood*.30+vec3(.03,.035,.022),edge);
  wood+=vec3(.20,.17,.10)*exp(-abs(p.z-.931)*145.);
  return mix(wood,vec3(.008,.013,.016)*(.72+.28*grain),dark);
}
vec3 environment(vec3 d,float dark,float warmth){
  vec2 p=d.xy/max(.13,abs(d.z));
  float rect=band(max(abs(p.x+.32)-1.42,abs(p.y-.68)-.97),.055)*step(d.z,0.);
  rect*=.35+.65*smoothstep(.02,.055,min(abs(p.x+.32),abs(p.y-.41)));
  float lamp=exp(-14.*(1.-dot(d,normalize(vec3(1,.4,.8)))));
  return mix(vec3(.09,.14,.16),vec3(.008,.012,.017),dark)+rect*mix(vec3(.92,1.24,1.28),vec3(1.3,.81,.44),warmth)*mix(1.,.20,dark)+lamp*vec3(1.45,.65,.14);
}
void main(){
  float t=R.z;
  float dark=smoothstep(39.,49.,t),warmth=smoothstep(24.,31.,t)*(1.-smoothstep(38.,43.,t));
  chip=1.-smoothstep(44.,47.,t)+smoothstep(59.5,60.15,t);
  vec2 screen=(2.*gl_FragCoord.xy-R.xy)/R.y;
  vec3 eye,at;
  float lens;
  if(t<12.){
    float u=smoothstep(0.,12.,t);eye=mix(vec3(2.4,1.63,4.25),vec3(1.35,1.40,3.35),u);
    at=vec3(-.45,.83,0);lens=2.7;
  }else if(t<21.){
    float u=smoothstep(12.,21.,t);eye=vec3(-.84+.33*u,1.31,1.36);at=vec3(-.84+.38*u,1.45,-1.25);lens=2.65;
  }else if(t<30.){
    float u=smoothstep(21.,30.,t);eye=vec3(-.69+.43*u,1.79,1.70);at=vec3(-.02,.84,.12);lens=2.64;
  }else if(t<39.){
    float u=smoothstep(30.,39.,t);eye=vec3(1.77-.73*u,1.46,3.14);at=vec3(-.31,.68,-.04);lens=2.46;
  }else if(t<49.5){
    float u=smoothstep(39.,49.5,t);eye=mix(vec3(1.04,1.46,3.14),vec3(.36,4.05,1.24),u);at=vec3(.04,.68,0);lens=2.86;
  }else{
    float u=smoothstep(50.,68.,t);eye=mix(vec3(-.66,1.50,2.24),vec3(.38,1.69,2.94),u);
    at=vec3(-.13,.72,0);lens=2.63;
  }
  vec3 forward=normalize(at-eye),right=normalize(cross(forward,vec3(0,1,0))),up=cross(right,forward);
  vec3 rd=normalize(forward*lens+right*screen.x+up*screen.y);
  vec3 col=mix(vec3(.17,.22,.24),vec3(.009,.014,.016),dark);
  float win=(-1.25-eye.z)/rd.z,floorT=-eye.y/rd.y,limit=60.;
  if(win>0.&&win<limit){
    limit=win;
    if(dark<.999)col=mix(windowView(eye,rd,t,warmth),vec3(.009,.014,.016),dark);
  }
  if(floorT>0.&&floorT<limit){limit=floorT;col=sill(eye+rd*floorT,dark);}
  // After the last line, turn only the cup. The sill, camera and light stay put.
  float turn=.44*smoothstep(69.65,70.25,t);
  mat2 pose=mat2(cos(turn),sin(turn),-sin(turn),cos(turn));
  vec3 cupEye=eye,cupRay=rd;
  cupEye.xz=eye.xz*pose;cupRay.xz=rd.xz*pose;
  vec3 offset=cupEye-vec3(.13,.57,0);
  float along=dot(offset,cupRay),disc=along*along-dot(offset,offset)+1.18;
  if(disc>0.){
    float reach=sqrt(disc),travel=max(0.,-along-reach),far=min(limit,-along+reach);
    for(int i=0;i<99;i++){
      if(travel>far)break;
      vec3 p=cupEye+cupRay*travel;vec2 hit=cup(p);
      if(hit.x<.0009){
        vec3 localNormal=normal(p),n=localNormal,v=-rd;
        n.xz=pose*localNormal.xz;
        float angle=atan(p.z,p.x),fres=pow(1.-max(dot(n,v),0.),4.);
        vec3 refl=reflect(rd,n),key=normalize(vec3(-.57,.83,-.56)),fill=normalize(vec3(.69,.53,.50));
        float occ=1.;
        for(int j=1;j<=3;j++){float d=float(j)*.065;occ-=max(0.,d-cup(p+localNormal*d).x)*(.49/float(j));}
        vec3 base=vec3(.93,.48,.022);
        if(dot(localNormal.xz,p.xz)<-.21)base=vec3(.60,.55,.33);
        float pin=min(abs(p.y-.159),abs(p.y-.19));
        if(pin<.007&&length(p.xz)<.65)base=vec3(.12,.22,.18);
        float freckle=smoothstep(.85,.99,noise(vec2(angle*112.,p.y*180.)));
        base*=1.-.32*freckle;
        if(damage(p)<.046&&chip>.2)base=mix(vec3(.25,.14,.055),vec3(.036,.049,.046),smoothstep(.004,.026,damage(p)));
        if(hit.y==2.)base=vec3(.024,.045,.047);
        vec3 spec=environment(refl,dark,warmth);
        if(hit.y==3.){
          vec2 q=p.xz-vec2(.02,-.08);float r=length(q),age=mod(t+.32,1.5);
          float wave=sin(86.*(r-age*.74))*exp(-abs(r-age*.74)*19.)*exp(-age*2.)*(1.-dark);
          refl=reflect(rd,normalize(vec3(.069*wave*q.x/max(r,.01),1,.069*wave*q.y/max(r,.01))));
          col=vec3(.081,.029,.006)*(1.-.55*pow(r/.58,3.))+environment(refl,dark,warmth)*(.08+.35*fres)+vec3(.10,.075,.04)*wave;
        }else{
          vec3 ambient=mix(vec3(.20,.22,.205),vec3(.10,.12,.136),dark);
          col=base*(ambient+max(0.,dot(n,key))*vec3(.81,.92,1.04)+max(0.,dot(n,fill))*vec3(.52,.32,.14))*occ;
          col*=.79+.21*smoothstep(.05,.86,p.y);
          col+=spec*(.16+.59*fres)+vec3(1,.72,.36)*pow(max(dot(refl,fill),0.),80.)*.56;
          float streak=exp(-abs(refl.x+.57)*22.)*smoothstep(-.44,.38,refl.y);
          col+=vec3(.37,.53,.58)*streak*(1.-.7*dark);
        }
        limit=travel;
        break;
      }
      travel+=max(.00065,hit.x*.83);
    }
  }
  // Three translucent slices of convecting air. Test depth so the rim occludes them.
  for(int j=0;j<3;j++){
    float idx=float(j),dist=(.12-idx*.13-eye.z)/rd.z;
    if(dist<0.||dist>limit||dark>.998)continue;
    vec3 p=eye+rd*dist;float y=p.y-.86;
    if(y<=0.||y>1.18)continue;
    float bend=.10*sin(7.*y-t*.88+idx*1.8)+.055*sin(13.*y-t*1.1)+.16*y;
    float across=(p.x-bend+.08*idx)/(.035+.13*y);
    float plume=exp(-across*across);
    plume*=smoothstep(0.,.16,y)*(1.-smoothstep(.48,1.18,y))*clouds(vec2(p.x*6.,y*5.-t*.65+idx));
    col=mix(col,vec3(.89,.94,.87),.18*plume*(1.-dark));
  }
  O=vec4(max(col,0.),1);
}
