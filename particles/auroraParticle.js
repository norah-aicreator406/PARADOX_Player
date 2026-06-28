window.NORAH_AURORA_PARTICLE = {
  dust: [],

  create() {
    this.dust = [];
  },

  draw(ctx, width, height, audio = {}) {
    // Aurora本体はGLSLで描くので、Canvas粒子は一旦OFF
  }
};