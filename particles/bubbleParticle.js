window.NORAH_BUBBLE_PARTICLE = {
  bubbles: [],

  create() {
    this.bubbles = [];

    for (let i = 0; i < 42; i++) {
      this.bubbles.push({
        x: Math.random(),
        y: Math.random(),
        size: 4 + Math.random() * 18,
        speed: 0.12 + Math.random() * 0.38,
        sway: Math.random() * Math.PI * 2,
        alpha: 0.18 + Math.random() * 0.36
      });
    }
  },

  draw(ctx, width, height, audio = {}) {
    const time = Date.now() * 0.001;
    const master = audio.master || 0;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    this.bubbles.forEach(bubble => {
      bubble.y -= bubble.speed * 0.0025 * (1 + master * 0.8);

      if (bubble.y < -0.08) {
        bubble.y = 1.08;
        bubble.x = Math.random();
        bubble.size = 4 + Math.random() * 18;
        bubble.speed = 0.12 + Math.random() * 0.38;
        bubble.alpha = 0.18 + Math.random() * 0.36;
      }

      const x =
        bubble.x * width +
        Math.sin(time * 0.9 + bubble.sway) * 18;

      const y = bubble.y * height;
      const r = bubble.size * (1 + master * 0.25);

      ctx.save();
      ctx.globalAlpha = bubble.alpha;

      ctx.strokeStyle = `rgba(155, 245, 255, ${0.42 + master * 0.24})`;
      ctx.lineWidth = Math.max(1, r * 0.09);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(220, 255, 255, ${0.18 + master * 0.10})`;
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    ctx.restore();
  }
};