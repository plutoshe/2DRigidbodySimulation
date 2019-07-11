uniform vec2 particleResolution;
uniform float deltaTime;
uniform sampler2D massTex;
uniform sampler2D forceTex;
uniform sampler2D velocityTex;
uniform sampler2D posTex;
uniform sampler2D cellTex;
uniform vec4 gravity;
attribute float bodyIndex;
varying vec4 vdata;
uniform float stiffness;
uniform float damping;
uniform float friction;
uniform float particleRadius;
uniform vec2 gridOriginPos;
uniform vec2 gridTextureResolution;
uniform vec2 cellSize;

void main() {
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	// uv += 0.5 / res;
	vec3 position = texture2D(posTex, uv).xyz;
    vec3 velocity = texture2D(velocityTex, uv).xyz;
    vec3 force = vec3(0,0,0);
	//texture2D(forceTex, uv).xyz;
    vec4 mass = texture2D(massTex, uv);
	

	// update particle physics
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	vec2 pos = texture2D(posTex, uv).xy;
	vec2 gridPos = worldPosToGridPos(pos, gridOriginPos, cellSize);
	vec2 gridUV = gridPosToGridUV(gridPos, gridTextureResolution);
	vec4 particleIndicesInCell;
	vec2 newuv;
	vec2 neighborCellTexUV;
	for (float i = -1.0; i <= 1.0; i += 1.0) {
		for (float j = -1.0; j <= 1.0; j+= 1.0) {
			//for (int k = -1; k <= 1; k++) {
			// neighboorhood coordinate
			vec2 newGridPos = gridPos + vec2(i,j);
			neighborCellTexUV = gridPosToGridUV(newGridPos, gridTextureResolution);
			//neighborCellTexUV += vec2(0.5) / (2.0 * gridTextureResolution); 
			// value at position
			particleIndicesInCell = texture2D(cellTex, neighborCellTexUV);
			newuv = indexToUV(particleIndicesInCell.y, particleResolution);
			//}
		}
	}


	// update border physics
	vec2 boxMin = vec2(-800, -600);
    vec2 boxMax = vec2(800, 600);
	
	vec3 dirs[2];
    dirs[0] = vec3(1,0,0);
    dirs[1] = vec3(0,1,0);
    for(int i=0; i<2; i++){
		vec3 dir = dirs[i];
		vec3 tangentVel = velocity - dot(velocity,dir) * dir;
		
		float x = dot(dir,position) - particleRadius;
		if (x < boxMin[i]) {
			// force = vec3(0, 1000, 0);
			force += -( stiffness * (x - boxMin[i]) * dir + damping * dot(velocity,dir) * dir);
            force -= friction * tangentVel;
		}
		x = dot(dir,position) + particleRadius;
        if(i != 1 && x > boxMax[i]){
			// force = vec3(0, 100, 0);
            dir = -dir;
            force -= -( stiffness * (x - boxMax[i]) * dir - damping * dot(velocity,dir) * dir);
            force -= friction * tangentVel;
        }
	}
	vdata = vec4(force, 1.0);
	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}