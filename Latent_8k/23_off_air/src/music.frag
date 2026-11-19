#version 300 es
precision highp float;
precision highp int;
out vec4 O;

const float tau=6.2831853;
const float sixteenth=.12;
const int roots[8]=int[8](38,38,41,36,38,43,41,36);
const int lead[24]=int[24](74,77,76,81,79,72,74,69,74,77,81,84,
                           86,84,81,79,77,76,72,74,81,79,76,74);
const int bassline[16]=int[16](0,0,0,12,0,0,7,0,0,0,0,12,0,10,0,7);

float noise(uint k) {
    k^=k>>16;
    k*=2146121005u;
    k^=k>>15;
    return float(k & 65535u)/32768.-1.;
}
float hz(int note) { return 440.*exp2(float(note-69)/12.); }
float env(float t,float attack,float decay) {
    return min(max(t,0.)/attack,1.)*exp(-max(t,0.)*decay);
}
vec2 stereo(float f,float pan) {
    return f*vec2(1.-pan,1.+pan);
}

float key(float sec) {
    if(sec<0.) return 0.;
    int bar=int(sec/1.92);
    int phrase=(bar/2)%4;
    float clock=mod(sec,1.92)/sixteenth;
    int stepIndex=int(clock);
    int slot=stepIndex<3?0:stepIndex<6?1:stepIndex<8?2:stepIndex<11?3:stepIndex<14?4:5;
    float onset=slot==0?0.:slot==1?3.:slot==2?6.:slot==3?8.:slot==4?11.:14.;
    float t=(clock-onset)*sixteenth;
    float f=hz(lead[phrase*6+slot]+(bar>=26 && bar<34?12:0));
    float z=tau*t*f;
    float sweep=.55+2.6*exp(-t*29.);
    float reed=sin(z+sweep*sin(z*2.001))+.32*sin(z*.998)+.19*sin(z*3.);
    float gate=min(1.,(1.92-mod(sec,1.92))/.016);
    return reed*env(t,.006,11.)*gate;
}

void main() {
    uint sampleIndex=uint(gl_FragCoord.x)+4096u*uint(gl_FragCoord.y);
    float t=float(sampleIndex)/48000.;
    int bar=int(t/1.92);
    float s=mod(t,1.92), beat=mod(s,.48), clock=s/sixteenth;
    int stepIndex=min(int(clock),15), root=roots[bar%8];
    float grid=mod(s,sixteenth);
    float white=noise(sampleIndex), high=white-noise(sampleIndex-1u);
    float full=smoothstep(5.2,5.76,t);
    float dance=bar>=8 && bar<37?1.:.48;
    float breakdown=bar>=22 && bar<24?0.:1.;
    float outro=1.-smoothstep(73.0,74.4,t);
    vec2 song=vec2(0);

    // Kicks, a short solenoid clap and swung sheet-metal hats.
    float kt=s;
    if(bar>=24 && bar<35) kt=beat;
    else if(s>.84 && s<1.20) kt=s-.84;
    else if(s>=1.20) kt=s-1.20;
    float kick=sin(tau*(49.*kt+4.7*(1.-exp(-kt*27.))));
    song+=.47*kick*env(kt,.002,15.)*full*dance*breakdown;
    float clap=mod(s+1.44,.96);
    float snap=env(clap,.001,43.)+.59*env(clap-.016,.001,49.)+.5*env(clap-.029,.002,28.);
    float skin=sin(tau*(184.*clap+1.4*(1.-exp(-clap*34.))));
    song+=full*dance*breakdown*snap*(.19*white+.038*high+.08*skin);
    float swing=mod(s+.219,.24);
    float hat=high*.60+sin(tau*7031.*t)*sin(tau*5917.*t)*.4;
    song+=stereo(hat*env(swing,.002,bar>=24?41.:31.)*.106*full,.39);
    song+=stereo(hat*env(grid,.001,103.)*.025*dance,-.42);

    // Detuned relay springs travel across the stereo field.
    float relay=mod(t+.48,.96);
    float spring=sin(tau*1373.*relay)+.65*sin(tau*2493.*relay)+.35*high;
    song+=stereo(.127*spring*env(relay,.001,52.),.7*sin(float(bar)+s*2.));
    if(bar<3 || (bar>=20 && bar<24) || bar>=37) {
        float chatter=mod(t,.06);
        song+=stereo(.052*(high+sin(tau*592.*chatter))*env(chatter,.002,102.),
            .65*sin(t*3.))*(.52+.48*cos(tau*s/.48));
    }
    float bassStart=stepIndex==2?grid+.12:grid;
    float edge=min(1.,(sixteenth-grid)*370.);
    float note=hz(root+bassline[stepIndex]);
    float phase=tau*note*bassStart;
    float bass=sin(phase)+.54*sin(phase+2.2*exp(-bassStart*19.)*sin(phase*1.997));
    float gates=(stepIndex==4 || stepIndex==9 || stepIndex==15)? .18 : 1.;
    song+=.16*bass*env(bassStart,.007,13.)*edge*gates*full*(.44+.56*dance)*breakdown;

    // Four voiced chords, with chorus on the upper notes and ducking on kicks.
    float pad=0.;
    vec2 cloud=vec2(0);
    for(int voice=0;voice<4;voice++) {
        int interval=voice==0?19:voice==1?(root==38?27:28):voice==2?31:38;
        float f=hz(root+interval);
        float phase=tau*f*s;
        float vibrato=sin(tau*(.29+.11*float(voice))*t);
        float v=sin(phase+.55*vibrato+1.2*sin(phase+vibrato))
               +.3*sin(phase*2.003+vibrato);
        cloud+=stereo(v,.65*cos(float(voice)*2.4));
        pad+=sin(phase+vibrato);
    }
    float swell=min(s*7.,1.)*min((1.92-s)*10.,1.);
    float sidechain=.48+.52*smoothstep(.035,.24,kt);
    song+=(cloud*.028+pad*.013)*swell*sidechain*(.6+.4*full);

    float hook=(bar>=4 && bar<22 || bar>=24 && bar<37)?1.:.19;
    song+=hook*(stereo(key(t),-.2)*.213+stereo(key(t-.36),.52)*.083
        +stereo(key(t-.72),-.62)*.043);
    float edit=t-(t>=69.12?69.12:30.72);
    if(edit>=0. && edit<.31) {
        song+=.16*(sin(tau*(922.*edit-1100.*edit*edit))+.43*high)*env(edit,.004,14.);
    }
    if(t>=28.32 && t<30.72) {
        song+=.082*sin(tau*t*(645.+14.*floor(s/.24)))*env(mod(s,.24),.003,24.);
    }
    float sonar=t-45.12;
    if(sonar>0. && sonar<1.4) {
        song+=.25*sin(tau*(68.*sonar+34.*sonar*sonar))*env(sonar,.04,2.8);
    }
    float last=t-74.4;
    float power=sin(tau*(44.*last+2.5*(1.-exp(-max(last,0.)*18.))));
    vec2 mixed=song*outro+.55*power*env(last,.002,15.)+.095*high*env(last,.001,38.);
    O=vec4(mixed*1.38/sqrt(1.+2.10*mixed*mixed),0,1);
}
