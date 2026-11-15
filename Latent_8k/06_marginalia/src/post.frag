#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
const int K[32]=int[32](0, 1,2,3,8,9,10,11,16,4, 2,1,10,3,0,9,18,11,17,2,4,10,19,8,1,12, 16,9,3,2,1,0);
// Draws the scene buffer as a pen-and-wash sketch: wobbling outlines, cross-hatching, watercolour washes,
// splatters on the drum'n'bass snares, handwritten captions and a seal.
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
float fb(vec2 p){return ns(p)*.5+ns(p*2.1+5.)*.3+ns(p*4.3+9.)*.2;}
vec4 S(vec2 p){return texture(A,p/R.xy);}
// one row of handwriting from the text texture, centred at c, h = row height, rv = how much has been written
float tx(vec2 u,vec2 c,float h,float r,float rv){
  vec2 p=(u-c)/h;
  return p.y>0.&&p.y<1.&&abs(p.x)<8.&&p.x<rv-8.?texture(B,vec2(.5+p.x/16.,(r+1.-p.y)/9.)).r:0.;
}
void main(){
  vec2 f=gl_FragCoord.xy,u=(f-.5*R.xy)/R.y;
  float T=R.z,br=T*.375,
        q=br<4.?br/4.:br<22.?(br-4.)/2.+1.:br<38.?br-12.:(br-38.)/2.+26.,
        sl=br<4.?4.:br>=22.&&br<38.?1.:2.,ts=fract(q)*sl,fr=floor(T*12.),k=0.,id=floor(min(q,31.));
  bool D=sl<1.5;
  // the pen has drawn this much of the shot: outlines first, then hatching, then the washes
  float pr=ts/(D?.3:br<4.?2.2:.7),rn=.6*fb(u*3.+id)+.4*(u.x+.9)/1.8;
  // boiling: the drawing is slightly different on every 12th of a second
  vec2 g=f+(vec2(ns(f*.015+fr*7.1),ns(f*.015+fr*3.3+50.))-.5)*4.;
  vec4 s=S(g);
  vec3 pa=vec3(.96,.93,.86)*(.96+.04*fb(f*.3))-(h1(f)-.5)*.02,ab=vec3(0);
  if(s.g>0.){
    // outlines where depth jumps
    float e=0.,w=1.+1.2*ns(f*.01+fr*.3);
    for(int j=0;j<4;j++){
      vec2 o=vec2(j&1,j>>1)*2.-1.;
      vec4 n=S(g+o*w);
      e=max(e,smoothstep(.02,.07,abs(n.g-s.g)/min(n.g,s.g))+smoothstep(.25,.5,abs(n.r-s.r))*.5);
    }
    k=e*(.25+.75*exp(-s.g*.015))*step(rn,pr*1.4);
    // cross-hatching: four layers of strokes, each switched on below a tone
    float hp=sat(pr*1.4-.35-rn);
    for(int j=0;j<4;j++){
      float a=.7+float(j)*1.3,th=.85-float(j)*.2,wd=sat((th-s.r)*3.5)*hp;
      vec2 d=vec2(cos(a),sin(a));
      float v=dot(g,d)/(6.+float(j)),x=dot(g,vec2(-d.y,d.x))/70.+h1(vec2(floor(v),j));
      v+=.25*ns(vec2(x*3.,v*.1))+.15*h1(vec2(j,fr));
      k=max(k,smoothstep(wd*.45,wd*.45-.15,abs(fract(v)-.5))*step(fract(x),.94)*.85);
    }
    k=max(k,sat((.2-s.r)*5.)*hp*.8);
    ab+=(1.-s.r)*.2*vec3(1,1,.9);
  }else ab+=(1.-s.r)*2.2*vec3(.9,.95,1)*(.8+.4*ns(f*.4));
  // watercolour: the washes bleed past the lines, granulate and darken at their edges
  vec2 bp=(f+(vec2(fb(u*4.+id),fb(u*4.+id+9.))-.5)*30.)/R.xy;
  vec4 c=texture(A,bp),l=textureLod(A,bp,4.);
  float wp=sat(pr*1.4-.6-rn*.5)*(.8+.4*ns(f*.25));
  ab+=wp*((c.b+max(c.b-l.b,0.)*1.5)*vec3(2.,1.1,.35)+(c.a+max(c.a-l.a,0.)*1.5)*vec3(.12,1.4,1.8));
  // the drawing sits inside a ragged frame, except in the drum'n'bass part
  vec2 bq=abs(u-vec2(0,.04))-vec2(.76,.39);
  float m=D?1.:smoothstep(.0,-.01,max(bq.x,bq.y)+.015*fb(u*12.)-.005);
  if(!D&&br<4.)m*=smoothstep(.1,.6,br*.5-rn);
  k*=m;ab*=m;
  // splatters on the snares
  if(D)for(int j=0;j<4;j++){
    float a=ts*16.-float(j*4+2);
    if(a<0.)continue;
    vec2 c=(vec2(h1(vec2(id,j)),h1(vec2(j,id)+5.))-.5)*vec2(1.5,.8);
    float sp=0.,z=sat(a*4.);
    for(int n=0;n<10;n++){
      float an=h1(vec2(n,j)+id)*6.28,di=n==0?0.:pow(h1(vec2(j,n)+id*2.),2.)*.3*z;
      sp=max(sp,smoothstep(.003,0.,length(u-c-di*vec2(cos(an),sin(an)))-(n==0?.06*z:.012*h1(vec2(n,id)))*(1.-.4*fb(u*40.))));
    }
    if(j==2)ab+=sp*vec3(.1,1.6,2.);else k=max(k,sp);
  }
  // handwriting: title, captions, credits
  float tp=0.,tb=br-.5,cr=br-46.;
  tp=max(tx(u,vec2(0,-.02),.16,0.,tb*12.),tx(u,vec2(0,-.12),.07,1.,(tb-1.)*20.))*step(br,4.);
  if(!D&&id>0.&&id<30.)tp=max(tp,tx(u,vec2(0,-.47),.07,float(K[int(id)]&7)+2.,(ts-.3)*14.));
  if(cr>0.)tp=max(max(tp,tx(u,vec2(0,-.47),.07,7.,cr*16.)),tx(u,vec2(0,-.02),.16,0.,(cr-1.4)*12.));
  vec2 tq=abs(u-vec2(0,.03))-vec2(.36,.16);
  float hb=smoothstep(.01,-.01,max(tq.x,tq.y)+.01*fb(u*20.))*(br<4.?sat(tb*2.):0.);
  if(cr>0.)hb=smoothstep(rn,rn+.2,cr*.8);
  k*=1.-hb;ab*=1.-hb;
  k=max(k,tp);
  // the seal: a vermilion stamp with LATENT knocked out
  float sa=max(br<4.?br-2.:cr-2.5,0.);
  if(sa>0.){
    vec2 p=mat2(.99,.12,-.12,.99)*(u-vec2(.72,-.43))*(1.+.4*exp(-sa*20.));
    float st=step(max(abs(p.x),abs(p.y)),.045+.003*ns(p*90.))*step(.25,ns(p*140.)+.3);
    st*=1.-tx(p,vec2(0,-.015),.03,8.,99.);
    ab+=st*vec3(.15,1.8,2.2)*sat(sa*30.);
  }
  vec3 ik=vec3(.1,.1,.15),col=mix(pa*exp(-ab),ik,k);
  // scratchboard: every second shot of the drum'n'bass part is white on black
  if(D&&mod(id,2.)==1.)col=mix(ik*.6+vec3(.5,.06,.04)*min(ab.b,1.),pa,k);
  col*=1.-.25*dot(u,u);
  O=vec4(col*smoothstep(50.,49.6,br)*sat(T*2.),1);
}
