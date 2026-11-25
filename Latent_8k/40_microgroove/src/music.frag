#version 300 es
precision highp float;
out vec4 O;
int SC;
float TS;

uint hs(uint x){x=x*747796405u+2891336453u;x=((x>>((x>>28u)+4u))^x)*277803737u;return(x>>22u)^x;}
float nr(uint x){return float(hs(x))*4.6566128e-10-1.;}
float ex(float x){return exp(clamp(x,-80.,0.));}
float ss(float a,float b,float x){return smoothstep(a,b,x);}
float E(float t,float d){return ss(0.,.002,t)*ex(-t*d);}
float mf(float m){return 440.*exp2((m-69.)/12.);}
float ph(float f){return fract(fract(f)*float(SC)+f*TS);}
float S(float p){return sin(6.283185*fract(p));}

float rs(float p,float f,float c,float q){
  float y=0.,x,h;
  for(int i=1;i<21;i++){h=float(i)*f;if(h>15e3||h>c*5.)break;x=h/max(c,30.);y+=S(float(i)*p)/(float(i)*sqrt((1.-x*x)*(1.-x*x)+x*x*q));}
  return y*.56;
}

const int CD[12]=int[12](18258027,21539022,25768208,19309671,18260038,13965415,13998180,15996006,18327721,21407947,16097389,18160747);
const int MA[6]=int[6](46473221,170958090,15015975,41066828,41230499,96);
const int MB[6]=int[6](49691697,516235596,18234419,348636819,49923564,12);
int cn(int c,int k){return((CD[c]>>(k*5))&31)+(k<1?30:50);}
int ml(int i,bool b){int v=((b?MB[i/6]:MA[i/6])>>((i%6)*5))&31;return v<2?v:v+60;}
int cid(int b,int s){
  if(b<32)return(b&3)<3?b&3:s<8?3:4;
  if(b<40)return b<34?5:b<36?6:b<38?0:b<39?7:4;
  if(b<56){int m=(b-40)&7;return m<2?m*3+5:m<4?m-2:m<6?9-m:m<7?9:s<8?10:4;}
  return 11;
}

void main(){
  int idx=int(gl_FragCoord.y)*4096+int(gl_FragCoord.x);
  if(idx>=5898240){O=vec4(0);return;}
  SC=idx/48000;int sb=idx/92160,st=idx/5760,si=st&15;
  TS=float(idx-SC*48000)/48e3;float t=float(SC)+TS,B=float(idx)/92160.,ag=float(idx-st*5760)/48e3,aB=float(idx-sb*92160)/48e3;
  float a=nr(uint(idx)+313u),b=nr(uint(max(0,idx-1))+313u),c=nr(uint(idx)+9011u),hp=a-.74*b;

  vec2 d=vec2(0),w=vec2(0);
  float m=ss(0.,.2,t)*(1.-ss(62.,63.9,B)),dk=1.-(((sb>=8&&sb<32)||(sb>=40&&sb<56))?(sb>=40?.64:.56):0.)*ex(-fract(B*4.)*4.6);

  // Dust crackle + Bar 4 needle drop + Bar 32 brake
  float dm=B<8.?ss(0.,1.,B):B>=32.&&B<40.?ss(32.3,33.,B)*(1.-ss(39.4,40.,B)):B>=56.&&B<61.2?1.-ss(60.9,61.2,B):0.;
  w+=vec2(hp,c-a*.6)*.015*dm+(hs(uint(idx/48)+77u)<4800000u?pow(float(hs(uint(idx)+17u))/4294967295.,6.):0.)*(.025*dm)*vec2(.8,1.1);
  if(t>=7.68&&t<8.5){float x=t-7.68;d+=vec2(sin(6.283*(50.+60.*ex(-x*32.))*x)*E(x,15.)*.35+hp*E(x,210.)*.15);}
  if(B>=32.&&B<33.2){float x=t-61.44;d+=vec2(sin(6.28*(99.*ex(-x*1.5)+28.)*x)*E(x,3.)*.26);}

  // Rhodes + Pad + folded 16th Clavinet chop
  int ci=cid(sb,si);
  float pO=ss(0.,1.5,B)*(1.-ss(59.,61.8,B)),pC=mix(1500.,3200.,ss(2.,40.,B))*(1.-ss(56.,60.5,B)*.78);
  if(pO>.001){
    vec2 rh=vec2(0),pd=vec2(0),cl=vec2(0);
    float bE=ss(0.,.012,aB)*(sb>=56?ex(-max(0.,t-107.52)*.38):(1.-ss(1.86,1.92,aB))),cE=E(ag,24.);
    bool doCl=(sb>=12&&sb<32||sb>=40&&sb<56)&&((((sb>=40?47958:42838)>>si)&1)==1);
    for(int v=0;v<4;v++){
      float fv=mf(float(cn(ci,v+1))),pn=float(v)*.18-.27;
      rh+=vec2(.5-pn,.5+pn)*S(ph(fv)+.18*ex(-aB*6.5)*S(ph(fv*7.)))*ex(-aB*(v<1?1.1:1.6))*.36*bE;
      float wm=rs(ph(fv*1.002)+float(v)*.1,fv,pC,.55)*.22;
      pd+=vec2(wm*(.9+pn),wm*(.9-pn))*ss(0.,.2,aB)*(1.-ss(1.75,1.92,aB));
      if(doCl&&v>0)cl+=vec2(S(ph(fv*2.)+1.6*ex(-ag*28.)*S(ph(fv*6.))))*.22*cE;
    }
    float pL=(B<4.?.32:.44)*dk*pO;
    d+=rh*pL*.55+cl*vec2(.75,1.15)*dk*.45; w+=(rh*.85+pd*1.05)*pL+cl*vec2(1.1,.8)*dk*.32;
  }

  // Octave Funk Bass
  if((sb>=4&&sb<32)||(sb>=40&&sb<56)){
    int bm=sb<8?16641:sb>=40?59737:44377;
    for(int k=0;k<2;k++){
      int sK=st-k,iK=sK&15,bK=sK>>4;
      if(sK>=0&&bK>=4&&(((bm>>iK)&1)==1)){
        float g=float(idx-sK*5760)/48e3,f=mf(float(cn(cid(bK,iK),0))+(iK==6||iK==14?12.:iK==11?7.:iK==15?(bK%4==3?11.:12.):0.));
        float bC=bK<8?360.:(480.+3200.*ex(-g*20.))*(bK>=40?1.25:1.);
        d+=vec2((S(ph(f))*.38+rs(ph(f),f,bC,.44)*.82)*ss(0.,.005,g)*ex(-g*(bK<8?4.5:8.2))*(1.-ss(.19,.24,g)))*(bK<8?.17:bK>=40?.22:.2)*dk;
      }
    }
  }

  // Drums (including Bar 39 snare fill folded cleanly)
  if(((sb>=8&&sb<32)||(sb>=39&&sb<56))&&!(sb==31&&si>=12)){
    if(sb!=39&&((si&3)==0||(sb%4==3&&si==14&&sb!=31)))d+=vec2(sin(6.283*(46.*ag+2.8*(1.-ex(-ag*44.))))*E(ag,11.)+hp*E(ag,240.)*.22)*.29;
    bool sn=(sb==39&&si>=4)||((sb!=39)&&(si==4||si==12||((sb==19||sb==31||sb==47||sb==55)&&si>=12)));
    if(sn){
      float cl=hp*(ex(-ag*20.)+ex(-abs(ag-.015)*90.))*.36,sg=sb==39?ss(38.8,39.9,B):1.;
      d+=(vec2(sin(6.283*195.*ag)*E(ag,28.)*.28)+vec2(cl*.85,cl*1.05))*ss(0.,.001,ag)*.68*sg;
      w+=vec2(cl*1.1,cl*.9)*ss(0.,.002,ag)*.48*sg;
    }
    if(sb!=39){
      bool op=(si&3)==2;
      vec2 ht=vec2(.9,.95)*(hp*.82+S(ph(4120.))*S(ph(5830.))*.3)*E(ag,op?20.:68.)*((si&1)==0?(op?.26:.18):.11);
      if((si&1)==1)ht=ht.yx*vec2(.8,1.15);
      d+=ht*.82; w+=ht*.58;
    }
  }
  if(sb==8||sb==20||sb==40||sb==56)w+=vec2(hp,c-.7*a)*E(aB,1.8)*.24;

  // Lead Hook
  if((sb>=12&&sb<32)||(sb>=40&&sb<56)){
    int s8=idx/11520,act=0,prv=0,sS=s8; bool uB=sb>=40;
    for(int j=0;j<8;j++){int k=s8-j;if(k<0)break;int v=ml(k&31,uB);if(v>=2){if(act==0){act=v;sS=k;}else{prv=v;break;}}else if(v==0&&act==0)break;}
    if(act>=2){
      float g=float(idx-sS*11520)/48e3,f=mf(float(act)),p=mf(float(prv>=2?prv:act));
      float q=f*g+((p-f)/38.)*(1.-ex(-g*38.)),vb=f*.0003*ss(.12,.38,g)*(1.-cos(34.*g)),lC=uB?6200.:4800.;
      float lE=ss(0.,.012,g)*(ml((s8+1)&31,uB)==0?1.-ss(.65,1.,fract(B*8.)):1.);
      float sg=rs(fract(q+vb),f,lC,.4)+.52*rs(fract(q*2.+vb),f*2.,lC*1.1,.48)+(uB?.55*rs(fract(q*1.498+vb),f*1.498,lC,.52):0.);
      vec2 lR=vec2(sg*.95,sg*1.05)*lE*dk*(uB?.21:.2);
      d+=lR*.6; w+=lR*.9;
    }
  }
  O=vec4(d*m,w*m);
}
