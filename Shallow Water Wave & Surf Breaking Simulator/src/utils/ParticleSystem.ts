import { Particle, GRID_SIZE } from '../types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 500;
  private canvasWidth: number;
  private canvasHeight: number;
  
  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  emitBreakingParticles(breakingPoints: { x: number; y: number; strength: number }[]) {
    for (const point of breakingPoints) {
      if (this.particles.length >= this.maxParticles) break;
      
      const count = Math.floor(point.strength * 5);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: point.x * this.canvasWidth + (Math.random() - 0.5) * 20,
          y: point.y * this.canvasHeight + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 4 - 2,
          life: 1,
          maxLife: 0.5 + Math.random() * 0.5,
          size: 2 + Math.random() * 4
        });
      }
    }
  }
  
  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 15 * dt;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt / p.maxLife;
      
      if (p.life <= 0 || p.y > this.canvasHeight) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.fill();
    }
  }
  
  getParticleCount(): number {
    return this.particles.length;
  }
  
  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}

export class StreamlineRenderer {
  private streamlines: { points: { x: number; y: number }[]; age: number }[] = [];
  private maxStreamlines: number = 30;
  private maxPoints: number = 50;
  private canvasWidth: number;
  private canvasHeight: number;
  
  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  seedStreamlines(count: number) {
    for (let i = 0; i < count && this.streamlines.length < this.maxStreamlines; i++) {
      this.streamlines.push({
        points: [{
          x: Math.random() * 0.3 * this.canvasWidth,
          y: Math.random() * this.canvasHeight
        }],
        age: 0
      });
    }
  }
  
  advect(velocityField: (x: number, y: number) => { u: number; v: number }, dt: number) {
    for (let i = this.streamlines.length - 1; i >= 0; i--) {
      const sl = this.streamlines[i];
      const last = sl.points[sl.points.length - 1];
      
      const scaleX = this.canvasWidth / GRID_SIZE;
      const scaleY = this.canvasHeight / GRID_SIZE;
      const vel = velocityField(last.x / scaleX, last.y / scaleY);
      
      const newPoint = {
        x: last.x + vel.u * 50 * dt,
        y: last.y + vel.v * 50 * dt
      };
      
      sl.points.push(newPoint);
      sl.age += dt;
      
      if (sl.points.length > this.maxPoints || 
          newPoint.x > this.canvasWidth || 
          newPoint.x < 0 ||
          sl.age > 3) {
        this.streamlines.splice(i, 1);
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    for (const sl of this.streamlines) {
      if (sl.points.length < 2) continue;
      
      ctx.beginPath();
      ctx.moveTo(sl.points[0].x, sl.points[0].y);
      
      for (let i = 1; i < sl.points.length; i++) {
        ctx.lineTo(sl.points[i].x, sl.points[i].y);
      }
      
      const alpha = 1 - sl.age / 3;
      ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      const last = sl.points[sl.points.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
      ctx.fill();
    }
  }
  
  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.streamlines = [];
  }
}

export class CrestRenderer {
  private crests: { x: number; y: number; age: number }[][] = [];
  private maxLines: number = 20;
  
  update(heightField: Float32Array, threshold: number) {
    const currentCrests: { x: number; y: number; age: number }[] = [];
    
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        const idx = (y * GRID_SIZE + x) * 4;
        const h = heightField[idx];
        const hLeft = heightField[(y * GRID_SIZE + x - 1) * 4];
        const hRight = heightField[(y * GRID_SIZE + x + 1) * 4];
        
        if (h > hLeft && h > hRight && h > threshold) {
          currentCrests.push({ x, y, age: 0 });
        }
      }
    }
    
    this.crests.unshift(currentCrests);
    if (this.crests.length > this.maxLines) {
      this.crests.pop();
    }
    
    for (const line of this.crests) {
      for (const crest of line) {
        crest.age += 1;
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    const scaleX = canvasWidth / GRID_SIZE;
    const scaleY = canvasHeight / GRID_SIZE;
    
    for (let i = 0; i < this.crests.length; i++) {
      const line = this.crests[i];
      const alpha = 1 - i / this.maxLines;
      
      ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.5})`;
      ctx.lineWidth = 2 - i * 0.08;
      
      ctx.beginPath();
      for (let j = 0; j < line.length; j++) {
        const crest = line[j];
        const px = crest.x * scaleX;
        const py = crest.y * scaleY;
        
        if (j === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
  }
  
  clear() {
    this.crests = [];
  }
}

export class SpectrumAnalyzer {
  private spectrumHistory: number[][] = [];
  private maxHistory: number = 100;
  private binCount: number = 32;
  
  update(heightField: Float32Array) {
    const spectrum = new Array(this.binCount).fill(0);
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const rowSum = new Array(this.binCount).fill(0);
      for (let x = 0; x < GRID_SIZE; x++) {
        const idx = (y * GRID_SIZE + x) * 4;
        const h = heightField[idx];
        const bin = Math.min(Math.floor((x / GRID_SIZE) * this.binCount), this.binCount - 1);
        rowSum[bin] += h * h;
      }
      for (let i = 0; i < this.binCount; i++) {
        spectrum[i] += rowSum[i] / GRID_SIZE;
      }
    }
    
    this.spectrumHistory.unshift(spectrum);
    if (this.spectrumHistory.length > this.maxHistory) {
      this.spectrumHistory.pop();
    }
  }
  
  render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.spectrumHistory.length === 0) return;
    
    const current = this.spectrumHistory[0];
    const maxVal = Math.max(...current.map(c => c + 0.001));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    const barWidth = width / this.binCount;
    
    for (let i = 0; i < this.binCount; i++) {
      const barHeight = (current[i] / maxVal) * height * 0.9;
      const x = i * barWidth;
      const y = height - barHeight;
      
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(50, 100, 200, 0.6)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
    }
    
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.binCount; i++) {
      const barHeight = (current[i] / maxVal) * height * 0.9;
      const x = (i + 0.5) * barWidth;
      const y = height - barHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText('波能谱密度', 5, 15);
    ctx.fillText('← 深水 → 浅水 →', width - 80, height - 5);
  }
  
  clear() {
    this.spectrumHistory = [];
  }
}
