uniform vec2 particleResolution;
uniform float deltaTime;
uniform sampler2D massTex;
uniform sampler2D forceTex;
uniform sampler2D velocityTex;
uniform sampler2D posTex;
uniform vec4 gravity;
uniform float drag;
uniform float particleRadius;
attribute float bodyIndex;
varying vec4 vdata;

void main() {
	vec2 uv = indexToUV(bodyIndex, particleResolution);
	// uv += 0.5 / res;
	vec2 position = texture2D(posTex, uv).xy;
    vec2 velocity = texture2D(velocityTex, uv).xy;
    vec2 force = texture2D(forceTex, uv).xy;
    vec4 mass = texture2D(massTex, uv);
	
	vec2 newvelocity = velocity + deltaTime * (force.xy * mass.w + gravity.xy);
	
    // Apply damping
    newvelocity *= pow(1.0 - drag, deltaTime);
	
	// update static objects collision
	vec2 boxMin = vec2(-800, -600);
    vec2 boxMax = vec2(800, 600);
	
	vec2 dirs[2];
    dirs[0] = vec2(1,0);
    dirs[1] = vec2(0,1);
    for(int i=0; i<2; i++){
		vec2 dir = dirs[i];
		vec2 tangentVel = velocity - dot(velocity,dir) * dir;
		
		float x = dot(dir,position) - particleRadius;
		if (x < boxMin[i]) {
			// force = vec3(0, 1000, 0);
			newvelocity[i] = newvelocity[i] * 0.7;
		}
		x = dot(dir,position) + particleRadius;
        if(x > boxMax[i]){
			// force = vec3(0, 100, 0);
            newvelocity[i] = newvelocity[i] * 0.7;
        }
	}

	vdata = vec4(newvelocity, 0.0, 1.0);

	gl_PointSize = 1.0;
	gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}