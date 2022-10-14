// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":0}

// The Universe Within - by Martijn Steinrucken aka BigWings 2018 
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Part 1 of The Universe Within Tutorial www.youtube.com/watch?v=3CycKKJiwis


#include "common.h"
#include "common_blending.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform float u_Scale; // {"material":"Scale","default":2,"range":[-10,10]}
uniform vec3 u_color1; // {"default":"1 1 1","material":"color 1","type":"color"}
//uniform vec3 u_color2; // {"material":"color 2","type":"color","default":"1 1 1"}
uniform float u_DistOpacity; // {"default":"1","material":"Opacity"}
uniform float u_TimeSpeed; // {"material":"Speed","default":1,"range":[-10,10]}
uniform float u_SparkleSpeed; // {"material":"Sparkle Speed","default":1,"range":[-10,10]}
uniform float u_SparkleGlow; // {"material":"Sparkle Glow","default":20,"range":[15,50]}
uniform vec4 g_Texture0Resolution;
uniform float g_Time;
uniform float u_pointerSpeed; // {"material":"pointerspeed","label":"Cursor Influence","default":0,"range":[-1,1]}


uniform vec2 g_PointerPosition;
varying vec4 v_PointerUV;

varying vec4 v_TexCoord;





float distLine( vec2 p, vec2 a, vec2 b){
	vec2 pa = p - a;
    vec2 ba = b - a;
    float t = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
    return length(pa - ba*t);
}

float noiseFloat(vec2 p){
    p = frac(p * vec2(213.53, 970.19));
    p = p + dot(p, p+548.23);
    return frac(p.x * p.y);
}

vec2 noiseVector(vec2 p){
	float n = noiseFloat(p);
    return vec2(n, noiseFloat(p+n));
}

vec2 GetPos(vec2 id, vec2 offsets){
	vec2 n = noiseVector(id + offsets) * g_Time * u_TimeSpeed;
    return sin(n) * 0.4 + offsets;
}

float Line(vec2 p, vec2 a, vec2 b){
	float d = distLine(p, a, b);
    float m = smoothstep(0.03, 0.002, d);
    m = m * smoothstep(1.5, 0.1, length(a-b));
    return m;
}

#if AUDIOPROCESSING
varying float v_AudioShift;
#endif


void main()
{
    float pointer = g_PointerPosition.yx * u_pointerSpeed;
    vec4 scene = texSample2D(g_Texture0, v_TexCoord.xy);
    vec2 uv = (v_TexCoord *g_Texture0Resolution.xy)/g_Texture0Resolution.y / u_Scale / 4;	

    uv = uv * 100.0 - pointer;
    
    float m = 0.0;
    vec2 gv = frac(uv) - 0.5;
    vec2 id = floor(uv);
    
    vec2 p[9];
    
    int i = 0;
    for(float y = -1.0; y<=1.0; y++){
    	for(float x = -1.0; x<=1.0; x++){
            p[i++] = GetPos(id, vec2(x, y));
        }
    }
    
    for(int i=0; i<9; i++){
    	m = m + Line(gv, p[4], p[i]);
#if AUDIOPROCESSING
        //vec2 j = (p[i] - gv) * (u_SparkleGlow / v_AudioShift) * v_AudioShift;
        vec2 j = (p[i] - gv) * u_SparkleGlow / v_AudioShift;      
#else
        vec2 j = (p[i] - gv) * u_SparkleGlow;
#endif
        float sparkle = 1.0/dot(j, j);    
        m = m + sparkle * (sin(g_Time*u_SparkleSpeed+frac(p[i].x)*3.0)*0.5 + 0.5);
    }
    
    m = m + Line(gv, p[1], p[3]);
    m = m + Line(gv, p[1], p[5]);
    m = m + Line(gv, p[7], p[3]);
    m = m + Line(gv, p[7], p[5]);

	
    
    vec3 col = u_color1 ;
    vec3 finalColor = col;

	// Apply blend mode
	finalColor = ApplyBlending(BLENDMODE, lerp(finalColor.rgb, scene.rgb, scene.a), finalColor.rgb,  u_DistOpacity * m);
float alpha = scene.a;
    //gl_FragColor.xyz = vec4(finalColor, alpha);
	gl_FragColor = vec4(finalColor, alpha);
}


