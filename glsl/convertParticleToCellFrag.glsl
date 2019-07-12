varying float vParticleIndex;
void main() {
    float value = vParticleIndex + 1.0;
    gl_FragColor = vec4(value, value, value, value); // indices are stored incremented by 1
}