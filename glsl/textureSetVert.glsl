uniform vec2 res;
//uniform int isVec4;
attribute float bodyIndex;
attribute vec4 data;
varying vec4 vData;
void main() {
	vec2 uv = indexToUV(bodyIndex, res);
	// uv += 0.5 / res;
	vData = data;
	gl_PointSize = 1.0;
	gl_Position = vec4(2.0*uv-1.0, 0, 1);
}