import { Component, OnInit } from '@angular/core';
import { AudioService, Track } from './audio.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="header">
        <h1>🎵 多轨音频波形编辑器</h1>
        <div class="toolbar">
          <label class="btn btn-secondary">
            📁 导入音频
            <input type="file" accept=".wav,.mp3" (change)="onFileImport($event)" style="display: none">
          </label>
          <button class="btn btn-secondary" (click)="cutSelection()" title="剪切">
            ✂️ 剪切
          </button>
          <button class="btn btn-secondary" (click)="copySelection()" title="复制">
            📋 复制
          </button>
          <button class="btn btn-secondary" (click)="pasteSelection()" title="粘贴">
            📌 粘贴
          </button>
          <button class="btn btn-secondary" (click)="undo()" title="撤销">
            ↩️ 撤销
          </button>
          <button class="btn btn-secondary" (click)="redo()" title="重做">
            ↪️ 重做
          </button>
        </div>
      </header>
      
      <div class="main-content">
        <div class="tracks-panel">
          <div *ngFor="let track of tracks" 
               class="track-item" 
               [class.active]="track.id === activeTrackId"
               (click)="selectTrack(track.id)">
            <div class="track-name">{{ track.name }}</div>
            <div class="track-controls">
              <div class="control-row">
                <label>音量</label>
                <input type="range" class="slider" min="0" max="2" step="0.01" 
                       [value]="track.volume" 
                       (input)="setVolume(track.id, $event)">
                <span>{{ (track.volume * 100).toFixed(0) }}%</span>
              </div>
              <div class="control-row">
                <label>声相</label>
                <input type="range" class="slider" min="-1" max="1" step="0.01" 
                       [value]="track.pan"
                       (input)="setPan(track.id, $event)">
                <span>{{ track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C' }}</span>
              </div>
            </div>
            <button class="btn btn-secondary" style="margin-top: 8px; width: 100%" 
                    (click)="deleteTrack(track.id); $event.stopPropagation()">
              🗑️ 删除轨道
            </button>
          </div>
          
          <div class="preset-panel">
            <h3>🎛️ 音频预设</h3>
            <div class="preset-buttons">
              <button class="preset-btn" (click)="loadPreset(1)">
                <strong>预设一</strong><br>
                正弦波+白噪音
              </button>
              <button class="preset-btn" (click)="loadPreset(2)">
                <strong>预设二</strong><br>
                鼓点节奏
              </button>
              <button class="preset-btn" (click)="loadPreset(3)">
                <strong>预设三</strong><br>
                金属声
              </button>
              <button class="preset-btn" (click)="loadPreset(4)">
                <strong>预设四</strong><br>
                微片段拼接
              </button>
            </div>
          </div>
          
          <div class="reverb-controls">
            <h3>🔊 卷积混响</h3>
            <select [(ngModel)]="selectedReverb" (change)="applyReverb()">
              <option value="">选择脉冲响应...</option>
              <option value="hall">大厅</option>
              <option value="room">房间</option>
              <option value="plate">板式</option>
              <option value="spring">弹簧</option>
              <option value="metal">金属</option>
            </select>
          </div>
          
          <div class="info-panel">
            <p class="warning">⚠️ 实验性功能：</p>
            <p>• 片段边界未对齐过零点会产生咔嗒爆音</p>
            <p>• 长脉冲响应会导致延迟和内存溢出</p>
            <p>• FFT频谱泄露导致模糊伪影</p>
            <p>• 撤销栈过深会导致内存膨胀</p>
          </div>
        </div>
        
        <div class="editor-panel">
          <app-waveform-editor></app-waveform-editor>
          
          <div class="transport-controls">
            <button class="btn btn-secondary" (click)="stop()" title="停止">
              ⏹️
            </button>
            <button class="play-btn" [class.playing]="isPlaying" (click)="togglePlay()">
              {{ isPlaying ? '⏸️' : '▶️' }}
            </button>
            <div class="time-display">{{ formatTime(currentTime) }}</div>
            <div class="zoom-controls">
              <button class="btn btn-secondary" (click)="zoomOut()">−</button>
              <span style="color: #888; margin: 0 8px">{{ zoomLevel.toFixed(1) }}x</span>
              <button class="btn btn-secondary" (click)="zoomIn()">+</button>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="isProcessing" class="progress-overlay">
        <div class="circular-progress">
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#e94560"/>
                <stop offset="100%" stop-color="#4ecdc4"/>
              </linearGradient>
            </defs>
            <circle class="progress-bg" cx="50" cy="50" r="40"/>
            <circle class="progress-bar" cx="50" cy="50" r="40" stroke-dasharray="251.2"
                    [style.stroke-dashoffset]="251.2 - (251.2 * processingProgress)"/>
          </svg>
        </div>
        <div class="progress-text">处理中... {{ (processingProgress * 100).toFixed(0) }}%</div>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  tracks: Track[] = [];
  activeTrackId: string | null = null;
  isPlaying = false;
  currentTime = 0;
  zoomLevel = 1;
  selectedReverb = '';
  isProcessing = false;
  processingProgress = 0;
  
  private selectionStart = 0;
  private selectionEnd = 0;

  constructor(private audioService: AudioService) {}

  ngOnInit() {
    this.audioService.tracks$.subscribe(tracks => {
      this.tracks = tracks;
    });
    
    this.audioService.activeTrack$.subscribe(id => {
      this.activeTrackId = id;
    });
    
    this.audioService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
    });
    
    this.audioService.currentTime$.subscribe(time => {
      this.currentTime = time;
    });
    
    this.audioService.zoom$.subscribe(zoom => {
      this.zoomLevel = zoom;
    });
  }

  async onFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.isProcessing = true;
      this.processingProgress = 0.3;
      
      try {
        await this.audioService.importAudioFile(input.files[0]);
        this.processingProgress = 1;
        setTimeout(() => {
          this.isProcessing = false;
          this.processingProgress = 0;
        }, 500);
      } catch (error) {
        console.error('Import error:', error);
        this.isProcessing = false;
      }
    }
  }

  async loadPreset(id: number) {
    this.isProcessing = true;
    this.processingProgress = 0.3;
    
    try {
      await this.audioService.loadPreset(id);
      this.processingProgress = 1;
      setTimeout(() => {
        this.isProcessing = false;
        this.processingProgress = 0;
      }, 500);
    } catch (error) {
      console.error('Preset load error:', error);
      this.isProcessing = false;
    }
  }

  selectTrack(trackId: string) {
    this.audioService.setActiveTrack(trackId);
  }

  setVolume(trackId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioService.setVolume(trackId, parseFloat(input.value));
  }

  setPan(trackId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioService.setPan(trackId, parseFloat(input.value));
  }

  deleteTrack(trackId: string) {
    this.audioService.deleteTrack(trackId);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audioService.pause();
    } else {
      this.audioService.play();
    }
  }

  stop() {
    this.audioService.stop();
  }

  zoomIn() {
    this.audioService.setZoom(this.zoomLevel * 1.5);
  }

  zoomOut() {
    this.audioService.setZoom(this.zoomLevel / 1.5);
  }

  cutSelection() {
    this.audioService.cutSelection(this.selectionStart, this.selectionEnd);
  }

  copySelection() {
    this.audioService.copySelection(this.selectionStart, this.selectionEnd);
  }

  pasteSelection() {
    this.audioService.pasteSelection(this.currentTime);
  }

  undo() {
    this.audioService.undo();
  }

  redo() {
    this.audioService.redo();
  }

  async applyReverb() {
    if (!this.selectedReverb || !this.activeTrackId) return;
    
    this.isProcessing = true;
    this.processingProgress = 0.2;
    
    const progressInterval = setInterval(() => {
      if (this.processingProgress < 0.9) {
        this.processingProgress += 0.1;
      }
    }, 200);
    
    try {
      await this.audioService.applyReverb(this.selectedReverb);
      this.processingProgress = 1;
    } catch (error) {
      console.error('Reverb error:', error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        this.isProcessing = false;
        this.processingProgress = 0;
        this.selectedReverb = '';
      }, 500);
    }
  }

  formatTime(seconds: number): string {
    return this.audioService.formatTime(seconds);
  }
}