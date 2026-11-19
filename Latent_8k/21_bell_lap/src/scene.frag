#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;
const vec3 ink=vec3(.105,.065,.16), plum=vec3(.28,.18,.36), grape=vec3(.52,.43,.69), paper=vec3(1.,.91,.78), lime=vec3(.88,.99,.16), coral=vec3(1.,.25,.22), ice=vec3(.63,.87,.88);
const float tau=6.2831853;
vec3 eye,ray,ro,rd,color,light;
float depth,beat,spin,night;
float label(vec2 uv,float row);
float hash(float x){return fract(sin(mod(x,1961.)*79.23)*4375.13);}
float stripe(float x,float width){return 1.-smoothstep(width,width+max(.0001,fwidth(x)),abs(x));}
void hit(float t,vec3 c){if(t>.006&&t<depth){depth=t;color=c;}}
vec3 shade(vec3 c,vec3 n){
 float l=dot(n,light);
 float rim=1.-abs(dot(n,rd));
 return night*(.58*c+.25*ice)*pow(rim,3.)+mix(mix(c*.50,ink,.27),c,smoothstep(-.04,.11,l))+.07*smoothstep(.78,.81,l);
}
// Intersect an affine sphere. The local x axis follows the line of the long bone.
void oval(vec3 a,vec3 b,float width,float thick,vec3 c){
 vec3 axis=normalize(b-a),side=normalize(cross(axis,vec3(0,0,1))),front=cross(axis,side);
 mat3 axes=mat3(axis,side,front);
 vec3 scale=vec3(length(b-a)*.5+width*.48,width,thick);
 vec3 u=(ro-(a+b)*.5)*axes/scale,v=rd*axes/scale;
 float av=dot(v,v),bv=dot(u,v),delta=bv*bv-av*(dot(u,u)-1.);
 if(delta>0.){
 float t=(-bv-sqrt(delta))/av;
 hit(t,shade(c,normalize(axes*((u+t*v)/scale))));
 }
}
// Thin round tubing uses a closest approach followed by a front-surface correction.
void tube(vec3 a,vec3 b,float width,vec3 c){
 vec3 ab=b-a,v=a-ro,q=ab-rd*dot(rd,ab);
 float k=clamp(-dot(q,v-rd*dot(rd,v))/max(.00001,dot(q,q)),0.,1.);
 vec3 d=v+k*ab;
 float t=dot(rd,d),rim=width*width-dot(d-t*rd,d-t*rd);
 if(rim>0.)hit(t-sqrt(rim),c);
}
void wheel(float x,bool rear,vec3 team,float phase){
 vec3 hub=vec3(x,.355,0);
 float t=(hub.z-ro.z)/rd.z;
 vec2 p=(ro+t*rd-hub).xy;
 float r=length(p);
 if(r<.356){
 float a=atan(p.y,p.x);
 vec3 c=ink;
 if(rear){
 c=mix(plum,grape,.5+.48*cos(a-phase));
 c+=.22*ice*pow(.5+.5*cos(34.*r+6.*a-phase*6.),8.)+night*team*exp(-240.*abs(r-.26));
 c=mix(c,team,.85*step(.92,cos(2.*a-phase*2.))*smoothstep(.10,.18,r));
 }else if(r<.29&&r>.046&&cos(a*3.-phase*3.+r*7.)<.70)return;
 if(r>.316)c=ink;
 if(abs(r-.313)<.006)c=paper;
 if(r<.034)c=ice;
 hit(t,c);
 }
}
void rider(float idx,vec3 base,vec3 forward,vec3 radial,float cadence,vec3 team){
 vec3 up=normalize(vec3(0,1.,0)-radial*.24);
 vec3 side=cross(forward,up);
 mat3 local=mat3(forward,up,side);
 ro=(eye-base)*local;rd=ray*local;
 vec3 center=vec3(0,.82,0)-ro;
 float along=dot(rd,center);
 if(along<-.2||along>depth+1.3||length(center-rd*along)>1.28)return;
 light=vec3(-.45,.76,.46);
 wheel(-.55,true,team,spin);wheel(.54,false,team,spin);
 vec3 rear=vec3(-.55,.355,0),crank=vec3(-.06,.29,0),seat=vec3(-.28,.90,0),bar=vec3(.36,.78,0);
 vec3 chainSide=vec3(0,0,.059);
 tube(rear+chainSide+vec3(0,.040,0),crank+chainSide+vec3(0,.108,0),.009,ink);
 tube(rear+chainSide-vec3(0,.040,0),crank+chainSide-vec3(0,.108,0),.009,ink);
 float ring=(chainSide.z-ro.z)/rd.z;
 vec2 gear=(ro+rd*ring-crank).xy;float gr=length(gear);
 if(gr<.112&&(gr>.082||cos(atan(gear.y,gear.x)*5.-cadence*5.)>.6))hit(ring,plum);
 tube(rear,crank,.021,grape);tube(rear,seat,.019,ice);
 tube(crank,seat,.039,team);tube(seat,bar,.044,team);tube(bar,crank,.052,team);
 tube(bar,vec3(.54,.355,0),.031,paper);
 tube(seat,seat+vec3(-.04,.13,0),.023,ink);
 oval(vec3(-.45,1.01,0),vec3(-.19,1.015,0),.037,.105,ink);
 vec3 hip=vec3(-.29,1.04+.027*sin(cadence*2.),0);
 vec3 shoulder=hip+vec3(.50,.32,.016*cos(cadence));
 vec3 neck=shoulder+vec3(.065,.065,0);
 for(int j=0;j<2;j++){
 float s=float(j)*2.-1.,a=cadence+float(j)*3.14159;
 vec3 foot=crank+vec3(.17*cos(a),.17*sin(a),s*.112);
 vec3 root=hip+vec3(0,0,s*.091);
 vec3 gap=foot-root;
 vec3 knee=(root+foot)*.5+normalize(vec3(-gap.y,gap.x,0))*sqrt(max(.004,.452*.452-dot(gap,gap)*.25));
 oval(root,knee,.089,.083,plum);
 oval(knee,foot,.055,.051,mix(coral,paper,.48));
 vec3 sock=mix(knee,foot,.65);
 oval(sock,foot,.048,.052,paper);
 oval(foot-vec3(.055,0,0),foot+vec3(.12,-.008,0),.043,.060,ink);
 tube(crank+vec3(0,0,s*.10),foot,.015,grape);
 vec3 hand=bar+vec3(.115,.085,s*.18),elbow=shoulder+vec3(.015,-.235,s*.174);
 tube(bar,hand,.021,ink);
 oval(shoulder+vec3(0,0,s*.13),elbow,.061,.062,team);
 oval(elbow,hand,.043,.043,mix(coral,paper,.48));
 oval(hand,hand+vec3(.041,-.012,0),.04,.045,ink);
 }
 oval(hip-vec3(.035,0,0),mix(hip,shoulder,.42),.139,.168,ink);
 oval(mix(hip,shoulder,.23),shoulder,.153,.172,team);
 vec3 bib=hip+vec3(.25,.19,0);
 vec3 hp=ro+depth*rd-bib;
 vec2 cloth=mat2(.87,-.49,.49,.87)*hp.xy;
 if(cloth.x>.04&&cloth.x<.23&&abs(hp.z)>.09&&abs(cloth.y)<.12){
 float seam=abs(fract(16.*(cloth.x+.44*abs(cloth.y)))-.5);
 color=mix(color,ink,.42*(1.-smoothstep(.09,.19,seam)));
 }
 if(abs(cloth.x)<.102&&abs(cloth.y)<.075&&abs(hp.z)>.087&&abs(hp.z)<.20){
 color=paper;
 if(label(cloth*vec2(sign(hp.z),1.)/vec2(.19,.13)+.5,idx==0.?4.:9.+idx)>.5)color=ink;
 }
 oval(mix(hip,shoulder,.70),mix(hip,shoulder,.75),.145,.165,paper);
 oval(neck,neck+vec3(.12,-.045,0),.112,.109,mix(coral,paper,.48));
 vec3 head=neck+vec3(.04,.087,0);
 oval(head-vec3(.145,.003,0),head+vec3(.116,-.035,0),.108,.126,team);
 vec3 helmetPoint=ro+depth*rd-head;
 if(abs(helmetPoint.x)<.11&&helmetPoint.y>.039&&helmetPoint.y<.105&&abs(helmetPoint.z)<.14&&mod(helmetPoint.z+.035*helmetPoint.x,.057)<.017)color=ink;
 oval(head+vec3(.056,-.057,0),head+vec3(.145,-.075,0),.042,.117,ink);
 vec3 visor=ro+depth*rd-head;
 if(visor.x>.045&&visor.x<.18&&abs(visor.y+.066)<.026&&abs(visor.z)>.048)
 color+=mix(ice,coral,clamp(visor.x*7.,0.,1.))*.74*exp(-49.*abs(visor.y+.053+.1*visor.x));
 oval(head-vec3(.107,.062,0),head+vec3(.043,.058,0),.036,.033,paper);
}
float wallDistance(vec3 e,vec3 d,float r){
 float a=dot(d.xz,d.xz),b=dot(e.xz,d.xz);
 return (-b+sqrt(max(0.,b*b-a*(dot(e.xz,e.xz)-r*r))))/max(a,.000001);
}
float label(vec2 uv,float row){
 if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return 0.;
 return textureLod(B,vec2(uv.x,(row*100.+(1.-uv.y)*100.)/2048.),0.).a;
}
void main(){
 beat=min(R.z*2.5,174.8);
 float t=beat*.4;
 night=smoothstep(74.,92.,beat)*(1.-smoothstep(162.,169.,beat));
 vec2 uv=(gl_FragCoord.xy-.5*R.xy)/R.y;
 float pass=smoothstep(108.,169.,beat);
 vec3 cam=vec3(-.56,.57,1.03),aim=vec3(-.27,.46,0);
 float lens=1.08,roll=-.10;
 if(beat>=12.){cam=vec3(-.40,1.27,3.65);aim=vec3(.05,.86,0);roll=-.15;}
 if(beat>=28.){cam=vec3(-4.,9.+4.*sin(beat*.08),7.);aim=vec3(1.8,.35,.25);roll=.24;}
 if(beat>=44.){cam=vec3(-3.25,1.22,-1.32);aim=vec3(.65,.96,.30);roll=.12;}
 if(beat>=60.){cam=vec3(5.8,1.65,1.8);aim=vec3(.6,.88,.3);roll=-.16;}
 if(beat>=76.){cam=vec3(.80,1.76,1.02);aim=vec3(.02,1.24,0);roll=-.19;}
 if(beat>=92.){float flight=sin(3.14159*clamp((beat-92.)/16.,0.,1.));
 cam=vec3(-2.,16.+44.*flight,2.4-27.*flight);aim=vec3(1.,0.,-18.*flight);roll=.61+flight*.65;}
 if(beat>=108.){cam=vec3(-1.7,.75,-2.25);aim=vec3(.3,.77,0);roll=.12;}
 if(beat>=124.){cam=vec3(2.8,2.65,3.45);aim=vec3(-.35,.87,-.1);roll=-.31;}
 if(beat>=140.){cam=vec3(-2.65,1.8,.8);aim=vec3(.1,1.03,0);roll=-.08;}
 if(beat>=156.){cam=vec3(.25,1.34,4.20);aim=vec3(-.15,.78,0);roll=-.06;}
 cam.x+=.26*sin(t*.67);cam.z+=.15*cos(t*.74);
 cam.y+=.018*sin(t*14.);aim.x+=.07*cos(t*1.6);
 cam.y=max(cam.y,(length(cam.xz+vec2(0,25.))-25.)*.36+.33);
 eye=cam+vec3(0,0,25.);
 vec3 fw=normalize(aim-cam),right=normalize(cross(fw,vec3(0,1,0))),up=cross(right,fw);
 uv=mat2(cos(roll),-sin(roll),sin(roll),cos(roll))*uv;
 ray=normalize(fw*lens+right*uv.x+up*uv.y);
 depth=1000.;color=mix(grape,ice,smoothstep(-.2,.45,ray.y));
 // The timing camera sees parallel rays. After the line, each column becomes a slit exposure.
 float slitX=0.;
 if(beat>=169.){
 vec2 sensor=(gl_FragCoord.xy-.5*R.xy)/R.y;
 slitX=(sensor.x-.19)*2.42;
 eye=vec3(.893+(R.z>=69.92?0.:slitX),3.27+sensor.y*2.42,29.);
 ray=normalize(vec3(0,-.63,-1.));
 }
 float theta=(t-69.92)*tau/33.12+.4-.0358+min(0.,t-36.8)*.22;
 // Far wall: terrace risers, printed hoardings, floodlights and open roof ribs.
 float tw=wallDistance(eye,ray,33.);
 vec3 p=eye+ray*tw;
 float arc=atan(p.x,p.z)+theta;
 color=mix(color,ink*.43,night);
 if(p.y<13.){
 float tier=floor((p.y-3.)*1.75),crowd=arc*134.+tier*.41;
 vec2 cell=vec2(fract(crowd)-.5,fract((p.y-3.)*1.75)-.42);
 vec3 c=mix(plum,grape,step(.81,cell.y+.42)*.68);
 float fan=hash(floor(crowd)+13.*tier);
 cell.y+=fan*.12-.06;
 if(length((cell-vec2(0,.17))*vec2(1.,.88))<.12)c=mix(grape,paper,fan);
 if(length((cell+vec2(0,.15))*vec2(.85,1.))<.24)c=mix(ink,fan>.6?coral:ice,fan*.8);
 if(abs(fract(crowd/31.)-.5)<.045)c=grape;
 if(p.y<4.8){
 vec2 signUV=vec2(fract(-arc*1.91),clamp((p.y-3.05)/1.7,0.,1.));
 c=mix(ink,lime,label(signUV,7.));
 }
 if(p.y>7.6){
 c=mix(ink,grape,.45);
 float beam=abs(fract(arc*9.55+(p.y-8.)*.19)-.5);
 if(beam<.09||mod(p.y,2.)<.12)c=ink;
 if(mod(arc*12.,1.)<.59&&abs(p.y-8.05)<.17)c=paper;
 if(p.y>10.&&beam>.10)c=ice;
 float truss=abs(fract(arc*19.1-(p.y-8.)*.42)-.5);
 if(p.y>9.75&&p.y<11.5&&(truss<.047||abs(p.y-11.38)<.075))c=plum;
 }
 float lamp=pow(max(0.,cos(arc*24.-t*1.3+p.y*.42)),12.);
 c=mix(c,c*.17+ice*lamp*.32,night);
 if(p.y>7.6)c+=night*vec3(.32,.7,1.)*exp(-2.8*abs(p.y-8.2))*pow(max(0.,cos(arc*28.)),4.)*3.;
 hit(tw,c);
 }
 // Intersect the conical banking and flat infield.
 float floorT=(-1.80-eye.y)/ray.y;
 if(floorT>0.){
 vec3 field=eye+floorT*ray;
 float fa=atan(field.x,field.z)+theta,fr=length(field.xz);
 vec3 paint=mix(plum,grape,.35);
 paint=mix(paint,grape,.64*label(vec2(fract(-fa*1.273), (fr-15.)/3.),1.));
 if(abs(fr-18.70)<.038||abs(fr-14.7)<.038)paint=grape;
 float dial=abs(fr-8.-1.2*sin(fa*8.+t*3.)-.45*cos(fa*21.-t*4.));
 paint=mix(paint,ink*.6+ice*exp(-dial*5.)*(.6+.4*cos(fa*144.))+grape*pow(.5+.5*cos(fr*4.-beat),18.),night);
 hit(floorT,fr<20.?paint:mix(plum,ink,night));
 }
 float h=eye.y/.36+25.,dy=ray.y/.36;
 float aa=dot(ray.xz,ray.xz)-dy*dy, bb=dot(eye.xz,ray.xz)-h*dy;
 float det=bb*bb-aa*(dot(eye.xz,eye.xz)-h*h);
 if(det>0.)for(int j=0;j<2;j++){
 float tt=(-bb+(j==0?-1.:1.)*sqrt(det))/aa;
 vec3 pos=eye+tt*ray;float radius=length(pos.xz);
 if(tt<=0.||radius<19.99||radius>33.||pos.y< -1.81)continue;
 float ang=atan(pos.x,pos.z)+theta;
 float board=floor(radius*5.),plank=ang*4.+hash(board);
 vec3 wood=mix(vec3(.78,.51,.46),vec3(.99,.76,.57),.3+.45*hash(board+79.*floor(plank))+.19*sin(radius*110.+3.*sin(ang*12.)));
 wood*=1.-.11*stripe(fract(radius*5.)-.5,.021);
 if(radius<21.5)wood=ice*.85;
 wood=mix(wood,ink,stripe(radius-22.05,.048));
 wood=mix(wood,coral,stripe(radius-24.05,.058));
 wood=mix(wood,grape,stripe(radius-28.4,.070));
 float tape=abs(sin(ang-.4))*radius;
 if(tape<.29)wood=tape<.045?ink:paper;
 // Raked bands of light across the boards.
 wood=mix(wood,wood*vec3(.75,.68,.85),.64*smoothstep(.14,.21,cos(ang*12.+radius*.06)));
 // Narrow luminous strands trace a travelling waveform around the bank.
 float ribbon=radius+.48*sin(ang*7.-beat*.35)+.18*sin(ang*19.+beat*.17);
 float line=abs(fract(ribbon*.82)-.5);
 vec3 beamColor=mix(vec3(.18,.9,1.),vec3(1.,.17,.54),.5+.5*cos(radius*.6+ang*3.));
 float packet=pow(.5+.5*cos(ang*9.-beat*.72+radius*.28),3.);
 wood=mix(wood,wood*vec3(.074,.064,.14)+beamColor*(.14+packet*2.)*exp(-line*24.),night);
 hit(tt,wood);
 }
 float ground=depth;vec3 groundPos=eye+ray*depth;
 if(R.z>=69.92){
 eye.x+=slitX;groundPos.x+=slitX;t-=slitX/11.5;
 }
 spin=-t*31.;
 for(int j=0;j<8;j++){
 float idx=float(j),offset=0.,lane=0.;
 if(j>0){offset=4.6-idx*1.62+sin(idx*3.+beat*.057)*.62-pass*(3.7+.3*idx);lane=(mod(idx,3.)-1.)*1.03+.48+.18*sin(beat*.09+idx);}
 if(j==1){
 float duel=smoothstep(90.,148.,beat);
 float finish=mix(.70+.22*sin(beat*.19),-.138,smoothstep(155.,174.8,beat));
 offset=mix(offset,finish,duel);lane=mix(lane,-.90,duel);
 }
 float an=offset/25.,radius=25.+lane;
 vec3 radial=vec3(sin(an),0,cos(an)),forward=vec3(cos(an),0,-sin(an));
 vec3 base=radial*radius+vec3(0,lane*.36,0);
 vec3 sh=groundPos-base;
 float shadow=length(vec2(dot(sh,forward)*.81,dot(sh,radial)*2.4)-vec2(.28,-.36));
 if(depth==ground&&shadow<1.)color=mix(color,color*vec3(.44,.38,.59),.72*(1.-smoothstep(.58,1.,shadow)));
 rider(idx,base,forward,radial,idx-t*(10.+.21*idx), j==0?lime:(j%3==1?coral:j%3==2?ice:grape));
 }
 O=vec4(color,1.);
}
