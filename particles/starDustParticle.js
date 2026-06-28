window.NORAH_STAR_DUST_PARTICLE = {
  starDust: [],

  create() {
    this.starDust = [];

    for (let i = 0; i < 90; i++) {
      this.starDust.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.8 + Math.random() * 2.8,
        speed: 0.04 + Math.random() * 0.16,
        drift: Math.random() * Math.PI * 2,
        alpha: 0.22 + Math.random() * 0.48,
        colorType: Math.floor(Math.random() * 3)
      });
    }
  },

  draw(ctx, width, height, audio = {}) {
    const time = Date.now() * 0.001;
    const high = audio.high || 0;
    const master = audio.master || 0;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    this.starDust.forEach(star => {
      star.x += Math.sin(time * 0.35 + star.drift) * 0.00018;
      star.y += star.speed * 0.0007;

      if (star.y > 1.06) {
        star.y = -0.06;
        star.x = Math.random();
      }

      const x = star.x * width;
      const y = star.y * height;
      const r = star.size * (1 + high * 0.8);

      let color;

      if (star.colorType === 0) {
        color = `rgba(170, 210, 255, ${star.alpha + high * 0.28})`;
      } else if (star.colorType === 1) {
        color = `rgba(190, 120, 255, ${star.alpha + master * 0.22})`;
      } else {
        color = `rgba(255, 150, 230, ${star.alpha + high * 0.18})`;
      }

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + master * 18;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    ctx.restore();
  }
};