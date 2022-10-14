// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":31}
// [COMBO] {"material":"Blend Color","combo":"SOLIDCOLOR","type":"options","default":1}

#include "common.h"
#include "common_blending.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"MASK","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"0 0 0 1"}

uniform float u_TopoOpacity; // {"default":"1","material":"Opacity"}
uniform float u_Scale; // {"material":"Scale","default":10,"range":[0, 20.0]}
uniform vec3 u_color1; // {"default":"1 1 1","material":"color 1","type":"color"}
uniform vec2 u_ScaleL; // {"default":"-5 -5","label":"position","linked":true,"material":"Position","range":[-10.0,10.0]}
uniform float u_shiftSpeed; // {"material":"speed","label":"Speed Spin","default":1,"range":[-20.0,20.0]}
uniform float u_shiftSpeed2; // {"material":"speed2","label":"Speed Circular","default":1,"range":[-20.0,20.0]}
uniform float u_extraValue1; // {"material":"value","label":"Value 1","default":0.7,"range":[0,20.0]}
uniform float u_extraValue2; // {"material":"value2","label":"Value 2","default":0.5,"range":[-20.0,20.0]}
uniform float u_extraValue3; // {"material":"value3","label":"Value 3","default":10,"range":[0.0,100.0]}
uniform float u_extraValue4; // {"material":"value4","label":"Value 4","default":0.15,"range":[0.0,20.0]}
uniform vec4 g_Texture0Resolution;
uniform float g_Time;

varying vec4 v_TexCoord;

#if AUDIOPROCESSING
varying float v_AudioShift;
#endif

float u_mod(float x, float y) {
    return x - y * floor(x/y);
}



void main()
{
	vec4 scene = texSample2D(g_Texture0, v_TexCoord.xy);
float mask = texSample2D(g_Texture1, v_TexCoord.zw).r;
	vec2 p = (u_Scale*v_TexCoord.xy * g_Texture0Resolution.xy) / g_Texture0Resolution.x -0.001/g_Texture0Resolution.y -0.001 + u_ScaleL; 	
    float tau = 3.1415926535*2.0;
    float a = atan2(p.x,p.y);
    float r = length(p)*0.75;
    vec2 uv = vec2(a/tau,r);
	float xCol = (uv.x  - (g_Time * u_shiftSpeed2/ 3.0)) * 3.0;
	xCol = u_mod(xCol, 3.0);
	vec3 horColour = vec3(0.25, 0.25, 0.25);
	
	if (xCol < 1.0) {
		
		horColour.r += 1.0 - xCol;
		horColour.g += xCol;
	}
	else if (xCol < 2.0) {
		
		xCol -= 1.0;
		horColour.g += 1.0 - xCol;
		horColour.b += xCol;
	}
	else {
		
		xCol -= 2.0;
		horColour.b += 1.0 - xCol;
		horColour.r += xCol;
	}

	// draw color beam
	uv.xy = (uv/1) - 1;
	

#if AUDIOPROCESSING
    float beamWidth = (u_extraValue1+u_extraValue2+v_AudioShift*cos(uv.x*u_extraValue3*tau*u_extraValue4*clamp(floor(5.0 + 10.0*cos(g_Time * u_shiftSpeed)), 0.0, 10.0))) * abs(1.0 / (30.0 * uv.y));
#else
	
	float beamWidth = (u_extraValue1+u_extraValue2*cos(uv.x*u_extraValue3*tau*u_extraValue4*clamp(floor(5.0 + 10.0*cos(g_Time * u_shiftSpeed)), 0.0, 10.0))) * abs(1.0 / (30.0 * uv.y));
#endif

	vec3 horBeam = beamWidth;


#if SOLIDCOLOR ==1
	vec3 finalColor = horBeam * horColour * u_color1;
#endif

#if SOLIDCOLOR ==0
	vec3 finalColor = horBeam * u_color1;
#endif


	// Apply blend mode
	finalColor = ApplyBlending(BLENDMODE, lerp(finalColor.rgb, scene.rgb, scene.a), finalColor.rgb, mask * u_TopoOpacity);

float alpha = scene.a;

	gl_FragColor = vec4(finalColor, alpha);
}

// Original shader [SIG2014] - Total Noob from Shadertoy created by Dynamite 
// https://www.shadertoy.com/view/XdlSDs
// https://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US