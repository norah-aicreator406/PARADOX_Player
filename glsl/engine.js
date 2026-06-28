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

  this.mesh.material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },

      uResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        )
      }
    },

    vertexShader: shader.vertex,
    fragmentShader: shader.fragment
  });

  this.setEnabled(true);

  console.log('Shader switched:', shaderName);
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
  if (!this.mesh.material.uniforms.uTime) return;

  this.mesh.material.uniforms.uTime.value =
    this.clock.getElapsedTime();

  if (this.mesh.material.uniforms.uResolution) {
    this.mesh.material.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  }
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