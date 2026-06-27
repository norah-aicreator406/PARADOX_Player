window.NORAH_SHADERS = {
  organicFlow: {
    name: "Bubble Ocean",

    vertex: `
      varying vec2 vUv;

      void main() {
        vUv = uv;

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(position, 1.0);
      }
    `,

    fragment: `
      varying vec2 vUv;

      uniform float uTime;
      uniform vec2 uResolution;

      float random(vec2 p) {
        return fract(
          sin(dot(p, vec2(127.1, 311.7))) *
          43758.5453123
        );
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x)
          + (c - a) * u.y * (1.0 - u.x)
          + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;

        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }

        return value;
      }

      float bubble(vec2 uv, vec2 center, float radius) {
  vec2 p = uv - center;

  p.x *= uResolution.x / uResolution.y;

  float d = length(p);

  float shell =
    smoothstep(radius, radius - 0.012, d) *
    smoothstep(radius - 0.045, radius - 0.015, d);

  vec2 highlightPos =
    center + vec2(-radius * 0.28, radius * 0.28);

  vec2 h = uv - highlightPos;

  h.x *= uResolution.x / uResolution.y;

  float highlight =
    smoothstep(radius * 0.45, 0.0, length(h));

  return shell + highlight * 0.35;
}

      void main() {
        vec2 uv = vUv;

        vec3 deep = vec3(0.0, 0.015, 0.055);
        vec3 midBlue = vec3(0.0, 0.18, 0.42);
        vec3 cyan = vec3(0.0, 0.78, 1.0);

        float verticalLight =
          smoothstep(0.0, 1.0, uv.y);

        vec3 color =
          mix(deep, midBlue, verticalLight * 0.85);

        float waterNoise =
          fbm(
            uv * vec2(4.0, 7.0) +
            vec2(uTime * 0.04, -uTime * 0.08)
          );

        color += cyan * waterNoise * 0.12;

        float surfaceGlow =
          smoothstep(0.35, 1.0, uv.y) *
          smoothstep(1.0, 0.55, uv.y);

        color += vec3(0.0, 0.45, 0.85) * surfaceGlow * 0.22;

        float lightRay1 =
          smoothstep(
            0.035,
            0.0,
            abs(uv.x - (0.22 + sin(uTime * 0.18) * 0.04))
          ) *
          smoothstep(1.0, 0.15, uv.y);

        float lightRay2 =
          smoothstep(
            0.05,
            0.0,
            abs(uv.x - (0.62 + sin(uTime * 0.13 + 2.0) * 0.05))
          ) *
          smoothstep(1.0, 0.18, uv.y);

        color += cyan * (lightRay1 + lightRay2) * 0.18;

        float bubbleMask = 0.0;

        for (int i = 0; i < 12; i++) {
          float fi = float(i);

          vec2 base = vec2(
            fract(sin(fi * 12.9898) * 43758.5453),
            fract(sin(fi * 78.233) * 24634.6345)
          );

          float speed = 0.08 + base.x * 0.16;

          vec2 center = vec2(
            base.x,
            fract(base.y + uTime * speed)
          );

          center.x += sin(uTime * 0.7 + fi) * 0.025;

          float radius =
            0.025 + fract(sin(fi * 31.73) * 9123.123) * 0.055;

          bubbleMask += bubble(uv, center, radius);
        }

        color += vec3(0.35, 0.95, 1.0) * bubbleMask * 0.75;

        float vignette =
          smoothstep(1.05, 0.22, distance(uv, vec2(0.5)));

        color *= vignette;


//--------------------------------------------------
// Strong God Rays
//--------------------------------------------------

float rayNoise = fbm(
  vec2(
    uv.x * 2.2,
    uv.y * 5.5
  ) +
  vec2(
    uTime * 0.045,
    -uTime * 0.06
  )
);

float diagonalA =
  uv.x - uv.y * 0.34;

float diagonalB =
  uv.x - uv.y * 0.18;

float ray1 =
  smoothstep(
    0.09,
    0.0,
    abs(
      diagonalA -
      (0.18 + rayNoise * 0.12)
    )
  );

float ray2 =
  smoothstep(
    0.12,
    0.0,
    abs(
      diagonalB -
      (0.58 - rayNoise * 0.16)
    )
  );

float ray3 =
  smoothstep(
    0.07,
    0.0,
    abs(
      diagonalA -
      (0.78 + rayNoise * 0.08)
    )
  );

float topFade =
  smoothstep(
    0.15,
    1.0,
    uv.y
  );

float bottomFade =
  smoothstep(
    0.0,
    0.72,
    1.0 - uv.y
  );

float rays =
  (ray1 + ray2 * 0.85 + ray3 * 0.55)
  * topFade
  * bottomFade;

color +=
  vec3(0.15, 0.85, 1.0)
  * rays
  * 0.85;

color +=
  vec3(0.02, 0.35, 0.75)
  * rays
  * rays
  * 0.65;

        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
};