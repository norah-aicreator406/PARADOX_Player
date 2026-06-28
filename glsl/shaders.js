window.NORAH_SHADERS = {
  deepGalaxy: {
    name: "Deep Galaxy",

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
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
        float amp = 0.5;

        for (int i = 0; i < 6; i++) {
          value += amp * noise(p);
          p *= 2.0;
          amp *= 0.5;
        }

        return value;
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = uv - 0.5;

        p.x *= uResolution.x / uResolution.y;

        float r = length(p);
        float a = atan(p.y, p.x);

        float swirl =
          a +
          r * 7.5 -
          uTime * 0.18;

        vec2 galaxyUv = vec2(
          cos(swirl),
          sin(swirl)
        ) * r * 3.0;

        float nebula =
          fbm(
            galaxyUv * 2.5 +
            vec2(uTime * 0.035, -uTime * 0.025)
          );

        float arms =
          smoothstep(
            0.34,
            0.88,
            nebula
          );

        float core =
          smoothstep(
            0.42,
            0.0,
            r
          );

        vec3 deep =
          vec3(0.002, 0.003, 0.018);

        vec3 blue =
          vec3(0.04, 0.12, 0.55);

        vec3 violet =
          vec3(0.34, 0.06, 0.62);

        vec3 pink =
          vec3(0.95, 0.18, 0.70);

        vec3 coreColor =
          vec3(1.0, 0.72, 0.55);

        vec3 color = deep;

        color += mix(blue, violet, nebula) * arms * 0.85;
        color += pink * pow(arms, 2.2) * 0.35;
        color += coreColor * core * 0.75;

        float stars = random(floor(uv * uResolution.xy * 0.45));
        float starMask = step(0.992, stars);

        float twinkle =
          0.55 +
          0.45 * sin(uTime * 2.2 + stars * 20.0);

        color += vec3(0.7, 0.9, 1.0) * starMask * twinkle;

        float vignette =
          smoothstep(0.95, 0.18, distance(uv, vec2(0.5)));

        color *= vignette;

        gl_FragColor = vec4(color, 1.0);
      }
    `
  },

  aurora: {
  name: "Aurora",

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

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x)
        + (c - a) * u.y * (1.0 - u.x)
        + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;

      for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }

      return v;
    }

    float mountain(vec2 uv, float base, float amp, float scale) {
      float n = fbm(vec2(uv.x * scale, 0.4));
      return base + n * amp;
    }

    void main() {
      vec2 uv = vUv;

      vec3 skyTop = vec3(0.005, 0.008, 0.035);
      vec3 skyMid = vec3(0.015, 0.025, 0.075);
      vec3 skyLow = vec3(0.002, 0.006, 0.018);

      vec3 color = mix(skyLow, skyMid, uv.y);
      color = mix(color, skyTop, smoothstep(0.35, 1.0, uv.y));

      float t = uTime * 0.08;

      float curtainNoise =
  fbm(vec2(
    uv.x * 1.8 + t,
    uv.y * 1.4 - t * 0.35
  ));

float mainWave =
  0.50 +
  sin(uv.x * 4.0 + uTime * 0.16) * 0.11 +
  sin(uv.x * 7.5 - uTime * 0.12) * 0.05;

float upperWave =
  mainWave + 0.17 +
  sin(uv.x * 5.0 - uTime * 0.10) * 0.04;

float lowerWave =
  mainWave - 0.14 +
  sin(uv.x * 6.0 + uTime * 0.12) * 0.035;

float wideBand =
  1.0 - smoothstep(0.0, 0.20, abs(uv.y - mainWave));

float upperBand =
  1.0 - smoothstep(0.0, 0.13, abs(uv.y - upperWave));

float lowerBand =
  1.0 - smoothstep(0.0, 0.12, abs(uv.y - lowerWave));

float vertical =
  smoothstep(0.10, 0.78, uv.y) *
  smoothstep(1.02, 0.32, uv.y);

float fineCurtains =
  pow(
    max(
      0.0,
      sin(
        uv.x * 52.0 +
        sin(uv.y * 7.0 + uTime * 0.18) * 2.0
      )
    ),
    5.0
  );

float softRibbon =
  vertical *
  (
    wideBand * 0.85 +
    upperBand * 0.45 +
    lowerBand * 0.35
  );

float aurora =
  softRibbon *
  (0.34 + fineCurtains * 0.72);

  float veil = aurora;

vec3 cyan = vec3(0.02, 0.95, 1.0);
vec3 green = vec3(0.05, 1.0, 0.62);
vec3 violet = vec3(0.78, 0.18, 1.0);
vec3 blue = vec3(0.05, 0.25, 1.0);
vec3 magenta = vec3(1.0, 0.22, 0.95);

vec3 auroraColor =
  mix(cyan, violet, smoothstep(0.12, 0.92, uv.x));

auroraColor =
  mix(auroraColor, green, curtainNoise * 0.42);

auroraColor =
  mix(auroraColor, magenta, smoothstep(0.55, 1.0, uv.x) * 0.32);

color += auroraColor * veil * 1.65;

float innerGlow =
  softRibbon *
  smoothstep(0.18, 0.92, curtainNoise);

color += mix(blue, violet, uv.x) * innerGlow * 0.34;

float edgeGlow =
  (
    upperBand * 0.32 +
    lowerBand * 0.28
  ) *
  vertical *
  fineCurtains;

color += mix(cyan, magenta, uv.x) * edgeGlow * 0.42;

      float stars = hash(floor(uv * uResolution.xy * 0.42));
      float starMask = step(0.9935, stars);

      float twinkle =
        0.45 +
        0.55 * sin(uTime * 2.0 + stars * 40.0);

      color += vec3(0.7, 0.9, 1.0) * starMask * twinkle * 0.8;


float farMountain =
  mountain(uv, 0.46, 0.08, 2.6);

float midMountain =
  mountain(uv + vec2(0.22, 0.0), 0.30, 0.13, 4.2);

float frontMountain =
  mountain(uv + vec2(0.48, 0.0), 0.16, 0.18, 6.8);

if (uv.y < farMountain) {
  vec3 farColor =
    mix(
      vec3(0.012, 0.035, 0.070),
      vec3(0.030, 0.090, 0.120),
      uv.y
    );

  color = mix(color, farColor, 0.62);
}

if (uv.y < midMountain) {
  vec3 midColor =
    mix(
      vec3(0.004, 0.018, 0.040),
      vec3(0.018, 0.065, 0.090),
      uv.y
    );

  color = mix(color, midColor, 0.82);
}

if (uv.y < frontMountain) {
  vec3 frontColor =
    mix(
      vec3(0.000, 0.002, 0.008),
      vec3(0.006, 0.020, 0.035),
      uv.y
    );

  color = mix(color, frontColor, 0.98);
}

      float vignette =
        smoothstep(0.98, 0.15, distance(uv, vec2(0.5)));

      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `
}


};