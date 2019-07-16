uniform vec2 particleResolution;
uniform sampler2D massTex;
uniform sampler2D momentumTex;
attribute float particleIndex;
varying vec2 newVelocity;

void main() {
	vec2 uv = indexToUV(particleIndex, particleResolution);
    vec2 momentum = texture2D(momentumTex, uv).xy;
    float mass = texture2D(massTex, uv).w;
	
	newVelocity = momentum / mass;

	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}