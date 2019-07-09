uniform vec2 particleResolution;
uniform float deltaTime;
uniform sampler2D posTex;
uniform sampler2D velocityTex;
attribute float bodyIndex;
varying vec4 vdata;

void main() {
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	// uv += 0.5 / res;
	vec4 trans = texture2D(posTex, uv);
	vec4 velocity = texture2D(velocityTex, uv);
	trans += deltaTime * vec4(velocity.xyz, 0);
	vdata = trans;

	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}