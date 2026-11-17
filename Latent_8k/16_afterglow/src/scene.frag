#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
float T,BR,Rstar,Rg,ig,rg,cl,sn,af;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float vno(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(h1(i),h1(i+vec3(1,0,0)),f.x),mix(h1(i+vec3(0,1,0)),h1(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h1(i+vec3(0,0,1)),h1(i+vec3(1,0,1)),f.x),mix(h1(i+vec3(0,1,1)),h1(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 tmp(float x){vec3 c=mix(vec3(1.,.2,.02),vec3(1.,.85,.5),sat(x*1.2));return mix(c,vec3(.75,.85,1.),sat(x-.55)*2.);}
float map(vec3 p){
  float d=1e5;
  if(BR<47.){
    float n=(vno(p*2.5+vec3(0.,0.,T*.35))-.5)*.14+(vno(p*9.+vec3(T*.1,0.,0.))-.5)*.05;
    d=length(p)-Rstar*(1.+n);
  }else if(BR<58.){
    d=length(p)-Rg;
  }
  if(BR>54.)d=min(d,length(p)-.09);
  return d;
}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;u.x*=R.x/R.y;
  T=R.z;BR=T/1.6;
  ig=smoothstep(0.,10.,BR);rg=smoothstep(26.,38.,BR);cl=smoothstep(41.,46.,BR);
  sn=smoothstep(47.,49.,BR);af=smoothstep(58.,63.,BR);
  Rstar=(.25+.75*ig)*(1.+1.6*rg)*(1.-.98*cl);
  Rg=mix(.07,8.,smoothstep(47.,58.,BR));Rg=mix(Rg,4.,af);
  float D=mix(30.,7.,smoothstep(0.,24.,BR));D=mix(D,2.2,cl);D=mix(D,14.,smoothstep(47.,58.,BR));D=mix(D,13.,af);
  float an=BR*.06;
  vec3 ro=vec3(cos(an)*D,.3*D+1.2,sin(an)*D),ta=vec3(0.);
  vec3 fw=normalize(ta-ro),ri=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,ri);
  vec3 rd=normalize(fw+ri*u.x*.55+up*u.y*.55);
  vec3 cen=normalize(-ro);
  float ang=acos(sat(dot(rd,cen)));
  float t=.1;vec3 p;bool hit=false;
  for(int i=0;i<90;i++){p=ro+rd*t;float d=map(p);if(d<.002){hit=true;break;}t+=max(d,.01)*.85;if(t>50.)break;}
  vec3 col=vec3(.01,.012,.018);
  vec3 id=floor(rd*240.);
  col+=pow(h1(id),400.)*vec3(1.,.95,.9);
  col+=pow(h1(id+7.31),220.)*.3*vec3(.8,.9,1.);
  col+=vec3(.25,.08,.12)*pow(vno(rd*2.2+vec3(1.,2.,3.)),2.)*(1.-af)*.6;
  float glow=0.;
  float hd=length(cross(ro,rd));
  if(BR<47.){
    float temp=.2+.45*ig;temp=mix(temp,.12,rg);
    float thick=(.5+.25*rg)*(1.-.8*cl);
    float co=exp(-max(hd-Rstar,0.)/thick)*(1.-.7*cl);
    col+=tmp(temp)*co*.8;glow+=co*1.2;
  }
  if(BR>=58.){
    float th=atan(Rg,max(D,.001));
    float fil=.1+.9*vno(rd*8.+vec3(0.,0.,T*.05));
    float neb=(1.-smoothstep(th-.3,th+.4,ang))*fil;
    vec3 shcol=mix(vec3(1.,.95,.85),vec3(.15,.6,.5),af);
    shcol=mix(shcol,vec3(.9,.35,.15),af*.5);
    col+=shcol*neb*mix(1.6,.9,af);
    glow+=neb;
    col+=vec3(.05,.2,.16)*pow(vno(rd*2.2+vec3(4.,5.,6.)),2.)*af*.7;
  }
  if(BR>47.)col+=vec3(1.,.97,.9)*exp(-(BR-47.)*1.6)*step(47.,BR)*2.5;
  if(BR>54.){
    col+=vec3(.6,.8,1.)*exp(-ang*25.)*af*1.2;
    vec3 ax=normalize(vec3(sin(BR*.22),.4,cos(BR*.22)));
    float be=pow(sat(dot(rd,ax)),40.)+pow(sat(dot(rd,-ax)),40.);
    col+=vec3(.5,.7,1.)*be*2.6;
    col+=vec3(.3,.5,.8)*pow(sat(dot(rd,ax)),4.)*.12;
    glow+=be*2.;
  }
  if(BR>60.){
    // new protostars kindle in the dust: the cycle begins again
    float ks=pow(h1(floor(rd*90.)+13.7),60.)*af*smoothstep(60.,70.,BR);
    col+=vec3(1.,.7,.4)*ks*1.6;
    glow+=ks;
  }
  if(hit){
    if(BR<47.){
      vec3 e=vec3(.003,0.,0.);
      vec3 n=normalize(vec3(map(p+vec3(e.x,0.,0.))-map(p-vec3(e.x,0.,0.)),
                            map(p+vec3(0.,e.x,0.))-map(p-vec3(0.,e.x,0.)),
                            map(p+vec3(0.,0.,e.x))-map(p-vec3(0.,0.,e.x))));
      float temp=.2+.45*ig;temp=mix(temp,.12,rg);
      float emis=1.-.9*cl;
      float limb=sat(dot(n,-rd));
      col=tmp(temp)*(.55+.45*limb)*emis*1.35;
      col*=.7+.3*vno(p*18.+vec3(T*.4,0.,0.));
      col+=tmp(temp)*exp(-abs(hd-Rstar)/.3)*.6;
      glow+=2.*emis;
    }else if(BR<58.){
      vec3 e=vec3(.003,0.,0.);
      vec3 n=normalize(vec3(map(p+vec3(e.x,0.,0.))-map(p-vec3(e.x,0.,0.)),
                            map(p+vec3(0.,e.x,0.))-map(p-vec3(0.,e.x,0.)),
                            map(p+vec3(0.,0.,e.x))-map(p-vec3(0.,0.,e.x))));
      float fil=.1+.9*vno(n*6.+vec3(0.,0.,T*.1));
      fil*=.4+.6*vno(n*15.+vec3(T*.2,0.,0.));
      col=vec3(1.,.95,.85)*fil*2.2;
      col+=vec3(.6,.8,1.)*pow(sat(dot(n,-rd)),3.)*.5;
      glow+=fil*2.;
    }else{
      col=vec3(.7,.85,1.)*4.;glow+=3.;
    }
  }
  col*=1.-smoothstep(72.,75.,BR);
  O=vec4(col,glow);
}
