// [COMBO] {"material":"ui_editor_properties_composite","combo":"COMPOSITE","type":"options","default":0,"options":{"ui_editor_properties_normal":0,"ui_editor_properties_blend":1,"ui_editor_properties_under":2,"ui_editor_properties_cutout":3}}
// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":0}
// [COMBO] {"material":"ui_editor_properties_monochrome","combo":"COMPOSITEMONO","type":"options","default":0}

#include "common_composite.h"

varying vec4 v_TexCoord;

uniform sampler2D g_Texture0; // {"hidden":true}
uniform sampler2D g_Texture1; // {"label":"ui_editor_properties_opacity_mask","mode":"opacitymask","combo":"MASK","paintdefaultcolor":"0 0 0 1"}
uniform sampler2D g_Texture2; // {"hidden":true}
uniform float u_ContrastSmoothness; // {"material":"Contrast Smoothness","default":16,"range":[0.1,64]}

uniform vec4 g_Texture0Resolution;
uniform vec2 g_TexelSize;

#define iResolution vec2(1. / g_TexelSize.x, 1. / g_TexelSize.y)

vec4 samp(int x, int y, vec2 fragCoord) {
  vec2 uv = fragCoord.xy / iResolution.xy * g_Texture0Resolution.zw;
  uv = (uv + vec2(x, y)) / g_Texture0Resolution.zw;
  vec4 color = texSample2D(g_Texture0, uv);
  return color;
}

float minc(float a1, float a2, float a3, float a4, float a5, float a6, float a7, float a8, float a9){
	return min(a1, min(a2, min(a3, min(a4, min(a5, min(a6, min(a7, min(a8, a9))))))));
}

float maxc(float a1, float a2, float a3, float a4, float a5, float a6, float a7, float a8, float a9){
	return max(a1, max(a2, max(a3, max(a4, max(a5, max(a6, max(a7, max(a8, a9))))))));
}

float powc(float a, float p){
	return 1.- pow(1.-a, p);
}

float get_local_contrast(vec2 c, float power) {
	float minColorR = minc(
		samp(-1., -1., c).r,
		samp(-1.,  0., c).r,
		samp(-1.,  1., c).r,
		samp( 0., -1., c).r,
		samp( 0.,  0., c).r,
		samp( 0.,  1., c).r,
		samp( 1., -1., c).r,
		samp( 1.,  0., c).r,
		samp( 1.,  1., c).r
	);

	float minColorG = minc(
		samp(-1., -1., c).g,
		samp(-1.,  0., c).g,
		samp(-1.,  1., c).g,
		samp( 0., -1., c).g,
		samp( 0.,  0., c).g,
		samp( 0.,  1., c).g,
		samp( 1., -1., c).g,
		samp( 1.,  0., c).g,
		samp( 1.,  1., c).g
	);

	float minColorB = minc(
		samp(-1., -1., c).b,
		samp(-1.,  0., c).b,
		samp(-1.,  1., c).b,
		samp( 0., -1., c).b,
		samp( 0.,  0., c).b,
		samp( 0.,  1., c).b,
		samp( 1., -1., c).b,
		samp( 1.,  0., c).b,
		samp( 1.,  1., c).b
	);

	float maxColorR = maxc(
		samp(-1., -1., c).r,
		samp(-1.,  0., c).r,
		samp(-1.,  1., c).r,
		samp( 0., -1., c).r,
		samp( 0.,  0., c).r,
		samp( 0.,  1., c).r,
		samp( 1., -1., c).r,
		samp( 1.,  0., c).r,
		samp( 1.,  1., c).r
	);

	float maxColorG = maxc(
		samp(-1., -1., c).g,
		samp(-1.,  0., c).g,
		samp(-1.,  1., c).g,
		samp( 0., -1., c).g,
		samp( 0.,  0., c).g,
		samp( 0.,  1., c).g,
		samp( 1., -1., c).g,
		samp( 1.,  0., c).g,
		samp( 1.,  1., c).g
	);

	float maxColorB = maxc(
		samp(-1., -1., c).b,
		samp(-1.,  0., c).b,
		samp(-1.,  1., c).b,
		samp( 0., -1., c).b,
		samp( 0.,  0., c).b,
		samp( 0.,  1., c).b,
		samp( 1., -1., c).b,
		samp( 1.,  0., c).b,
		samp( 1.,  1., c).b
	);

	return (powc(abs(maxColorR - minColorR), power) + powc(abs(maxColorG - minColorG), power) + powc(abs(maxColorB - minColorB), power)) / 3.;
}

void main() {
  vec2 blurredCoords = v_TexCoord.xy;

  #ifdef HLSL_SM30
  blurredCoords += 0.75 / g_Texture0Resolution.zw;
  #endif

  vec4 blurred = texSample2D(g_Texture0, ApplyCompositeOffset(blurredCoords, g_Texture0Resolution.xy));
  vec4 albedoOld = texSample2D(g_Texture2, v_TexCoord.xy);

  #if MASK
  float mask = texSample2D(g_Texture1, v_TexCoord.zw).r;
  #else
  float mask = 1.0;
  #endif

  float div = mix(blurred.a, 1, step(blurred.a, 0));
  blurred = ApplyComposite(albedoOld, vec4(blurred.rgb / div, blurred.a));
  float localContrast = get_local_contrast(v_TexCoord.xy * iResolution, u_ContrastSmoothness);
  blurred = mix(albedoOld, blurred, mask * (1.-localContrast));

  gl_FragColor = blurred;
//   gl_FragColor = vec4(localContrast, localContrast, localContrast, 1.);
}
