#version 300 es
precision highp float;
uniform vec4 R;
out vec4 O;

const float pi = 3.14159265, turn = 6.2831853, pitch = turn / 64.;
const vec3 ink = vec3(.027,.021,.045), cream = vec3(1.12,.94,.73);
const vec3 orange = vec3(1.62,.23,.053), blue = vec3(.063,.137,1.25);
const vec3 lilac = vec3(.49,.49,.88);
const vec3 light = vec3(-.493,.783,.38);
float time, beat, radius;
int mode;

float rand(vec2 p) {
    vec3 q = fract(p.xyx*.1031);
    q += dot(q,q.yzx+33.33);
    return fract((q.x+q.y)*q.z);
}
float band(float x,float k) { return abs(fract(x+.5)-.5)-k; }
mat2 rotation(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }
float title(vec2 cell) {
    const int glyph[25]=int[25](62,127,65,127,62,127,127,9,9,1,126,127,9,127,126,65,65,127,65,65,127,127,25,111,70);
    int row=3-int(cell.y), x=int(cell.x)+18;
    if(x<0 || x>36 || row<0 || row>6 || x==18 || x==19) return 0.;
    if(x>=20) x-=2;
    int col=x%6, letter=x/6;
    if(col==5) return 0.;
    return float((glyph[(letter-int(letter>=2))*5+col]>>row)&1);
}

// A card cell has one porcelain face and one coloured face.
// Evaluate both adjacent cues, then rotate the entire part between them.
vec2 signal(vec2 cell, float cue) {
    float r=length(cell), x=cell.x, y=cell.y;
    float checker=mod(x+y,2.);
    if (beat<12.) {
        float wave=sin(.48*x+.52*y-cue*.72);
        return vec2(step(.02,wave),mix(2.,3.,step(0.,sin(.2*y+.8))));
    }
    if (beat<32. || beat>=144.) {
        if (beat>=150.) {
            float collapse = smoothstep(150.,155.,beat);
            return vec2(step(abs(y)+abs(x)*.16,11.*(1.-collapse))
                *step(0.,sin(x*.55+cue)),2.);
        }
        float panel=step(abs(y),4.)*step(abs(x),19.);
        float pattern = max(panel*(1.-title(cell)),step(18.8,r)*step(r,19.9)*(1.-panel));
        if (abs(y)>=7. && abs(y)<10. && abs(x)<17.) pattern=1.;
        if (abs(y)>11. && abs(x)>18.) pattern=checker;
        float paint = abs(y)>=7. && abs(y)<10. && abs(x)<17.
            ? mod(floor((x+17.)/8.5),4.)+1. : panel*3.;
        return vec2(pattern,paint);
    }
    if (mode==0) {
        float curve = r + 2.9*sin(.18*x+.29*y+cue*.39);
        float bars = band((y+3.*sin(x*.16-cue*.32))/7.,.23);
        float track = band(curve*.16-cue*.27,.24);
        return vec2(step(mix(track,bars,step(47.,beat)),0.),
            2.+mod(floor(x*.13+y*.17+cue*.37),3.));
    }
    if (mode==1) {
        float phase=fract(x/64.*3.+y*.095-cue*.16);
        float grid = step(.78,fract(x/8.))*step(.5,fract(y/5.));
        return vec2(max(grid,step(.44,phase)),
            phase>.90 ? 4. : phase>.67 ? 2. : 3.);
    }
    float s = sin(x*pitch*3.+.27*y+cue*.24)+.63*cos(y*.52-cue*.44);
    float continents = step(.22,s);
    float equator = step(abs(y-3.*sin(x*pitch*2.+cue*.23)),1.2);
    return vec2(max(continents,equator), equator>.5 ? 4. : s>.8 ? 2. : 3.);
}

vec3 palette(float paint) {
    if(paint<.5) return ink;
    if(paint<1.5) return lilac;
    if(paint<2.5) return orange;
    if(paint<3.5) return blue;
    return vec3(.94,.72,.24);
}

// Coordinates on a plane, the interior of a cylinder, or a spherical shell.
vec2 address(vec3 p) {
    if(mode==0) return p.xy;
    if(mode==1) return vec2(atan(p.y,p.x)/pitch,p.z);
    return vec2(atan(p.z,p.x)/pitch,asin(clamp(p.y/length(p),-1.,1.))/pitch);
}
void frame(vec2 cell,out vec3 pos,out vec3 u,out vec3 v,out vec3 n) {
    if(mode==0) {
        pos=vec3(cell,0); u=vec3(1,0,0); v=vec3(0,1,0); n=vec3(0,0,1);
    } else {
        float a=cell.x*pitch;
        vec2 ring=vec2(cos(a),sin(a));
        if(mode==1) {
            pos=vec3(ring*radius,cell.y);
            u=vec3(-ring.y,ring.x,0); v=vec3(0,0,1); n=vec3(-ring,0);
        } else {
            float lat=cell.y*pitch;
            n=vec3(ring.x*cos(lat),sin(lat),ring.y*cos(lat));
            u=vec3(-ring.y,0,ring.x);
            v=cross(u,n);
            pos=n*radius;
        }
    }
}
float shell(vec3 eye,vec3 ray,float h) {
    if(mode==0) return (h-eye.z)/ray.z;
    vec3 e=eye,d=ray;
    if(mode==1) { e.z=0.; d.z=0.; }
    float span=radius+(mode==1?-h:h), a=dot(d,d), b=dot(e,d);
    float k=b*b-a*(dot(e,e)-span*span);
    if(k<0. || a<.00001) return 1e4;
    return (-b+(mode==1?1.:-1.)*sqrt(k))/a;
}
bool valid(vec2 id) {
    if(mode==0) return abs(id.x)<=21. && abs(id.y)<=12.;
    if(mode==1) return id.y > -94.;
    return abs(id.y)<16.;
}

vec3 studio(vec3 eye,vec3 ray,out float depth) {
    vec3 top=mode==2?vec3(.09,.11,.31):vec3(.23,.15,.22);
    vec3 sky=mix(ink,top,clamp(.44+ray.y,0.,1.));
    depth=1e4;
    if (mode==1) {
        float farEnd=(-94.-eye.z)/ray.z;
        vec2 view=(eye+farEnd*ray).xy;
        float rad=length(view), charge=smoothstep(89.,95.5,beat);
        float contact=step(abs(rad-7.8),.11)+step(abs(rad-6.65),.19);
        float filament=step(abs(view.y),.10+charge*.19)*step(abs(view.x),5.2);
        float inner=exp(-rad*.24)*(1.+4.*charge);
        float echo=charge*exp(-4.*abs(rad-9.*fract(beat*.44)));
        return ink*.36+orange*(contact*.45+filament*(.64+2.3*charge)+inner*.27)
            +blue*.24*step(8.8,rad)+lilac*echo*.83;
    }
    if(mode==2) sky+=vec3(.10,.12,.39)*pow(max(0.,dot(ray,normalize(-eye+vec3(0,3,0)))),29.);
    float floorY=mode==2?-13.4:-15.;
    float t=(floorY-eye.y)/ray.y;
    if(t<0.) return sky;
    depth=t;
    vec3 p=eye+ray*t;
    float shadow=exp(-dot(p.xz,p.xz)/(mode==2?210.:295.));
    float rule=step(band(p.z*.105,.016),0.);
    vec3 floorColor=mix(vec3(.22,.156,.203),vec3(.69,.49,.42),1.-shadow);
    if(mode==2) floorColor=mix(vec3(.015,.019,.049),vec3(.065,.075,.17),1.-shadow);
    return mix(floorColor+rule*.015,sky,1.-exp(-t*.016));
}

// Analytic finite cylinders in the cell's tilted frame. A sphere around each
// part rejects rays before the quadratic and before sampling the face.
float intercept(vec3 p,vec3 ray,vec2 size,out vec3 normal,out vec3 hit) {
    float k=dot(p,ray);
    if(dot(p,p)-k*k>.239) return 1e4;
    vec3 o=p, d=ray;
    o.x/=size.x; d.x/=size.x;
    float cap=-sign(d.z)*size.y;
    float t=(cap-o.z)/d.z;
    vec2 q=o.xy+t*d.xy;
    normal=vec3(0,0,sign(cap));
    if(dot(q,q)>.1936 || t<0.) {
        float a=dot(d.xy,d.xy), b=dot(o.xy,d.xy);
        float f=b*b-a*(dot(o.xy,o.xy)-.1936);
        if(f<0. || a<.00001) return 1e4;
        t=(-b-sqrt(f))/a;
        if(t<0. || abs(o.z+t*d.z)>size.y) return 1e4;
        normal=normalize(vec3((o.xy+t*d.xy)/vec2(size.x,1),0));
    } else {
        normal=normalize(vec3(q*smoothstep(.389,.44,length(q))*1.8,normal.z));
    }
    hit=o+t*d;
    return t;
}

void camera(out vec3 eye,out vec3 aim,out float focal,out float roll) {
    focal=1.25; roll=0.; aim=vec3(0);
    if(beat<12.) {
        float u=beat/12.;
        eye=vec3(4.1-5.*u,-1.55+3.6*u,2.8+5.*u);
        aim=vec3(1.5-4.*u,-.3,0);
        roll=.12-.28*u;
    } else if(beat<32. || beat>=144.) {
        float u=clamp((beat-12.)/20.,0.,1.);
        eye=vec3(-4.8*(1.-u),2.3*(1.-u),35.-2.5*u);
        if(beat>=144.) eye=vec3(0,0,35.);
    } else if(beat<48.) {
        float u=(beat-32.)/16.;
        eye=vec3(16.-33.*u,-6.+8.*u,11.+4.*u);
        aim=vec3(5.-10.*u,1.9,0);
        roll=.21-.42*u;
    } else if(beat<64.) {
        float u=(beat-48.)/16.;
        eye=vec3(-14.+38.*u,8.-12.*u,27.-13.*u*u);
        aim=vec3(-2,0,0);
        roll=-.15+u*.3;
    } else if(beat<96.) {
        float u=beat-64.;
        eye=vec3(2.6*sin(u*.21),2.*cos(u*.17),5.-2.2*u-18.*smoothstep(26.,32.,u));
        aim=vec3(-eye.xy*.4,eye.z-14.);
        roll=u*.095+.13*sin(u*.68);
        focal=.89+.21*sin(u*.10);
    } else {
        float u=beat-96., orbit=.22+u*.044;
        float close=smoothstep(109.,119.,beat)*(1.-smoothstep(121.,128.,beat));
        float range=34.+5.*smoothstep(124.,133.,beat)+2.*cos(u*.15)-12.*close;
        eye=vec3(sin(orbit)*range,3.1+2.4*cos(u*.14),cos(orbit)*range);
        aim.y=-.32;
        roll=.15*sin(u*.15);
    }
}

void main() {
    time=R.z; beat=time/.48;
    mode=beat<64. || beat>=144. ? 0 : beat<96. ? 1 : 2;
    radius=mode==2 ? 9.7+1.4*smoothstep(127.,135.,beat) : 10.1859;
    vec3 eye, aim;
    float focal, roll;
    camera(eye,aim,focal,roll);
    vec3 forward=normalize(aim-eye), right=normalize(cross(forward,vec3(0,1,0)));
    vec2 uv=rotation(roll)*((gl_FragCoord.xy-R.xy*.5)/R.y);
    vec3 ray=normalize(focal*forward+uv.x*right+uv.y*cross(right,forward));
    float depth;
    vec3 color=studio(eye,ray,depth);

    float base=shell(eye,ray,0.), anchor=shell(eye,ray,.49);
    if(base>0. && base<min(depth,1000.)) {
        vec3 p=eye+ray*base;
        vec2 grid=address(p), cell=round(grid), local=grid-cell;
        vec2 box=abs(grid)-vec2(22.25,13.25);
        bool board=length(max(box+.65,0.))+min(max(box.x,box.y)+.65,0.)<.65;
        if(mode==0 ? board : mode==1 ? p.z>-94. : beat<130. || mod(cell.y,4.)!=0.) {
            float hole=dot(local,local);
            float rail=step(.476,abs(local.y));
            float well=smoothstep(.12,.27,hole);
            color=mix(ink*.23,vec3(.10,.068,.11),well)*(.82+.18*rand(cell));
            float axis=step(abs(local.y),.071)*step(abs(local.x),.34);
            color+=vec3(.24,.16,.105)*axis*(1.-abs(local.y)*12.);
            color+=rail*.021;
            if(mode==0 && !valid(cell)) {
                float pin=step(length(local),.092)*step(.6,rand(cell));
                color=vec3(.11,.074,.12)+pin*.21+step(max(box.x,box.y),-.22)*.031;
            }
            depth=base;
        }
    }
    if(anchor>0. && anchor<min(1e3,depth+1.8)) {
        vec3 guide=eye+ray*anchor;
        vec2 grid=address(guide);
        for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++) {
            vec2 cell=round(grid)+vec2(i,j);
            if(!valid(cell)) continue;
            vec2 id=cell;
            if(mode!=0) id.x=mod(id.x+32.,64.)-32.;
            float noise=rand(id);
            vec3 pos,u,v,n;
            frame(cell,pos,u,v,n);
            float wave=beat*.5 + (mode==0?.028*cell.x+.04*cell.y: .023*cell.y+.075*sin(cell.x*pitch));
            wave+=noise*.10;
            if(beat>146.) wave=beat+.089*length(cell);
            vec2 now=signal(id,floor(wave));
            vec2 was=signal(id,floor(wave)-1.);
            float flip=smoothstep(.03,.37,fract(wave));
            float tip=mix(was.x,now.x,flip)*pi+(noise-.5)*.042;
            tip+=.085*sin(cell.y*.4-beat*1.8)*exp(-4.*fract(wave));
            float lift=mode==0 ? .34*(1.+sin(.36*cell.x+.27*cell.y-beat*1.33))
                *smoothstep(48.,56.,beat)*(1.-step(64.,beat)) : 0.;
            if(mode==2 && beat>=128.) {
                lift=(.22+.32*cos(.68*cell.y-.52*beat))*smoothstep(128.,133.,beat);
                if(mod(cell.y,4.)==0.) lift+=.68*smoothstep(130.,137.,beat);
            }
            pos+=n*(.53+lift);
            if(beat>=154. && length(cell)>.1) continue;
            float cs=cos(tip),sn=sin(tip);
            vec3 a=v*cs+n*sn, b=n*cs-v*sn;
            vec3 off=eye-pos;
            vec3 origin=vec3(dot(off,u),dot(off,a),dot(off,b));
            vec3 direction=vec3(dot(ray,u),dot(ray,a),dot(ray,b));
            float stretch=mode==2 ? .98*max(.14,cos(cell.y*pitch)) : 1.;
            vec3 localNormal, hit;
            float d=intercept(origin,direction,vec2(stretch,.076),localNormal,hit);
            if(d>=depth) continue;
            depth=d;
            vec3 normal=normalize(localNormal.x*u+localNormal.y*a+localNormal.z*b);
            float rim=length(hit.xy), face=abs(localNormal.z);
            float groove = smoothstep(.013,.026,abs(rim-.365));
            float enamel=step(.42,rim);
            vec3 paint=localNormal.z>0. ? cream : palette(mix(was.y,now.y,step(.5,flip)));
            if(beat>=154.) paint=orange*1.48;
            paint*=.94+.12*noise;
            paint*=.89+.11*groove;
            vec3 edge=vec3(.24,.19,.24)*(1.+.42*sin(140.*hit.z));
            paint=mix(edge,paint,face*(1.-enamel*.87));
            float pin=1.-smoothstep(.048,.069,rim);
            paint=mix(paint,vec3(.29,.23,.23)+.18*step(hit.y,.014),pin);
            float diffuse=max(0.,dot(light,normal));
            float spec=pow(max(dot(normal,normalize(light-ray)),0.),36.);
            float fresnel=pow(1.-abs(dot(ray,normal)),3.);
            float key=mode==2?.67+.49*dot(n,light):1.;
            color=paint*(.34+.76*diffuse)*key+spec*vec3(1.17,.78,.52)
                +fresnel*vec3(.13,.20,.45);
            if(mode==1) {
                float pulse=exp(-9.*abs(fract(id.y*.072+beat*.29+.5)-.5));
                color+=paint*pulse*.77;
            } else if(mode==2 && beat>128.) {
                // A charge races diagonally across the loose rows.
                float surge=band(id.x/64.+id.y*.071-beat*.29,0.);
                color+=mix(blue,orange,step(.5,fract(id.y*.125)))
                    *exp(-22.*surge)*face*smoothstep(128.,130.,beat);
            }
        }
    }

    if(mode==2 && beat>=128.) {
        // Inclined orbital bands go behind the globe and cross in front of it.
        for(int i=0;i<2;i++) {
            float f=float(i);
            vec3 normal=normalize(vec3(.21+f*.36,1.,.31-f*.54));
            float d=-dot(eye,normal)/dot(ray,normal);
            vec3 p=eye+d*ray;
            float r=length(p), ang=atan(p.z,p.x);
            float power=smoothstep(128.+f*2.,132.+f*3.,beat);
            float orbit=13.2+f*2.2+f*.32*sin(ang*3.);
            float stripes=band((r-orbit)*4.,.15);
            float teeth=fract(ang*24./turn+beat*(f-.5)*.25);
            if(d>0. && d<depth && abs(r-orbit)<.64*power) {
                vec3 tape=mix(lilac,orange,f)*(.39+.87*step(.7,teeth));
                color=mix(color,tape,.28+.72*step(stripes,0.));
            }
        }
    }
    if(mode==1 && depth<1e3) color=mix(color,ink+.008,1.-exp(-depth*.021));
    O=vec4(color,1);
}
