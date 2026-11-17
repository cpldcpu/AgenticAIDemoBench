#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;
float h1(float p){return fract(sin(p*127.1)*43758.5453);}
// integer hash noise, no periodicity at audio rates (uint hash as in 10_geode)
float hs(float x){uint h=uint(x)*747796405u+2891336453u;h=((h>>((h>>28u)+4u))^h)*277803737u;h=(h>>22u)^h;return float(h)/4294967295.;}
float sat(float x){return clamp(x,0.,1.);}
void main(){
  float i=gl_FragCoord.x+gl_FragCoord.y*4096.,br=i/96000.;
  float bp=fract(br*4.),bi=floor(br*4.);
  float grw=smoothstep(8.,16.,br),org=smoothstep(16.,24.,br),pk=smoothstep(30.,34.,br),
        ps=smoothstep(40.,44.,br),cl=smoothstep(47.,54.,br),ni=smoothstep(57.,63.,br);
  // lightning envelope - the SAME law as the scene shader, so thunder strikes on the picture
  float pr=mix(.2,.9,sat((br-24.)/16.))*(1.-sat((br-50.)/6.));
  float F=step(24.,br)*(1.-step(56.,br))*step(pr,h1(bi*3.7))*exp(-bp*7.);
  float d1=br-24.,d2=br-40.;F+=exp(-d1*d1*22.)+exp(-d2*d2*22.);
  float o=0.;
  // prairie wind: three noise bands, gusting
  float w=(hs(floor(i*.07))-.5)*.7+(hs(floor(i*.31))-.5)*.25+(hs(floor(i*1.9))-.5)*.05;
  o+=w*(.05+.13*org+.09*ps*(1.-cl)+.06*ni)*(1.+.35*sin(br*2.2));
  // drone pad: A minor, warms as the tower grows
  float pad=sin(i*.0072256)+.7*sin(i*.010838)+.45*sin(i*.014451)+.3*sin(i*.021676);
  o+=pad*(.08+.05*grw)*(1.-.45*cl)*(1.-.8*ni);
  // heartbeat kick building under the tower
  float ke=exp(-bp*9.);
  o+=sin(i*6.2832*(50.+150.*exp(-bp*16.))/48000.)*ke*.15*step(8.,br)*step(br,24.);
  // build: rising line, noise riser, snare roll on the last bar
  o+=sin(i*6.2832*(55.+(br-16.)*16.)/48000.)*.05*org*(1.-step(24.,br));
  o+=(hs(floor(i*.9))-.5)*.15*org*(1.-step(24.,br));
  float rp=fract(br*16.);
  o+=(hs(floor(i*1.2))-.5)*exp(-rp*6.)*.22*step(23.,br)*step(br,24.);
  // the drop: four-on-the-floor with the storm overhead, half-time in the clearing
  float ht=step(48.,br),kb=mod(bi,2.);
  float dk=step(24.,br)*(1.-.55*cl)*(1.-.7*ni);
  o+=sin(i*6.2832*(45.+160.*exp(-bp*20.))/48000.)*exp(-bp*8.)*.36*dk*mix(1.,step(.5,kb),ht);
  // offbeat wobble bass: A A C G, wobble accelerating near the peak
  float m=mod(br,4.);
  float nt=3.*step(2.,m)*step(m,3.)-2.*step(3.,m);
  float wob=mix(4.,8.,step(.5,fract(br*.5)))*mix(1.,2.,step(50.,br));
  float bf=55.*pow(1.0594631,nt)*(1.+.015*sin(i*.0000655));
  o+=sin(i*6.2832*bf/48000.)*(.55+.45*sin(fract(br*wob)*6.2832))*.27*dk;
  // hats like rain on a tin roof
  o+=exp(-fract(br*8.)*22.)*(hs(floor(i*2.3))-.5)*.1*step(28.,br)*(1.-.8*ps)*(1.-.9*cl)*(1.-.8*ht);
  // the rain bed as the cell passes overhead
  o+=(hs(floor(i*1.4))-.5)*.11*ps*(1.-cl);
  // snare on 2 and 4
  float se=exp(-bp*14.);
  o+=((hs(floor(i*1.1))-.5)*.8+sin(i*.024272)*.35)*se*.2*step(30.,br)*(1.-.5*ps)*(1.-.9*cl)*(1.-ht);
  // thunder: the flash envelope drives a sub sweep and brown noise - strike and boom are one
  o+=(sin(i*.004973)*.65+(hs(floor(i*.6))-.5)*.5)*F*.5;
  // the clearing: plucked A major arpeggio over half-time, warm pad strings under it
  float mn=mod(floor(br*2.),4.);
  float pn=3.*step(.5,mn)*step(mn,1.5)+7.*step(1.5,mn)*step(mn,2.5)+12.*step(2.5,mn);
  o+=sin(i*6.2832*220.*pow(1.0594631,pn)/48000.)*exp(-fract(br*2.)*5.)*.1*cl*(1.-ni)*step(48.,br)*(1.-step(58.,br));
  float pd=sin(i*.014451)+.6*sin(i*.018191)+.4*sin(i*.021676)+.25*sin(i*.027243);
  o+=pd*.06*cl*(1.-ni)*step(49.,br);
  // night: crickets and one distant rumble
  o+=sin(i*.576)*pow(sat(sin(i*.0032)),6.)*step(.5,hs(floor(i*.006)))*.045*ni;
  o+=sin(i*.004062)*exp(-abs(br-59.)*1.2)*.18*ni;
  o*=1.-.95*smoothstep(62.5,64.,br);
  o=tanh(o*1.15);
  O=vec4(o,o*.92+(h1(i)*.01-.005),0.,1.);
}
