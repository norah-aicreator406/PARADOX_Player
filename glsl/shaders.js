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
},

neonGeometry: {
  // 下記のコード
  name: "Neon Geometry Core",

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
    precision highp float;

    varying vec2 vUv;

    uniform float uTime;
    uniform vec2 uResolution;

    uniform float uBass;
    uniform float uMid;
    uniform float uHigh;
    uniform float uLevel;
    uniform float uBeat;


    const float PI =
      3.14159265359;

    const float TAU =
      6.28318530718;


    mat2 rotate2D(
      float angle
    ) {
      float c =
        cos(angle);

      float s =
        sin(angle);

      return mat2(
        c, -s,
        s,  c
      );
    }


    /*
     * 指定半径に沿った発光リング。
     */
    float ring(
      vec2 p,
      float radius,
      float width
    ) {
      float distanceFromRing =
        abs(
          length(p) -
          radius
        );

      return width /
        max(
          distanceFromRing,
          0.0008
        );
    }


    /*
     * 極座標上の多角形距離。
     *
     * sidesを6にすると六角形。
     */
    float polygonDistance(
      vec2 p,
      float sides,
      float radius
    ) {
      float angle =
        atan(
          p.y,
          p.x
        );

      float sector =
        TAU /
        sides;

      float polygonRadius =
        cos(
          floor(
            0.5 +
            angle /
            sector
          ) *
          sector -
          angle
        ) *
        length(p);

      return abs(
        polygonRadius -
        radius
      );
    }


    /*
     * 放射状の細い光線。
     */
    float radialLines(
      vec2 p,
      float count,
      float sharpness
    ) {
      float angle =
        atan(
          p.y,
          p.x
        );

      float lines =
        abs(
          sin(
            angle *
            count *
            0.5
          )
        );

      return pow(
        max(
          0.0,
          1.0 -
          lines
        ),
        sharpness
      );
    }


    /*
     * 中心付近の発光。
     */
    float centerGlow(
      vec2 p,
      float size
    ) {
      return size /
        max(
          dot(p, p),
          0.001
        );
    }


    /*
     * 簡易ノイズ。
     */
    float hash(
      vec2 p
    ) {
      return fract(
        sin(
          dot(
            p,
            vec2(
              127.1,
              311.7
            )
          )
        ) *
        43758.5453123
      );
    }


    void main() {
      vec2 uv =
        vUv;

      vec2 p =
        uv -
        0.5;

      /*
       * 縦長・横長の画面でも
       * 図形が楕円にならないよう補正。
       */
      p.x *=
        uResolution.x /
        max(
          uResolution.y,
          1.0
        );


      /*
       * 音声値を少し安全な範囲へ。
       */
      float bass =
        clamp(
          uBass,
          0.0,
          1.0
        );

      float mid =
        clamp(
          uMid,
          0.0,
          1.0
        );

      float high =
        clamp(
          uHigh,
          0.0,
          1.0
        );

      float level =
        clamp(
          uLevel,
          0.0,
          1.0
        );

      float beat =
        clamp(
          uBeat,
          0.0,
          1.0
        );


      /*
       * BeatとBassで
       * 図形全体を膨張させる。
       */
      float pulse =
        bass * 0.11 +
        beat * 0.16;

      p *=
        1.0 -
        pulse;


      /*
       * 全体回転。
       */
      float rotation =
        uTime * 0.12 +
        mid * 0.45;

      p =
        rotate2D(
          rotation
        ) *
        p;


      float radius =
        length(p);

      float angle =
        atan(
          p.y,
          p.x
        );


      /*
       * 音に反応する輪郭の歪み。
       */
      float deformation =
        sin(
          angle * 6.0 +
          uTime * 1.25
        ) *
        (
          0.008 +
          mid * 0.028
        );

      deformation +=
        sin(
          angle * 12.0 -
          uTime * 1.8
        ) *
        (
          0.003 +
          high * 0.012
        );


      vec2 distortedP =
        p *
        (
          1.0 +
          deformation
        );


      /*
       * 六角形のメイン輪郭。
       */
      float mainPolygonDistance =
        polygonDistance(
          distortedP,
          6.0,
          0.255 +
          bass * 0.035
        );

      float mainPolygon =
        0.0035 /
        max(
          mainPolygonDistance,
          0.001
        );


      /*
       * 内側の回転した六角形。
       */
      vec2 innerP =
        rotate2D(
          -uTime * 0.21
        ) *
        distortedP;

      float innerPolygonDistance =
        polygonDistance(
          innerP,
          6.0,
          0.155 +
          mid * 0.025
        );

      float innerPolygon =
        0.0025 /
        max(
          innerPolygonDistance,
          0.001
        );


      /*
       * 外周リング。
       */
      float outerRing =
        ring(
          distortedP,
          0.345 +
          bass * 0.035,
          0.0014 +
          level * 0.0015
        );


      /*
       * 内周リング。
       */
      float innerRing =
        ring(
          distortedP,
          0.105 +
          mid * 0.018,
          0.0012 +
          high * 0.001
        );

      /*
 * 回転方向へ遅れて追従する残像。
 * 奥へ行くほど薄く、大きくなる。
 */
vec2 trailP1 =
  rotate2D(
    -0.045 -
    mid * 0.025
  ) *
  distortedP *
  1.025;

vec2 trailP2 =
  rotate2D(
    -0.095 -
    mid * 0.040
  ) *
  distortedP *
  1.055;

vec2 trailP3 =
  rotate2D(
    -0.155 -
    mid * 0.060
  ) *
  distortedP *
  1.095;


float trailPolygon1 =
  0.0022 /
  max(
    polygonDistance(
      trailP1,
      6.0,
      0.255 +
      bass * 0.035
    ),
    0.001
  );

float trailPolygon2 =
  0.0017 /
  max(
    polygonDistance(
      trailP2,
      6.0,
      0.255 +
      bass * 0.035
    ),
    0.001
  );

float trailPolygon3 =
  0.0012 /
  max(
    polygonDistance(
      trailP3,
      6.0,
      0.255 +
      bass * 0.035
    ),
    0.001
  );


float trailRing1 =
  ring(
    trailP1,
    0.345 +
    bass * 0.035,
    0.0009
  );

float trailRing2 =
  ring(
    trailP2,
    0.345 +
    bass * 0.035,
    0.00065
  );

float trailRing3 =
  ring(
    trailP3,
    0.345 +
    bass * 0.035,
    0.00045
  );


      /*
       * 放射状ライン。
       */
      float rays =
        radialLines(
          distortedP,
          18.0,
          16.0
        );

      rays *=
        smoothstep(
          0.39,
          0.12,
          radius
        );

      rays *=
        smoothstep(
          0.055,
          0.17,
          radius
        );

      rays *=
        0.16 +
        high * 0.75;


      /*
       * 回転方向が逆の追加ライン。
       */
      vec2 reverseP =
        rotate2D(
          -uTime * 0.28
        ) *
        p;

      float secondaryRays =
        radialLines(
          reverseP,
          12.0,
          22.0
        );

      secondaryRays *=
        smoothstep(
          0.31,
          0.08,
          length(reverseP)
        );

      secondaryRays *=
        0.08 +
        mid * 0.42;


      /*
       * 中央コア。
       */
      float core =
        centerGlow(
          p,
          0.0018 +
          beat * 0.0035
        );


      /*
       * 周囲の淡い波紋。
       */
      float waveRadius =
        fract(
          uTime * 0.18
        );

      float wave =
        0.0007 /
        max(
          abs(
            radius -
            (
              0.08 +
              waveRadius * 0.34
            )
          ),
          0.002
        );

      wave *=
        1.0 -
        waveRadius;

      wave *=
        0.12 +
        bass * 0.38;


      /*
       * 色設計。
       */
      vec3 cyan =
        vec3(
          0.02,
          0.92,
          1.0
        );

      vec3 violet =
        vec3(
          0.55,
          0.08,
          1.0
        );

      vec3 magenta =
        vec3(
          1.0,
          0.04,
          0.62
        );

      vec3 blue =
        vec3(
          0.03,
          0.16,
          1.0
        );


      float colorPosition =
        0.5 +
        0.5 *
        sin(
          angle * 3.0 +
          uTime * 0.55
        );

      vec3 mainColor =
        mix(
          cyan,
          violet,
          colorPosition
        );

      vec3 secondaryColor =
        mix(
          magenta,
          blue,
          0.5 +
          0.5 *
          sin(
            angle * 2.0 -
            uTime * 0.7
          )
        );


      /*
       * 背景。
       */
      vec3 color =
        vec3(
          0.0015,
          0.002,
          0.012
        );


      /*
       * 各レイヤーを合成。
       */
      color +=
        mainColor *
        mainPolygon *
        (
          0.45 +
          level * 0.85
        );

      color +=
        secondaryColor *
        innerPolygon *
        (
          0.28 +
          mid * 0.72
        );

      color +=
        cyan *
        outerRing *
        (
          0.28 +
          bass * 0.70
        );

      color +=
        magenta *
        innerRing *
        (
          0.22 +
          high * 0.65
        );

      color +=
        mainColor *
        rays;

      color +=
        secondaryColor *
        secondaryRays;

      color +=
        mix(
          violet,
          cyan,
          high
        ) *
        core *
        (
          0.18 +
          beat * 0.85
        );

      color +=
        cyan *
        wave;


      /*
 * Trail合成。
 * 音量と中音域で残像を少し強くする。
 */
float trailPower =
  0.22 +
  level * 0.22 +
  mid * 0.18;

color +=
  mix(
    violet,
    cyan,
    0.30
  ) *
  trailPolygon1 *
  trailPower *
  0.55;

color +=
  mix(
    magenta,
    violet,
    0.45
  ) *
  trailPolygon2 *
  trailPower *
  0.34;

color +=
  blue *
  trailPolygon3 *
  trailPower *
  0.20;


color +=
  cyan *
  trailRing1 *
  trailPower *
  0.32;

color +=
  violet *
  trailRing2 *
  trailPower *
  0.20;

color +=
  magenta *
  trailRing3 *
  trailPower *
  0.12;


      /*
       * 外周に細かなデジタル粒子。
       */
      vec2 particleGrid =
        floor(
          uv *
          uResolution.xy *
          0.16
        );

      float particleNoise =
        hash(
          particleGrid
        );

      float particleMask =
        step(
          0.994 -
          high * 0.012,
          particleNoise
        );

      float particleArea =
        smoothstep(
          0.48,
          0.12,
          radius
        );

      color +=
        mix(
          cyan,
          magenta,
          particleNoise
        ) *
        particleMask *
        particleArea *
        (
          0.2 +
          high * 1.25
        );


      /*
       * Beat時に白いハイライト。
       */
      color +=
        vec3(1.0) *
        beat *
        (
          mainPolygon +
          outerRing
        ) *
        0.18;


      /*
       * 中央から少しだけ明るくする。
       */
      float radialLight =
        smoothstep(
          0.48,
          0.0,
          radius
        );

      color +=
        mainColor *
        radialLight *
        (
          0.018 +
          level * 0.055
        );


      /*
       * 画面端を暗くする。
       */
      float vignette =
        smoothstep(
          0.92,
          0.16,
          distance(
            uv,
            vec2(0.5)
          )
        );

      color *=
        vignette;


      /*
       * 明るすぎる部分を自然に圧縮。
       */
      color =
        1.0 -
        exp(
          -color *
          1.35
        );


      gl_FragColor =
        vec4(
          color,
          1.0
        );
    }
  `
}



};