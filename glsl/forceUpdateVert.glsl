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
uniform float particleRadius;
uniform vec2 gridOriginPos;
uniform vec2 gridTextureResolution;
uniform vec2 cellSize;

uniform float particleSpring;
uniform float particleDamping;
uniform float particleFriction;

uniform float groundSpring;
uniform float groundDamping;
uniform float groundFriction;



vec2 particleForce(float STIFFNESS, float DAMPING, float DAMPING_T, float distance, float minDistance, vec2 xi, vec2 xj, vec2 vi, vec2 vj){
    vec2 rij = xj - xi;
    vec2 rij_unit = normalize(rij);
    vec2 vij = vi - vj;
    vec2 vij_t = vij - dot(vij, rij_unit) * rij_unit;
    vec2 springForce = - STIFFNESS * (distance - max(length(rij), minDistance)) * rij_unit;
    vec2 dampingForce = - DAMPING * vij;
    vec2 tangentForce = DAMPING_T * vij_t;
    return springForce + dampingForce + tangentForce;
}


void main() {
	// update particle physics
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	vec2 position = texture2D(posTex, uv).xy;
    vec2 force = vec2(0,0);
	//texture2D(forceTex, uv).xyz;
    vec4 mass = texture2D(massTex, uv);
		
	vec2 velocity = texture2D(velocityTex, uv).xy;
	vec2 gridPos = worldPosToGridPos(position, gridOriginPos, cellSize);
	vec2 gridUV = gridPosToGridUV(gridPos, gridTextureResolution);
	vec4 particleIndicesInCell;
	vec2 newuv;
	vec2 neighborCellTexUV;
	float neighborIndex;
	for (float i = -1.0; i < 2.0; i += 1.0) {
		for (float j = -1.0; j < 2.0; j+= 1.0) {
			//for (int k = -1; k <= 1; k++) {
			// neighboorhood coordinate
			vec2 newGridPos = gridPos + vec2(i,j);
			neighborCellTexUV = gridPosToGridUV(newGridPos, gridTextureResolution);
			particleIndicesInCell = texture2D(cellTex, neighborCellTexUV);
			for (int k = 0; k < 4; k++) {
				neighborIndex = particleIndicesInCell[k] - 1.0;
				vec2 neighborUV = indexToUV(neighborIndex, particleResolution);
				vec2 neighborPosition = texture2D(posTex, neighborUV).xy;
				vec2 neighborVelocity = texture2D(velocityTex, neighborUV).xy;
				if (particleIndicesInCell[k] > 0.0 && neighborIndex != bodyIndex &&
					newGridPos.x>=0.0 && newGridPos.y>=0.0 && 
					newGridPos.x<gridTextureResolution.x && newGridPos.y<gridTextureResolution.y) {
					vec2 r = position - neighborPosition;
					float len = sqrt(r.x * r.x + r.y * r.y);
                    if( len < particleRadius * 2.0) {
						vec2 dir = normalize(r);
						// the cofficient between fluid
						force += particleForce(particleSpring, particleDamping, groundFriction, 
						2.0 * particleRadius, particleRadius, 
						position, neighborPosition, 
						velocity, neighborVelocity);
					}
				}
			}
		}
	}

	// update static objects collision
	vec2 boxMin = vec2(-800, -500);
    vec2 boxMax = vec2(800, 600);
	
	vec2 dirs[2];
    dirs[0] = vec2(1,0);
    dirs[1] = vec2(0,1);
    for(int i=0; i<2; i++){
		vec2 dir = dirs[i];
		vec2 tangentVel = velocity - dot(velocity,dir) * dir;
		// the cofficient between fluid and static mesh(like wall)
		float x = dot(dir,position) + particleRadius;
		
        if(i != 1 && x > boxMax[i]){
            force = force - groundSpring * (x - boxMax[i]) * dir - 
				groundDamping * velocity -
				groundFriction * tangentVel;
        }
		x = dot(dir,position) - particleRadius;
		if (x < boxMin[i]) {
			dir = -dir;
			force = force - groundSpring * (boxMin[i] - x) * dir - 
				groundDamping * velocity - 
				groundFriction * tangentVel;
		}
	}

	
	vdata = vec4(force, 0.0, 1.0);
	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}