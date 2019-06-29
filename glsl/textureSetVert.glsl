uniform vec2 res;
//uniform int isVec4;
attribute float bodyIndex;
attribute vec4 data;
varying vec4 vData;
void main() {
	vec2 uv = indexToUV(bodyIndex, res);
	uv += 0.5 / res;
	vData = data;
	gl_PointSize = 30.0;
	// * isVec4 + (1- isVec4) * vec4(position, 1);
	// vec4 sx = data;
	// sx.x /= 800.0;
	// sx.y /= 600.0;
	gl_Position = vec4(2.0*uv-1.0, 0, 1);
}