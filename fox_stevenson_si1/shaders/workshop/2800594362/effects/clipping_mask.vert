
uniform vec2 g_ParallaxPosition;
uniform mat4 g_ModelViewProjectionMatrix;

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec4 v_TexCoord;
varying vec2 v_ParallaxOffset;

void main() {
	gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);

	v_ParallaxOffset = vec2(g_ParallaxPosition.x - 0.5, -g_ParallaxPosition.y + 0.5) * 0.5;

	v_TexCoord.xy = a_TexCoord;
}