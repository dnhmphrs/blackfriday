// The background: the royal-blue tube gradient, a starburst of rays turning around the globe, the glow
// behind it and the faint company lockup tiled across it. On Black Friday the rays turn fast, twist
// and pulse, and the palette flips between blue and red on the beat.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;      // canvas size, px
uniform float uPx;      // canvas px per CSS px
uniform vec2 uC;        // the rays' centre (the globe's), canvas px, y up
uniform float uR;       // the globe's radius, canvas px
uniform float uAng;     // the rays' turn, radians
uniform float uBF;      // 1 on Black Friday
uniform float uFlip;    // 0 or 1: the palette, flipped on the beat (Black Friday only)
uniform float uPulse;   // 0..1, the beat's pulse, decaying
uniform float uTime;    // seconds
uniform float uK;       // layout scale
uniform sampler2D uTile;

const float TAU = 6.2831853;

vec3 ramp3(vec3 a, vec3 b, vec3 c, float m, float t) {
  return t < m ? mix(a, b, t / m) : mix(b, c, (t - m) / (1.0 - m));
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / uRes;
  float y = 1.0 - uv.y;

  // the tube: royal blue, brighter at the top, deep at the foot
  vec3 blueA = vec3(0.039, 0.110, 0.769), blueB = vec3(0.039, 0.133, 0.839), blueC = vec3(0.027, 0.059, 0.612);
  vec3 redA = vec3(0.86, 0.02, 0.10), redB = vec3(0.93, 0.05, 0.08), redC = vec3(0.45, 0.0, 0.07);
  float red = uBF * uFlip;
  vec3 col = mix(ramp3(blueA, blueB, blueC, 0.45, y), ramp3(redA, redB, redC, 0.45, y), red);

  // the rays
  vec2 d = p - uC;
  float r = length(d);
  float n = mix(18.0, 24.0, uBF);
  float twist = uBF * (0.35 + 0.25 * sin(uTime * 1.7)) * r / max(uRes.x, uRes.y);
  float a = atan(d.y, d.x) + uAng + twist;
  float w = fract(a / TAU * n);
  float tri = abs(w - 0.5);                        // 0 at a ray's middle, 0.5 at the next
  float aa = n / (TAU * max(r, 1.0)) * 1.2;        // one pixel, in fractions of a ray pair
  float width = 0.25 + uBF * 0.06 * uPulse;
  float lit = smoothstep(width - aa, width + aa, tri);
  float reach = max(uRes.x, uRes.y);
  float fade = 0.35 + 0.65 * exp(-r / (reach * 0.55));
  fade *= smoothstep(uR * 0.6, uR * 1.2, r) * 0.85 + 0.15;   // calmer right behind the globe
  vec3 rayBlue = vec3(0.22, 0.48, 1.0), rayRed = vec3(1.0, 0.72, 0.05);
  vec3 rayCol = mix(rayBlue, rayRed, red);
  float strength = mix(0.42, 0.5, uBF) + uBF * 0.12 * uPulse;
  col *= 1.0 - 0.16 * (1.0 - lit) * fade;           // the gaps between the rays a shade deeper
  col = mix(col, rayCol, lit * fade * strength);

  // the glow behind the globe
  float g = r / (uR * 3.1 * (1.0 + 0.08 * uBF * uPulse));
  vec3 glowCol = g < 0.22 ? mix(vec3(0.345, 0.769, 1.0), vec3(0.165, 0.549, 1.0), g / 0.22)
                          : mix(vec3(0.165, 0.549, 1.0), vec3(0.075, 0.282, 0.933), clamp((g - 0.22) / 0.22, 0.0, 1.0));
  glowCol = mix(glowCol, vec3(1.0, 0.86, 0.25), red);
  float glowA = 1.0 - smoothstep(0.30, 0.72, g);
  col = mix(col, glowCol, glowA * mix(1.0, 0.85, uBF));

  // the lockup, tiled faintly, turned 6 degrees
  vec2 q = vec2(p.x, uRes.y - p.y) / uPx;          // CSS px, y down
  float c6 = 0.9945219, s6 = -0.1045285;
  q = vec2(c6 * q.x - s6 * q.y, s6 * q.x + c6 * q.y);
  vec2 cell = vec2(260.0, 224.0) * uK;
  float tile = texture2D(uTile, fract(q / cell)).r;
  col = mix(col, vec3(1.0), tile * 0.085);

  gl_FragColor = vec4(col, 1.0);
}
