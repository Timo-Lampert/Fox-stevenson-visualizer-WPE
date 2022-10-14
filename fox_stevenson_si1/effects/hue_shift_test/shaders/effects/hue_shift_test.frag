
#include "common.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"material":"hueshiftmask","label":"Opacity","mode":"opacitymask","combo":"OPACITYMASK","paintdefaultcolor":"0 0 0 1"}
uniform float u_HueShift; // {"material":"Shift amount","default":0,"range":[-1,1]}

varying vec4 v_TexCoord;

void main() 
{
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
	float mask = texSample2D(g_Texture1, v_TexCoord.xy).r;
	vec3 colors = rgb2hsv(albedo.rgb);
	colors.x += u_HueShift;
	albedo.rgb = mix(albedo, hsv2rgb(colors), mask);
	gl_FragColor = albedo;
}
