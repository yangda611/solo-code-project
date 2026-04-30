import { Injectable } from '@angular/core';
import { AnimationState, Point, Problem } from '../models/pcb.models';
import { ANIMATION_DURATIONS, COLORS } from '../models/config.constants';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private animationFrameId: number | null = null;
  private animations: Map<string, AnimationInstance> = new Map();
  
  private animationStatesSubject = new BehaviorSubject<Map<string, AnimationState>>(new Map());
  public animationStates$ = this.animationStatesSubject.asObservable();

  constructor() {}

  playSnapAnimation(targetPoint: Point, callback?: () => void): string {
    const id = `snap-${Date.now()}`;
    const duration = ANIMATION_DURATIONS.snap;
    const startTime = performance.now();
    
    const animation: AnimationInstance = {
      id,
      type: 'snap',
      startTime,
      duration,
      targetPoint,
      color: COLORS.snap,
      callback
    };
    
    this.animations.set(id, animation);
    this.startAnimationLoop();
    
    return id;
  }

  playCurrentAnimation(path: Point[], netColor: string, callback?: () => void): string {
    const id = `current-${Date.now()}`;
    const duration = ANIMATION_DURATIONS.current;
    const startTime = performance.now();
    
    const animation: AnimationInstance = {
      id,
      type: 'current',
      startTime,
      duration,
      path,
      color: netColor,
      callback
    };
    
    this.animations.set(id, animation);
    this.startAnimationLoop();
    
    return id;
  }

  playSparkAnimation(position: Point, callback?: () => void): string {
    const id = `spark-${Date.now()}`;
    const duration = ANIMATION_DURATIONS.spark;
    const startTime = performance.now();
    
    const animation: AnimationInstance = {
      id,
      type: 'spark',
      startTime,
      duration,
      targetPoint: position,
      color: COLORS.spark,
      callback
    };
    
    this.animations.set(id, animation);
    this.startAnimationLoop();
    
    return id;
  }

  playDragAnimation(targetId: string, callback?: () => void): string {
    const id = `drag-${Date.now()}`;
    const duration = ANIMATION_DURATIONS.drag;
    const startTime = performance.now();
    
    const animation: AnimationInstance = {
      id,
      type: 'drag',
      startTime,
      duration,
      targetId,
      callback
    };
    
    this.animations.set(id, animation);
    this.startAnimationLoop();
    
    return id;
  }

  playScanAnimation(boardWidth: number, boardHeight: number, callback?: () => void): string {
    const id = `scan-${Date.now()}`;
    const duration = ANIMATION_DURATIONS.scan;
    const startTime = performance.now();
    
    const animation: AnimationInstance = {
      id,
      type: 'scan',
      startTime,
      duration,
      boardDimensions: { width: boardWidth, height: boardHeight },
      color: COLORS.scan,
      callback
    };
    
    this.animations.set(id, animation);
    this.startAnimationLoop();
    
    return id;
  }

  playCompleteAnimation(callback?: () => void): string {
    const id = `complete-${Date.now()}`;
    const duration = ANIMATION_DURATIONS.complete;
    const startTime = performance.now();
    
    const animation: AnimationInstance = {
      id,
      type: 'complete',
      startTime,
      duration,
      color: COLORS.complete,
      callback
    };
    
    this.animations.set(id, animation);
    this.startAnimationLoop();
    
    return id;
  }

  stopAnimation(id: string): void {
    this.animations.delete(id);
    if (this.animations.size === 0 && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stopAllAnimations(): void {
    this.animations.clear();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.animationStatesSubject.next(new Map());
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId) return;
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private animate(): void {
    const now = performance.now();
    const statesToRemove: string[] = [];
    const updatedStates = new Map<string, AnimationState>();
    
    for (const [id, animation] of this.animations) {
      const elapsed = now - animation.startTime;
      const progress = Math.min(1, elapsed / animation.duration);
      
      const state: AnimationState = {
        type: animation.type,
        progress,
        targetId: animation.targetId,
        path: animation.path,
        color: animation.color
      };
      
      updatedStates.set(id, state);
      
      if (progress >= 1) {
        statesToRemove.push(id);
        if (animation.callback) {
          animation.callback();
        }
      }
    }
    
    for (const id of statesToRemove) {
      this.animations.delete(id);
      updatedStates.delete(id);
    }
    
    this.animationStatesSubject.next(updatedStates);
    
    if (this.animations.size > 0) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrameId = null;
    }
  }

  getSparkParticles(progress: number, center: Point): SparkParticle[] {
    const particles: SparkParticle[] = [];
    const particleCount = 12;
    const maxRadius = 30 * progress;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = maxRadius * (0.5 + Math.random() * 0.5);
      const opacity = 1 - progress;
      const size = 3 + Math.random() * 3;
      
      particles.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
        size,
        opacity,
        color: progress < 0.5 ? '#ffaa00' : '#ff4400'
      });
    }
    
    return particles;
  }

  getCurrentFlowPosition(progress: number, path: Point[]): Point {
    if (path.length < 2) return path[0] || { x: 0, y: 0 };
    
    const totalLength = this.calculatePathLength(path);
    const targetLength = totalLength * progress;
    
    let currentLength = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const segLength = this.distance(path[i], path[i + 1]);
      
      if (currentLength + segLength >= targetLength) {
        const t = (targetLength - currentLength) / segLength;
        return {
          x: path[i].x + t * (path[i + 1].x - path[i].x),
          y: path[i].y + t * (path[i + 1].y - path[i].y)
        };
      }
      
      currentLength += segLength;
    }
    
    return path[path.length - 1];
  }

  private calculatePathLength(points: Point[]): number {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      length += this.distance(points[i], points[i + 1]);
    }
    return length;
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }
}

interface AnimationInstance {
  id: string;
  type: 'snap' | 'current' | 'spark' | 'drag' | 'scan' | 'complete';
  startTime: number;
  duration: number;
  targetId?: string;
  targetPoint?: Point;
  path?: Point[];
  boardDimensions?: { width: number; height: number };
  color?: string;
  callback?: () => void;
}

interface SparkParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}
