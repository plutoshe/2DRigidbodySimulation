varying float vparticleIndex;

void main() {
	float value = vparticleIndex / 3.0;
	gl_FragColor = vec4(value, value, value, 1);
}