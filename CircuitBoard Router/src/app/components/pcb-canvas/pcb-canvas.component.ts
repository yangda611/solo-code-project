import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { 
  PCBData, 
  PCBComponent, 
  Trace, 
  Net, 
  Problem, 
  Point,
  AnimationState,
  ComponentType,
  SnapPoint
} from '../../models/pcb.models';
import { PcbDataService } from '../../services/pcb-data.service';
import { AnimationService } from '../../services/animation.service';
import { COLORS, GRID_SIZE } from '../../models/config.constants';

type ToolMode = 'select' | 'place-chip' | 'place-resistor' | 'place-capacitor' | 'place-connector' | 'route';

const BOARD_OFFSET = 50;
const SNAP_DISTANCE = 15;
const GRID_SNAP_THRESHOLD = 8;

@Component({
  selector: 'app-pcb-canvas',
  templateUrl: './pcb-canvas.component.html',
  styleUrls: ['./pcb-canvas.component.scss']
})
export class PcbCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('svgCanvas') svgCanvas!: ElementRef<SVGSVGElement>;
  
  @Input() toolMode: ToolMode = 'select';
  
  pcbData: PCBData = this.pcbDataService.getPCBData();
  selectedComponentId: string | null = null;
  selectedTraceId: string | null = null;
  animationStates: Map<string, AnimationState> = new Map();
  
  isDragging = false;
  dragStartPosition: Point = { x: 0, y: 0 };
  dragComponent: PCBComponent | null = null;
  dragOffset: Point = { x: 0, y: 0 };
  
  isRouting = false;
  routingStartPin: { pinId: string; position: Point } | null = null;
  routingCurrentPosition: Point = { x: 0, y: 0 };
  routingPath: Point[] = [];
  
  snapPoint: SnapPoint | null = null;
  
  private destroy$ = new Subject<void>();
  
  get COLORS() { return COLORS; }

  constructor(
    private pcbDataService: PcbDataService,
    private animationService: AnimationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.pcbDataService.pcbData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.pcbData = data;
        this.cdr.markForCheck();
      });
    
    this.pcbDataService.selectedComponent$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.selectedComponentId = id;
        this.cdr.markForCheck();
      });
    
    this.pcbDataService.selectedTrace$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.selectedTraceId = id;
        this.cdr.markForCheck();
      });
    
    this.animationService.animationStates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(states => {
        this.animationStates = states;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getComponentColor(type: ComponentType): { fill: string; stroke: string } {
    switch (type) {
      case 'chip':
        return { fill: COLORS.chip, stroke: COLORS.chipOutline };
      case 'resistor':
        return { fill: COLORS.resistor, stroke: COLORS.resistorOutline };
      case 'capacitor':
        return { fill: COLORS.capacitor, stroke: COLORS.capacitorOutline };
      case 'connector':
        return { fill: COLORS.connector, stroke: COLORS.connectorOutline };
      default:
        return { fill: COLORS.chip, stroke: COLORS.chipOutline };
    }
  }

  getNetColor(netId: string): string {
    const net = this.pcbData.nets.find(n => n.id === netId);
    return net?.color || COLORS.trace;
  }

  getProblemColor(type: string): string {
    switch (type) {
      case 'short': return COLORS.problemShort;
      case 'open': return COLORS.problemOpen;
      case 'cross': return COLORS.problemCross;
      case 'dense': return COLORS.problemDense;
      case 'unconnected': return COLORS.problemUnconnected;
      default: return COLORS.problemOpen;
    }
  }

  getPathD(points: Point[]): string {
    if (points.length < 2) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  onMouseDown(event: MouseEvent): void {
    const point = this.getMousePoint(event);
    
    if (this.toolMode === 'select') {
      const component = this.getComponentAtPoint(point);
      if (component) {
        this.isDragging = true;
        this.dragComponent = component;
        this.dragStartPosition = { ...component.position };
        this.dragOffset = {
          x: point.x - component.position.x,
          y: point.y - component.position.y
        };
        this.pcbDataService.setSelectedComponent(component.id);
      } else {
        const trace = this.getTraceAtPoint(point);
        if (trace) {
          this.pcbDataService.setSelectedTrace(trace.id);
        } else {
          this.pcbDataService.setSelectedComponent(null);
          this.pcbDataService.setSelectedTrace(null);
        }
      }
    } else if (this.toolMode.startsWith('place-')) {
      const type = this.toolMode.replace('place-', '') as ComponentType;
      const snapPoints = this.pcbDataService.findSnapPoints(point);
      const bestSnap = snapPoints[0];
      
      let placePosition = point;
      if (bestSnap && bestSnap.distance < 15) {
        placePosition = bestSnap.point;
        this.animationService.playSnapAnimation(bestSnap.point);
      }
      
      this.pcbDataService.addComponent(type, placePosition);
      this.animationService.playSnapAnimation(placePosition);
    } else if (this.toolMode === 'route') {
      const pin = this.getPinAtPoint(point);
      if (pin) {
        this.isRouting = true;
        this.routingStartPin = { pinId: pin.id, position: { ...pin.position } };
        this.routingPath = [{ ...pin.position }];
        this.routingCurrentPosition = { ...pin.position };
      }
    }
  }

  onMouseMove(event: MouseEvent): void {
    const point = this.getMousePoint(event);
    
    const snapPoints = this.pcbDataService.findSnapPoints(point);
    
    this.snapPoint = null;
    if (this.toolMode !== 'select' && !this.isDragging) {
      const bestSnap = snapPoints[0];
      
      if (bestSnap && bestSnap.type === 'pin' && bestSnap.distance < SNAP_DISTANCE) {
        this.snapPoint = bestSnap;
      }
    }
    
    if (this.isDragging && this.dragComponent) {
      const newPosition = {
        x: point.x - this.dragOffset.x,
        y: point.y - this.dragOffset.y
      };
      
      const bestSnap = snapPoints[0];
      if (bestSnap && bestSnap.type === 'grid' && bestSnap.distance < GRID_SNAP_THRESHOLD) {
        newPosition.x = bestSnap.point.x - this.dragOffset.x;
        newPosition.y = bestSnap.point.y - this.dragOffset.y;
      }
      
      this.pcbDataService.updateComponentPosition(this.dragComponent.id, newPosition);
    }
    
    if (this.isRouting) {
      if (this.snapPoint) {
        this.routingCurrentPosition = this.snapPoint.point;
      } else {
        this.routingCurrentPosition = point;
      }
      
      const lastPoint = this.routingPath[this.routingPath.length - 1];
      const dx = Math.abs(this.routingCurrentPosition.x - lastPoint.x);
      const dy = Math.abs(this.routingCurrentPosition.y - lastPoint.y);
      
      if (dx > GRID_SIZE || dy > GRID_SIZE) {
        const midPoint = this.snapPoint ? this.snapPoint.point : {
          x: Math.round(this.routingCurrentPosition.x / GRID_SIZE) * GRID_SIZE,
          y: Math.round(this.routingCurrentPosition.y / GRID_SIZE) * GRID_SIZE
        };
        
        this.routingPath.push({
          x: midPoint.x,
          y: lastPoint.y
        });
        this.routingPath.push(midPoint);
      }
    }
  }

  onMouseUp(event: MouseEvent): void {
    const point = this.getMousePoint(event);
    
    if (this.isDragging && this.dragComponent) {
      this.isDragging = false;
      this.dragComponent = null;
    }
    
    if (this.isRouting && this.routingStartPin) {
      const pin = this.getPinAtPoint(point);
      
      if (pin && pin.id !== this.routingStartPin.pinId) {
        this.routingPath.push({ ...pin.position });
        this.pcbDataService.addTrace(
          this.routingStartPin.pinId,
          pin.id,
          this.routingPath
        );
        
        this.animationService.playCompleteAnimation();
      }
      
      this.isRouting = false;
      this.routingStartPin = null;
      this.routingPath = [];
    }
  }

  onDoubleClick(event: MouseEvent): void {
    const point = this.getMousePoint(event);
    
    const component = this.getComponentAtPoint(point);
    if (component && this.selectedComponentId === component.id) {
      if (confirm(`确定删除元件 ${component.name} 吗？`)) {
        this.pcbDataService.deleteComponent(component.id);
        this.pcbDataService.setSelectedComponent(null);
      }
      return;
    }
    
    const trace = this.getTraceAtPoint(point);
    if (trace && this.selectedTraceId === trace.id) {
      if (confirm('确定删除这条走线吗？')) {
        this.pcbDataService.deleteTrace(trace.id);
        this.pcbDataService.setSelectedTrace(null);
      }
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedComponentId) {
        const component = this.pcbData.components.find(c => c.id === this.selectedComponentId);
        const componentName = component ? component.name : '该元件';
        if (confirm(`确定删除元件 "${componentName}" 吗？`)) {
          this.pcbDataService.deleteComponent(this.selectedComponentId);
          this.pcbDataService.setSelectedComponent(null);
        }
      } else if (this.selectedTraceId) {
        if (confirm('确定删除这条走线吗？')) {
          this.pcbDataService.deleteTrace(this.selectedTraceId);
          this.pcbDataService.setSelectedTrace(null);
        }
      }
    }
    
    if (event.key === 'Escape') {
      if (this.isRouting) {
        this.isRouting = false;
        this.routingStartPin = null;
        this.routingPath = [];
      }
      this.pcbDataService.setSelectedComponent(null);
      this.pcbDataService.setSelectedTrace(null);
    }
  }

  private getMousePoint(event: MouseEvent): Point {
    if (!this.svgCanvas) return { x: 0, y: 0 };
    
    const svg = this.svgCanvas.nativeElement;
    const CTM = svg.getScreenCTM();
    
    if (!CTM) return { x: 0, y: 0 };
    
    return {
      x: (event.clientX - CTM.e) / CTM.a - BOARD_OFFSET,
      y: (event.clientY - CTM.f) / CTM.d - BOARD_OFFSET
    };
  }

  private getComponentAtPoint(point: Point): PCBComponent | null {
    for (const component of this.pcbData.components) {
      if (point.x >= component.position.x &&
          point.x <= component.position.x + component.width &&
          point.y >= component.position.y &&
          point.y <= component.position.y + component.height) {
        return component;
      }
    }
    return null;
  }

  private getPinAtPoint(point: Point): { id: string; position: Point } | null {
    for (const component of this.pcbData.components) {
      for (const pin of component.pins) {
        const dx = Math.abs(point.x - pin.position.x);
        const dy = Math.abs(point.y - pin.position.y);
        if (dx < 10 && dy < 10) {
          return pin;
        }
      }
    }
    return null;
  }

  private getTraceAtPoint(point: Point): Trace | null {
    for (const trace of this.pcbData.traces) {
      for (let i = 0; i < trace.points.length - 1; i++) {
        const distance = this.pointToSegmentDistance(
          point,
          trace.points[i],
          trace.points[i + 1]
        );
        if (distance < 8) {
          return trace;
        }
      }
    }
    return null;
  }

  private pointToSegmentDistance(p: Point, v: Point, w: Point): number {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return this.distance(p, v);
    
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    return this.distance(p, {
      x: v.x + t * (w.x - v.x),
      y: v.y + t * (w.y - v.y)
    });
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  getRoutingPreviewPath(): string {
    if (!this.isRouting || this.routingPath.length === 0) return '';
    
    const points = [...this.routingPath, this.routingCurrentPosition];
    return this.getPathD(points);
  }

  getSparkParticles(progress: number, center: Point): { x: number; y: number; size: number; opacity: number; color: string }[] {
    return this.animationService.getSparkParticles(progress, center);
  }

  getCurrentFlowPosition(progress: number, path: Point[]): Point {
    return this.animationService.getCurrentFlowPosition(progress, path);
  }

  get animationStateEntries(): [string, AnimationState][] {
    return Array.from(this.animationStates.entries());
  }

  trackByTraceId(index: number, trace: Trace): string {
    return trace.id;
  }

  trackByComponentId(index: number, component: PCBComponent): string {
    return component.id;
  }

  trackByPinId(index: number, pin: { id: string }): string {
    return pin.id;
  }

  trackByProblemId(index: number, problem: Problem): string {
    return problem.id;
  }

  trackByAnimationKey(index: number, entry: [string, AnimationState]): string {
    return entry[0];
  }

  trackByParticle(index: number, particle: { x: number; y: number }): string {
    return `${particle.x}-${particle.y}-${index}`;
  }

  getPinLabelX(pin: { position: Point; componentId: string }, component: PCBComponent): number {
    const isRightSide = pin.position.x > component.position.x + component.width / 2;
    return pin.position.x + (isRightSide ? 12 : -12);
  }

  getAnimationPathX(state: AnimationState): number {
    return state.path?.[0]?.x || 0;
  }

  getAnimationPathY(state: AnimationState): number {
    return state.path?.[0]?.y || 0;
  }
}
