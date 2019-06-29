uniform float pointSize;
uniform sampler2D texture;
varying vec2 coord;
void main() {
	// position.x = position.x * 2 - 1;
	// position.y = position.y * 2 - 1;
	coord = vec2((position.x / 800.0 + 1.0) / 2.0, (position.y / 600.0 + 1.0) / 2.0);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	gl_PointSize  = pointSize;
}
// attribute vec3 inPositon;
// void main() {
// 	gl_Position = vec4(inPosition, 1);
// }