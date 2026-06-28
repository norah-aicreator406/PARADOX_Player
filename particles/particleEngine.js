window.NORAH_PARTICLE_ENGINE = {
  preset: "default",

  setPreset(preset) {
    this.preset = preset || "default";
    console.log("Particle preset:", this.preset);

    if (this.preset === "bubble" && window.NORAH_BUBBLE_PARTICLE) {
  window.NORAH_BUBBLE_PARTICLE.create();
}

if (this.preset === "starDust") {
  if (window.NORAH_STAR_DUST_PARTICLE) {
    window.NORAH_STAR_DUST_PARTICLE.create();
  }

  if (window.NORAH_SHOOTING_STAR_PARTICLE) {
    window.NORAH_SHOOTING_STAR_PARTICLE.create();
  }
}

if (this.preset === "auroraDust") {
  if (window.NORAH_AURORA_PARTICLE) {
    window.NORAH_AURORA_PARTICLE.create();
  }
}

  },

  getPreset() {
    return this.preset;
  },


drawBubbles(ctx, width, height, audio = {}) {
  if (this.preset !== "bubble") return;
  if (!window.NORAH_BUBBLE_PARTICLE) return;

  window.NORAH_BUBBLE_PARTICLE.draw(
    ctx,
    width,
    height,
    audio
  );
},

drawStarDust(ctx, width, height, audio = {}) {
  if (this.preset !== "starDust") return;
  if (!window.NORAH_STAR_DUST_PARTICLE) return;

  window.NORAH_STAR_DUST_PARTICLE.draw(
    ctx,
    width,
    height,
    audio
  );
},

drawShootingStars(ctx, width, height, audio = {}) {
  if (this.preset !== "starDust") return;
  if (!window.NORAH_SHOOTING_STAR_PARTICLE) return;

  window.NORAH_SHOOTING_STAR_PARTICLE.draw(
    ctx,
    width,
    height,
    audio
  );
},

drawAuroraDust(ctx, width, height, audio = {}) {
  if (this.preset !== "auroraDust") return;
  if (!window.NORAH_AURORA_PARTICLE) return;

  window.NORAH_AURORA_PARTICLE.draw(
    ctx,
    width,
    height,
    audio
  );
},

};

