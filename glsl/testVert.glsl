attribute float particleIndex;
varying float vparticleIndex;

void main() {
	vparticleIndex = particleIndex;
	gl_PointSize = 600.0;
	gl_Position = vec4(0, 0, 0, 1);
}