// Plain WebGL 1: a full-screen triangle and a fragment shader per canvas. Returns null when WebGL is not
// available (or a shader will not compile), and the page carries on without it.
import QUAD from './quad.glsl';

export function layer(canvas, frag, { alpha = false } = {}) {
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha, antialias: false, depth: false, stencil: false, premultipliedAlpha: true,
                                      preserveDrawingBuffer: false, powerPreference: 'low-power' });
  } catch { gl = null; }
  if (!gl) return null;

  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, QUAD));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  } catch (e) {
    console.warn('WebGL off:', e.message);
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const where = {};
  const loc = (name) => (name in where ? where[name] : (where[name] = gl.getUniformLocation(prog, name)));

  return {
    gl,
    /** set the canvas's backing size: CSS size times scale (px per CSS px) */
    size(w, h, scale) {
      const W = Math.max(1, Math.round(w * scale)), H = Math.max(1, Math.round(h * scale));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      return { W, H };
    },
    /** a texture from an image, linear and clamped (NPOT-safe in WebGL 1); the shader wraps it itself */
    texture(img, unit = 0) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    },
    /** draw with these uniforms: numbers become float, arrays vec2..vec4, {tex: unit} a sampler */
    draw(u) {
      if (gl.isContextLost()) return;
      for (const [k, v] of Object.entries(u)) {
        const l = loc(k);
        if (l === null) continue;
        if (typeof v === 'number') gl.uniform1f(l, v);
        else if (v && 'tex' in v) gl.uniform1i(l, v.tex);
        else gl[`uniform${v.length}fv`](l, v);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
