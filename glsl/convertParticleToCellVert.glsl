uniform vec2 particleSize;
uniform vec2 cellSize;
uniform vec3 gridPos;
uniform sampler2D particlePosTex;
attribute float particleIndex;
varying float vParticleIndex;
void main() {
	// body to particle index
	vec2 uv = indexToUV(particleIndex, particleSize);
	vParticleIndex = particleIndex;

	// get position of particle
	vec3 pos = texture2D(particlePosTex, uv).xyz;

	// convert particle position to cell index
	vec2 uvCell = posToUV(pos, res);
	// convert index to gl_Position
	vec2 gridUV = gridPosToGridUV(cellPos, 0, gridResolution, gridTextureResolution, gridZTiling);
	gridUV += 0.5 / gridTextureResolution;
	gl_PointSize = 2.0;
	gl_Position = vec4(2.0*gridUV - 1.0, 0, 1);
}
