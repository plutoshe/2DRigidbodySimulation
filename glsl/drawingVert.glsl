uniform vec2 res;
uniform vec2 screen;
uniform float pointSize;
uniform sampler2D posTex;
attribute float bodyIndex;
varying vec4 vdata;
void main() {
	vec2 uv = indexToUV(bodyIndex, res);
	
	uv += 0.5 / res;
	//vdata = vec4(texture2D( posTex, uv ).xyz, 1);
	vec4 trans = vec4(texture2D(posTex, uv).xyz, 1);
	
	
	trans.x /= screen.x;
	trans.y /= screen.y;
	//trans.x = 0.0;
	//trans.y = 0.0;
	gl_Position = vec4(2.0*uv-1.0,0,1);
	//gl_Position = vec4(uv,0,1);
	//gl_Position = vec4(1, 1, 0, 1);
	vdata = trans;
	//vdata = vec4(texture2D(posTex, vec2(0,0) ).xyz, 1);//trans;
	// gl_Position = trans;
	gl_PointSize = 200.0;
}