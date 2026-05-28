import { COLORS } from './piece.js';
import { CELL_SIZE, VISIBLE_ROWS } from './board.js';

export class EffectsManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = 200;
    this.canvas.height = VISIBLE_ROWS * CELL_SIZE;
    this.particles = [];
    this.floaters = [];
    this.shakeAmount = 0;
    this.colorKeys = Object.keys(COLORS);
    this.initFloaters();
  }

  initFloaters() {
    for (let i = 0; i < 8; i++) {
      this.addFloater();
    }
  }

  addFloater() {
    const type = this.colorKeys[Math.floor(Math.random() * this.colorKeys.length)];
    this.floaters.push({
      x: Math.random() * 160 + 20,
      y: Math.random() * this.canvas.height,
      vy: -(Math.random() * 0.3 + 0.1),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      size: Math.random() * 12 + 8,
      opacity: Math.random() * 0.2 + 0.1,
      color: COLORS[type],
    });
  }

  onLineClear(rows, count) {
    const centerY = rows.reduce((sum, r) => sum + (r - 2) * CELL_SIZE, 0) / rows.length;
    const normalizedY = (centerY / (VISIBLE_ROWS * CELL_SIZE)) * this.canvas.height;
    const burstCount = count * 15;

    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const color = COLORS[this.colorKeys[Math.floor(Math.random() * this.colorKeys.length)]];
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 60,
        y: normalizedY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.015 + 0.01,
        size: Math.random() * 4 + 2,
        color,
      });
    }

    if (count === 4) {
      this.shakeAmount = 8;
    }
  }

  getShake() {
    if (this.shakeAmount <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shakeAmount,
      y: (Math.random() - 0.5) * this.shakeAmount,
    };
  }

  update(dt) {
    this.shakeAmount = Math.max(0, this.shakeAmount - dt * 0.02);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (const f of this.floaters) {
      f.y += f.vy;
      f.rotation += f.rotSpeed;
      if (f.y < -30) {
        f.y = this.canvas.height + 30;
        f.x = Math.random() * 160 + 20;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.height / 2
    );
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#050508');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const f of this.floaters) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.globalAlpha = f.opacity;
      ctx.shadowBlur = 6;
      ctx.shadowColor = f.color;
      ctx.fillStyle = f.color;
      ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
