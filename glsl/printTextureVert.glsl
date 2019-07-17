uniform sampler2D originTex;
uniform float pointSize;
varying vec2 auv;
void main() {
    auv = uv;

    gl_Position = vec4(position, 1);
}