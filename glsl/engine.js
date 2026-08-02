const THREE = require('three');

window.NORAH_GLSL_ENGINE = {
  initialized: false,
  enabled: false,
  renderer: null,
  scene: null,
  camera: null,
  clock: null,
  animationId: null,
  mesh: null,

  audioData: {
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
  beat: 0
},

  init() {
    const canvas = document.getElementById('glslLayer');

    if (!canvas) {
      console.warn('glslLayer が見つかりません');
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(
      -1,
      1,
      1,
      -1,
      0,
      1
    );

    this.clock = new THREE.Clock();

    this.createScene();

    this.initialized = true;
    this.setEnabled(false);

    this.animate();

    console.log("NORAH GLSL Renderer ready");
  },

  createScene() {

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0
});

    this.mesh = new THREE.Mesh(
        geometry,
        material
    );

    this.scene.add(this.mesh);

},

  resize() {
  if (!this.renderer) return;

  this.renderer.setPixelRatio(window.devicePixelRatio || 1);
  this.renderer.setSize(window.innerWidth, window.innerHeight);

  if (!this.mesh) return;
  if (!this.mesh.material) return;
  if (!this.mesh.material.uniforms) return;
  if (!this.mesh.material.uniforms.uResolution) return;

  this.mesh.material.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
},

  setShader(shaderName) {
  if (!this.mesh) return;

  if (shaderName === 'none') {
    this.setEnabled(false);
    return;
  }

  const shader = window.NORAH_SHADERS?.[shaderName];

  if (!shader) {
    console.warn('Shader not found:', shaderName);
    return;
  }

  this.mesh.material =
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
        value: 0
      },

      uResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        )
      },

      uBass: {
        value: 0
      },

      uMid: {
        value: 0
      },

      uHigh: {
        value: 0
      },

      uLevel: {
        value: 0
      },

      uBeat: {
        value: 0
      }
    },

    vertexShader:
      shader.vertex,

    fragmentShader:
      shader.fragment,

    transparent: true,
    depthWrite: false
  });

  this.setEnabled(true);

  console.log('Shader switched:', shaderName);
},


setAudioData(
  audioData = {}
) {
  const clamp =
    value =>
      Math.max(
        0,
        Math.min(
          1,
          Number(value) || 0
        )
      );

  this.audioData.bass =
    clamp(
      audioData.bass
    );

  this.audioData.mid =
    clamp(
      audioData.mid
    );

  this.audioData.high =
    clamp(
      audioData.high
    );

  this.audioData.level =
    clamp(
      audioData.level ??
      audioData.overall
    );

  this.audioData.beat =
    clamp(
      audioData.beat
    );
},




  setEnabled(enabled) {
  this.enabled = Boolean(enabled);

  const canvas = document.getElementById('glslLayer');
  if (canvas) {
    canvas.style.display = this.enabled ? 'block' : 'none';
  }
},

  update() {
  if (!this.mesh) return;
  if (!this.mesh.material) return;
  if (!this.mesh.material.uniforms) return;

  const uniforms =
    this.mesh.material.uniforms;

  if (uniforms.uTime) {
    uniforms.uTime.value =
      this.clock.getElapsedTime();
  }

  if (uniforms.uResolution) {
    uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  }

  if (uniforms.uBass) {
    uniforms.uBass.value =
      THREE.MathUtils.lerp(
        uniforms.uBass.value,
        this.audioData.bass,
        0.16
      );
  }

  if (uniforms.uMid) {
    uniforms.uMid.value =
      THREE.MathUtils.lerp(
        uniforms.uMid.value,
        this.audioData.mid,
        0.14
      );
  }

  if (uniforms.uHigh) {
    uniforms.uHigh.value =
      THREE.MathUtils.lerp(
        uniforms.uHigh.value,
        this.audioData.high,
        0.12
      );
  }

  if (uniforms.uLevel) {
    uniforms.uLevel.value =
      THREE.MathUtils.lerp(
        uniforms.uLevel.value,
        this.audioData.level,
        0.15
      );
  }

  if (uniforms.uBeat) {
    uniforms.uBeat.value =
      THREE.MathUtils.lerp(
        uniforms.uBeat.value,
        this.audioData.beat,
        0.24
      );
  }

  /*
   * Beatは一瞬だけ反応させるため、
   * 毎フレーム少しずつ減衰させる。
   */
  this.audioData.beat *=
    0.86;
},

animate() {
  this.animationId = requestAnimationFrame(() => this.animate());

  if (!this.enabled) return;

  this.update();

  this.renderer.render(
    this.scene,
    this.camera
  );
},

};

window.addEventListener('DOMContentLoaded', () => {
  window.NORAH_GLSL_ENGINE.init();
});

window.addEventListener('resize', () => {
  window.NORAH_GLSL_ENGINE.resize();
});