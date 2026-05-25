import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AudioService, Track } from '../audio.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-waveform-editor',
  template: `
    <div class="waveform-container" #container>
      <canvas #waveformCanvas class="waveform-canvas"></canvas>
      <div class="playhead" [style.left.%]="playheadPosition"></div>
      
      <div *ngIf="showClipping" class="clipping-indicator">
        ⚠️ 削波失真检测到 {{ clippingCount }} 个样本
      </div>
      
      <div class="clipping-bars">
        <div class="clipping-bar" [class.active]="clipLevel >= 1"></div>
        <div class="clipping-bar" [class.active]="clipLevel >= 2"></div>
        <div class="clipping-bar" [class.active]="clipLevel >= 3"></div>
        <div class="clipping-bar" [class.active]="clipLevel >= 4"></div>
        <div class="clipping-bar" [class.active]="clipLevel >= 5"></div>
      </div>
    </div>
    
    <div class="spectrogram-container">
      <canvas #spectrogramCanvas></canvas>
    </div>
  `
})
export class WaveformEditorComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('waveformCanvas') waveformCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('spectrogramCanvas') spectrogramCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;
  
  private subscriptions: Subscription[] = [];
  tracks: Track[] = [];
  activeTrack: Track | undefined;
  currentTime = 0;
  zoom = 1;
  playheadPosition = 0;
  showClipping = false;
  clippingCount = 0;
  clipLevel = 0;
  
  private spectrogramData: number[][] = [];
  private needsResize = false;
  private isAnimatingZoom = false;
  private spectrogramTimeout: any = null;
  private lastSpectrogramSamples: string = '';

  constructor(private audioService: AudioService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.audioService.tracks$.subscribe(tracks => {
        this.tracks = tracks;
        this.drawWaveform();
        this.checkClipping();
        if (tracks.length > 0) {
          const lastTrack = tracks[tracks.length - 1];
          const sampleKey = lastTrack.id + '_' + lastTrack.samples.length;
          if (this.lastSpectrogramSamples !== sampleKey) {
            this.debouncedLoadSpectrogram(lastTrack.samples, sampleKey);
          }
        }
      }),
      this.audioService.activeTrack$.subscribe(id => {
        this.activeTrack = this.tracks.find(t => t.id === id);
        this.drawWaveform();
      }),
      this.audioService.currentTime$.subscribe(time => {
        this.currentTime = time;
        this.updatePlayhead();
      }),
      this.audioService.zoom$.subscribe(zoom => {
        this.animateZoom(zoom);
      })
    );
  }

  ngAfterViewChecked() {
    if (this.needsResize) {
      this.resizeCanvas();
      this.needsResize = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.spectrogramTimeout) {
      clearTimeout(this.spectrogramTimeout);
    }
  }

  private resizeCanvas() {
    if (!this.container || !this.waveformCanvas) return;
    
    const width = this.container.nativeElement.clientWidth * this.zoom;
    const height = Math.max(400, this.tracks.length * 120);
    
    this.waveformCanvas.nativeElement.width = Math.max(width, 800);
    this.waveformCanvas.nativeElement.height = height;
    
    if (this.spectrogramCanvas) {
      this.spectrogramCanvas.nativeElement.width = Math.max(width, 800);
      this.spectrogramCanvas.nativeElement.height = 200;
    }
    
    this.drawWaveform();
    this.drawSpectrogram();
  }

  private animateZoom(targetZoom: number) {
    if (this.isAnimatingZoom) return;
    
    const startZoom = this.zoom;
    const duration = 300;
    const startTime = performance.now();
    
    this.isAnimatingZoom = true;
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.zoom = startZoom + (targetZoom - startZoom) * eased;
      this.needsResize = true;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimatingZoom = false;
      }
    };
    
    requestAnimationFrame(animate);
  }

  private drawWaveform() {
    const canvas = this.waveformCanvas?.nativeElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, height);
    
    this.tracks.forEach((track, index) => {
      const trackHeight = 100;
      const trackY = 10 + index * 120;
      
      ctx.fillStyle = track.id === this.activeTrack?.id ? '#1a1a2e' : '#151525';
      ctx.fillRect(0, trackY, width, trackHeight);
      
      ctx.strokeStyle = track.id === this.activeTrack?.id ? '#4ecdc4' : '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, trackY, width, trackHeight);
      
      this.drawTrackWaveform(ctx, track, trackY, trackHeight, width);
    });
    
    this.drawGrid(ctx, width, height);
  }

  private drawTrackWaveform(ctx: CanvasRenderingContext2D, track: Track, y: number, height: number, width: number) {
    const samples = track.samples;
    const samplesPerPixel = Math.floor(samples.length / width);
    const centerY = y + height / 2;
    
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, track.id === this.activeTrack?.id ? '#4ecdc4' : '#e94560');
    gradient.addColorStop(0.5, track.id === this.activeTrack?.id ? '#44a08d' : '#ff6b6b');
    gradient.addColorStop(1, track.id === this.activeTrack?.id ? '#4ecdc4' : '#e94560');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, samples.length);
      
      let min = 0, max = 0;
      for (let i = start; i < end; i++) {
        const val = samples[i] * track.volume;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      
      const top = centerY - (max * height / 2);
      const bottom = centerY - (min * height / 2);
      
      if (x === 0) {
        ctx.moveTo(x, top);
      } else {
        ctx.lineTo(x, top);
      }
    }
    
    for (let x = width - 1; x >= 0; x--) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, samples.length);
      
      let min = 0;
      for (let i = start; i < end; i++) {
        const val = samples[i] * track.volume;
        if (val < min) min = val;
      }
      
      const bottom = centerY - (min * height / 2);
      ctx.lineTo(x, bottom);
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = track.id === this.activeTrack?.id ? 'rgba(78, 205, 196, 0.8)' : 'rgba(233, 69, 96, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, samples.length);
      
      let max = 0;
      for (let i = start; i < end; i++) {
        const val = Math.abs(samples[i]) * track.volume;
        if (val > max) max = val;
      }
      
      const peakY = centerY - (max * height / 2);
      if (x === 0) {
        ctx.moveTo(x, peakY);
      } else {
        ctx.lineTo(x, peakY);
      }
    }
    
    for (let x = width - 1; x >= 0; x--) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, samples.length);
      
      let max = 0;
      for (let i = start; i < end; i++) {
        const val = Math.abs(samples[i]) * track.volume;
        if (val > max) max = val;
      }
      
      const peakY = centerY + (max * height / 2);
      ctx.lineTo(x, peakY);
    }
    
    ctx.closePath();
    ctx.stroke();
  }

  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    const maxDuration = this.getMaxDuration();
    const pixelsPerSecond = width / maxDuration;
    
    for (let t = 0; t <= maxDuration; t += 1) {
      const x = t * pixelsPerSecond;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  private debouncedLoadSpectrogram(samples: number[], sampleKey: string) {
    if (this.spectrogramTimeout) {
      clearTimeout(this.spectrogramTimeout);
    }
    this.spectrogramTimeout = setTimeout(async () => {
      await this.loadSpectrogram(samples, sampleKey);
    }, 300);
  }

  private async loadSpectrogram(samples: number[], sampleKey: string) {
    try {
      const data = await this.audioService.getSpectrogram(samples);
      this.spectrogramData = data.spectrogram || [];
      this.lastSpectrogramSamples = sampleKey;
      this.drawSpectrogram();
    } catch (e) {
      console.error('Spectrogram load failed:', e);
      this.spectrogramData = [];
    }
  }

  private drawSpectrogram() {
    const canvas = this.spectrogramCanvas?.nativeElement;
    if (!canvas || this.spectrogramData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const numFrames = this.spectrogramData.length;
    const numBins = this.spectrogramData[0]?.length || 0;
    
    if (numBins === 0) {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, width, height);
      return;
    }
    
    const imageData = ctx.createImageData(width, height);
    
    for (let x = 0; x < width; x++) {
      const frameIndex = Math.min(numFrames - 1, Math.floor((x / width) * numFrames));
      const frame = this.spectrogramData[frameIndex] || [];
      
      for (let y = 0; y < height; y++) {
        const binIndex = Math.min(numBins - 1, Math.max(0, Math.floor((1 - y / height) * numBins)));
        const value = frame[binIndex] || 0;
        
        const intensity = Math.min(1, Math.max(0, value / 0.5));
        const pixelIndex = (y * width + x) * 4;
        
        const hue = 240 - intensity * 200;
        const saturation = 0.8;
        const lightness = intensity * 0.6;
        
        const rgb = this.hslToRgb(hue / 360, saturation, lightness);
        
        imageData.data[pixelIndex] = rgb.r;
        imageData.data[pixelIndex + 1] = rgb.g;
        imageData.data[pixelIndex + 2] = rgb.b;
        imageData.data[pixelIndex + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  private hslToRgb(h: number, s: number, l: number) {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  private updatePlayhead() {
    const maxDuration = this.getMaxDuration();
    this.playheadPosition = (this.currentTime / maxDuration) * 100;
    this.updateClipLevel();
  }

  private updateClipLevel() {
    if (!this.activeTrack) {
      this.clipLevel = 0;
      return;
    }
    
    const sampleIndex = Math.floor(this.currentTime * this.activeTrack.sampleRate);
    const windowSize = 1000;
    let maxLevel = 0;
    
    for (let i = Math.max(0, sampleIndex - windowSize); i < Math.min(this.activeTrack.samples.length, sampleIndex + windowSize); i++) {
      const level = Math.abs(this.activeTrack.samples[i]) * this.activeTrack.volume;
      if (level > maxLevel) maxLevel = level;
    }
    
    this.clipLevel = Math.min(5, Math.floor(maxLevel * 5));
  }

  private checkClipping() {
    this.showClipping = false;
    this.clippingCount = 0;
    
    this.tracks.forEach(track => {
      const result = this.audioService.detectClipping(track.samples.map(s => s * track.volume));
      if (result.hasClipping) {
        this.showClipping = true;
        this.clippingCount += result.count;
      }
    });
  }

  private getMaxDuration(): number {
    if (this.tracks.length === 0) return 10;
    return Math.max(...this.tracks.map(t => t.samples.length / t.sampleRate));
  }
}
