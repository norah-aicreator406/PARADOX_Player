window.NORAH_SHADERS = window.NORAH_SHADERS || {};

window.NORAH_SHADERS.aurora = {
  name: "Aurora v6",

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

      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }

      return v;
    }

    float mountainLine(vec2 uv, float base, float amp, float scale, float shift) {
      float n = fbm(vec2(uv.x * scale + shift, 0.28));
      return base + n * amp;
    }

    float softBand(vec2 uv, float baseY, float thickness, float phase, float speed) {
      float t = uTime * speed;

      float wave =
        sin(uv.x * 2.2 + phase + t) * 0.12 +
        sin(uv.x * 4.4 - phase - t * 0.7) * 0.06 +
        sin(uv.x * 7.5 + phase * 1.6 + t * 0.35) * 0.025;

      float center = baseY + wave;

      float d = abs(uv.y - center);

      float body =
        1.0 - smoothstep(0.0, thickness, d);

      float haze =
        1.0 - smoothstep(0.0, thickness * 4.2, d);

      return body * 0.42 + haze * 0.58;
    }

    float verticalFibers(vec2 uv, float phase) {
      float bend =
        sin(uv.y * 4.0 + uTime * 0.10 + phase) * 2.2 +
        sin(uv.y * 9.0 - uTime * 0.06 + phase) * 1.1;

      float lines =
        sin(
          uv.x * 95.0 +
          bend +
          phase
        );

      float fiber =
        smoothstep(0.52, 1.0, lines);

      float breakMask =
        0.55 +
        0.45 *
        fbm(vec2(
          uv.x * 5.5 + phase,
          uv.y * 9.0 - uTime * 0.04
        ));

      return fiber * breakMask;
    }

    void main() {
      vec2 uv = vUv;

      float aspect = uResolution.x / uResolution.y;

      vec2 auv = uv;
      auv.x = (uv.x - 0.5) * min(aspect, 1.45) + 0.5;

      vec3 skyTop = vec3(0.002, 0.004, 0.020);
      vec3 skyMid = vec3(0.008, 0.017, 0.050);
      vec3 skyLow = vec3(0.002, 0.006, 0.014);

      vec3 color = mix(skyLow, skyMid, uv.y);
      color = mix(color, skyTop, smoothstep(0.30, 1.0, uv.y));

      float stars = hash(floor(uv * uResolution.xy * 0.34));
      float starMask = step(0.995, stars);
      float twinkle =
        0.45 +
        0.55 * sin(uTime * 2.0 + stars * 40.0);

      color += vec3(0.65, 0.85, 1.0) * starMask * twinkle * 0.66;

      float farMountain =
        mountainLine(uv, 0.46, 0.08, 2.4, 0.2);

      float midMountain =
        mountainLine(uv + vec2(0.20, 0.0), 0.31, 0.13, 4.0, 2.0);

      float frontMountain =
        mountainLine(uv + vec2(0.46, 0.0), 0.15, 0.18, 6.6, 4.6);

      float aboveFar =
        smoothstep(farMountain - 0.03, farMountain + 0.22, uv.y);

      float aboveMid =
        smoothstep(midMountain - 0.03, midMountain + 0.26, uv.y);

      float verticalFade =
        smoothstep(0.16, 0.76, uv.y) *
        smoothstep(1.0, 0.34, uv.y);

      vec2 flowUv = auv;

      float horizontalDrift =
        sin(auv.y * 3.0 + uTime * 0.07) * 0.05 +
        sin(auv.y * 8.0 - uTime * 0.05) * 0.025;

      flowUv.x += horizontalDrift;

      float band1 =
        softBand(flowUv, 0.63, 0.115, 0.0, 0.16) * aboveFar;

      float band2 =
        softBand(flowUv, 0.53, 0.095, 2.2, 0.13) * aboveMid;

      float band3 =
        softBand(flowUv, 0.72, 0.080, 4.6, 0.10) * aboveFar;

      float band4 =
        softBand(flowUv, 0.43, 0.075, 5.8, 0.09) * aboveMid;

      float cloth =
        (
          band1 * 0.95 +
          band2 * 0.82 +
          band3 * 0.50 +
          band4 * 0.42
        ) *
        verticalFade;

      float fiber =
        verticalFibers(flowUv, 0.0) * 0.42 +
        verticalFibers(flowUv + vec2(0.06, 0.02), 2.4) * 0.28 +
        verticalFibers(flowUv - vec2(0.04, 0.01), 4.8) * 0.20;

      float centerGlow =
        pow(cloth, 1.8);

      float aurora =
        cloth * 0.58 +
        cloth * fiber * 0.72 +
        centerGlow * 0.20;

      vec3 cyan = vec3(0.02, 0.92, 1.0);
      vec3 aqua = vec3(0.03, 1.0, 0.82);
      vec3 green = vec3(0.08, 1.0, 0.55);
      vec3 violet = vec3(0.62, 0.16, 1.0);
      vec3 magenta = vec3(1.0, 0.22, 0.92);
      vec3 blue = vec3(0.04, 0.18, 1.0);

      float colorFlow =
        0.5 +
        0.5 *
        sin(
          auv.x * 3.0 +
          auv.y * 1.6 +
          uTime * 0.05
        );

      vec3 auroraColor =
        mix(cyan, violet, smoothstep(0.10, 0.92, auv.x));

      auroraColor =
        mix(auroraColor, green, colorFlow * 0.34);

      auroraColor =
        mix(
          auroraColor,
          magenta,
          smoothstep(0.58, 1.0, auv.x) * 0.32
        );

      auroraColor =
        mix(
          auroraColor,
          aqua,
          smoothstep(0.18, 0.55, auv.x) *
          smoothstep(0.96, 0.48, auv.x) *
          0.28
        );

      color += auroraColor * aurora * 2.75;

      float highlight =
        pow(cloth * fiber, 2.2);

      color +=
        vec3(0.85, 0.98, 1.0) *
        highlight *
        0.65;

      float bloom =
        cloth * 0.65 +
        centerGlow * 0.45;

      color += mix(cyan, violet, auv.x) * bloom * 0.62;
      color += mix(blue, magenta, auv.x) * bloom * 0.28;

      float horizonGlow =
        smoothstep(0.10, 0.52, uv.y) *
        smoothstep(0.72, 0.22, uv.y);

      color += vec3(0.02, 0.16, 0.18) * horizonGlow * 0.20;

      if (uv.y < farMountain) {
        vec3 farColor =
          mix(
            vec3(0.010, 0.030, 0.060),
            vec3(0.030, 0.080, 0.115),
            uv.y
          );

        color = mix(color, farColor, 0.68);
      }

      if (uv.y < midMountain) {
        vec3 midColor =
          mix(
            vec3(0.004, 0.016, 0.035),
            vec3(0.016, 0.055, 0.080),
            uv.y
          );

        color = mix(color, midColor, 0.84);
      }

      if (uv.y < frontMountain) {
        vec3 frontColor =
          mix(
            vec3(0.000, 0.002, 0.008),
            vec3(0.006, 0.018, 0.030),
            uv.y
          );

        color = mix(color, frontColor, 0.98);
      }

      float vignette =
        smoothstep(1.02, 0.18, distance(uv, vec2(0.5)));

      color *= vignette;

      color = pow(color, vec3(0.92));

      gl_FragColor = vec4(color, 1.0);
    }
  `
};