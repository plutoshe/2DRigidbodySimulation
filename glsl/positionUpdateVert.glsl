uniform vec2 particleResolution;
uniform float deltaTime;
uniform sampler2D posTex;
uniform sampler2D velocityTex;
attribute float bodyIndex;
varying vec2 newPosition;

void main() {
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	// uv += 0.5 / res;
	vec2 oldPosition = texture2D(posTex, uv).xy;
	vec2 velocity = texture2D(velocityTex, uv).xy;
	newPosition = oldPosition + deltaTime * velocity.xy;

	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}