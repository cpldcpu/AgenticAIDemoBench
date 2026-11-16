#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;
float sat(float x){return clamp(x,0.,1.);}
float h1(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 f=gl_FragCoord.xy,q=f/R.xy,u=q-.5;
  float T=R.z,br=T/1.875,a=6.28*h1(f+fract(T)*99.);
  vec3 c=texture(A,q).rgb,b=vec3(0);
  // a soft glow from the mip chain
  for(float l=2.;l<7.;l++){
    vec2 o=exp2(l)/R.xy*vec2(cos(a+l),sin(a+l));
    b+=(textureLod(A,q+o,l)+textureLod(A,q-o,l)).rgb;
  }
  c=mix(c,b/10.,.1);
  // the house lights follow the kick drum
  c*=1.+.07*exp(-fract(T*2.13333)*6.)*step(4.,br);
  c*=1.-dot(u,u)*.5;
  c=pow(1.-exp(-2.*c),vec3(.45));
  // an iris opens the show, closes between the acts and at the end
  a=min(min(abs(br-20.),abs(br-32.)),min(br,63.-br)*.5);
  c*=smoothstep(0.,.03,a*4.-length(u*vec2(R.x/R.y,1)));
  // a flash when the finale begins, and confetti until the last chord
  c+=step(44.,br)*exp(min(44.-br,0.)*8.);
  for(float i=0.;i<3.;i++){
    vec2 g=(u*vec2(R.x/R.y,1)+vec2(sin(T*.7+i*2.)*.05,T*(.25+.1*i)))*(7.+3.*i)+i*5.3;
    float h=h1(floor(g));
    a=h*99.+T*(h-.9)*20.;
    g=(fract(g)-.5)*mat2(cos(a),sin(a),-sin(a),cos(a));
    if(h>.86&&br>44.&&br<61.&&abs(g.x)<.16&&abs(g.y)<.09*abs(cos(T*6.*h+i)))c=vec3[3](vec3(.9,.2,.15),vec3(1,.8,.1),vec3(.15,.3,.75))[int(h*50.)%3];
  }
  // captions: rows of texture B, each with a first bar and a length; white in the dark acts, black otherwise
  for(int i=0;i<7;i++){
    float n=float[7](0.,1.,2.,3.,4.,0.,5.)[i],x=br-float[7](.5,4.1,20.2,32.2,44.,60.6,60.6)[i],
          L=float[7](3.2,1.8,1.8,1.8,1.4,3.,3.)[i],s=i<1?2.:n<1.?1.5:.8;
    vec2 p=vec2(u.x/s+.5,(u.y-(i==5?.3:i<1?-.36:-.38))*9./s+.5);
    if(x>0.&&x<L&&p.y>0.&&p.y<1.&&p.x>0.&&p.x<1.){
      p.y=(n+1.-p.y)/9.;
      c=mix(c,vec3(br<4.||br>32.&&br<44.?.95:.02),texture(B,p).r*sat(min(x,L-x)*6.));
    }
  }
  O=vec4(c+(h1(f+T*83.)-.5)*.02,1);
}
