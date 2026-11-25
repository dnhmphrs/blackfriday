// The tape and the tube, over the whole page. This layer is blended with mix-blend-mode: hard-light,
// so mid grey (0.5) leaves the page alone, darker darkens it and lighter lightens it: scanlines and the
// tube's vignette darken; white static, the tracking band and the beat's flash lighten; the colour
// blotches nudge the hue both ways.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;      // canvas size, px
uniform float uPx;      // canvas px per CSS px
uniform float uFrame;   // the tape's frame (25 a second); the noise moves on with it
uniform float uTime;    // seconds
uniform float uMotion;  // 0 for a still picture (reduced motion)
uniform float uGrain;   // 1 when moving; lighter on a still frame, where frozen static reads as dirt
uniform float uBF;      // 1 on Black Friday
uniform float uFlash;   // 0..1, the beat's flash, decaying (Black Friday only)
uniform vec4 uClock;    // the clock's box, canvas px (x, y from the bottom, w, h)
uniform float uTick;    // 0..1, the clock's tick, decaying

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / uRes;
  vec2 q = vec2(p.x, uRes.y - p.y) / uPx;           // CSS px, y down
  float fr = uFrame;
  float v = 0.5;

  // scanlines, every 3 CSS px
  v -= 0.05 * (0.5 + 0.5 * cos(q.y * 2.0943951));

  // the tube: dark at the rim, darker in the corners
  vec2 c = uv * 2.0 - 1.0;
  float rim = pow(abs(c.x), 7.0) + pow(abs(c.y), 7.0);
  v -= 0.11 * dot(c, c) * 0.5 + 0.16 * smoothstep(0.15, 1.2, rim);

  // grain and white static: short horizontal streaks
  vec2 cellS = floor(vec2(q.x / 4.0, q.y / 1.5));
  float h = hash(cellS + vec2(fr * 17.31, fr * 7.77));
  float spark = step(0.9972, h) * (0.45 + 0.55 * hash(cellS * 1.37 + fr));
  float grain = hash(floor(q) + vec2(fr * 3.11, fr * 1.73)) - 0.5;
  v += (0.045 * grain + 0.36 * spark) * uGrain;

  // the tracking band, rolling slowly up the screen, full of static
  float by = 1.0 - fract(uTime * 0.045 + 0.35);
  float band = exp(-pow((uv.y - (1.0 - by)) * 14.0, 2.0)) * uMotion;
  v += band * (0.035 + 0.3 * step(0.96, hash(cellS + vec2(fr * 5.1, 3.3))));

  // colour blotches: slow chroma noise, moved on every 4 frames (as I and Q in YIQ)
  float slow = floor(fr / 4.0);
  vec2 bq = q * vec2(0.021, 0.083);
  float ci = vnoise(bq + vec2(slow * 7.3, slow * 3.1)) - 0.5;
  float cq = vnoise(bq * 1.3 + vec2(41.0 + slow * 5.7, 17.0)) - 0.5;
  vec3 col = vec3(v) + 0.085 * mix(0.6, 1.0, uGrain) * (ci * vec3(0.956, -0.272, -1.106) + cq * vec3(0.621, -0.647, 1.703));

  // Black Friday: the beat flashes the tube's rim yellow, and the clock glows on each tick
  float edge = smoothstep(0.35, 1.25, length(c));
  col += uBF * uFlash * edge * vec3(0.26, 0.20, 0.0);
  vec2 cc = uClock.xy + uClock.zw * 0.5;
  vec2 dq = max(abs(p - cc) - uClock.zw * 0.5, 0.0) / uPx;
  float out_ = length(dq);                          // CSS px outside the clock's box (0 inside)
  float halo = exp(-out_ / 26.0) * smoothstep(0.0, 6.0, out_) * step(0.5, uClock.z);
  col += uBF * uTick * halo * vec3(0.20, 0.17, 0.02);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
