
uniform mat4 g_ModelViewProjectionMatrix;

uniform float u_zoom; // {"material":"Zoom","default":1,"range":[0.5,1.5]}
uniform float u_general; // {"material":"General","default":1,"range":[0,1]}

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec4 v_TexCoord;
varying vec2 v_TexCoordMask;

void main() {
	gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);
	v_TexCoord.xy = (a_TexCoord - CAST2(0.5)) * (1.0 + (1.0 - u_zoom) * u_general) + CAST2(0.5);
}
