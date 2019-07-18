uniform sampler2D originTex;
varying vec2 auv;
void main() {
    gl_FragColor = texture2D(originTex, auv);

}