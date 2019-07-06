varying float vparticleIndex;

void main() {
	float value = (vparticleIndex + 1.0) / 5.0;
	gl_FragColor = vec4(value, value, value, value);
}