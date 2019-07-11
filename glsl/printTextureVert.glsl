uniform sampler2D originTex;
uniform float pointSize;
varying vec2 auv;
void main() {
    auv = position.xy;
    gl_PointSize = pointSize;
    gl_Position = vec4(2.0 * auv - 1.0, 0, 1);
}