uniform vec2 particleResolution;
uniform vec2 screen;
uniform sampler2D posTex;
attribute float bodyIndex;
varying vec2 uvdata;
void main() {
	vec2 posuv = indexToUV(bodyIndex, particleResolution);
	
	// uv += 0.5 / res;
	//vdata = vec4(texture2D( posTex, uv ).xyz, 1);
	// vec2 trans = vec2(0,0);
	vec2 trans = texture2D(posTex, posuv).xy;
	trans += position.xy;
	trans.x /= screen.x;
	trans.y /= screen.y;

	//vdata = data;
	uvdata = uv;
	gl_Position = vec4(trans, 0, 1);
	
	//trans.x = 0.0;
	//trans.y = 0.0;
	//gl_Position = vec4(2.0*uv-1.0,0,1);
	//gl_Position = vec4(uv,0,1);
	//gl_Position = vec4(1, 1, 0, 1);
	//vdata = trans;
	//vdata = vec4(texture2D(posTex, vec2(0,0) ).xyz, 1);//trans;
	// gl_Position = trans;
	// gl_PointSize = pointSize;
}