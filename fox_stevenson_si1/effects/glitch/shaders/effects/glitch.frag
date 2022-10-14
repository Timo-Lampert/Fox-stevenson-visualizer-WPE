
uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform vec3 g_LightsPosition[4];
uniform float g_AudioSpectrum16Left[16];
uniform vec3 g_Color;


varying vec2 v_TexCoord;

void main() {
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
	gl_FragColor =  vec4(g_AudioSpectrum16Left[0], g_Color.x, 0.0, 0.5);
}
