import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PcbDataService } from './services/pcb-data.service';
import { PresetService } from './services/preset.service';
import { AnimationService } from './services/animation.service';
import { PCBData, WorkerMessage, WorkerResponse, Problem } from './models/pcb.models';

type ToolMode = 'select' | 'place-chip' | 'place-resistor' | 'place-capacitor' | 'place-connector' | 'route';
type PresetType = 'normal' | 'short' | 'dense' | 'complex';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PCB 电路布线工具';
  currentTool: ToolMode = 'select';
  isAnalyzing = false;
  
  private worker: Worker | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private pcbDataService: PcbDataService,
    private presetService: PresetService,
    private animationService: AnimationService
  ) {}

  ngOnInit(): void {
    this.initWorker();
    
    const initialPreset: PresetType = 'normal';
    this.loadPreset(initialPreset);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(new URL('./workers/pcb-analyzer.worker', import.meta.url));
      
      this.worker.onmessage = ({ data }: { data: WorkerResponse }) => {
        this.handleWorkerResponse(data);
      };
      
      this.worker.onerror = (error) => {
        console.error('Web Worker error:', error);
      };
    } catch (error) {
      console.warn('Web Worker not supported, running in main thread');
    }
  }

  private handleWorkerResponse(data: WorkerResponse): void {
    this.isAnalyzing = false;
    
    switch (data.type) {
      case 'problems':
        if (data.payload.problems) {
          this.pcbDataService.updateProblems(data.payload.problems);
          
          if (data.payload.problems.length > 0) {
            const shortProblems = data.payload.problems.filter(p => p.type === 'short');
            for (const problem of shortProblems) {
              this.animationService.playSparkAnimation(problem.position);
            }
          } else {
            this.animationService.playCompleteAnimation();
          }
        }
        break;
      
      case 'shortResult':
        if (data.payload.problems) {
          this.pcbDataService.updateProblems([
            ...this.pcbDataService.getPCBData().problems.filter(p => p.type !== 'short'),
            ...data.payload.problems
          ]);
        }
        break;
      
      case 'crossResult':
        if (data.payload.problems) {
          this.pcbDataService.updateProblems([
            ...this.pcbDataService.getPCBData().problems.filter(p => p.type !== 'cross'),
            ...data.payload.problems
          ]);
        }
        break;
      
      case 'densityResult':
        if (data.payload.problems) {
          this.pcbDataService.updateProblems([
            ...this.pcbDataService.getPCBData().problems.filter(p => p.type !== 'dense'),
            ...data.payload.problems
          ]);
        }
        break;
      
      case 'unconnectedResult':
        if (data.payload.problems) {
          this.pcbDataService.updateProblems([
            ...this.pcbDataService.getPCBData().problems.filter(p => p.type !== 'unconnected'),
            ...data.payload.problems
          ]);
        }
        break;
    }
  }

  onToolChange(tool: ToolMode): void {
    this.currentTool = tool;
  }

  onAnalyze(): void {
    this.isAnalyzing = true;
    const pcbData = this.pcbDataService.getPCBData();
    
    const boardData = pcbData;
    this.animationService.playScanAnimation(
      boardData.board.width,
      boardData.board.height,
      () => {
        if (this.worker) {
          const message: WorkerMessage = {
            type: 'analyze',
            payload: boardData
          };
          this.worker.postMessage(message);
        } else {
          this.isAnalyzing = false;
          console.warn('Web Worker not available');
        }
      }
    );
  }

  onClear(): void {
    this.pcbDataService.setPCBData({
      board: this.pcbDataService.getPCBData().board,
      components: [],
      traces: [],
      nets: [],
      problems: []
    });
  }

  loadPreset(presetType: PresetType): void {
    const presetData = this.presetService.getPreset(presetType);
    this.pcbDataService.setPCBData(presetData);
    this.animationService.playCompleteAnimation();
  }
}
