attribute float particleIndex;
varying float vparticleIndex;
uniform float tmpParticleSize;

void main() {
	vparticleIndex = particleIndex;
	gl_PointSize = tmpParticleSize;//600.0;
	gl_Position = vec4(0, 0, 0, 1);
}