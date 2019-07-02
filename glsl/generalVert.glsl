uniform float pointSize;
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	gl_PointSize  = pointSize;
}
