import { audioEngine } from "./audio-engine.js";
import { state } from "./state.js";

export class VisualizerEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.mode = state.visualizerMode || "bars"; // bars, spectrum, wave, circular, particles
    this.particles = [];
    this.initParticles();
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 400,
        y: Math.random() * 300,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() - 0.5) * 1.5,
        color: i % 2 === 0 ? "#ff2d55" : "#b336ff"
      });
    }
  }

  setMode(mode) {
    this.mode = mode;
    state.visualizerMode = mode;
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    const freqData = audioEngine.getFrequencyData();
    const waveData = audioEngine.getWaveformData();

    switch (this.mode) {
      case "bars":
        this.renderBars(ctx, width, height, freqData);
        break;
      case "spectrum":
        this.renderSpectrum(ctx, width, height, freqData);
        break;
      case "wave":
        this.renderWave(ctx, width, height, waveData);
        break;
      case "circular":
        this.renderCircular(ctx, width, height, freqData);
        break;
      case "particles":
        this.renderParticles(ctx, width, height, freqData);
        break;
      default:
        this.renderBars(ctx, width, height, freqData);
    }
  }

  renderBars(ctx, width, height, data) {
    const barCount = 48;
    const barWidth = (width / barCount) * 0.75;
    const gap = (width - barWidth * barCount) / (barCount + 1);

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, "#ff2d55");
    gradient.addColorStop(0.5, "#ff5252");
    gradient.addColorStop(1, "#b336ff");

    for (let i = 0; i < barCount; i++) {
      const val = state.isPlaying ? data[i * 2] || 0 : (Math.sin(Date.now() * 0.003 + i) * 6 + 12);
      const barHeight = Math.max(4, (val / 255) * height * 0.85);
      const x = gap + i * (barWidth + gap);
      const y = height - barHeight;

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();
    }
  }

  renderSpectrum(ctx, width, height, data) {
    const count = 64;
    const step = width / count;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "rgba(255, 45, 85, 0.7)");
    gradient.addColorStop(0.5, "rgba(179, 54, 255, 0.8)");
    gradient.addColorStop(1, "rgba(0, 210, 255, 0.7)");

    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < count; i++) {
      const val = state.isPlaying ? data[i * 2] || 0 : 20;
      const y = height - (val / 255) * height * 0.8;
      const x = i * step;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderWave(ctx, width, height, data) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#00d2ff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 210, 255, 0.6)";

    ctx.beginPath();
    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  renderCircular(ctx, width, height, data) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const count = 48;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const val = state.isPlaying ? data[i * 2] || 0 : 20;
      const spike = (val / 255) * (baseRadius * 0.9);

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + spike);
      const y2 = centerY + Math.sin(angle) * (baseRadius + spike);

      ctx.strokeStyle = i % 2 === 0 ? "#ff2d55" : "#b336ff";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  renderParticles(ctx, width, height, data) {
    const bass = state.isPlaying ? (data[0] + data[1] + data[2]) / 3 : 20;
    const scale = 1 + (bass / 255) * 0.8;

    this.particles.forEach(p => {
      p.x += p.speedX * scale;
      p.y += p.speedY * scale;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (bass / 200 + 0.8), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }
}

export const visualizerEngine = new VisualizerEngine();
