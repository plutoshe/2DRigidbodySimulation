int uvToIndex(vec2 uv, vec2 size) {
	ivec2 coord = ivec2(floor(uv * size + 0.5));
	return coord.x + int(size.x) * coord.y;
}
vec2 indexToUV(float index, vec2 res){
	vec2 uv = vec2(mod(index / res.x, 1.0), floor(index / res.x) / res.y) + 0.5/res;
	return uv;
}

vec2 worldPosToGridPos(vec2 postion, vec2 gridOriginPos, vec2 cellSize) {
	return floor((postion - gridOriginPos) / cellSize);
}

vec2 gridPosToGridUV(vec2 gridPos, vec2 gridTexSize) {
	return gridPos / gridTexSize;
}