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

void main() {
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	// uv += 0.5 / res;
	vec3 position = texture2D(posTex, uv).xyz;
    vec3 velocity = texture2D(velocityTex, uv).xyz;
    vec3 force = vec3(0,0,0);
	//texture2D(forceTex, uv).xyz;
    vec4 mass = texture2D(massTex, uv);
	
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