/*****************************************
			test neighboor
******************************************/
varying vec4 vParticleValue; 
varying float vParticleIndex; 
void main() {
	 gl_FragColor = vec4(0, 1, 0, 1);
	// float value = (vParticleIndex + 1.0) / 22.0;
	//gl_FragColor = vParticleValue;
	//vec4(1, vParticleIndex/10.0,  1, 1);
}

/*****************************************
			test stencil
******************************************/

// varying float vparticleIndex;

// void main() {
// 	float value = (vparticleIndex + 1.0) / 5.0;
// 	gl_FragColor = vec4(value, value, value, value);
// }