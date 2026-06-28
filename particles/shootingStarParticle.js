window.NORAH_SHOOTING_STAR_PARTICLE = {
  shootingStars: [],

  create() {
    this.shootingStars = [];

    for (let i = 0; i < 5; i++) {
      this.shootingStars.push({
        x: Math.random(),
        y: Math.random() * 0.5,
        length: 80 + Math.random() * 140,
        speed: 0.003 + Math.random() * 0.004,
        alpha: 0.15 + Math.random() * 0.35,
        delay: Math.random() * 4
      });
    }
  },

  draw(ctx, width, height, audio = {}) {
    const time = Date.now() * 0.001;
    const high = audio.high || 0;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    this.shootingStars.forEach(star => {
      const active =
        Math.sin(time * 0.8 + star.delay) > 0.72;

      if (!active) return;

      star.x += star.speed;
      star.y += star.speed * 0.35;

      if (star.x > 1.15 || star.y > 1.05) {
        star.x = -0.15;
        star.y = Math.random() * 0.45;
      }

      const x = star.x * width;
      const y = star.y * height;

      const alpha =
        star.alpha + high * 0.35;

      const gradient = ctx.createLinearGradient(
        x,
        y,
        x - star.length,
        y - star.length * 0.35
      );

      gradient.addColorStop(
        0,
        `rgba(230, 245, 255, ${alpha})`
      );

      gradient.addColorStop(
        0.4,
        `rgba(160, 120, 255, ${alpha * 0.45})`
      );

      gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
      );

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.2 + high * 2.2;
      ctx.shadowColor = `rgba(190, 150, 255, ${alpha})`;
      ctx.shadowBlur = 14 + high * 24;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x - star.length,
        y - star.length * 0.35
      );
      ctx.stroke();
    });

    ctx.restore();
  }
};