
// [COMBO] {"material":"Color Handling","combo":"COLORHANDLING","type":"options","default":0,"options":{"Use Font Atlas Color":0, "Posterized Color": 1,"Pixelated Base Color":2, "Base Color":3}}
// [COMBO] {"material":"Smoother Transitions","combo":"SMOOTH","type":"options","default":1}

#include "common_blur.h"

uniform float g_ResolutionScale;  // {"material":"resolution_scale","label":"Resolution Scale","default":0.125,"range":[0.01, 0.5]}

uniform vec2 u_fontGridSize; // {"default":"1 1","int":true,"linked":false,"material":"Font Atlas Grid Dimensions","range":[1,30]}

uniform float u_smoothness; // {"material":"Smoothness","default":2,"range":[0.5,10]}


uniform vec4 g_Texture0Resolution;
uniform vec4 g_Texture1Resolution;
uniform vec2 g_TexelSize;

varying vec2 v_TexCoord;

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"material":"font_atlas", "label":"Font Atlas"}


#ifdef HLSL
	#define fract frac
#endif

vec3 blur3s(vec2 u, vec2 d) {	// single-pass 3x3 kernel gaussian blur
	vec2 o1 = vec2(d.x,   0);
	vec2 o2 = vec2(0  , d.y);
	vec2 o3 = vec2(d.x, d.y);
	vec2 o4 = vec2(d.x,-d.y);
	return texSample2D(g_Texture0, u).rgb * 0.25
	+ texSample2D(g_Texture0, u + o1).rgb * 0.125
	+ texSample2D(g_Texture0, u - o1).rgb * 0.125
	+ texSample2D(g_Texture0, u + o2).rgb * 0.125
	+ texSample2D(g_Texture0, u - o2).rgb * 0.125
	+ texSample2D(g_Texture0, u + o3).rgb * 0.0625
	+ texSample2D(g_Texture0, u - o3).rgb * 0.0625
	+ texSample2D(g_Texture0, u + o4).rgb * 0.0625
	+ texSample2D(g_Texture0, u - o4).rgb * 0.0625;
}

void main() {
	const vec2 fontRatio = vec2((g_Texture1Resolution.z/u_fontGridSize.x)/(g_Texture1Resolution.w/u_fontGridSize.y),1.);
	const vec2 newResolution = g_Texture0Resolution.xy * g_ResolutionScale / fontRatio;

	const vec2 scaledCoord = v_TexCoord * newResolution;
	const vec2 newTexelSize = 1 / newResolution;

	// Snap the texture coordinates to the new pixel grid (new resolution).
	vec2 v_TexCoord00 = round(scaledCoord) * newTexelSize;
	// Make sure we sample from the center of an original pixel, instead of between them.
	v_TexCoord00 = round(v_TexCoord00 / g_TexelSize.xy) * g_TexelSize + g_TexelSize * 0.5;

#if SMOOTH == 1
	//const vec3 rasterColor = blur13(v_TexCoord00, v_TexCoord.zw);
	const vec3 rasterColor = blur3s(v_TexCoord00, 1. / g_Texture0Resolution.zw / g_ResolutionScale / u_smoothness);
#else
	const vec3 rasterColor = texSample2D(g_Texture0, v_TexCoord00).rgb;
#endif
	const float rasterGray = ((rasterColor.r + rasterColor.g + rasterColor.b) / 3.) * 0.99998 + 0.00001;
	const vec2 rasterUV = (v_TexCoord - v_TexCoord00) / (newTexelSize) + 0.5;

	const float charCount = u_fontGridSize.x * u_fontGridSize.y;
	const vec2 cellUV = vec2(1. / u_fontGridSize.x, 1. / u_fontGridSize.y);

	const float posterized = floor(rasterGray * charCount) / charCount;
	const vec2 atlasPos = vec2(
		mod(posterized * charCount, u_fontGridSize.x) / u_fontGridSize.x,
		floor(posterized * charCount / u_fontGridSize.x) / u_fontGridSize.y
	);
	const vec2 atlasUV = rasterUV * cellUV + atlasPos;

#if COLORHANDLING == 0
	gl_FragColor = texSample2D(g_Texture1, atlasUV);
#else
	const vec4 c = texSample2D(g_Texture1, atlasUV);
	const float mask = ((c.r + c.g + c.b) / 3. > 0.5);
#if COLORHANDLING == 1
	gl_FragColor = vec4(mask * CAST3(posterized), 1);
#endif
#if COLORHANDLING == 2
	gl_FragColor = vec4(mask * rasterColor, 1);
#endif
#if COLORHANDLING == 3
	gl_FragColor = vec4(mask * texSample2D(g_Texture0, v_TexCoord).rgb,1);
#endif
#endif

	// DEBUG OUTPUTS
	//gl_FragColor = vec4(blur3s(v_TexCoord, 1. / g_Texture0Resolution.zw / g_ResolutionScale / u_smoothness),1);
	//gl_FragColor = vec4(CAST3(rasterGray),1);
	//gl_FragColor = vec4(rasterColor,1);
	//gl_FragColor = vec4(atlasPos,0,1);
	//gl_FragColor = vec4(atlasUV,0,1);
}
