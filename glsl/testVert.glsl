/*****************************************
			test neighboor
******************************************/

attribute float particleIndex;
uniform vec2 particleResolution;
uniform vec2 gridTextureResolution;
uniform sampler2D particlePosTex;
uniform sampler2D cellTex;
uniform float pointSize;
uniform vec2 gridOriginPos;
uniform vec2 cellSize;
varying float vParticleIndex; 
varying vec4 vParticleValue; 

void main() {
	vec2 uv = indexToUV(particleIndex, particleResolution);
	vec2 pos = texture2D(particlePosTex, uv).xy;
	vec2 gridPos = worldPosToGridPos(pos, gridOriginPos, cellSize);
	vec2 gridUV = gridPosToGridUV(gridPos, gridTextureResolution);
	vec2 newGridUV;
	vec4 particleIndicesInCell;
	vec2 newuv;
	vec2 neighborCellTexUV;
	for (float i = -1.0; i <= -1.0; i += 1.0) {
		for (float j = -1.0; j <= -1.0; j+= 1.0) {
			//for (int k = -1; k <= 1; k++) {
			// neighboorhood coordinate
			vec2 newGridPos = gridPos + vec2(i,j);
			neighborCellTexUV = gridPosToGridUV(newGridPos, gridTextureResolution);
			//neighborCellTexUV += vec2(0.5) / (2.0 * gridTextureResolution); 
			// value at position
			particleIndicesInCell = texture2D(cellTex, neighborCellTexUV);
			newuv = indexToUV(particleIndicesInCell.w, particleResolution);
			//}
		}
	}
	vParticleValue = particleIndicesInCell;
	vParticleIndex = particleIndicesInCell.w;
	gl_PointSize = 100.0;
	gl_Position = vec4(newuv * 2.0 -1.0, 0,1);
	// gl_Position = vec4(0.7, 0.7, 0, 1);
}

/*****************************************
			test stencil
******************************************/

// attribute float particleIndex;
// varying float vparticleIndex;
// uniform float pointSize;

// void main() {
// 	vparticleIndex = particleIndex;
// 	gl_PointSize = pointSize;//600.0;
// 	gl_Position = vec4(0, 0, 0, 1);
// }