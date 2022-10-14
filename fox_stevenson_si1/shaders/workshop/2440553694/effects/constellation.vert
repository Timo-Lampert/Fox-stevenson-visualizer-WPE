

// [COMBO] {"material":"ui_editor_properties_audio_response","combo":"AUDIOPROCESSING","type":"audioprocessingoptions","default":0}

#include "common.h"

uniform mat4 g_ModelViewProjectionMatrix;
uniform mat4 g_ModelViewProjectionMatrixInverse;
uniform vec2 g_PointerPosition;

// uniform vec2 g_Offset; // {"default":"0 0","label":"ui_editor_properties_offset","material":"offset"}
// //uniform vec2 g_Scale; // {"default":"1 1","label":"ui_editor_properties_scale","material":"scale"}
// uniform vec2 g_Scale; // {"default":"1 1","label":"ui_editor_properties_scale","linked":true,"material":"scale","range":[0.1,10.0]}
// uniform float g_Direction; // {"material":"angle","label":"ui_editor_properties_angle","default":0,"range":[0,6.28],"direction":true}


uniform vec4 g_Texture0Resolution;
varying vec4 v_PointerUV;
attribute vec3 a_Position;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;

// vec2 applyFx(vec2 v) {
// 	v = rotateVec2(v - CAST2(0.5), -g_Direction);
// 	return (v + g_Offset) * g_Scale + CAST2(0.5);
// }

#if AUDIOPROCESSING
varying float v_AudioShift;
uniform float g_AudioSpectrum16Left[16];
uniform float g_AudioSpectrum16Right[16];

uniform float g_AudioFrequencyMin; // {"material":"frequencymin","label":"ui_editor_properties_frequency_min","default":0,"int":true,"range":[0,15]}
uniform float g_AudioFrequencyMax; // {"material":"frequencymax","label":"ui_editor_properties_frequency_max","default":1,"int":true,"range":[0,15]}
uniform float g_AudioPower; // {"material":"audioexponent","label":"ui_editor_properties_audio_exponent","default":1.0,"range":[0,4]}
uniform vec2 g_AudioBounds; // {"default":"1.0 0.2","label":"ui_editor_properties_audio_bounds","material":"audiobounds"}

uniform float g_AudioMultiply; // {"material":"audioamount","label":"ui_editor_properties_audio_amount","default":1,"range":[0,2]}

float CreateAudioResponse(float bufferLeft[16], float bufferRight[16])
{
	float audioFrequencyEnd = max(g_AudioFrequencyMin, g_AudioFrequencyMax);
	float audioResponse = 0.0;

#if AUDIOPROCESSING == 1
	for (int a = int(g_AudioFrequencyMin); a <= int(g_AudioFrequencyMax); ++a)
	{
		audioResponse += bufferLeft[a];
	}
	audioResponse /= (g_AudioFrequencyMax - g_AudioFrequencyMin + 1.0);
#endif
#if AUDIOPROCESSING == 2
	for (int a = int(g_AudioFrequencyMin); a <= int(g_AudioFrequencyMax); ++a)
	{
		audioResponse += bufferRight[a];
	}
	audioResponse /= (g_AudioFrequencyMax - g_AudioFrequencyMin + 1.0);
#endif
#if AUDIOPROCESSING == 3
	for (int a = int(g_AudioFrequencyMin); a <= int(g_AudioFrequencyMax); ++a)
	{
		audioResponse += bufferLeft[a];
		audioResponse += bufferRight[a];
	}
	audioResponse /= (g_AudioFrequencyMax - g_AudioFrequencyMin + 1.0) * 2.0;
#endif

	audioResponse = smoothstep(g_AudioBounds.x, g_AudioBounds.y, audioResponse);
	audioResponse = saturate(pow(audioResponse, g_AudioPower)) * g_AudioMultiply;
	return audioResponse;
}
#endif

void main() {

	vec3 position = a_Position;

	gl_Position = mul(vec4(position, 1.0), g_ModelViewProjectionMatrix);
	
	v_TexCoord = a_TexCoord;
	
 	//v_TexCoord = applyFx(v_TexCoord);


#if AUDIOPROCESSING
	v_AudioShift = CreateAudioResponse(g_AudioSpectrum16Left, g_AudioSpectrum16Right);
#endif

vec2 pointer = g_PointerPosition;
	pointer.y = 1.0 - pointer.y; // Flip pointer screen space Y to match texture space Y
	v_PointerUV.xyz = mul(vec4(pointer * 2 - 1, 0.0, 1.0), g_ModelViewProjectionMatrixInverse).xyw;
	v_PointerUV.xy *= 0.5 / g_Texture0Resolution.xy;
	v_PointerUV.w = g_Texture0Resolution.y / -g_Texture0Resolution.x;
}
