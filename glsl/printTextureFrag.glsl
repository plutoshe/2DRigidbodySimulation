uniform sampler2D originTex;
varying vec2 auv;
void main() {
    gl_FragColor = vec4(texture2D(originTex, auv).xyz, 0);

}