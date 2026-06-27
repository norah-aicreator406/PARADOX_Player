const THREE = require('three');

window.NORAH_GLSL_ENGINE = {
  initialized: false,
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

    this.animate();

    console.log("NORAH GLSL Renderer ready");
  },

  createScene() {

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({

  uniforms: {

    uTime: {
        value: 0
    },

    uResolution: {
        value: new THREE.Vector2(
            window.innerWidth,
            window.innerHeight
        )
    }

},

  vertexShader:
    window.NORAH_SHADERS.organicFlow.vertex,

  fragmentShader:
    window.NORAH_SHADERS.organicFlow.fragment

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
    if (this.mesh) {

    this.mesh.material.uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight
    );

}
  },

  update() {

  if (!this.mesh) return;

  this.mesh.material.uniforms.uTime.value =
    this.clock.getElapsedTime();

},

animate() {

  this.animationId = requestAnimationFrame(() => this.animate());

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