const THREE = require('three');

const {
  EffectComposer
} = require(
  'three/examples/jsm/postprocessing/EffectComposer.js'
);

const {
  RenderPass
} = require(
  'three/examples/jsm/postprocessing/RenderPass.js'
);

const {
  UnrealBloomPass
} = require(
  'three/examples/jsm/postprocessing/UnrealBloomPass.js'
);

const {
  OutputPass
} = require(
  'three/examples/jsm/postprocessing/OutputPass.js'
);

window.NORAH_GLSL_ENGINE = {
  initialized: false,
  enabled: false,
  renderer: null,
  scene: null,
  camera: null,
  clock: null,
  animationId: null,
  mesh: null,

  composer: null,

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

    console.log("Renderer OK");

    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

console.log(
  "Three revision:",
  THREE.REVISION
);


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
   
    this.renderer.outputColorSpace =
    THREE.SRGBColorSpace;

    this.renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure =
    1.15;


    this.initialized = true;
    this.setEnabled(false);

    this.lastFrameTime =
    performance.now();


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
      },

      uRotationBoost: {
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


geometryRotation: 0,
geometryRotationSpeed: 0,
lastFrameTime: 0,



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

  update(deltaSeconds = 1 / 60) {
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
  /*
 * 音で加速し、慣性でゆっくり減速する。
 */
/*
 * 60fpsを基準にした時間倍率。
 * FPSが変化しても、実時間あたりの速度を一定にする。
 */
const frameScale =
  deltaSeconds * 60;

if (this.audioData.beat > 0.25) {
  this.geometryRotationSpeed +=
    0.0012 * frameScale;
}

/*
 * FPSに依存しない減速。
 */
this.geometryRotationSpeed *=
  Math.pow(
    0.982,
    frameScale
  );

this.geometryRotationSpeed =
  THREE.MathUtils.clamp(
    this.geometryRotationSpeed,
    0,
    0.004
  );

/*
 * FPSに依存しない回転。
 */
this.geometryRotation +=
  this.geometryRotationSpeed *
  frameScale;

if (uniforms.uRotationBoost) {
  uniforms.uRotationBoost.value =
    this.geometryRotation;
}


  this.audioData.beat *=
    0.86;
},

animate() {

  this.animationId =
    requestAnimationFrame(
      () => this.animate()
    );

  if (!this.enabled) return;

  const deltaSeconds =
    this.clock.getDelta();

  this.update(
    deltaSeconds
  );

  this.renderPipeline();
},

renderPipeline() {

  this.renderScene();

},


renderScene() {

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