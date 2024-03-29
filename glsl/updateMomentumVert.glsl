uniform sampler2D momentumTex;
uniform sampler2D forceTex;
uniform sampler2D massTex;
uniform float deltaTime;
uniform vec2 momentumTexResolution;
attribute float particleIndex;
varying vec2 newMomentum;
uniform vec4 gravity;

void main() {
    vec2 uv = indexToUV(particleIndex, momentumTexResolution);
    vec2 oldMomentum = texture2D(momentumTex, uv).xy;
    float mass = texture2D(massTex, uv).w;
    vec2 force = texture2D(forceTex, uv).xy + gravity.xy * mass;
    newMomentum = oldMomentum + deltaTime * force;
    gl_PointSize = 1.0;
    gl_Position = vec4(2.0 * uv - 1.0, 0, 1);
}