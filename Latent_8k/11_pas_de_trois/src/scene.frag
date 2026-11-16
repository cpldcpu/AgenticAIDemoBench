#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
// PAS DE TROIS - a mechanical ballet in three acts.
// T time, BT beats, F number of rings (0 = rows), X costume change per column or ring, K costume (0 disc, 1 ball, 2 spiral),
// W delay of the dance per dancer in beats, MV move (0 step, 1 kick, 2 quarter turns, 3 pirouette, 4 jumping jack), AC act (0 yellow, 1 rose, 2 black, 3 finale, 4 prologue),
// AMP how much they dance, FP arms when they stand still (-1 down, 1 up), GD distance to the wall of the dancer's cell,
// GM distance to the plane that mirrors the dancer, TH height of a step: rings become tiers and rows a staircase,
// M part hit by the last map() (0 floor, 1 leg, 2 foot, 3 torso, 4 head, 5 arm, 6 hand, 7 costume, 8 hat), KK its costume, D running minimum
float T,BT,F,X,K,W,MV,AC,AMP,FP,GD,GM,M,KK,D,CI,TH,BB;
bool SG;   // every costume dances its own move
vec2 G,LC;   // columns and rows to each side of the centre; position inside the cell
vec3 Q;      // position on the dancer, mirrored to x > 0
// the programme: act*1000 + camera*100 + size*10 + move. Two bars each up to bar 40, then one bar each
const int SH[44]=int[44](4000,4100,0,401,102,303,11,291,313,324,1000,1411,1792,1103,1324,1293,2000,2103,2592,2634,
  103,1103,2103,3410,3334,3334,3011,3102,3792,3792,3293,3413,3634,3634,3594,3101,3354,3354,3653,3653,3010,3010,3010,3010);
// cameras (front, close, along the line, from above, low, crane, around the tiers, up the stairs): distance, distance per size, elevation, azimuth
const vec4 CM[8]=vec4[8](vec4(3.9,.5,.1,0),vec4(2.2,0,.05,.5),vec4(5,0,.22,1.1),vec4(3,4,1.5,0),vec4(3.2,.9,-.18,-.4),vec4(9,0,.5,.7),vec4(5,2.3,.12,0),vec4(8,0,.12,.3));
// red, yellow, blue, white, black
const vec3 P[5]=vec3[5](vec3(.75,.02,.01),vec3(1,.6,0),vec3(.01,.09,.5),vec3(.9,.87,.8),vec3(.02));
// colour of leg, foot, torso, head, arm, hand, costume and hat for the three costumes
const int CT[24]=int[24](3,0,2,3,3,0,0,0,4,3,0,3,4,1,3,1,3,1,2,3,3,1,1,1);
// backdrop per act
const vec3 BG[5]=vec3[5](vec3(1,.64,.02),vec3(1,.3,.45),vec3(.001,.001,.003),vec3(.92,.89,.82),vec3(.001,.001,.003));

float sat(float x){return clamp(x,0.,1.);}
mat2 rot(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
void U(float d,float m){if(d<D)D=d,M=m;}
float cap(vec3 p,vec3 a,vec3 b){b-=a;p-=a;return length(p-b*sat(dot(p,b)/dot(b,b)));}
// The stage: a floor and one dancer per cell. Cells are 2 units wide and stand in rows or in rings of 6, 12, 18...
// around one dancer in the middle. With TH every ring stands a step above the next one out, and every row a step above the one in front.
float map(vec3 p){
  float l=length(p.xz),y=p.y,i,j,a,c,g=1.,b,e,u,k,sx,mv=MV;
  if(F>0.){
    i=clamp(round(l/2.),0.,F);
    g=1.-l+abs(p.x);
    j=0.;
    if(i>0.){
      c=1.0472/i;
      a=atan(p.x,p.z)+BT*.15*(mod(i,2.)-.5);   // neighbouring rings turn against each other
      j=round(a/c);
      p.xz=vec2((a-j*c)*l,l-i*2.);
      g=c*l*.5;
    }
    y-=TH*(F-i);
  }else{
    vec2 r=clamp(round(p.xz/2.),-G,G);
    i=r.x;j=r.y;
    p.xz-=2.*r;
    y+=TH*j;
  }
  p.y=y;
  g=min(g-abs(p.x),1.-abs(p.z));
  GD=g<0.||y>2.5?9.:g+.12;   // no wall above the heads
  LC=p.xz;
  CI=mod(i+j,3.);   // which of three spotlight colours
  D=min(y,max(p.z+1.,y-TH));M=0.;GM=9.;   // the floor, and the riser of the next step up
  b=BB=BT-(i+j)*W;   // this dancer's beat
  l=max(length(p.xz),y-1.2);
  if(l>1.3)return min(D,l-1.);
  e=smoothstep(0.,.4,fract(b))+floor(b);   // counts the beats, but snaps from one to the next
  u=cos(3.1416*e)*AMP;                     // +1 and -1 on alternate beats
  k=KK=mod(K+i*X,3.);
  if(SG)mv=k<.5?3.:k<1.5?4.:1.;   // the disc spins, the ball jumps, the spiral kicks
  p.y-=abs(sin(b*3.1416))*.12*AMP;         // a hop that lands on the beat
  p.xz*=rot(mv==3.?b*3.1416:mv==2.?e*1.5708:.3*u);
  vec3 q=p,h;
  GM=abs(p.x)+.06;   // left and right half move differently: do not step across the middle
  q.x=abs(q.x);
  Q=q;
  sx=sign(p.x)*u;
  // legs: stiff, like a tin toy
  a=mv==1.?1.2*max(sx,0.):mv>3.5?0.:.35*sx;
  c=mv>3.5?.25-.25*u:0.;   // the jumping jack spreads them
  h=vec3(.11,1,0)+.92*vec3(sin(c),-cos(a)*cos(c),sin(a)*cos(c));
  U(cap(q,vec3(.11,1,0),h)-.05,1.);
  U(length(q-h)-.085,2.);
  U((length((q-vec3(0,1.32,0))/vec3(.2,.34,.15))-1.)*.15,3.);
  U(length(q-vec3(0,1.8,0))-.17,4.);
  // arms: one up, one down, or both up in the pirouette
  a=1.57+(mv>3.5?-.9*u:mv>2.5?.9*AMP:sx)+(1.-AMP)*FP;
  h=vec3(.2,1.52,0)+.55*vec3(sin(a),-cos(a),.2);
  U(cap(q,vec3(.2,1.52,0),h)-.04,5.);
  U(length(q-h)-(k==1.?.14:.08),6.);
  l=length(q.xz);
  if(k<.5){
    // a disc for a skirt and a cone for a hat
    U(max(abs(q.y-1.02-q.z*.2*u)-.02,l-.7),7.);
    U(max(dot(vec2(l,q.y-2.3),vec2(.94,.34)),1.9-q.y),8.);
  }else if(k<1.5){
    // a ball, and a flat hat
    U(length(q-vec3(0,1,0))-.45,7.);
    U(max(abs(q.y-1.96)-.015,l-.32),8.);
  }else{
    // a wire spiral, and a halo
    c=atan(p.z,p.x)*.0223;
    for(float o=0.;o<2.;o++){
      g=clamp((floor((q.y-c)/.14)+o)*.14+c,.4,1.05);
      U(length(vec2(l-.2-(1.1-g)*.85,q.y-g))-.03,7.);
    }
    U(length(vec2(l-.24,q.y-2.03))-.02,8.);
  }
  return D;
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-R.xy)/R.y,v;
  T=R.z;BT=T*2.13333;
  float br=BT/4.,n,t,d;
  int sl=min(int(br),63),cd,kd;
  sl=sl<40?sl/2:sl-20;
  cd=SH[sl];
  AC=float(cd/1000);
  kd=cd/100%10;
  n=float(cd/10%10);
  MV=float(cd%10);
  K=AC>3.5?0.:AC>2.5?kd==1?float(sl):1.:AC;
  X=AC==3.?1.:0.;
  F=kd==3||kd==6?n:0.;
  TH=(kd==6?1.1:kd==7?.5:0.)*smoothstep(0.,1.,fract(br/2.)*2.);   // the steps rise out of the floor during the first bar of the shot
  if(n>8.)n=99.;   // as many as the eye can see
  G=vec2(n,kd==5||kd==7?n:0.);
  W=kd==2||kd==5||kd==7?.25:kd==6?.33333:kd==3?.33333*float(sl&1):0.;   // a wave down the line, or around every other ring
  SG=X>0.&&(kd<3||kd==4);
  AMP=sat(br*.6-.9)*sat((61.-br)*8.);
  FP=br>9.?1.:-1.;
  bool dk=AC==2.||AC>3.5;
  // camera
  vec4 cm=CM[kd];
  float ca=cm.w+.25*sin(T*.3+float(sl))+(kd==3||kd==6?T*.12:0.),
        ce=cm.z-(kd==3?.25*float(sl&1):0.);   // every other view from above is tilted
  d=cm.x+cm.y*n;
  vec3 tg=vec3(0,kd==1?1.6:1.05+TH*F*.45,0),
       rc=tg+d*vec3(cos(ce)*sin(ca),sin(ce),cos(ce)*cos(ca)),
       f=normalize(tg-rc),r=normalize(cross(f,vec3(0,1,0))),
       col=vec3(0),bc=BG[int(AC)];
  // two samples per pixel
  for(int aa=0;aa<2;aa++){
    uv+=(float(aa)-.25)/R.y;
    // the lens gives a little on every beat
    vec3 ro=rc,rd=normalize(f*(1.8-.05*exp(-fract(BT)*5.)*step(4.,br))+r*uv.x+cross(r,f)*uv.y),at=vec3(1);
    vec3 vl=vec3(0);
    // two rounds: the stage, then its reflection in the floor
    for(int z=0;z<2;z++){
      t=0.;
      for(int i=0;i<160;i++){
        d=map(ro+rd*t);
        if(d<.0005*t||t>46.)break;
        // never step past the wall of a cell: in rows the exact way out along the ray, in rings the distance to the wall
        v=(sign(rd.xz)-LC)/rd.xz;
        d=min(min(min(d,GM),F>0.||GD>8.?GD:min(v.x,v.y)+.02),dk?.45:9.)*.9;
        // light in the air under each spotlight
        vl+=d*smoothstep(1.,.3,length(LC)/max(1.2-.12*(ro.y+rd.y*t),.05))*exp(-t*.1)*(n<1.?vec3(1,.85,.6):P[int(CI)]*1.5+.05);
        t+=d;
      }
      if(d>.05)t=47.;   // ran out of steps far away: that is haze
      if(dk&&z<1)col+=vl*(.04+.06*exp(-fract(BT)*3.))/(1.+min(n,3.));   // the beams flare on the beat
      // backdrop: a painted wall without an edge. A disc on it, and in the finale a square and a triangle as well
      v=rd.xy/max(-rd.z,.01)-vec2(0,.42);
      vec3 b=bc*(.9+.3*rd.y);
      b=mix(b,AC==3.?P[0]:mix(bc,vec3(1,.95,.9),dk?.03:.5),smoothstep(.01,0.,length(v)-.33));
      v.x=abs(v.x)-1.;
      if(AC==3.)b=mix(b,P[rd.x>0.?1:2],smoothstep(.01,0.,rd.x>0.?max(abs(v.x)*.87+v.y*.5,-v.y)-.14:max(abs(v.x),abs(v.y))-.2));
      if(rd.z>0.)b=bc;
      if(t>46.){col+=at*b;break;}
      vec3 p=ro+rd*t,nn=vec3(0),e,al,q;
      for(int i=0;i<4;i++){
        e=.5773*(2.*vec3(i+3>>1&1,i>>1&1,i&1)-1.);
        nn+=e*map(p+e*.001);
      }
      nn=normalize(nn);
      float m=M,kk=KK,sh,ao=1.,s,w=t*.004,fg=smoothstep(24.,46.,t),fr=kd==7?p.z+400.:length(p.xz),mt=0.,cc=CI,bb=BB;
      q=Q;
      vec2 lc=LC;
      e=reflect(rd,nn);
      vec3 dl=vec3(0),sp=dl;
      // Three stage lights, red, green and blue, a third of a turn apart: together they are white, but every shadow has a colour.
      // In the dark acts one white spotlight per dancer instead. The very first sample measures occlusion,
      // and each shadow starts at an offset that differs from pixel to pixel to hide the steps
      for(int k=0;k<(dk?1:3);k++){
        vec3 l=normalize(vec3(sin(dk?.7:float(k)*2.1+1.+T*.3),1.1,cos(dk?.7:float(k)*2.1+1.+T*.3))),   // they circle slowly
             lk=dk?vec3(smoothstep(1.5,.8,length(lc))):.2+.4*vec3(k==0,k==1,k==2);
        sh=1.;
        s=.02+.1*fract(sin(dot(gl_FragCoord.xy+float(aa+k),vec2(12.99,78.23)))*43758.5);
        for(int i=0;i<17;i++){
          d=map(i+k<1?p+nn*.2:p+nn*.02+l*s);
          if(i+k<1)ao=sat(.3+d*3.5);
          else sh=min(sh,sat(14.*d/s)),s+=clamp(min(d,GD),.02,.2);
        }
        dl+=lk*sh*max(dot(nn,l),0.);
        sp+=lk*sh*pow(max(dot(e,l),0.),40.);
      }
      if(m<.5){
        // the floor of each act: sunburst, chessboard, black lacquer, target
        al=AC<.5?mix(bc,vec3(1,.88,.55),smoothstep(-w,w,sin(atan(p.x,p.z)*12.+T*.4)*fr/12.)):
           AC<1.5?mix(bc,vec3(1,.85,.88),smoothstep(-w,w,cos(p.x*1.5708)*cos(p.z*1.5708)*.64)):
           dk?n<1.?vec3(.3):P[int(cc)]*.4+.05:
           fr<11.||kd==7?P[int(mod(round(fr/2.)*2.,3.))]:bc;
        if(nn.y<.5)al=P[3];   // risers are white
      }else{
        int ci=CT[int(kk)*8+int(m)-1];
        if(m==7.){
          if(kk<.5){
            // the disc is a colour wheel with a black rim
            ci=int(mod(floor(atan(q.x,q.z)*1.59+.5),3.));
            if(ci==1)ci=3;
            if(length(q.xz)>.62)ci=4;
          }else if(kk<1.5){
            // the ball has black and white gores and a red belt
            ci=3+int(mod(floor(atan(q.x,q.z)*1.91+.5),2.));
            if(abs(q.y-1.)<.05)ci=0;
          }
        }
        if(m==3.&&fract(q.y*9.)<.5)ci=3;
        if(m==4.&&q.z>0.){
          // eyes and cheeks
          if(length(vec2(q.x-.065,q.y-1.82))<.032)ci=4;
          if(length(vec2(q.x-.11,q.y-1.74))<.03)ci=0;
          if(abs(length(vec2(q.x,q.y-1.79))-.07)<.008&&q.y<1.745)ci=4;   // and a smile
        }
        al=P[ci];
        if(kk>1.5&&ci==1)mt=1.,al*=.5;   // the spiral dancer wears gold
      }
      vec3 c=al*(dl*1.1+(dk?vec3(.02,.03,.06):mix(vec3(1),bc,.5)*.45)*(.6+.4*nn.y)*ao)
        +sp*(.25+mt*4.*P[1])
        +mt*P[1]*.4*(.5+.5*e.y)
        +pow(sat(1.+dot(nn,rd)),3.)*ao*(dk?vec3(.1,.2,.5):bc)*.3*step(.5,m);
      // every landing sends a ring of light across the floor
      if(m<.5)c+=smoothstep(.08,0.,abs(length(lc)-fract(bb)*1.3-.3))*(1.-fract(bb))*AMP*step(.5,nn.y)*(dk?n<1.?vec3(1,.85,.6):P[int(cc)]*1.5+.05:vec3(.25));
      c=mix(c,b,fg);
      // the floor is polished: it mirrors at a flat angle
      s=m<.5?(1.-fg)*((dk?.3:.02)+.6*pow(sat(1.+dot(nn,rd)),5.)):0.;
      col+=at*c*(1.-s);
      if(s==0.)break;
      at*=s;
      ro=p+nn*.01;
      rd=e;
    }
  }
  O=vec4(clamp(col*.5,0.,4.),1);
}
