import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Track {
  id: string;
  name: string;
  samples: number[];
  sampleRate: number;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

export interface HistoryEntry {
  type: string;
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private tracks: Track[] = [];
  private tracksSubject = new BehaviorSubject<Track[]>([]);
  private activeTrackId: string | null = null;
  private activeTrackSubject = new BehaviorSubject<string | null>(null);
  
  private isPlaying = false;
  private playbackSubject = new BehaviorSubject<boolean>(false);
  private currentTime = 0;
  private timeSubject = new BehaviorSubject<number>(0);
  
  private zoomLevel = 1;
  private zoomSubject = new BehaviorSubject<number>(1);
  
  private clipboard: { samples: number[], start: number, end: number } | null = null;
  
  private history: HistoryEntry[] = [];
  private historyIndex = -1;
  
  tracks$ = this.tracksSubject.asObservable();
  activeTrack$ = this.activeTrackSubject.asObservable();
  isPlaying$ = this.playbackSubject.asObservable();
  currentTime$ = this.timeSubject.asObservable();
  zoom$ = this.zoomSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initAudioContext();
  }

  private initAudioContext() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async loadPreset(presetId: number): Promise<Track> {
    try {
      const response = await this.http.get<any>(`/api/audio/preset/${presetId}`).toPromise();
      const track: Track = {
        id: `track-${Date.now()}`,
        name: response.name,
        samples: response.samples,
        sampleRate: response.sampleRate,
        volume: 1,
        pan: 0,
        muted: false,
        solo: false
      };
      this.tracks.push(track);
      this.tracksSubject.next([...this.tracks]);
      this.setActiveTrack(track.id);
      this.saveHistory('add-track', { track });
      return track;
    } catch (error) {
      console.error('Error loading preset:', error);
      throw error;
    }
  }

  async importAudioFile(file: File): Promise<Track> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.http.post<any>('/api/audio/import', formData).toPromise();
      const track: Track = {
        id: `track-${Date.now()}`,
        name: file.name,
        samples: response.samples,
        sampleRate: response.sampleRate,
        volume: 1,
        pan: 0,
        muted: false,
        solo: false
      };
      this.tracks.push(track);
      this.tracksSubject.next([...this.tracks]);
      this.setActiveTrack(track.id);
      this.saveHistory('add-track', { track });
      return track;
    } catch (error) {
      console.error('Error importing file:', error);
      throw error;
    }
  }

  setActiveTrack(trackId: string | null) {
    this.activeTrackId = trackId;
    this.activeTrackSubject.next(trackId);
  }

  getActiveTrack(): Track | undefined {
    return this.tracks.find(t => t.id === this.activeTrackId);
  }

  setVolume(trackId: string, volume: number) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.volume = volume;
      this.tracksSubject.next([...this.tracks]);
    }
  }

  setPan(trackId: string, pan: number) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.pan = pan;
      this.tracksSubject.next([...this.tracks]);
    }
  }

  deleteTrack(trackId: string) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index > -1) {
      const deleted = this.tracks.splice(index, 1);
      this.tracksSubject.next([...this.tracks]);
      if (this.activeTrackId === trackId) {
        this.activeTrackId = this.tracks[0]?.id || null;
        this.activeTrackSubject.next(this.activeTrackId);
      }
      this.saveHistory('delete-track', { track: deleted[0] });
    }
  }

  cutSelection(start: number, end: number) {
    const track = this.getActiveTrack();
    if (!track) return;
    
    const startSample = Math.floor(start * track.sampleRate);
    const endSample = Math.floor(end * track.sampleRate);
    
    const cutSamples = track.samples.slice(startSample, endSample);
    this.clipboard = { samples: cutSamples, start, end };
    
    const before = track.samples.slice(0, startSample);
    const after = track.samples.slice(endSample);
    track.samples = [...before, ...after];
    
    this.tracksSubject.next([...this.tracks]);
    this.saveHistory('cut', { trackId: track.id, start, end, cutLength: cutSamples.length });
  }

  copySelection(start: number, end: number) {
    const track = this.getActiveTrack();
    if (!track) return;
    
    const startSample = Math.floor(start * track.sampleRate);
    const endSample = Math.floor(end * track.sampleRate);
    
    const copiedSamples = track.samples.slice(startSample, endSample);
    this.clipboard = { samples: copiedSamples, start, end };
  }

  pasteSelection(position: number) {
    if (!this.clipboard) return;
    
    const track = this.getActiveTrack();
    if (!track) return;
    
    const posSample = Math.floor(position * track.sampleRate);
    
    const before = track.samples.slice(0, posSample);
    const after = track.samples.slice(posSample);
    track.samples = [...before, ...this.clipboard.samples, ...after];
    
    this.tracksSubject.next([...this.tracks]);
    this.saveHistory('paste', { trackId: track.id, position, pastedLength: this.clipboard.samples.length });
  }

  undo() {
    if (this.historyIndex <= 0) return;
    
    this.historyIndex--;
    const entry = this.history[this.historyIndex];
    console.log('Undo:', entry.type);
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    
    this.historyIndex++;
    const entry = this.history[this.historyIndex];
    console.log('Redo:', entry.type);
  }

  private saveHistory(type: string, data: any) {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ type, data, timestamp: Date.now() });
    this.historyIndex++;
    
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  setZoom(level: number) {
    this.zoomLevel = Math.max(0.5, Math.min(10, level));
    this.zoomSubject.next(this.zoomLevel);
  }

  getZoom() {
    return this.zoomLevel;
  }

  getMaxDuration(): number {
    if (this.tracks.length === 0) return 10;
    return Math.max(...this.tracks.map(t => t.samples.length / t.sampleRate));
  }

  play() {
    if (this.isPlaying || !this.audioContext) return;
    this.resumeContext();
    
    this.isPlaying = true;
    this.playbackSubject.next(true);
    
    this.startPlayback();
  }

  private startPlayback() {
    const startTime = this.currentTime;
    const startSample = Math.floor(startTime * 44100);
    
    this.tracks.forEach(track => {
      if (track.muted) return;
      
      const source = this.audioContext!.createBufferSource();
      const buffer = this.audioContext!.createBuffer(1, track.samples.length - startSample, track.sampleRate);
      const channelData = buffer.getChannelData(0);
      
      for (let i = startSample; i < track.samples.length; i++) {
        channelData[i - startSample] = track.samples[i] * track.volume;
      }
      
      source.buffer = buffer;
      
      const gainNode = this.audioContext!.createGain();
      gainNode.gain.value = track.volume;
      
      const panner = this.audioContext!.createStereoPanner();
      panner.pan.value = track.pan;
      
      source.connect(gainNode).connect(panner).connect(this.audioContext!.destination);
      source.start();
    });
    
    this.updatePlaybackTime();
  }

  private updatePlaybackTime() {
    if (!this.isPlaying) return;
    
    this.currentTime += 0.016;
    this.timeSubject.next(this.currentTime);
    
    if (this.currentTime >= this.getMaxDuration()) {
      this.stop();
      return;
    }
    
    requestAnimationFrame(() => this.updatePlaybackTime());
  }

  pause() {
    this.isPlaying = false;
    this.playbackSubject.next(false);
  }

  stop() {
    this.isPlaying = false;
    this.playbackSubject.next(false);
    this.currentTime = 0;
    this.timeSubject.next(0);
  }

  seek(time: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.pause();
    this.currentTime = Math.max(0, Math.min(time, this.getMaxDuration()));
    this.timeSubject.next(this.currentTime);
    if (wasPlaying) this.play();
  }

  async applyReverb(irType: string, duration: number = 2): Promise<boolean | undefined> {
    const track = this.getActiveTrack();
    if (!track) return;
    
    try {
      const irResponse = await this.http.post<any>('/api/audio/generate-ir', {
        type: irType,
        duration,
        sampleRate: track.sampleRate
      }).toPromise();
      
      const convolvedResponse = await this.http.post<any>('/api/audio/convolve', {
        audioSamples: track.samples,
        irSamples: irResponse.samples
      }).toPromise();
      
      const oldSamples = [...track.samples];
      track.samples = convolvedResponse.samples;
      this.tracksSubject.next([...this.tracks]);
      this.saveHistory('reverb', { trackId: track.id, oldSamples });
      
      return true;
    } catch (error) {
      console.error('Error applying reverb:', error);
      throw error;
    }
  }

  async getSpectrogram(samples: number[]): Promise<any> {
    try {
      if (!samples || samples.length === 0) {
        console.log('Spectrogram: empty samples');
        return { spectrogram: [] };
      }
      
      const maxSamples = 44100 * 5;
      const downsampled = samples.length > maxSamples 
        ? samples.filter((_, i) => i % Math.ceil(samples.length / maxSamples) === 0)
        : samples;
      
      console.log(`Requesting spectrogram for ${downsampled.length} samples...`);
      
      return await new Promise((resolve) => {
        this.http.post<any>('/api/audio/spectrogram', {
          samples: downsampled,
          sampleRate: 44100
        }).subscribe({
          next: (result) => {
            console.log(`Spectrogram received: ${result?.spectrogram?.length || 0} frames`);
            resolve(result || { spectrogram: [] });
          },
          error: (err) => {
            console.warn('Spectrogram API request failed:', err.status, err.message);
            resolve({ spectrogram: [] });
          }
        });
      });
    } catch (error) {
      console.warn('Spectrogram unexpected error:', error);
      return { spectrogram: [] };
    }
  }

  detectClipping(samples: number[]): { hasClipping: boolean; count: number } {
    let count = 0;
    for (let i = 0; i < samples.length; i++) {
      if (Math.abs(samples[i]) >= 1) {
        count++;
      }
    }
    return { hasClipping: count > 0, count };
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  }
}
