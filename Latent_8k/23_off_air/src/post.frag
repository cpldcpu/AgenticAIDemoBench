#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A,B;
out vec4 O;

float mask(vec2 p,vec2 size) {
    vec2 d=abs(p)-size*.5;
    return 1.-smoothstep(-1./R.y,1./R.y,max(d.x,d.y));
}
float type(vec2 p,vec2 size,float row) {
    vec2 uv=p/size+.5;
    return mask(p,size)*textureLod(B,vec2(uv.x,(row+1.-uv.y)*100./512.),0.).a;
}
void main() {
    vec2 uv=gl_FragCoord.xy/R.xy;
    vec2 p=(gl_FragCoord.xy-.5*R.xy)/R.y;
    float beat=R.z/.48, measure=fract(beat*.25);
    float cut=min(abs(beat-64.),min(abs(beat-96.),abs(beat-144.)));
    float sync=exp(-14.*cut);
    vec2 smear=vec2(.018*sync*sin(118.*p.y+beat*9.),0);
    // The vertical retrace slips through the picture before the drum cut.
    float roll=smoothstep(59.,63.5,beat)*(1.-step(64.,beat));
    uv.y=fract(uv.y+roll*.22);
    smear.x+=roll*.075*sin(75.*p.y+beat*6.)*step(.36,fract(p.y*3.-beat));
    vec3 col=texture(A,uv+smear).rgb;
    col.r=mix(col.r,texture(A,uv-smear*.56).r,max(sync,roll*.8));
    vec3 glow=max(textureLod(A,uv,4.).rgb-.54,0.);
    col+=glow*.32;
    col*=1.-.22*dot(p,p);
    col=pow(1.-exp(-col*1.62),vec3(.58));
    float grain=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
    col+=(grain-.5)*.028;
    col=mix(col,vec3(.95,.83,.70),.36*sync*step(.59,fract(p.y*6.+beat)));

    vec3 paper=vec3(.99,.925,.813), black=vec3(.084,.069,.115);
    vec3 red=vec3(1.,.30,.105);
    vec2 top=p-vec2(-R.x/R.y*.5+.2,.428);
    float caption=smoothstep(11.8,12.5,beat)*(1.-smoothstep(30.,32.,beat));
    if(beat>48.) caption=smoothstep(48.,49.,beat)*(1.-smoothstep(60.,62.,beat));
    float tag=mask(top,vec2(.305,.051))*caption;
    col=mix(col,black,tag);
    col=mix(col,red,mask(top+vec2(.132,0),vec2(.012,.018))*caption*(.6+.4*exp(-measure*11.)));
    col=mix(col,paper,type(top-vec2(.013,0),vec2(.259,.057),beat<32.?1.:2.)*caption);

    // The raster squeezes to a single live row at the end.
    float shut=smoothstep(150.,155.,beat);
    float shutter=1.-smoothstep(.002,.006,abs(p.y)-.51*pow(1.-shut,2.));
    col=mix(black*.59,col,shutter);
    col+=red*.38*exp(-abs(beat-154.)*2.-abs(p.y)*220.-dot(p,p)*4.);
    float end=smoothstep(154.9,156.0,beat);
    col=mix(col,black*.59,end);
    float logo=type(p-vec2(-.075,.015),vec2(.79,.193),0.);
    col=mix(col,paper,logo*end);
    col=mix(col,red,mask(p-vec2(.347,.014),vec2(.075,.012))*end);
    col=mix(col,paper*.6,type(p+vec2(0,.115),vec2(.4,.064),3.)*end);
    col=mix(col,paper*.42,type(p+vec2(0,.391),vec2(.24,.043),4.)*end);
    O=vec4(col,1);
}
