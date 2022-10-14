
#include "common_blending.h"

/*
if you want to use the cursor interactivity i recommend to apply this effect only on full screen layers or a composition layers that fill the entire screen
*/

// [COMBO] {"material":"Shutter Mode","combo":"COUNTER_ROTATION","type":"options","default":0,"options":{"Rotating Blades":0,"Sliding Blades":1}}
// [COMBO] {"material":"Flip Horizontal","combo":"INVERT_X","type":"options","default":1}
// [COMBO] {"material":"Cursor Proximity Interaction","combo":"PROXIMITY_CLOSE","type":"options","default":0,"options":{"Open Shutter":0,"Close Shutter":1}}
// [COMBO] {"material":"Audio / Script Interaction","combo":"AUDIO_CLOSE","type":"options","default":0,"options":{"Open Shutter":0,"Close Shutter":1}}


#define M_PI 3.1415926535897932384626433832795

#define MOTIVE_IMAGE 1
#define MOTIVE_BACKGROUND 2

#define MOVEMENT_NONE 0
#define MOVEMENT_LINEAR 1
#define MOVEMENT_CIRCULAR 2

#define SCALE_ABSOLUTE 0
#define SCALE_RELATIVE 1

uniform float g_Time;
uniform vec2 g_PointerPosition;


uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform vec4 g_Texture0Resolution;

varying vec4 v_TexCoord;

uniform float N; // {"label":"Blade Count","material":"1_shutter_1_segment_count","int":true,"default":8,"range":[3,20]}
uniform vec3 color_shutter;       // {"default":"0.2 0.2 0.2","label":"Shutter Color","material":"1_shutter_2_color","type":"color"}
uniform float alpha_shutter; // {"label": "Shutter Alpha", "material":"1_shutter_3_alpha", "default":1, "range":[0,1]}
uniform vec3 color_stroke;       // {"default":"0.3 0.3 0.3","label":"Stroke Color","material":"1_shutter_4_stroke_color","type":"color"}
uniform float alpha_stroke; // {"label": "Stroke Alpha", "material":"1_shutter_5_stroke_alpha", "default":1, "range":[0,1]}
uniform float stroke_width;      // {"label": "Stroke Width", "material":"1_shutter_6_width", "default":0.04, "range":[0,0.1]}

uniform float scale; // {"label": "Scale", "material":"2_placement_1_scale", "default":1, "range":[0.1,2.5]}
uniform vec2 position; // {"default":"0.0 0.0","label":"Offset","material":"2_placement_2_position","position":true}
uniform float rotation; // {"label": "Rotation", "material":"2_placement_3_rotation", "default":0.0, "range":[0,1]}
uniform float rot_speed; // {"label": "Rotation Speed", "material":"2_placement_4_rspeed", "default":0, "range":[-2.5,2.5]}


uniform float leeway; // {"label": "Leeway", "material":"3_interaction_1_leeway", "default":0.5, "range":[0,1]}
uniform float offset; // {"label": "Resting Position", "material":"3_interaction_2_offset", "default":0.5, "range":[0,1]}

uniform float audio_weight; // {"label": "Audio / Script Weight", "material":"4_audio_1_weight", "default":0.5, "range":[0,1]}
uniform float audio_in; // {"label": "Audio / Script Input", "material":"4_audio_1_in", "default":0.5, "range":[0,1]}

uniform float cursor_radius; // {"label": "Cursor Radius", "material":"5_cursor_1_radius", "default":1.0, "range":[0.1,5]}


const float sr3 = sqrt(3.);
const float hr3 = sqrt(3.) / 2.;

mat2 rMat(float angle) {
    float s = sin(angle * M_PI * 2.);
    float c = cos(angle * M_PI * 2.);
    return mat2(c, -s, s, c);;
}

vec4 select(vec4 c0, vec4 c1, float s) {
    return c0 * (1 - s) + c1 * s;
}

vec4 alphaBlend(vec4 bg, vec4 fg) {
    float ao = 1 - (1 - bg.a) * (1- fg.a);
    return vec4((fg.rgb * fg.a + (1 - fg.a) * bg.a * bg.rgb) / ao, ao);
}

void main() {
	float xyRatio = g_Texture0Resolution.x / g_Texture0Resolution.y;
    vec2 ratCorr = vec2(xyRatio, 1);
	vec2 uv = mul((v_TexCoord.xy - 0.5) * ratCorr - position, rMat(g_Time * rot_speed + rotation)) / scale;
    #if (INVERT_X)
        uv.x = -uv.x;
    #endif
    uv *= 5.0;
    vec2 cursor = ((g_PointerPosition * 2. - 1.) * ratCorr / 2. - position) / scale;

    //draw shutter
    mat2 rotMat = rMat(1./N);

    float cursor_status = clamp(length(cursor) * 5. / cursor_radius,0.,1.);
    #if(PROXIMITY_CLOSE == 1)
        cursor_status = 1 - cursor_status;
    #endif
    float audio_status = audio_in;
    #if (AUDIO_CLOSE == 0)
        audio_status = 1 - audio_status;
    #endif

    audio_status *= audio_weight;
    cursor_status *= 1. - audio_weight;
    float openness = (audio_status + cursor_status) * leeway + (1. -leeway) * offset;
    float f = M_PI / 4. * (1. - stroke_width * 0.9) * openness;

    vec2 lens_uv = mul(uv,rMat(1./12.));
    #if (COUNTER_ROTATION == 1)
        lens_uv = mul(lens_uv, rMat(f / N));
    #endif

    float dist;
    float shutter_stroke_mask;
    float stroke_mask;
    float cover_mask = 0.;
    float circle_mask = step(length(lens_uv),1.);
    float global_stroke_mask = 0;
    float global_shutter_mask = 0;

    for (int i=0; i<N+1; i++) {
        dist = -dot(lens_uv-vec2(-1,1),vec2(sin(f),cos(f)));
        shutter_stroke_mask = step(dist, stroke_width);
        stroke_mask = step(abs(dist), stroke_width);

        global_shutter_mask += sign(i) * circle_mask * (1. - cover_mask) * shutter_stroke_mask * (1. - stroke_mask); 
        global_stroke_mask += sign(i) * circle_mask * (1. - cover_mask) * stroke_mask;
        // sign(i) makes sure nothing is drawn in the first iteration
        // the first iteration just sets up the cover_mask for the next iteration

        cover_mask = shutter_stroke_mask;
        lens_uv = mul(lens_uv,rotMat);
    }
    
    //if(global_shutter_mask + global_stroke_mask < 1.) discard;
	//gl_FragColor = vec4(1,1,1,0.5);*/

    vec4 output = texSample2D(g_Texture0, v_TexCoord.xy);
    output = vec4(ApplyBlending(0, output.rgb, color_stroke, alpha_stroke * global_stroke_mask), 1);
    output = vec4(ApplyBlending(0, output.rgb, color_shutter, alpha_shutter * global_shutter_mask), 1);
    gl_FragColor = output;

    //gl_FragColor.rg = sspos;
    //if(length(sspos - cursor) < 0.12) gl_FragColor = vec4(1,1,1,1);
}
