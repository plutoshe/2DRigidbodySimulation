uniform vec2 particleResolution;
uniform float deltaTime;
uniform sampler2D massTex;
uniform sampler2D forceTex;
uniform sampler2D velocityTex;
uniform sampler2D posTex;
uniform sampler2D cellTex;
uniform vec4 gravity;
attribute float bodyIndex;
varying vec4 vdata;

void main() {
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	// uv += 0.5 / res;
    vec4 velocity = texture2D(velocityTex, uv);
    vec4 force = texture2D(forceTex, uv);
    vec4 mass = texture2D(massTex, uv);
	force += deltaTime * vec4(0, 3.0, 0, 0);
	// force += vec4(0, 1, 0, 0) * deltaTime;
	vdata = force;

	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}