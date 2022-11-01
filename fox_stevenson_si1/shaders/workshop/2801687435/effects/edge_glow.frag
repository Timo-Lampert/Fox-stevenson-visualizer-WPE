// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":0}
// [COMBO] {"material":"Invert mask","combo":"INVERT","type":"options","default":0}

#include "common.h"
#include "common_blending.h"

varying vec2 v_TexCoordKernel[9];

uniform sampler2D g_Texture0; // {"hidden":true}
uniform sampler2D g_Texture1; // {"combo":"OPACITYMASK","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}

uniform float u_blendAlpha; // {"material":"Opacity","label":"ui_editor_properties_opacity","default":1,"range":[0.01,1]}
uniform float u_edgeBrightness; // {"material":"Edge brightness","default":2,"range":[0,5]}
uniform float u_blendBrightness; // {"material":"Background brightness","default":2,"range":[0,5]}
uniform float u_edgeAlpha; // {"material":"Edge alpha","default":1,"range":[0,1]}
uniform float u_backgroundAlpha; // {"material":"Background alpha","default":1,"range":[0,1]}
uniform vec3 u_edgeColor; // {"default":"1 1 1","material":"Edge color","type":"color"}
uniform vec3 u_backgroundColor; // {"default":"1 1 1","material":"Background color","type":"color"}
uniform float u_detectionThreshold; // {"material":"ui_editor_properties_detection_threshold","default":1,"range":[0,2]}
uniform float u_detectionMultiply; // {"material":"ui_editor_properties_detection_multiply","default":2,"range":[0,5]}

void main() {
	vec4 albedo = texSample2D(g_Texture0, v_TexCoordKernel[4]);
	float mask = texSample2D(g_Texture1, v_TexCoordKernel[4]).r;

#if INVERT == 1
mask = 1.0 - mask;
#endif
	
	vec3 sample00 = texSample2D(g_Texture0, v_TexCoordKernel[0]).rgb;
	vec3 sample10 = texSample2D(g_Texture0, v_TexCoordKernel[1]).rgb;
	vec3 sample20 = texSample2D(g_Texture0, v_TexCoordKernel[2]).rgb;
	vec3 sample01 = texSample2D(g_Texture0, v_TexCoordKernel[3]).rgb;
	
	vec3 sample21 = texSample2D(g_Texture0, v_TexCoordKernel[5]).rgb;
	vec3 sample02 = texSample2D(g_Texture0, v_TexCoordKernel[6]).rgb;
	vec3 sample12 = texSample2D(g_Texture0, v_TexCoordKernel[7]).rgb;
	vec3 sample22 = texSample2D(g_Texture0, v_TexCoordKernel[8]).rgb;
	
	vec3 gx = sample20 - sample00 + (sample21 - sample01) * 2.0 + sample22 - sample02;
	vec3 gy = sample00 - sample02 + (sample10 - sample12) * 2.0 + sample20 - sample22;

	float g = gx*gx + gy*gy;
	float edge = min(1.0, max(0.0, g * u_detectionMultiply * 2.0 + (u_detectionThreshold - 1.0)));
	
	vec3 edgeColor = mix(albedo.rgb, albedo.rgb * u_edgeColor * u_edgeBrightness, edge);
	vec3 normalColor = mix(albedo.rgb, albedo.rgb * u_backgroundColor * u_blendBrightness, 1 - edge);
	float edgeAlpha = mix(albedo.a, u_edgeAlpha, edge);
	float backgroundAlpha = mix(albedo.a, u_backgroundAlpha, 1 - edge);

	vec4 color = vec4(mix(normalColor, edgeColor, edge), mix(backgroundAlpha, edgeAlpha, edge));
	
	gl_FragColor.a = color.a;
	gl_FragColor.rgb = ApplyBlending(BLENDMODE, albedo.rgb, color.rgb, u_blendAlpha * mask);
}