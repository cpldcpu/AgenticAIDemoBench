#version 300 es
precision highp float;
out vec4 O;
const float Z=6.283185;
const int CH[8]=int[8](143613098,139418790,135224749,143662504,145710506,143613094,139418787,143662501);
const int ML[16]=int[16](525357,42349,46368,44078,525357,46610,46123,1064,590893,46544,51648,542772,33845,440850,46123,303147);

float hs(int n){uint x=uint(n)*747796405u+2891336453u;x=((x>>((x>>28u)+4u))^x)*277803737u;return float((x>>22u)^x)/2147483648.-1.;}
float cn(int i,int j){return float((CH[i&7]>>(j*7))&127);}
float mf(float m){return 440.*exp2((m-69.)/12.);}
float S(float x){return clamp(x,0.,1.);}
float ss(float a,float b,float x){return smoothstep(a,b,x);}
float W(float x,float a,float b){return step(a,x)*step(x,b);}
float kk(float a,float d){return tanh(sin(Z*(45.*a+5.5*(1.-exp(-a*28.))))*1.9)*exp(-a*d);}
vec2 pn(int i){float p=.5+.4*sin(float(i)*2.);return vec2(1.-p,p);}
vec2 fs(float p,float m){vec2 q=p*vec2(1.003,.997);return sin(q+m*sin(q)+.35*m*sin(q*2.));}
int mn(int q){q=(q%64+64)%64;return(ML[q>>2]>>((q&3)*5))&31;}

vec2 ld(int n){
  float b=float(n)/96e3,s2=W(b,32.,48.),s3=W(b,52.,60.),c=W(b,40.,48.);
  if(W(b,8.,24.)+s2+s3<.5)return vec2(0);
  int o=s3>.5?32:0,e=n/12000-o,s=e,f=e+1;
  for(int i=0;i<6;i++){if(mn(s)==1)s--;if(mn(f)==1)f++;}
  int m=mn(s);if(m<2)return vec2(0);
  float t=float(n-(s+o)*12000)/48e3,r=float((f+o)*12000-n)/48e3,v=.25*sin(t*33.)*S(t*2.8-.25);
  float p=Z*mf(float(m+60)+c*12.)*t+v,fl=sin(p+(1.2+exp(-t*7.))*sin(p*2.))*.7;
  vec2 g=mix(vec2(fl),fs(p,1.2)*.55+fl*.32,s2);
  if(W(b,16.,24.)+c>.5)g+=fs(Z*mf(float(m-3-((1319168>>m)&1)+60)+c*12.)*t+v,.85)*.26;
  return g*S(t*120.)*S(r*40.)*(.55+.45*exp(-t*2.))*(s3>.5?.16*ss(60.,57.,b):s2>.5?.34:.25);
}

void main(){
  int N=int(gl_FragCoord.x)+int(gl_FragCoord.y)*4096;
  float B=float(N)/96e3,cz=ss(49.,51.6,B)*step(B,51.75);
  int n=cz>.01?N-N%(1+int(cz*cz*4.)):N,b=n/96000,st=n/6000;
  float t=float(n)/48e3,ts=float(n-st*6000)/48e3,nz=hs(n),hz=(nz-hs(n-1))*.5,ke=0.,gr=W(B,4.,24.)+W(B,32.,48.);
  vec2 D=vec2(0),E=D,bs=D,v;

  if(B<63.5){
    float l=ss(0.,3.,B)*ss(63.5,59.,B)*(.72+.3*ss(23.5,24.5,B)*ss(32.5,31.5,B)),m=.45+.6*ss(26.,32.,B);v=vec2(0);
    for(int k=0;k<2;k++){
      int i=b-k;if(i<0||i>=63||(B>=52.&&i<52))continue;
      float c0=float(n-i*96000)/48e3,e=ss(0.,.22,c0)*exp(-max(c0-2.,0.)*3.8)*ss(3.5,3.1,c0);
      for(int j=0;j<4;j++){vec2 q=Z*mf(cn(i,j)+(j<1?12.:0.))*c0*vec2(1.002,.998)+float(j);v+=sin(q+m*sin(q+.3*sin(c0*2.+float(j))))*e;}
      v+=sin(Z*mf(cn(i,3)+12.)*c0*vec2(1.002,.998))*e*.24;
    }
    v*=l*.048;D+=v*.55;E+=v*.9;
  }

  if(B<63.){
    for(int k=0;k<4;k++){
      int i=st-k;if(i<0)break;
      float a=ts+float(k)*.125,u=float(i)/16.,g=W(u,4.,24.)+W(u,32.,48.),r=W(u,32.,48.);
      int s2=i&31,s1=i&15,ib=i>>4;
      if((g>.5&&(((r>.5?306250761:68224065)>>s2)&1)>0)||(W(u,48.,51.5)>.5&&(s1&3)==0)){
        ke=max(ke,exp(-a*6.5));D+=kk(a,r>.5?7.5:8.8)*(r>.5?.42:u>=48.?.28:.34)+hz*exp(-a*220.)*.18;
      }
      if(W(u,12.,24.)+r>.5){
        float w=max((ib&7)==7&&s1>7?.6:0.,(s1==4||s1==12)?1.:(r>.5&&((538984576>>s2)&1)>0?.28:0.));
        if(w>0.){v=(sin(Z*195.*a+2.*exp(-a*36.))*exp(-a*22.)*.38+(nz*.35+hz*1.3)*exp(-a*14.)*.5)*w*vec2(1,.9);D+=v*.88;E+=v*.45;}
      }
      if(g>.5){
        float oh=s1==14&&r>.5?1.:0.;
        v=(sin(Z*2900.*a+1.4*sin(Z*4310.*a))*.26+hz*vec2(1,.9)*.45)*exp(-a*mix(54.,12.,oh))*(oh>.5?.65:(s1&3)==2?.48:.22)*(u>=8.?1.:.65);
        D+=v*.82;E+=v*.25;
        if(k<2&&((21061>>s1)&1)>0){
          float rt=cn(ib,0)+(s1==14?(ib&3)==3?7.:12.:0.),q=mf(rt),fc=180.+(r>.5?2800.:1500.)*exp(-a*13.),ac=0.;
          for(float h=1.;h<9.;h++){float x=q*h/fc;ac+=sin(Z*q*h*a)/h/(1.+x*x*x*x)*(1.+1.9*exp(-(x-1.)*(x-1.)*16.));}
          bs+=(sin(Z*(rt>40.?q*.5:q)*a)*.32+tanh(ac*1.5)*.24)*S(a*300.)*S((.25-a)*45.)*exp(-a*4.8);
        }
      }
      if((u<4.||W(u,24.,32.)+W(u,52.,60.)>.5)&&((9289>>s1)&1)>0){
        v=sin(Z*mf(84.+float((i*5)%12))*a)*exp(-a*65.)*S(a*300.)*.13*pn(i);D+=v*.6;E+=v*.9;
      }
    }
  }

  float pm=gr>.5?1.-.72*ke:1.;D+=bs*pm*.74;

  if(B<62.){
    int dv=(B<4.||W(B,24.,32.)>.5||B>=52.)?12000:6000,cs=n/dv;v=vec2(0);
    for(int k=0;k<4;k++){
      int i=cs-k;if(i<0)break;
      float a=float(n-i*dv)/48e3,u=float(i*dv)/96e3;if(u>=62.)continue;
      int x=(i&7)==7?0:3-abs((i&3)-2);float r0=cn(int(u),x);
      float q=mf(r0+(x<1?r0<40.?36.:24.:12.)+W(u,32.,48.)*float((i&3)==2)*12.),s=0.;
      for(float h=1.;h<6.;h++)s+=sin(Z*q*h*(1.+.001*h*h)*a)*exp(-a*(2.8+h*2.))/(h*h);
      v+=(s+sin(Z*q*4.72*a)*exp(-a*75.)*.22)*S(a*300.)*S((float(dv)*4./48e3-a)*25.)*pn(i)*ss(0.,2.,u)*ss(62.,57.5,u)*(u>=48.?.17:.26);
    }
    v*=gr>.5?.6+.4*pm:1.;D+=v*.72;E+=v*1.05;
  }

  for(int k=0;k<3;k++){v=ld(n-k*18000)*pow(.44,float(k))*(k<1?vec2(1):k<2?vec2(.35,1):vec2(1,.35));D+=v*(.76+.24*pm);if(k<1)E+=v*.38;}

  if(W(B,2.8,4.)+W(B,28.,31.5)>.5){float u=B<10.?(B-2.8)/1.2:(B-28.)/3.5;v=vec2(hz*u*u*.23+sin(Z*240.*(exp2(u*u*2.2)-1.))*u*.11)*ss(1.,.98,u);D+=v*.55;E+=v*.9;}
  if(W(B,4.,5.5)+W(B,52.,56.)+W(B,62.5,64.5)>.5){
    float a=t-(B<20.?8.:B<60.?104.:125.),c=B<20.?sin(Z*440.*(exp2(a*1.7)-1.))*exp(-a*3.8)*S(a*300.)*.18:(sin(Z*mf(78.)*a)+.6*sin(Z*mf(85.)*a)+.4*sin(Z*mf(88.)*a))*exp(-a*(B<60.?1.4:3.4))*S(a*300.)*.16;
    D+=(B<60.?kk(a,2.8)*.35:0.)+c*vec2(.9,1);E+=c*vec2(1,.9)*1.5;
  }
  if(W(B,48.,51.75)>.5){
    float u=(B-48.)/3.75,r=exp2(floor(B-47.)),a=fract(B*r)*(2./r),s=0.;
    for(int j=0;j<6;j++){float x=fract(u*1.5+float(j)/6.);s+=sin(Z*195.*(exp2(x*4.5)-1.))*(.5-.5*cos(Z*x));}
    v=vec2((nz*.32+sin(Z*320.*a)*.5)*exp(-a*(16.+r*4.))*(.2+.3*u))+s*.14*(.45+u)*vec2(1,.9);D+=v*.78;E+=v*.9;
  }
  D=mix(D,floor(D*18.+.5)/18.,cz*.5);
  O=vec4(D,E)*ss(0.,.12,t)*ss(64.5,62.8,B)*(1.-ss(51.6,51.74,B)*step(B,52.));
}
