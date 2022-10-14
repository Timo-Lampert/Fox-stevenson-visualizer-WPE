// [COMBO] {"material":"Lens type","combo":"TYPE","type":"options","default":0,"options":{"Spherical":0,"Anamorphic":1}}
// [COMBO] {"material":"Invert mask","combo":"INVERT","type":"options","default":0}
// [COMBO] {"material":"Show grid","combo":"GRID","type":"options","default":0}

#include "common.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"MASK","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform float u_distorsion; // {"material":"Distorsion 1","default":0,"range":[-1,1]}
uniform float u_radius; // {"material":"Distorsion 2","default":0,"range":[-1,1]}
uniform float u_aberration; // {"material":"Chromatic aberration","default":0,"range":[-1,1]}
uniform vec2 g_center; // {"default":"0.5 0.5","label":"ui_editor_properties_center","material":"center","position":true}
uniform float u_focusLength; // {"material":"Focus length","default":1,"range":[0,3]}
uniform float u_general; // {"material":"General","default":1,"range":[0,1]}
uniform float u_gridSize; // {"material":"Grid size","default":25,"range":[0,50]}
uniform float u_gridAlpha; // {"material":"Grid opacity","default":1,"range":[0,1]}
uniform float g_ratio; // {"material":"ratio","label":"Lens ratio","default":0.418,"range":[0,1]}
uniform float g_Size; // {"material":"size","label":"Distorion size","default":1,"range":[0,2]}
uniform vec3 u_gridColor; // {"default":"1 1 1","material":"Grid color","type":"color"}

uniform vec4 g_Texture0Resolution;
varying vec4 v_TexCoord;

#if g_Texture0Resolution.x < g_Texture0Resolution.y
#define ratioDiff (vec2(g_ratio, 1.0))
#else
#define ratioDiff (vec2(g_ratio, 1.0))
#endif

#if TYPE == 1
#define type (vec2((g_Texture0Resolution.x / g_Texture0Resolution.y), 1.0) * ratioDiff)
#else
#define type vec2((g_Texture0Resolution.x / g_Texture0Resolution.y), 1.0)
#endif

vec2 computeUV(vec2 uv, float amount, float radius){
    
    uv = (uv - 0.5) * type * 2.0 / g_Size;
    vec2 radial = 0.0, tangential = 0.0, center = (g_center - 0.5);

    float focusLength = 1.0 / u_focusLength;

    radial += uv * (1.0 + amount * pow(length(uv), 2.0) + radius * pow(length(uv), 4.0)) * focusLength;

    tangential.x = 2.0 * center.y * uv.x * uv.y + center.x * (length(uv) + 2.0 * uv.x * uv.x);
    tangential.y = center.y * (length(uv) + 2.0 * uv.y * uv.y) + 2.0 * center.x * uv.x * uv.y;

    return ((radial + tangential) / (type * 2.0 / g_Size)) + 0.5;
}

void main() {

    float offset = u_aberration * 0.1 * u_general;
    float distortion = u_distorsion * u_general;
    float radius = u_radius * u_general;

    vec4 albedo = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion, radius));

    float red = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion + offset, radius)).r;
    float green = albedo.g;
    float blue = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion - offset, radius)).b;
    float alpha = albedo.a;

    float mask = texSample2D(g_Texture1, v_TexCoord.xy).r;
#if INVERT
    mask = 1.0 - mask;
#endif

#if GRID
    vec2 div = u_gridSize * vec2(1.0, g_Texture0Resolution.y / g_Texture0Resolution.x);
	float lines = 0.0;
    vec2 uv = computeUV(v_TexCoord.xy, distortion, radius);
	lines += smoothstep(0.05 * (u_gridSize / 30), 0.0, abs(mod(abs(uv.x * 2.0 * div.x), 2.0) - 1.0));
	lines += smoothstep(0.05 * (u_gridSize / 30), 0.0, abs(mod(abs(uv.y * 2.0 * div.y), 2.0) - 1.0));
	lines = clamp(lines, 0.0, 1.0);
#else
    float lines = 0.0;
    vec4 colorLines = CAST4(0.0);
#endif

	gl_FragColor = mix(texSample2D(g_Texture0, v_TexCoord.xy), vec4(mix(vec3(red, green, blue), u_gridColor, u_gridAlpha * lines), alpha), mask);
}