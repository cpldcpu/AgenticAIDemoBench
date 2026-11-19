#version 300 es
precision highp float;
uniform vec4 R;
uniform sampler2D A;
out vec4 O;
void main(){
    vec2 uv=gl_FragCoord.xy/R.xy;
    float bar=R.z/.96;
    vec3 c=texture(A,uv).rgb;
    vec3 soft=textureLod(A,uv,3.3).rgb;
    c+=.28*max(soft-.76,0.);
    c*=1.-.10*pow(length(uv-.5)*1.37,2.);
    float grain=fract(52.9829*fract(dot(gl_FragCoord.xy+mod(floor(R.z*24.),71.),vec2(.06711056,.00583715))));
    c+=(grain-.5)*.027;
    // Two glints mark the cuts between the counter and open water.
    float flash=exp(-6.*abs(bar-32.))+.93*exp(-7.*abs(bar-72.));
    c=mix(c,vec3(1.,.96,.72),flash);
    O=vec4(clamp(c,0.,1.),1);
}
