uniform sampler2D originTex;
varying vec2 uvdata;
void main() {
	// gl_FragColor = vec4(0,1,1,1);
	gl_FragColor = texture2D(originTex, uvdata);
	//;
}