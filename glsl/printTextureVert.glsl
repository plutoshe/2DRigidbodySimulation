uniform sampler2D originTex;
uniform float pointSize;
varying vec2 auv;
void main() {
    auv = (position.xy + 1.0) / 2.0;

    gl_Position = vec4(position, 1);
}