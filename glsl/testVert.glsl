attribute float particleIndex;
varying float vparticleIndex;
uniform float pointSize;

void main() {
	vparticleIndex = particleIndex;
	gl_PointSize = pointSize;//600.0;
	gl_Position = vec4(0, 0, 0, 1);
}