#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
float T,BR,grw,org,pk,ps,cl,ni,n2,F,ANG;
vec3 SP,SD;
float sat(float x){return clamp(x,0.,1.);}
float sm(float a,float b){return smoothstep(a,b,BR);}
float h1(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float hf(float p){return fract(sin(p*127.1)*43758.5453);}
float vno(vec3 p){
  vec3 i=floor(p),w=fract(p);w=w*w*(3.-2.*w);
  return mix(mix(mix(h1(i),h1(i+vec3(1,0,0)),w.x),mix(h1(i+vec3(0,1,0)),h1(i+vec3(1,1,0)),w.x),w.y),
             mix(mix(h1(i+vec3(0,0,1)),h1(i+vec3(1,0,1)),w.x),mix(h1(i+vec3(0,1,1)),h1(i+vec3(1,1,1)),w.x),w.y),w.z);
}
float fbm(vec3 p){float s=0.,a=.55;for(int i=0;i<4;i++){s+=a*vno(p);p=p*2.17+11.3;a*=.5;}return s;}
// lightning: same law as music.frag, so picture and thunder strike together
float flash(){
  float b=BR*4.,bi=floor(b),bf=b-bi;
  float pr=mix(.2,.9,sat((BR-24.)/16.))*(1.-sat((BR-50.)/6.));
  float f=step(24.,BR)*(1.-step(56.,BR))*step(pr,hf(bi*3.7))*exp(-bf*7.);
  float d1=BR-24.,d2=BR-40.;
  f+=exp(-d1*d1*22.)+exp(-d2*d2*22.);
  return f;
}
float seg(vec3 ro,vec3 rd,vec3 a,vec3 b){
  vec3 v=b-a,w=ro-a;
  float bb=dot(rd,v),cc=dot(v,v),dd=dot(rd,w),ee=dot(w,v);
  float s=sat((ee-dd*bb)/max(cc-bb*bb,.001));
  float t=s*bb-dd;
  return length(t>0.?w+t*rd-s*v:w-s*v);
}
// the storm: one density field - boiling tower, spreading anvil deck with mammatus, rotating wall cloud, rain shaft
float dens(vec3 p){
  vec3 q=p-SP;
  float d=0.;
  float h=2.5+11.*grw,vy=q.y/h;
  if(vy>0.&&vy<1.25){
    vec2 tq=q.xz;
    float ca=cos(ANG*vy*.7),sa=sin(ANG*vy*.7);
    tq=vec2(tq.x*ca-tq.y*sa,tq.x*sa+tq.y*ca);
    float rr=length(tq);
    float rad=(.8+1.2*grw+.5*org)*(1.+2.8*org*smoothstep(.5,1.2,vy));
    float n=fbm(vec3(tq.x*.55,q.y*.3,tq.y*.55)+vec3(0.,0.,T*.05));
    d+=sat((rad-rr)/1.5+.9*n-.45)*sat(vy*6.)*sat((1.25-vy)*4.);
  }
  float rr2=length(q.xz);
  if(org>0.&&rr2<62.){
    float lob=pow(fbm(vec3(q.x*.9,3.7,q.z*.9)),2.5)*pk;
    float dd=sat(1.-abs(q.y-(4.65-.85*lob))/.5)*sat((6.+48.*org-rr2)/10.)*org;
    if(dd>0.)dd*=.45+.55*fbm(vec3(q.x*.32,T*.03,q.z*.32)+vec3(T*.02,0.,0.));
    d+=dd;
  }
  if(org>0.){
    vec2 w=q.xz-vec2(0.,2.);
    float ca=cos(-ANG),sa=sin(-ANG);
    w=vec2(w.x*ca-w.y*sa,w.x*sa+w.y*ca);
    float wl=sat(1.-length(w)/3.4)*sat(1.-abs(q.y-1.4)/1.4);
    if(wl>0.)d+=wl*org*(.35+.65*fbm(vec3(w.x*.6,q.y*.6,w.y*.6)+vec3(0.,0.,T*.08)));
  }
  if(rr2<4.5&&q.y<2.2&&q.y>-.5&&org>0.)
    d+=sat((2.6-rr2)/2.)*sat((2.-q.y)/2.4)*org*(.3+ps)*(.5+.5*vno(vec3(q.x*6.,q.y*2.-T*9.,q.z*6.)))*.3;
  return d*(1.-.45*cl);
}
// the sky outside the storm; the rainbow is added later, in front of the retreating rain
vec3 sky(vec3 rd){
  float h=pow(sat(rd.y*8.),.6);
  vec3 c=mix(vec3(.72,.6,.44),vec3(.24,.3,.4),pow(h,.45));
  c=mix(c,vec3(.4,.5,.44),org*.45*sat(1.-rd.y*1.5)*(1.-n2));
  c+=vec3(1.,.75,.5)*pow(sat(dot(rd,SD)),28.)*.28*(1.-.7*org)*(1.-n2)*sat(rd.y*6.+.2);
  c+=vec3(1.,.85,.6)*pow(sat(dot(rd,SD)),2500.)*2.6;
  c+=vec3(.9,.95,1.)*pow(h1(floor(rd*230.)),400.)*ni;
  c*=1.-.6*n2;
  return c;
}
vec3 rainbow(vec3 rd){
  float d0=dot(rd,-SD);
  float rbi=sm(48.,52.)*(1.-sm(54.,57.));
  return rbi*(vec3(1.,.3,.2)*sat((d0-.712)/.02)*sat((.748-d0)/.02)*1.1
     +vec3(.35,1.,.35)*sat((d0-.742)/.02)*sat((.778-d0)/.02)*1.1
     +vec3(.3,.4,1.)*sat((d0-.772)/.02)*sat((.808-d0)/.02)*1.1);
}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;u.x*=R.x/R.y;
  T=R.z;BR=T/2.;
  grw=sm(8.,16.);org=sm(16.,24.);pk=sm(30.,34.);ps=sm(40.,44.);cl=sm(47.,54.);ni=sm(57.,63.);n2=sm(56.,60.);
  float zS=mix(-55.,-30.,sat(BR/24.));zS=mix(zS,6.,sm(36.,44.));zS=mix(zS,32.,sm(44.,56.));zS=mix(zS,55.,sm(56.,62.));
  SP=vec3(4.*sin(BR*.07)+2.*sin(BR*.23),0.,zS);
  ANG=max(BR-16.,0.)*.07;
  SD=normalize(vec3(.28,.16,-.92));
  F=flash()*(.55+.45*step(.35,hf(floor(T*45.))));
  float bi=floor(BR*4.);
  vec2 bo=SP.xz+vec2(hf(bi*7.7)-.5,hf(bi*9.3)-.5)*7.+vec2(0.,5.5);
  vec3 b0=vec3(bo.x,3.6,bo.y);
  vec3 b1=b0+vec3((hf(bi*3.1)-.5)*1.7,-1.2,(hf(bi*4.7)-.5)*1.7);
  vec3 b2=b1+vec3((hf(bi*5.9)-.5)*1.5,-1.3,(hf(bi*6.1)-.5)*1.5);
  vec3 bb=b1+vec3(1.1,-.35,1.1);
  // a second, fainter strike elsewhere in the cell
  vec3 c0=vec3(SP.x+(hf(bi*4.1)-.5)*9.,4.2,SP.z+(hf(bi*6.3)-.5)*9.+2.);
  vec3 c1=c0+vec3((hf(bi*2.9)-.5)*2.,-2.2,(hf(bi*8.3)-.5)*2.);
  vec3 c2=c1+vec3((hf(bi*1.7)-.5)*1.5,-2.,(hf(bi*9.1)-.5)*1.5);
  // camera: one chase - watch from the grass, push in, orbit the mesocyclone, pass under the shelf, follow the backside out
  vec3 roA=vec3(13.,1.6,5.),taA=vec3(SP.x*.3,3.2,SP.z);
  vec3 roB=vec3(8.,1.9,4.),taB=vec3(SP.x,4.5,SP.z);
  float oa=(BR-24.)*.13;
  vec3 roC=SP+vec3(sin(oa)*15.,2.4,cos(oa)*15.),taC=vec3(SP.x,2.8,SP.z);
  vec3 roD=SP+vec3(4.2,2.1,6.2),taD=SP+vec3(-2.5,3.6,-8.);
  vec3 roE=vec3(SP.x-1.5,1.8,SP.z-12.),taE=vec3(SP.x,6.5,SP.z+1.);
  vec3 roF=vec3(SP.x-5.,2.3,SP.z-19.),taF=vec3(SP.x+2.,8.,SP.z+5.);
  vec3 ro=mix(roA,roB,sm(6.,12.));
  ro=mix(ro,roC,sm(24.,25.));ro=mix(ro,roD,sm(40.,41.));
  ro=mix(ro,roE,sm(45.,47.));ro=mix(ro,roF,sm(56.,58.));
  vec3 ta=mix(taA,taB,sm(6.,12.));
  ta=mix(ta,taC,sm(24.,25.));ta=mix(ta,taD,sm(40.,41.));
  ta=mix(ta,taE,sm(45.,47.));ta=mix(ta,taF,sm(56.,58.));
  ro.xz+=vec2(sin(T*.6),sin(T*.43))*.1;ta.y+=sin(T*.8)*.06;
  vec3 fw=normalize(ta-ro),ri=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,ri);
  vec3 rd=normalize(fw+ri*u.x*.62+up*u.y*.62);
  float tg=rd.y<0.?-ro.y/rd.y:1e5;
  float t=0.,tr=1.;
  vec3 col=vec3(0);
  vec2 SDH=normalize(SD.xz);
  for(int i=0;i<96;i++){
    if(t>min(tg,60.))break;
    vec3 p=ro+rd*t;
    float de=dens(p);
    if(de>.015){
      float dt=.12+.055*t;
      float sh=0.;
      for(int j=0;j<3;j++)sh+=dens(p+SD*(1.5*exp2(float(j)*1.7)))*(1.2-.3*float(j));
      vec3 q=p-SP;float rr2=length(q.xz);
      // light leaks in under the anvil from the sunset side of the horizon
      float sg=sat(dot(q.xz/max(rr2,.001),SDH))*sat((rr2-14.)/22.);
      vec3 amb=((mix(vec3(.45,.38,.3),vec3(.13,.14,.18),org*.55)+vec3(.3,.24,.18)*cl*.9*sat((p.y-1.)/6.))*(.6+.4*sat((p.y-1.5)/9.))+vec3(.26,.19,.11)*sg)*(1.-.7*n2);
      vec3 li=amb+vec3(1.2,.85,.55)*.65*exp(-sh*1.1)*(1.-.6*org)*(1.-n2)+vec3(.8,.85,1.)*F*2.2/(1.+dot(p-b0,p-b0)*.5);
      float ab=de*dt*1.1;
      col+=tr*(1.-exp(-ab))*li;
      tr*=exp(-ab);
      if(tr<.02)break;
      t+=dt*.7;
    }else t+=.12+.055*t;
  }
  // the prairie
  if(rd.y<0.){
    vec3 gp=ro+rd*tg;
    gp.xz+=vec2(sin(gp.z*.25+T*2.6),cos(gp.x*.25+T*2.2))*.5*(1.-grw);
    float wet=ps*(1.-.6*cl);
    float g1=fbm(vec3(gp.x*.35,1.,gp.z*.35));
    vec3 alb=mix(vec3(.5,.42,.24),vec3(.33,.35,.16),g1);
    alb=mix(alb,vec3(.2,.14,.08),wet*.55)*(.75+.5*vno(vec3(gp.x*3.,5.,gp.z*3.)));
    float shad=1.-.72*org*sat(1.-length(gp.xz-SP.xz)/34.);
  vec3 gcol=alb*(mix(vec3(.5,.44,.36),vec3(.16,.17,.21),org)*1.6*shad*(1.-.5*n2)
      +vec3(1.2,.85,.55)*.3*exp(-dens(gp+SD*4.)*2.)*(1.-.7*org)*(1.-n2));
    float gd2=dot(gp-vec3(b2.x,0.,b2.z),gp-vec3(b2.x,0.,b2.z));
    gcol+=vec3(.75,.8,1.)*F*1.2/(1.+gd2*.4);
    float pud=sat((g1-.45)*3.)*wet;
    if(pud>0.){
      float fr2=pow(1.-sat(-rd.y),3.);
      gcol=mix(gcol,sky(reflect(rd,vec3(0.,1.,0.)))*.7+vec3(.6,.65,.8)*F*.3,pud*fr2*.7);
    }
    col+=tr*mix(gcol,sky(rd),sat(tg*.01));
  }else col+=tr*sky(rd);
  // telephone poles down the section line, wires sagging between them
  float pv=(1.-.85*org)+.6*cl;
  if(pv>.05&&rd.y>-.35){
    float pz=floor(ro.z/9.)*9.,tp=1e5,dmw=9.;
    for(int k=0;k<8;k++){
      float z0=pz+float(k)*9.-31.5;
      vec2 rel=vec2(ro.x-5.,ro.z-z0);
      float aa=dot(rd.xz,rd.xz),b2=dot(rd.xz,rel),c2=dot(rel,rel)-.0144;
      float disc=b2*b2-aa*c2;
      if(disc>0.){
        float tp2=(-b2-sqrt(disc))/aa;
        if(tp2>0.&&tp2<tp&&tp2<70.)if(ro.y+rd.y*tp2>0.&&ro.y+rd.y*tp2<5.6)tp=tp2;
      }
      dmw=min(dmw,seg(ro,rd,vec3(5.,5.32,z0),vec3(5.,4.97,z0+4.5)));
      dmw=min(dmw,seg(ro,rd,vec3(5.,4.97,z0+4.5),vec3(5.,5.32,z0+9.)));
      dmw=min(dmw,seg(ro,rd,vec3(5.,5.12,z0),vec3(5.,5.12,z0+9.)));
    }
    if(tp<70.&&(rd.y>0.||tp<tg))
      col=mix(col,vec3(.2,.16,.13)*(.5+.5*sat(dot(vec3(-.4,.8,.4),-rd)))+vec3(.75,.8,1.)*F*2.2/(1.+dot(ro+rd*tp-b0,ro+rd*tp-b0)*.5),pv*sat(1.5-tp/50.));
    if(dmw<.05)
      col=mix(col,vec3(.16,.13,.11),pv*sat(1.-dmw/.04));
  }
  // the bolt, and its twin deeper in the cell
  float dm=min(seg(ro,rd,b0,b1),min(seg(ro,rd,b1,b2),seg(ro,rd,b1,bb)));
  col+=tr*vec3(.7,.78,1.)*(exp(-dm*dm*450.)*2.2+exp(-dm*dm*25.)*.35)*F;
  float dm2=min(seg(ro,rd,c0,c1),seg(ro,rd,c1,c2));
  col+=tr*vec3(.6,.68,1.)*(exp(-dm2*dm2*600.)*1.4+exp(-dm2*dm2*30.)*.2)*F;
  // the rainbow hangs in the retreating rain, in front of the storm
  col+=rainbow(rd)*sat(tr+.35);
  col*=1.-sm(62.,64.);
  O=vec4(col,(1.-grw)*.3+ps*.25);
}
