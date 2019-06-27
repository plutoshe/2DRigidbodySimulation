attribute vec2 inPositon;
void main() {
	gl_Position = vec4(inPosition, 0, 1);
}