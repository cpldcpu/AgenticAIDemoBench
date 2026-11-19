#version 300 es
precision highp float;
out vec4 O;
const float tau=6.2831853;
float hz(float note){return 440.*exp2((note-69.)/12.);}
float noise(float sampleNo){
    uint x=uint(max(0.,sampleNo)); x=(x^(x>>15u))*2246822519u;
    return float(x^(x>>13u))/2147483648.-1.;
}
vec2 pan(float v,float place){return v*vec2(1.-place,1.+place);}
float noteAt(int beat){
    // Twenty-four eighths. Zeroes leave room for the answering player.
    const float notes[24]=float[24](76.,0.,72.,74.,76.,0.,79.,0.,0.,78.,74.,0.,72.,0.,69.,71.,0.,74.,71.,0.,67.,69.,0.,0.);
    const float bridge[24]=float[24](81.,0.,0.,79.,0.,76.,74.,0.,0.,72.,71.,0.,74.,0.,78.,0.,0.,76.,71.,0.,0.,0.,67.,71.);
    return beat>=192&&beat<288?bridge[beat%24]:notes[beat%24];
}
float subject(float tick,int voice){
    if(tick<0.)return 0.;
    int stepNo=int(floor(tick));
    float sum=0.;
    for(int back=0;back<4;back++){
        int index=stepNo-back;
        if(index<0)continue;
        float note=noteAt(index);
        if(note<1.)continue;
        float t=(fract(tick)+float(back))*.16;
        float f=hz(note+float(voice==1?-12:voice==2?7:0));
        float a=tau*f*t;
        float attack=1.-exp(-t*(voice==1?32.:220.));
        float env=exp(-t*(index%6==0?5.1:8.1))*attack;
        float tone=sin(a+1.1*exp(-22.*t)*sin(2.*a))+.35*sin(2.*a)+.14*sin(3.01*a);
        if(voice==1){
            a+=.075*sin(t*32.);
            tone=sin(a)+.31*sin(a*3.)+.18*sin(a*5.)+.095*sin(a*7.);
        }
        if(voice==2)tone=sin(a+.95*exp(-7.*t)*sin(1.997*a))+.29*sin(3.99*a)*exp(-3.*t);
        sum+=tone*env;
    }
    return sum;
}
float root(int barNo){
    const float bass[8]=float[8](45.,50.,43.,40.,45.,48.,50.,40.);
    return bass[(barNo/2)%8];
}
float tin(float t,float f){
    float a=tau*t*f;
    return (1.-exp(-420.*t))*(sin(a)*exp(-8.*t)+.65*sin(2.67*a)*exp(-13.*t)+.31*sin(4.12*a)*exp(-18.*t));
}
vec2 ensemble(float sec){
    float tick=sec/.16,bar=tick/6.;
    int stepNo=int(tick),barNo=int(bar);
    float k=fract(tick)*.16,beat=mod(tick,3.)*.16;
    float phrase=smoothstep(3.5,8.,bar),reveal=smoothstep(46.,55.,bar);
    float cut=1.-smoothstep(29.8,31.9,bar)+smoothstep(32.,39.,bar);
    float end=1.-smoothstep(69.7,72.,bar);
    float ran=noise(floor(sec*48000.)),last=noise(floor(sec*48000.)-1.);
    float high=(ran-last)*.5;
    vec2 mixdown=vec2(0);
    if(bar<72.){
        float first=subject(tick,0);
        if(bar>=40.&&bar<48.)first*=.55+.45*cos(tau*bar);
        mixdown+=pan(first,-.21)*(.16-.075*smoothstep(31.,32.,bar)+.055*reveal);
        mixdown+=pan(subject(tick-1.50,0),.52)*.031;
        mixdown+=pan(subject(tick-12.,1),.27)*(.12*smoothstep(13.,16.,bar)+.072*smoothstep(31.,32.,bar)-.055*reveal);
        mixdown+=pan(subject(tick-24.,2),-.42)*.115*reveal;
        float base=root(barNo),pos=mod(tick,6.);
        float offset=pos<2.5?0.:pos<4.5?2.5:4.5;
        float t=(pos-offset)*.16;
        float freq=hz(base+(offset==0.?0.:offset==2.5?7.:barNo%2==0?12.:5.));
        float a=tau*freq*t;
        float bass=(sin(a+.85*exp(-24.*t)*sin(a))+.23*sin(2.*a)+.17*sin(3.*a))*exp(-6.*t)*(1.-exp(-110.*t));
        mixdown+=.25*bass*(.38+.62*phrase);
        // The accompaniment accents three pairs against the tune's two triplets.
        float stroke=(mod(tick+.08,2.))*.16;
        float strum=0.;
        for(int j=0;j<3;j++){
            float u=max(0.,stroke-float(j)*.009);
            bool major=base==50.||base==43.||base==48.;
            float n=base+12.+(j==0?(major?4.:3.):j==1?7.:10.);
            float b=tau*hz(n)*u;
            strum+=(sin(b)+.44*sin(2.*b)+.22*sin(4.*b))*exp(-15.*u)*(1.-exp(-260.*u));
        }
        mixdown+=pan(strum,-.42)*.062*phrase*cut*(1.-.8*step(32.,bar)*(1.-step(48.,bar)));
        float kick=sin(tau*(53.*beat+0.98*(1.-exp(-30.*beat))))*exp(-15.*beat);
        float shell=step(2.99,pos)*tin(beat,196.)*.12;
        float scrape=high*(.05+.045*float(stepNo%3==2))*exp(-k*(stepNo%3==2?24.:78.));
        mixdown+=(.24*kick+pan(shell,.29)+pan(scrape,.21))*phrase*cut;
        float click=tin(k,530.+float(stepNo%3)*113.);
        mixdown+=pan(click,-.14)*.08*(1.-smoothstep(1.,1.8,mod(tick,3.)))*smoothstep(7.,8.,bar)*(1.-smoothstep(16.,20.,bar));
        mixdown*=end;
    }
    if(bar>=72.){
        float time=sec-69.12;
        float tail=tin(time,220.)*.29+tin(time,329.63)*.18;
        for(int i=0;i<4;i++){
            float t=time-float(i)*.32;
            if(t>=0.)tail+=.16*tin(t,hz(57.+float(i)*3.));
        }
        float t=time-4.80;
        if(t>0.)tail+=.24*tin(t,880.)+.14*sin(2764.6*t)*exp(-2.8*t)*(1.-exp(-180.*t));
        mixdown+=vec2(tail);
    }
    return mixdown;
}
void main(){
    float sampleNo=floor(gl_FragCoord.x)+4096.*floor(gl_FragCoord.y);
    float sec=sampleNo/48000.;
    vec2 mixdown=ensemble(sec);
    O=vec4(.94*tanh(1.65*mixdown)*smoothstep(0.,.006,sec),0,1);
}
