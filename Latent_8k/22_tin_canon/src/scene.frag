#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D B;
out vec4 O;

const vec3 ink=vec3(.025,.115,.16), milk=vec3(1.,.925,.72), red=vec3(.85,.19,.125), gold=vec3(.99,.70,.21);
float bar,opening,rollX,rollRadius,pixel;
mat2 turn(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
float rnd(vec2 p){vec3 q=fract(p.xyx*vec3(.1031,.11369,.13787));q+=dot(q,q.yzx+19.19);return fract((q.x+q.y)*q.z);}
float cover(float d){return 1.-smoothstep(-pixel,pixel,d);}
float box2(vec2 p,vec2 size){vec2 a=abs(p)-size;return length(max(a,0.))+min(max(a.x,a.y),0.);}
float rim(vec2 p){return box2(p,vec2(1.25,.60))-.22;}
float letters(vec2 p,vec2 mid,vec2 halfsize,float line){
    vec2 uv=(p-mid)/halfsize*.5+.5;
    if(any(greaterThan(abs(uv-.5),vec2(.5))))return 0.;
    return texture(B,vec2((8.+uv.x*1000.)/1024.,(line*180.+140.-uv.y*110.)/2048.)).a;
}
// Each fin is specified with three counterclockwise points.
float edge(vec2 p,vec2 a,vec2 b){vec2 d=normalize(b-a);return dot(p-a,vec2(d.y,-d.x));}
float tri(vec2 p,vec2 a,vec2 b,vec2 c){return max(edge(p,a,b),max(edge(p,b,c),edge(p,c,a)));}
float widthAt(float x){return .30*sqrt(max(0.,1.-(x+.012)*(x+.012)/(.92*.92)))*(.93+.40*x);}
float fishShape(vec2 p){
    float body=max(abs(p.y)-widthAt(p.x),abs(p.x+.012)-.92);
    float fins=min(tri(p,vec2(-1.31,.32),vec2(-1.16,0),vec2(-.73,.008)),tri(p,vec2(-1.31,-.31),vec2(-.73,.008),vec2(-1.16,0)));
    fins=min(fins,tri(p,vec2(-.39,.18),vec2(.23,.22),vec2(-.08,.44)));
    fins=min(fins,tri(p,vec2(-.20,-.18),vec2(-.05,-.37),vec2(.11,-.22)));
    return min(body,fins);
}
vec3 scales(vec2 p,float phase){
    float flank=clamp(p.y/max(.025,widthAt(p.x)),-1.,1.);
    vec3 c=mix(vec3(.49,.70,.71),milk,smoothstep(-1.,-.40,flank));
    c=mix(c,vec3(.075,.39,.44),smoothstep(-.30,.80,flank));
    float side=exp(-9.*abs(flank+.07+.19*sin(4.*p.x+phase)));
    c+=side*vec3(.44,.30,.12);
    vec2 rows=p*vec2(16.,23.);
    rows.x+=.5*mod(floor(rows.y),2.);
    float arc=length((fract(rows)-vec2(.38,.50))*vec2(.85,1.));
    float head=smoothstep(.34,.41,p.x+.68*p.y*p.y);
    c*=1.-.25*(1.-head)*(1.-smoothstep(.015,.08,abs(arc-.43)));
    c*=1.-.62*smoothstep(.25,.67,flank)*smoothstep(.1,.8,sin(35.*p.x+8.*flank))*(1.-head);
    c=mix(c,ink,.64*exp(-120.*abs(p.x-.38-1.45*p.y*p.y)));
    if(abs(p.y)>widthAt(p.x)||p.x<-.90)c=mix(vec3(.72,.31,.18),gold,.42+.34*cos(65.*atan(p.y,p.x+.75)));
    vec2 eye=p-vec2(.65,.076);
    c=mix(c,ink,1.-smoothstep(.086,.094,length(eye)));
    c=mix(c,gold,1.-smoothstep(.063,.076,length(eye)));
    c=mix(c,ink,1.-smoothstep(.040,.050,length(eye)));
    c=mix(c,vec3(1.),1.-smoothstep(.014,.023,length(eye-vec2(.018,.02))));
    c=mix(c,ink,.8*exp(-120.*abs(p.y+.05-.10*(p.x-.72)))*smoothstep(.70,.80,p.x));
    return c;
}
vec3 badge(vec2 p){
    float d=rim(p);
    vec3 c=mix(red,ink,cover(d+.095));
    c=mix(c,gold,cover(abs(d+.135)-.008));
    c=mix(c,red,cover(d+.16));
    c*=.97+.03*sin(28.*atan(p.y+.11,p.x+.79));
    // A fish on a cream oval, with a two-colour engraved flank.
    vec2 med=(p-vec2(-.76,-.035))/vec2(.52,.42);
    c=mix(c,gold,cover(length(med)-1.04));
    c=mix(c,milk,cover(length(med)-.995));
    vec2 fp=turn(-.19)*(p-vec2(-.70,-.035))/.41;
    c=mix(c,ink,cover(fishShape(fp)));
    vec2 hatch=fp*vec2(4.7,8.6);
    hatch.x+=.5*mod(floor(hatch.y),2.);
    float fry=cover(fishShape((fract(hatch)-.5)*vec2(2.55,1.82)));
    c=mix(c,milk,cover(fishShape(fp)+.035)*fry*.93);
    c=mix(c,milk,cover(length(fp-vec2(.63,.075))-.065));
    c=mix(c,milk,letters(p,vec2(.43,.17),vec2(.73,.235),0.));
    c=mix(c,ink,letters(p,vec2(.44,-.199),vec2(.64,.091),2.));
    c=mix(c,milk,letters(p,vec2(.43,-.42),vec2(.50,.052),3.));
    c=mix(c,milk,letters(p,vec2(0,.565),vec2(.57,.052),1.));
    c=mix(c,milk,letters(p,vec2(-.77,-.55),vec2(.20,.05),6.));
    return c;
}
vec2 nearer(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec2 metalwork(vec3 p){
    float d=rim(p.xy);
    // Hollow stamped pan with a bead around the mouth.
    float wall=max(abs(d+.022)-.024,abs(p.z-.22)-.194);
    float base=max(d,abs(p.z-.042)-.035);
    vec2 item=vec2(min(base,wall),1.);
    item=nearer(item,vec2(length(vec2(d+.012,p.z-.423))-.030,2.));
    item=nearer(item,vec2(max(max(d+.038,p.x-rollX),abs(p.z-.411)-.009),3.));
    vec3 spindle=p-vec3(rollX,0,.419+rollRadius);
    item=nearer(item,vec2(max(length(spindle.xz)-rollRadius,abs(p.y)-.773),4.));
    // Slotted winding key extends past the near lip.
    vec2 handle=turn(-opening*10.)*spindle.xz;
    float shaft=max(length(spindle.xz)-.033,abs(p.y+.87)-.21);
    float loopD=(length(vec2(handle.x*1.65,p.y+1.22))-.185)*.70;
    item=nearer(item,vec2(min(shaft,length(vec2(loopD,handle.y))-.024),2.));
    float inside=bar<71.5?.262:.085;
    return nearer(item,vec2(max(d+.039,p.z-inside),5.));
}
vec3 alloy(vec3 n,vec3 rd,vec3 p){
    vec3 r=reflect(rd,n);
    float a=r.z*.72+r.x*.65-r.y*.24;
    vec3 col=mix(vec3(.12,.21,.22),vec3(.75,.79,.73),smoothstep(-.70,.12,a));
    col=mix(col,vec3(.20,.26,.25),smoothstep(.15,.31,a));
    col+=vec3(.78,.76,.64)*(smoothstep(.38,.53,a)-smoothstep(.68,.77,a));
    col+=.25*pow(max(0.,r.z),8.);
    return col*(.98+.027*sin(p.y*470.+sin(p.x*17.)));
}
vec3 lunch(vec2 p){
    vec2 tile=fract((turn(.16)*p+.2)/1.5)-.5;
    float grout=max(abs(tile.x),abs(tile.y));
    vec2 k=abs(tile);
    float petal=length(vec2((k.x-k.y)*2.6,k.x+k.y-.35))-.235;
    vec3 glaze=vec3(.84,.86,.74),blue=vec3(.25,.50,.57);
    vec3 c=mix(glaze,blue,cover(petal));
    c=mix(c,glaze,cover(abs(k.x-k.y)-.010)*cover(petal+.042));
    c=mix(c,blue,cover(length(k)-.047)+cover(abs(grout-.448)-.006));
    c=mix(c,vec3(.60,.68,.61),smoothstep(.481,.5,grout));
    c*=.80+.20*smoothstep(-.66,.04,sin(p.x*1.9-p.y*2.+1.));
    float shadow=rim(p-vec2(.14,-.13));
    c*=mix(.50,1.,smoothstep(-.04,.24,shadow));
    // Cross sections of two lemons on the counter.
    for(int i=0;i<2;i++){
        vec2 q=(p-(i==0?vec2(1.96,1.04):vec2(-2.03,-1.41)))/(i==0?.56:.66);
        float l=length(q);
        c*=mix(.72,1.,smoothstep(.94,1.2,length(q-vec2(.07,-.10))));
        if(l<1.02){
            float angle=atan(q.y,q.x);
            float spoke=abs(sin(5.*angle+.12*sin(3.*angle)+.09*sin(6.*l)));
            vec2 sacs=vec2(angle*52.,l*34.);
            sacs.y+=.5*sin(floor(sacs.x));
            float cells=length(fract(sacs)-.5);
            vec3 pulp=mix(vec3(.98,.63,.09),vec3(1.,.83,.31),.32+.52*smoothstep(.08,.56,cells));
            pulp=mix(milk,pulp,smoothstep(.014,.084,spoke*l)*smoothstep(.03,.12,l));
            c=l>.94?gold*(.87+.12*cos(angle+1.)):l>.878+.007*sin(33.*angle)?milk:pulp;
        }
    }
    return c;
}
vec3 contents(vec2 p,float d){
    float empty=step(71.5,bar);
    float corrugation=sin((d+.22)*85.)*.5+.5;
    vec3 c=mix(vec3(.45,.37,.10),vec3(.86,.70,.21),.5+.22*cos(4.*p.x+7.*p.y)+.17*corrugation);
    c=mix(c,mix(vec3(.48,.55,.53),vec3(.85,.87,.77),.5+.38*cos(3.*p.x-4.*p.y)+.10*corrugation),empty);
    if(empty>.5){
        float print=letters(p,vec2(0,.06),vec2(.84,.17),4.);
        c=mix(c,ink,.85*print);
        c=mix(c,ink,letters(p,vec2(0,-.26),vec2(.54,.064),5.)*.78);
    }else{
        float index=clamp(floor(p.x/.43+3.5),0.,6.);
        vec2 q=p-vec2((index-3.)*.43,0.);
        float flip=mod(index,2.)*2.-1.;
        vec2 fp=vec2(q.y*flip,-q.x*flip)/.63+vec2(-.12,0.);
        float pluck=fract((bar*3.-index)/3.5);
        float wake=smoothstep(14.,19.,bar);
        fp.y+=wake*(.037+.11*exp(-pluck*6.))*sin(5.*fp.x+pluck*10.+index);
        float ring=abs(length((fp-vec2(.60,.02))*vec2(.7,1.))-pluck*.9);
        c+=vec3(.30,.22,.08)*wake*exp(-ring*45.-3.*pluck);
        float skin=fishShape(fp);
        c*=mix(.48,1.,smoothstep(-.03,.095,skin+.02*fp.y));
        c=mix(c,scales(fp,bar*.8+index),cover(skin));
        float gleam=abs(p.x+.52*p.y+.13*sin(p.y*12.+bar*1.6)-sin(bar*.68)*1.6);
        c+=vec3(.30,.25,.12)*exp(-19.*gleam);
    }
    return c*mix(.68,1.,smoothstep(.035,.18,-d));
}
vec3 tableShot(vec2 uv){
    float yaw=.08,pitch=.98,dist=4.65,roll=.025;
    vec3 focus=vec3(0.,0.,.22);
    if(bar<8.){
        float move=smoothstep(0.,6.8,bar);
        dist=mix(2.32,3.94,move);yaw=mix(-.52,.17,move);pitch=mix(.88,1.11,move);
        focus.x=mix(-.57,0.,move);roll=mix(-.14,.06,move);
    }else if(bar<16.){
        dist=2.92+.06*(bar-8.);yaw=.78-.035*(bar-8.);pitch=.65+.035*(bar-8.);focus.x=.52-opening*.92;roll=-.09;
    }else if(bar<24.){
        float m=(bar-16.)/8.;pitch=1.48-.41*m;yaw=-.04-.24*m;dist=3.45-.36*m;roll=.03-.12*m;
    }else if(bar<32.){
        float m=smoothstep(24.,32.,bar);dist=mix(3.,.24,m);pitch=1.19+.32*m;focus=vec3(.47*m,-.48*m,.265);yaw=.24-.32*m;roll=-.1-.44*m;
    }else{
        float m=smoothstep(72.,78.,bar);dist=mix(2.95,3.79,m);pitch=1.38-.31*m;yaw=.09+.13*m;roll=.06;
    }
    vec3 eye=focus+dist*vec3(sin(yaw)*cos(pitch),-cos(yaw)*cos(pitch),sin(pitch));
    vec3 fw=normalize(focus-eye),rt=normalize(cross(fw,vec3(0,0,1)));
    uv=turn(roll)*uv;
    vec3 rd=normalize(fw*1.86+rt*uv.x+cross(rt,fw)*uv.y);
    float ground=-eye.z/rd.z;
    vec3 floorPoint=eye+rd*ground;
    vec3 c=lunch(floorPoint.xy);
    float t=max(0.,(.98-eye.z)/rd.z),mat=0.;
    vec3 pos=eye+rd*t;
    for(int j=0;j<80;j++){
        vec2 hit=metalwork(pos);
        if(hit.x<.0014){mat=hit.y;break;}
        t+=max(.001,hit.x*.90);
        if(t>=ground)break;
        pos=eye+rd*t;
    }
    if(mat>.5){
        float d=rim(pos.xy);
        vec2 e=vec2(.0016,0);
        vec3 n=normalize(vec3(metalwork(pos+e.xyy).x-metalwork(pos-e.xyy).x,metalwork(pos+e.yxy).x-metalwork(pos-e.yxy).x,metalwork(pos+e.yyx).x-metalwork(pos-e.yyx).x)+vec3(0,0,.000001));
        c=alloy(n,rd,pos);
        if(mat==1.&&abs(n.z)<.65){
            float stripe=smoothstep(.055,.067,pos.z)*(1.-smoothstep(.34,.36,pos.z));
            c=mix(c,red*(.72+.25*n.y),stripe*.92);
            c=mix(c,gold,.80*cover(abs(pos.z-.12)-.009));
        }
        if(mat==3.)c=d>-.062?c:badge(pos.xy)*(.89+.16*c);
        if(mat==4.){
            vec2 q=pos.xz-vec2(rollX,.419+rollRadius);
            if(abs(pos.y)>.765)c*=.60+.34*cos(length(q)*210.+atan(q.y,q.x));
            else c*=mix(vec3(.88,.92,.88),gold,.24+.20*cos(atan(q.y,q.x)*2.+opening*23.));
        }
        if(mat==5.)c=contents(pos.xy,d);
    }
    return c;
}
float thread(vec2 p){return sin(p.x*3.+1.8*sin(p.y*2.+.04*bar))+cos(p.y*3.7+1.6*cos(p.x*2.8-.12*bar));}
vec3 water(vec2 uv,float deep){
    vec2 p=uv+vec2(bar*.023,0);
    float top=clamp(.48+.48*uv.y,0.,1.);
    vec3 c=mix(vec3(.011,.111,.20),vec3(.085,.60,.65),top);
    c=mix(c,vec3(.14,.32,.53),deep*.52);
    float cone=p.x-.40*p.y+.05*sin(p.y*2.+bar*.19);
    float shafts=.45+.27*sin(8.*cone)+.18*cos(17.*cone+.20*bar)+.10*cos(37.*cone);
    c+=vec3(.20,.37,.23)*shafts*shafts*(.2+.8*top);
    float surface=max(.065,1.17-uv.y);
    vec2 lens=vec2(p.x/surface+bar*.05,1.5/surface+bar*.09);
    float lines=exp(-4.6*abs(thread(lens)));
    c+=vec3(.32,.35,.23)*lines*smoothstep(.20,1.,uv.y);
    // Cut-paper kelp growing from two receding shelves.
    for(int i=0;i<2;i++){
        float layer=float(i);
        vec2 s=p*vec2(1.7+.6*layer,1)+vec2(layer*2.+bar*.012*layer,0.);
        float hill=-.94+.10*sin(2.1*s.x)+.12*cos(1.2*s.x+layer)-.11*layer;
        float h=s.y-hill;
        float cell=floor(s.x*3.);
        float height=.12+.34*rnd(vec2(cell,layer));
        float bend=.026*sin(19.*h+bar*1.1+cell)+.08*h;
        float x=fract(s.x*3.)-.5+bend*3.;
        float kelp=(.065+.032*sin(58.*h+cell))*sin(3.14159*clamp(h/height,0.,1.));
        float plant=cover(abs(x)-kelp)*step(.0,h)*step(h,height);
        c=mix(c,mix(vec3(.038,.26,.31),ink,layer*.68),max(cover(h),plant)*.8);
    }
    return c;
}
// An inverse map from the screen to a staggered school. Its middle rows
// are swept sideways before they settle into the outline on the tin.
vec3 school(vec3 c,vec2 p,float loose,float kind,float light){
    vec2 space=vec2(.068,.037);
    float row=floor(p.y/space.y+.5);
    float shift=.5*mod(row,2.)+.14*sin(row*9.+bar*1.3)-bar*.95;
    vec2 id=vec2(floor(p.x/space.x+shift+.5),row);
    float seed=rnd(id+kind);
    vec2 mid=vec2(id.x-shift,row)*space+(seed-.5)*vec2(.009,.012);
    vec2 pattern=mid;
    pattern.y+=.037*sin(mid.x*4.-bar*1.3);
    pattern.x+=loose*(1.25*sin(pattern.y*7.+bar*.32)+.65*cos(pattern.y*4.-bar*.22));
    pattern.y+=loose*.12*sin(pattern.x*4.+bar*.43);
    float eye=distance(pattern,vec2(.63,.073));
    if(fishShape(pattern)>.004||eye<.057||abs(pattern.x-.37-1.45*pattern.y*pattern.y)<.021)return c;
    vec2 q=turn(-.12*sin(mid.x*4.-bar*1.3))*((p-mid)/(.029+.004*seed));
    q.y+=.06*sin(q.x*4.+bar*5.+9.*seed);
    float d=fishShape(q);
    float shimmer=.5+.5*cos(pattern.x*8.-pattern.y*16.-bar*2.+seed);
    vec3 foil=mix(vec3(.61,.79,.76),milk,shimmer);
    foil=mix(foil,vec3(.18,.57,.69),smoothstep(.04,.23,pattern.y));
    if(eye<.116||abs(pattern.y)>widthAt(pattern.x)||pattern.x<-.88)foil=gold;
    foil*=.82+.18*cos(5.*q.y);
    return mix(c,foil*light,1.-smoothstep(-.04,.04,d));
}
vec3 swimming(vec3 c,vec2 fp,float phase,float opacity){
    fp.y+=.10*sin(4.*fp.x-bar*5.2+phase)*(.29+.71*(1.-smoothstep(-1.,.55,fp.x)));
    float d=fishShape(fp);
    if(d<.06){
        vec3 skin=scales(fp,bar+phase);
        skin+=vec3(.19,.26,.24)*exp(-13.*abs(fp.y+.07+.1*sin(bar*1.2+phase)));
        c=mix(c,skin,opacity*(1.-smoothstep(-.008,.008,d)));
    }
    return c;
}
vec3 ocean(vec2 uv){
    float deep=smoothstep(37.,51.,bar)*(1.-smoothstep(66.,72.,bar));
    vec3 c=water(uv,deep)*mix(vec3(1),vec3(.40,.52,.71),deep);
    // Distant travelling shoals and plankton establish the change of scale.
    for(int i=0;i<3;i++){
        float z=float(i);
        vec2 q=uv*vec2(4.+z*2.,7.+z*3.);
        q.y+=.9*sin(uv.x*1.5+bar*.22+z*3.)+z*3.;
        q.x-=bar*(.39+z*.05);
        vec2 cell=floor(q);float r=rnd(cell+z);
        vec2 s=(fract(q)-.5)*vec2(3.7,2.6);
        if(r>.33&&abs(cell.y-3.*z)<2.)c=mix(c,vec3(.065,.29,.36),.55*cover(fishShape(s)));
    }
    if(bar<40.){
        float macro=1.-smoothstep(32.,39.,bar);
        float t=bar-32.;
        for(int i=0;i<5;i++){
            float z=float(4-i);
            vec2 mid=vec2(.24*sin(t*.47+z*1.7)+z*.45-.32,.12*sin(t*.72+z)+z*.32-.22);
            
            mid.x-=macro*2.05;
            float size=(.96+2.7*macro)/(1.+z*.64);
            vec2 q=turn(-.10-.10*sin(t*.40+z))*(uv-mid)/size;
            c=swimming(c,q,z,1./(1.+.14*z));
        }
    }else if(bar<48.){
        // Approach a revolving spiral of fish end-on. One local evaluation
        // per log-polar cell keeps the cost independent of its screen depth.
        vec2 p=uv-vec2(.28*sin(bar*.55),.12);
        float radial=max(.002,length(p));
        float rings=log(radial)*2.0-bar*.98;
        float angle=atan(p.y,p.x)+floor(rings)*.76+bar*.56;
        float sector=6.2831853/12.;
        float heading=floor(angle/sector+.5)*sector-floor(rings)*.76-bar*.56;
        float radius=exp((floor(rings)+.5+bar*.98)*.5);
        vec2 centre=radius*vec2(cos(heading),sin(heading));
        vec2 q=turn(-heading-1.37)*(p-centre)/(radius*.209);
        c=swimming(c,q,floor(rings),smoothstep(.018,.40,radial));
    }else{
        float loose=(1.-smoothstep(49.,57.,bar))+.87*smoothstep(65.,72.,bar);
        float zoom=mix(2.05,1.23,smoothstep(48.,56.,bar))+.065*sin((bar-56.)*.26);
        vec2 mid=vec2(.10+.14*sin(bar*.44),.07*sin(bar*.55));
        vec2 q=turn(-.08-.065*sin(bar*.26))*(uv-mid)/zoom+vec2(-.13,0.);
        c=school(c,q,loose,2.,1.);
        if(bar>63.){
            vec2 leader=turn(.08)*(uv-vec2(-1.9+(bar-63.)*.64,-.54+.18*sin(bar*.8)))/.37;
            c=swimming(c,leader,3.,1.);
        }
    }
    for(int i=0;i<2;i++){
        vec2 q=uv*(5.+3.*float(i));
        q.y-=bar*(.59+.22*float(i));q.x+=.19*sin(q.y*.85+bar*.51);
        vec2 cell=floor(q);float seed=rnd(cell+13.);
        vec2 v=fract(q)-vec2(.25+.46*seed,.48);
        if(seed>.72){
            float radius=.035+.10*seed;
            float ring=abs(length(v)-radius);
            c=mix(c,milk,.46*exp(-ring*105.)*(.56+.44*sin(atan(v.y,v.x))));
        }
    }
    return c;
}
void main(){
    bar=R.z/.96;
    opening=smoothstep(8.,20.,bar);
    rollX=mix(1.47,-1.40,opening);rollRadius=.032+.15*sqrt(opening);
    pixel=1.5/R.y;
    vec2 uv=(gl_FragCoord.xy*2.-R.xy)/R.y;
    vec3 c;
    if(bar<32.||bar>=72.)c=tableShot(uv);
    else c=ocean(uv);
    if(bar>=76.75&&bar<79.){
        float t=(bar-76.75)*1.47;
        vec2 jump=vec2(.26+.72*t,-.08+1.55*t-1.18*t*t);
        vec2 q=turn(1.-2.4*t)*(uv-jump)/(.28+.23*t);
        c=swimming(c,q,7.,smoothstep(0.,.17,t));
    }
    O=vec4(c,1);
}
