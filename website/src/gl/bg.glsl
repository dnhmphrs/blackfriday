// The background, as on the banner: the royal-blue tube gradient, the maker's mark tiled faintly across
// it, 24 pale rays turning round the badge, and the glow behind the badge. On Black Friday, all day, the
// ground goes warm (orange to red, sun-yellow rays, a hot glow) and the rays turn fast and brighten on
// each beat; every other beat they flash yellow and so does the screen's rim.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;      // canvas size, px
uniform float uPx;      // canvas px per CSS px
uniform vec2 uC;        // the badge's middle, canvas px, y up
uniform float uR;       // the badge's radius, canvas px
uniform float uAng;     // the rays' turn, radians
uniform float uBF;      // 1 on Black Friday
uniform float uFlip;    // 0 or 1: the flash, on every other beat (Black Friday only)
uniform float uPulse;   // 0..1, the beat's pulse, decaying
uniform float uK;       // layout scale
uniform sampler2D uTile;

const float TAU = 6.2831853;

vec3 ramp3(vec3 a, vec3 b, vec3 c, float m, float t) {
  return t < m ? mix(a, b, t / m) : mix(b, c, (t - m) / (1.0 - m));
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / uRes;

  // the tube: #0a1cc4 at the top, #0a22d6 at 45%, #070f9c at the foot; on the day #ff8c1a, #f03a0c, #b0000e
  float y = 1.0 - uv.y;
  vec3 blue = ramp3(vec3(0.039, 0.110, 0.769), vec3(0.039, 0.133, 0.839), vec3(0.027, 0.059, 0.612), 0.45, y);
  vec3 warm = ramp3(vec3(1.0, 0.549, 0.102), vec3(0.941, 0.227, 0.047), vec3(0.690, 0.0, 0.055), 0.45, y);
  vec3 col = mix(blue, warm, uBF);

  // the mark, tiled at 9.5% white, turned 6 degrees
  vec2 q = vec2(p.x, uRes.y - p.y) / uPx;          // CSS px, y down
  float c6 = 0.9945219, s6 = -0.1045285;
  q = vec2(c6 * q.x - s6 * q.y, s6 * q.x + c6 * q.y);
  vec2 cell = vec2(260.0, 224.0) * uK;
  col = mix(col, vec3(1.0), texture2D(uTile, fract(q / cell)).r * 0.095);

  // the rays: 24, each 6 degrees of every 15, pale blue at 11%; on the day sun yellow, stronger
  vec2 d = p - uC;
  float r = length(d);
  float w = fract((atan(d.y, d.x) + uAng) / TAU * 24.0);
  float off = abs(w - 0.2);
  off = min(off, 1.0 - off);                       // from the middle of the nearest ray, in ray pairs
  float aa = 24.0 / (TAU * max(r, 1.0));           // a pixel, in ray pairs
  float lit = 1.0 - smoothstep(0.2 - aa, 0.2 + aa, off);
  vec3 rayCol = mix(vec3(0.47, 0.78, 1.0), mix(vec3(1.0, 0.82, 0.25), vec3(1.0, 0.941, 0.208), uFlip), uBF);
  float rayA = mix(0.11, 0.2 + 0.08 * uPulse + 0.12 * uFlip, uBF);
  col = mix(col, rayCol, lit * rayA);

  // the glow behind the badge: #58c4ff, #2a8cff at 22%, #1348ee at 44%, gone by 72% of 1.5 radii;
  // on the day #fff6b0, #ffd21a, #ff8a00
  float g = r / (1.5 * uR * (1.0 + 0.05 * uBF * uPulse));
  vec3 g0 = mix(vec3(0.345, 0.769, 1.0), vec3(1.0, 0.965, 0.69), uBF);
  vec3 g1 = mix(vec3(0.165, 0.549, 1.0), vec3(1.0, 0.824, 0.102), uBF);
  vec3 g2 = mix(vec3(0.075, 0.282, 0.933), vec3(1.0, 0.541, 0.0), uBF);
  vec3 glow = g < 0.22 ? mix(g0, g1, g / 0.22) : mix(g1, g2, clamp((g - 0.22) / 0.22, 0.0, 1.0));
  col = mix(col, glow, (1.0 - clamp((g - 0.44) / 0.28, 0.0, 1.0)) * (1.0 - 0.25 * uBF));

  // on the day, the flash: the screen's rim flares yellow
  vec2 e = abs(uv - 0.5) * 2.0;
  float rim = smoothstep(0.86, 1.0, max(e.x, e.y));
  col = mix(col, vec3(1.0, 0.941, 0.208), uBF * uFlip * rim * 0.8);

  gl_FragColor = vec4(col, 1.0);
}
