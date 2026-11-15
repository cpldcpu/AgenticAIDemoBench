#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;

float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}

void main(){
  vec2 f=gl_FragCoord.xy,u=f/R.xy-.5;
  float T=R.z,BR=T*.53333,
        dt=BR<8.?1.:BR<55.?mod(BR-8.,10.):BR-62.,
        cut=dt>=0.&&dt<.35?exp(-dt*22.):0.;
  vec2 v=u*(.98+.04*dot(u,u));
  if(cut>.01)v.x+=(h1(vec2(floor(u.y*36.),floor(T*35.)))-.5)*.16*cut;
  vec2 q=v+.5;
  vec3 c=vec3(0),b=c,ana=c;
  for(int i=0;i<3;i++)c[i]=texture(A,.5+v*(1.-(.004+.005*cut)*float(i))).rgb[i];
  for(float l=2.;l<8.;l++){
    float a=6.283*h1(f+l*7.+T*91.);
    vec2 sc=exp2(l)/R.xy,o=sc*1.25*vec2(cos(a),sin(a)),p=vec2(-o.y,o.x);
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)+textureLod(A,q+p,l)+textureLod(A,q-p,l)).rgb;
    if(l<6.){vec2 ho=vec2(sc.x*3.,0);ana+=(textureLod(A,q+ho,l)+textureLod(A,q-ho,l)).rgb;}
  }
  c=(c+b*.009+ana*vec3(.25,.75,1)*.012+cut*.28)*(1.-dot(u,u)*.8);

  if(BR>=1.&&BR<71.){
    vec2 au=abs(u),bk=step(abs(au-.465),vec2(.001))*step(.41,au.yx);
    c+=vec3(.25,.75,1)*((bk.x+bk.y)*step(max(au.x,au.y),.467)*.5
      +step(abs(u.y+.46),.0012)*step(abs(u.x),.45)*step(u.x+.45,BR*.0122)*.4)*smoothstep(1.,2.5,BR)*smoothstep(71.,68.,BR);
  }

  for(int i=0;i<8;i++){
    bool h=i>5;
    float dur=h?4.5:5.2,x=BR-(h?(i==6?3.2:63.2):i<1?.5:float(i)*10.-1.7);
    if(x>0.&&x<dur){
      vec2 p=h?vec2(u.x/1.05+.5,(u.y-(i==6?.22:-.24))*8.+.5):vec2((u.x+.44)/.75,(u.y+.4)*15.);
      if(min(p.x,p.y)>0.&&max(p.x,p.y)<1.){
        float a=clamp(min(x,dur-x)*4.,0.,1.);
        c*=1.-.5*a;if(!h)a*=step(p.x,x*1.5);
        p.y=(float(i)+1.-p.y)/8.;
        c+=(texture(B,p).r+textureLod(B,p,2.5).r*.3)*a*(i>6?vec3(1,.88,.68):vec3(.7,.92,1))*1.2;
      }
    }
  }

  c=pow(max(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),0.),vec3(.45));
  c=mix(c,fract(vec3(61,67,71)*h1(f+T*61.))*.65,pow(1.-min(BR/1.6,1.),2.))+(h1(f+T*83.)-.5)*.028;
  O=vec4(c*smoothstep(73.6,70.8,BR),1);
}
