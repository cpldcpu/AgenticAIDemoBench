#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,u=f/R.xy-.5,v=u,q;
  float T=R.z,br=T/1.6667,cut=sat(texture(A,vec2(.5)).a),
        // diffusion: 0 = pure noise, 1 = clean. The track starts and ends in noise.
        pr=min(sat(br/7.),1.-sat((br-73.)/6.5)),n=floor(pr*50.);
  vec3 c=vec3(0),b=c;
  // cuts: rows slip sideways
  v.x+=(h1(vec2(floor(u.y*30.),floor(T*30.)))-.5)*.25*cut*cut;
  // diffusion: the picture is rendered in blocks that get smaller with every step
  float bs=exp2(floor(6.*(1.-pr)));
  vec2 k=floor(f/bs);
  if(bs>1.)v=(k+.5)*bs/R.xy-.5;
  q=v+.5;
  // chromatic aberration
  for(int i=0;i<3;i++)c[i]=texture(A,.5+v*(1.-.005*float(i))).rgb[i];
  // bloom from the mip chain, 4 taps per level
  for(float l=2.;l<8.;l++){
    float a=6.28*h1(f+l*7.+T*91.);
    vec2 o=exp2(l)/R.xy*1.2*vec2(cos(a),sin(a)),p=vec2(-o.y,o.x);
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)+textureLod(A,q+p,l)+textureLod(A,q-p,l)).rgb;
  }
  // anamorphic streak from the highlights
  for(float i=-6.;i<7.;i++)b+=max(textureLod(A,q+vec2(i*.03,0),4.).rgb-.7,0.)*exp(-abs(i)*.4)*1.5;
  c+=b*.006;
  c+=cut*.3;
  c=mix(c,vec3(h1(k+n),h1(k+n+9.),h1(k+n+19.)),pow(1.-pr,2.)*.95);
  c*=1.-dot(u,u)*.8;
  // text: rows of the texture B, each with a start bar and a length
  for(int i=0;i<10;i++){
    int r=int[10](0,1,2,3,4,5,6,7,1,0)[i];
    float x=br-float[10](.5,3.6,8.,12.,24.,32.2,48.,60.,73.5,77.)[i],L=float[10](3.4,4.4,4.,4.,4.,4.,4.,6.,3.5,3.)[i],s=r==2?1.5:.85;
    vec2 p=vec2((u.x+.44)/s,(u.y+.4)*9./s);
    if(x>0.&&x<L&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      float a=sat(min(x,L-x)*6.),cx=(p.x*2048.-64.)/35.19,row=float(r);
      c*=1.-.75*a;
      if(r==0)a*=step(p.x,.031+.0172*floor(x*13.));
      // step counter: two digits from the digit strip in row 8
      if(r==1&&cx>=5.&&cx<7.){
        float d=cx<6.?floor(n/10.):mod(n,10.);
        p.x=(64.+35.19*(d+fract(cx)))/2048.;row=8.;
      }
      p.y=(row+1.-p.y)/9.;
      c+=(texture(B,p).r+textureLod(B,p,3.).r*.25)*a*(r==2||r==7?vec3(1,.95,.85):vec3(.6,.9,1));
    }
  }
  c=c*(2.51*c+.03)/(c*(2.43*c+.59)+.14);
  c=pow(c,vec3(.45));
  c+=(h1(f+T*83.)-.5)*.03;
  O=vec4(c*smoothstep(80.,79.4,br),1);
}
