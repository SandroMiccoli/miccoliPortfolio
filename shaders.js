(function (root) {
	const VERT = [
		'attribute vec3 aPosition;',
		'attribute vec2 aTexCoord;',
		'uniform mat4 uProjectionMatrix;',
		'uniform mat4 uModelViewMatrix;',
		'varying vec2 vTexCoord;',
		'void main() {',
		'  vTexCoord = aTexCoord;',
		'  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);',
		'}'
	].join('\n');

	const FILTER = [
		'varying vec2 vTexCoord;',
		'uniform vec2 u_resolution;',
		'uniform float u_time;',
		'uniform sampler2D u_input;',
		'',
		'vec2 uv() {',
		'  return vTexCoord;',
		'}',
		'',
		'vec4 src() {',
		'  return texture2D(u_input, uv());',
		'}'
	].join('\n');

	const BLEND_FN = [
		'uniform sampler2D u_input;',
		'uniform float u_hasInput;',
		'uniform float u_blendMode;',
		'',
		'vec3 blendWith(vec3 gen) {',
		'  if (u_hasInput < 0.5) return gen;',
		'  vec3 prev = texture2D(u_input, vTexCoord).rgb;',
		'  if (u_blendMode < 0.5) return gen;',
		'  if (u_blendMode < 1.5) return min(prev + gen, 1.0);',
		'  if (u_blendMode < 2.5) return prev * gen;',
		'  if (u_blendMode < 3.5) return vec3(1.0) - (vec3(1.0) - prev) * (vec3(1.0) - gen);',
		'  if (u_blendMode < 4.5) return abs(prev - gen);',
		'  if (u_blendMode < 5.5) {',
		'    vec3 low = 2.0 * prev * gen;',
		'    vec3 high = vec3(1.0) - 2.0 * (vec3(1.0) - prev) * (vec3(1.0) - gen);',
		'    return mix(low, high, step(0.5, prev));',
		'  }',
		'  if (u_blendMode < 6.5) return max(prev - gen, 0.0);',
		'  if (u_blendMode < 7.5) return max(prev, gen);',
		'  return min(prev, gen);',
		'}'
	].join('\n');

	const LINES = [
		'varying vec2 vTexCoord;',
		'uniform vec2 u_resolution;',
		'uniform float u_time;',
		'uniform float u_density;',
		'uniform float u_thickness;',
		'uniform float u_angle;',
		'uniform float u_spread;',
		'uniform float u_speed;',
		'uniform float u_mix;',
		'uniform float u_invert;',
		BLEND_FN,
		'',
		'float lineField(vec2 p, vec2 dir, float dens, float thick, float phase) {',
		'  float x = abs(fract(dot(p, dir) * dens + phase) - 0.5);',
		'  return smoothstep(thick, thick * 0.22, x);',
		'}',
		'',
		'void main() {',
		'  vec2 p = vTexCoord * 2.0 - 1.0;',
		'  p.x *= u_resolution.x / max(u_resolution.y, 1.0);',
		'  float ang = u_angle * 0.017453292;',
		'  float ang2 = ang + u_spread * 0.017453292;',
		'  vec2 dir = vec2(cos(ang), sin(ang));',
		'  vec2 dir2 = vec2(cos(ang2), sin(ang2));',
		'  float t = u_time * u_speed;',
		'  float a = lineField(p, dir, u_density, u_thickness, t);',
		'  float b = lineField(p, dir2, u_density * 0.84, u_thickness * 0.9, -t * 0.73);',
		'  float v = max(a, b * u_mix);',
		'  v = mix(v, 1.0 - v, step(0.5, u_invert));',
		'  gl_FragColor = vec4(blendWith(vec3(v)), 1.0);',
		'}'
	].join('\n');

	const WARP = [
		FILTER,
		'uniform float u_amount;',
		'uniform float u_frequency;',
		'uniform float u_speed;',
		'uniform float u_detail;',
		'',
		'void main() {',
		'  vec2 st = uv();',
		'  float t = u_time * u_speed;',
		'  vec2 q = st;',
		'  q += u_amount * 0.22 * vec2(',
		'    sin(st.y * u_frequency + t),',
		'    cos(st.x * u_frequency * 0.91 - t)',
		'  );',
		'  q += u_amount * u_detail * 0.12 * vec2(',
		'    sin(q.y * u_frequency * 2.15 - t * 1.3),',
		'    cos(q.x * u_frequency * 1.87 + t * 1.1)',
		'  );',
		'  gl_FragColor = texture2D(u_input, clamp(q, 0.0, 1.0));',
		'}'
	].join('\n');

	const LOOKUP = [
		FILTER,
		'uniform sampler2D u_lut;',
		'uniform float u_contrast;',
		'uniform float u_brightness;',
		'',
		'void main() {',
		'  vec3 col = src().rgb;',
		'  float luma = dot(col, vec3(0.299, 0.587, 0.114));',
		'  luma = clamp((luma - 0.5) * u_contrast + 0.5 + u_brightness, 0.0, 1.0);',
		'  vec3 mapped = texture2D(u_lut, vec2(luma, 0.5)).rgb;',
		'  gl_FragColor = vec4(mapped, 1.0);',
		'}'
	].join('\n');

	const BLOOM_BRIGHT = [
		FILTER,
		'uniform float u_threshold;',
		'',
		'void main() {',
		'  vec3 col = src().rgb;',
		'  float luma = dot(col, vec3(0.299, 0.587, 0.114));',
		'  float m = smoothstep(u_threshold, u_threshold + 0.18, luma);',
		'  gl_FragColor = vec4(col * m, 1.0);',
		'}'
	].join('\n');

	const BLOOM_BLUR = [
		FILTER,
		'uniform vec2 u_texel;',
		'uniform vec2 u_dir;',
		'uniform float u_radius;',
		'',
		'void main() {',
		'  vec2 st = uv();',
		'  vec2 stepDir = u_dir * u_texel * u_radius;',
		'  vec3 sum = texture2D(u_input, st).rgb * 0.227027;',
		'  sum += texture2D(u_input, st + stepDir * 1.384615).rgb * 0.316216;',
		'  sum += texture2D(u_input, st - stepDir * 1.384615).rgb * 0.316216;',
		'  sum += texture2D(u_input, st + stepDir * 3.230769).rgb * 0.070270;',
		'  sum += texture2D(u_input, st - stepDir * 3.230769).rgb * 0.070270;',
		'  gl_FragColor = vec4(sum, 1.0);',
		'}'
	].join('\n');

	const BLOOM_COMP = [
		FILTER,
		'uniform sampler2D u_bloom;',
		'uniform float u_intensity;',
		'',
		'void main() {',
		'  vec3 col = src().rgb;',
		'  vec3 glow = texture2D(u_bloom, uv()).rgb;',
		'  gl_FragColor = vec4(col + glow * u_intensity, 1.0);',
		'}'
	].join('\n');

	const COPY = [
		FILTER,
		'uniform float u_gain;',
		'',
		'void main() {',
		'  gl_FragColor = vec4(src().rgb * u_gain, 1.0);',
		'}'
	].join('\n');

	root.SYNTH_SHADERS = {
		vert: VERT,
		lines: LINES,
		warp: WARP,
		lookup: LOOKUP,
		bloomBright: BLOOM_BRIGHT,
		bloomBlur: BLOOM_BLUR,
		bloomComp: BLOOM_COMP,
		copy: COPY
	};
})(window);
