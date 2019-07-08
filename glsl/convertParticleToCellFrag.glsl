varying float vParticleIndex;
void main() {
    gl_FragColor = vec4( vParticleIndex, vParticleIndex, vParticleIndex, vParticleIndex); // indices are stored incremented by 1
}