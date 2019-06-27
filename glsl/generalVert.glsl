void main() {
	// position.x = position.x * 2 - 1;
	// position.y = position.y * 2 - 1;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	gl_PointSize  = 10.0;
}
// attribute vec3 inPositon;
// void main() {
// 	gl_Position = vec4(inPosition, 1);
// }