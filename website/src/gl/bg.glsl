// The background, as on the banner: the royal-blue tube gradient, the maker's mark tiled faintly across
// it, 24 pale rays turning round the badge, and the glow behind the badge. On Black Friday the rays
// turn fast and brighten on each beat; every other beat they flash pale and the screen's rim red.
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

  // the tube: #0a1cc4 at the top, #0a22d6 at 45%, #070f9c at the foot
  vec3 col = ramp3(vec3(0.039, 0.110, 0.769), vec3(0.039, 0.133, 0.839), vec3(0.027, 0.059, 0.612), 0.45, 1.0 - uv.y);

  // the mark, tiled at 9.5% white, turned 6 degrees
  vec2 q = vec2(p.x, uRes.y - p.y) / uPx;          // CSS px, y down
  float c6 = 0.9945219, s6 = -0.1045285;
  q = vec2(c6 * q.x - s6 * q.y, s6 * q.x + c6 * q.y);
  vec2 cell = vec2(260.0, 224.0) * uK;
  col = mix(col, vec3(1.0), texture2D(uTile, fract(q / cell)).r * 0.095);

  // the rays: 24, each 6 degrees of every 15, pale blue at 11%
  vec2 d = p - uC;
  float r = length(d);
  float w = fract((atan(d.y, d.x) + uAng) / TAU * 24.0);
  float off = abs(w - 0.2);
  off = min(off, 1.0 - off);                       // from the middle of the nearest ray, in ray pairs
  float aa = 24.0 / (TAU * max(r, 1.0));           // a pixel, in ray pairs
  float lit = 1.0 - smoothstep(0.2 - aa, 0.2 + aa, off);
  vec3 rayCol = mix(vec3(0.47, 0.78, 1.0), vec3(0.78, 0.92, 1.0), uFlip);
  float rayA = mix(0.11, 0.16 + 0.08 * uPulse + 0.12 * uFlip, uBF);
  col = mix(col, rayCol, lit * rayA);

  // the glow behind the badge: #58c4ff, #2a8cff at 22%, #1348ee at 44%, gone by 72% of 1.5 radii
  float g = r / (1.5 * uR * (1.0 + 0.05 * uBF * uPulse));
  vec3 glow = g < 0.22 ? mix(vec3(0.345, 0.769, 1.0), vec3(0.165, 0.549, 1.0), g / 0.22)
                       : mix(vec3(0.165, 0.549, 1.0), vec3(0.075, 0.282, 0.933), clamp((g - 0.22) / 0.22, 0.0, 1.0));
  col = mix(col, glow, 1.0 - clamp((g - 0.44) / 0.28, 0.0, 1.0));

  // on the day, the flash: the screen's rim goes red
  vec2 e = abs(uv - 0.5) * 2.0;
  float rim = smoothstep(0.88, 1.0, max(e.x, e.y));
  col = mix(col, vec3(1.0, 0.086, 0.086), uBF * uFlip * rim * 0.9);

  gl_FragColor = vec4(col, 1.0);
}
