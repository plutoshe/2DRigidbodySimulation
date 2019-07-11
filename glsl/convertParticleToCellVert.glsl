uniform vec2 particleResolution;
uniform vec2 cellSize;
uniform vec2 gridOriginPos;
uniform vec2 gridTextureResolution;
uniform sampler2D particlePosTex;
uniform float pointSize;
attribute float particleIndex;
varying float vParticleIndex;
void main() {
	// body to particle index
	vec2 uv = indexToUV(particleIndex, particleResolution);
	vParticleIndex = particleIndex;

	// get position of particle
	vec2 pos = texture2D(particlePosTex, uv).xy;

	// convert particle position to cell index
	vec2 gridPos = worldPosToGridPos(pos, gridOriginPos, cellSize);
	// // convert index to gl_Position
	vec2 gridUV = gridPosToGridUV(gridPos, gridTextureResolution);
	// gridUV += 0.5 / gridTextureResolution;
	gl_PointSize = pointSize;
	// gl_Position = vec4(2.0*pos - 1.0, 0, 1);
	gl_Position = vec4(2.0 * gridUV - 1.0, 0, 1);
}
