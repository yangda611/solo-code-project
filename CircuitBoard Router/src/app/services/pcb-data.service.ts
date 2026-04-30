import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  PCBData, PCBComponent, Trace, Net, Problem, Point, Pin,
  ComponentType, SnapPoint, AnimationState, WorkerMessage, WorkerResponse
} from '../models/pcb.models';
import { 
  COMPONENT_DEFAULTS, GRID_SIZE, TRACE_WIDTH, SNAP_DISTANCE, NET_COLORS 
} from '../models/config.constants';

@Injectable({
  providedIn: 'root'
})
export class PcbDataService {
  private pcbDataSubject = new BehaviorSubject<PCBData>(this.createEmptyPCB());
  public pcbData$ = this.pcbDataSubject.asObservable();
  
  private selectedComponentSubject = new BehaviorSubject<string | null>(null);
  public selectedComponent$ = this.selectedComponentSubject.asObservable();
  
  private selectedTraceSubject = new BehaviorSubject<string | null>(null);
  public selectedTrace$ = this.selectedTraceSubject.asObservable();
  
  private animationStateSubject = new BehaviorSubject<AnimationState>({ 
    type: 'none', 
    progress: 0 
  });
  public animationState$ = this.animationStateSubject.asObservable();

  constructor() {}

  private createEmptyPCB(): PCBData {
    return {
      board: {
        width: 1000,
        height: 800,
        gridSize: GRID_SIZE,
        layers: ['top', 'bottom']
      },
      components: [],
      traces: [],
      nets: [],
      problems: []
    };
  }

  getPCBData(): PCBData {
    return this.pcbDataSubject.getValue();
  }

  setPCBData(data: PCBData): void {
    this.pcbDataSubject.next(data);
  }

  addComponent(type: ComponentType, position: Point): PCBComponent {
    const data = this.getPCBData();
    const defaults = COMPONENT_DEFAULTS[type];
    
    const id = `${type}-${Date.now()}`;
    const name = this.generateComponentName(type, data.components);
    
    const pins = this.generatePins(type, id, position, defaults);
    
    const component: PCBComponent = {
      id,
      type,
      name,
      position,
      rotation: 0,
      width: defaults.width,
      height: defaults.height,
      pins
    } as PCBComponent;
    
    data.components.push(component);
    this.pcbDataSubject.next({ ...data });
    
    return component;
  }

  private generateComponentName(type: ComponentType, components: PCBComponent[]): string {
    const prefixes: Record<ComponentType, string> = {
      chip: 'U',
      resistor: 'R',
      capacitor: 'C',
      connector: 'J'
    };
    
    const prefix = prefixes[type];
    const count = components.filter(c => c.type === type).length + 1;
    
    return `${prefix}${count}`;
  }

  private generatePins(type: ComponentType, componentId: string, position: Point, defaults: { width: number; height: number; pinSpacing: number }): Pin[] {
    const pins: Pin[] = [];
    
    if (type === 'chip') {
      const pinsPerSide = 4;
      for (let i = 0; i < pinsPerSide; i++) {
        pins.push({
          id: `${componentId}-pin-${i + 1}`,
          label: `${i + 1}`,
          position: {
            x: position.x,
            y: position.y + (i + 1) * defaults.pinSpacing
          },
          componentId,
          isPower: false,
          isGround: false
        });
        pins.push({
          id: `${componentId}-pin-${pinsPerSide + i + 1}`,
          label: `${pinsPerSide + i + 1}`,
          position: {
            x: position.x + defaults.width,
            y: position.y + (pinsPerSide - i) * defaults.pinSpacing
          },
          componentId,
          isPower: false,
          isGround: false
        });
      }
    } else if (type === 'resistor' || type === 'capacitor') {
      pins.push({
        id: `${componentId}-pin-1`,
        label: '1',
        position: {
          x: position.x,
          y: position.y + defaults.height / 2
        },
        componentId,
        isPower: false,
        isGround: false
      });
      pins.push({
        id: `${componentId}-pin-2`,
        label: '2',
        position: {
          x: position.x + defaults.width,
          y: position.y + defaults.height / 2
        },
        componentId,
        isPower: false,
        isGround: false
      });
    } else if (type === 'connector') {
      const pinCount = 4;
      for (let i = 0; i < pinCount; i++) {
        pins.push({
          id: `${componentId}-pin-${i + 1}`,
          label: `${i + 1}`,
          position: {
            x: position.x + (i + 1) * defaults.pinSpacing,
            y: position.y
          },
          componentId,
          isPower: false,
          isGround: false
        });
      }
    }
    
    return pins;
  }

  updateComponentPosition(componentId: string, newPosition: Point): void {
    const data = this.getPCBData();
    const component = data.components.find(c => c.id === componentId);
    
    if (!component) return;
    
    const dx = newPosition.x - component.position.x;
    const dy = newPosition.y - component.position.y;
    
    component.position = newPosition;
    component.pins.forEach(pin => {
      pin.position.x += dx;
      pin.position.y += dy;
    });
    
    data.traces.forEach(trace => {
      if (trace.startPinId) {
        const startPin = this.findPin(trace.startPinId, data);
        if (startPin) {
          trace.startPoint = { ...startPin.position };
          trace.points[0] = { ...startPin.position };
        }
      }
      if (trace.endPinId) {
        const endPin = this.findPin(trace.endPinId, data);
        if (endPin) {
          trace.endPoint = { ...endPin.position };
          trace.points[trace.points.length - 1] = { ...endPin.position };
        }
      }
    });
    
    this.pcbDataSubject.next({ ...data });
  }

  deleteComponent(componentId: string): void {
    const data = this.getPCBData();
    const component = data.components.find(c => c.id === componentId);
    
    if (!component) return;
    
    const pinIds = component.pins.map(p => p.id);
    data.traces = data.traces.filter(trace => 
      !pinIds.includes(trace.startPinId) && !pinIds.includes(trace.endPinId)
    );
    
    data.nets.forEach(net => {
      net.pinIds = net.pinIds.filter(id => !pinIds.includes(id));
    });
    
    data.components = data.components.filter(c => c.id !== componentId);
    this.pcbDataSubject.next({ ...data });
  }

  addTrace(startPinId: string, endPinId: string, points: Point[]): Trace | null {
    const data = this.getPCBData();
    
    const startPin = this.findPin(startPinId, data);
    const endPin = this.findPin(endPinId, data);
    
    if (!startPin || !endPin) return null;
    
    let netId: string;
    
    if (startPin.netId && endPin.netId && startPin.netId === endPin.netId) {
      netId = startPin.netId;
    } else if (startPin.netId) {
      netId = startPin.netId;
      if (endPin.netId) {
        this.mergeNets(endPin.netId, netId, data);
      }
      endPin.netId = netId;
    } else if (endPin.netId) {
      netId = endPin.netId;
      startPin.netId = netId;
    } else {
      netId = this.createNewNet(data);
      startPin.netId = netId;
      endPin.netId = netId;
    }
    
    const trace: Trace = {
      id: `trace-${Date.now()}`,
      startPinId,
      endPinId,
      startPoint: { ...startPin.position },
      endPoint: { ...endPin.position },
      points: [...points],
      width: TRACE_WIDTH,
      layer: 'top',
      netId
    };
    
    const net = data.nets.find(n => n.id === netId);
    if (net) {
      net.traceIds.push(trace.id);
      if (!net.pinIds.includes(startPinId)) net.pinIds.push(startPinId);
      if (!net.pinIds.includes(endPinId)) net.pinIds.push(endPinId);
    }
    
    data.traces.push(trace);
    this.pcbDataSubject.next({ ...data });
    
    return trace;
  }

  private createNewNet(data: PCBData): string {
    const netCount = data.nets.length + 1;
    const netId = `net-${netCount}`;
    
    data.nets.push({
      id: netId,
      name: `Net${netCount}`,
      pinIds: [],
      traceIds: [],
      color: NET_COLORS[netCount % NET_COLORS.length]
    });
    
    return netId;
  }

  private mergeNets(sourceNetId: string, targetNetId: string, data: PCBData): void {
    const sourceNet = data.nets.find(n => n.id === sourceNetId);
    const targetNet = data.nets.find(n => n.id === targetNetId);
    
    if (!sourceNet || !targetNet) return;
    
    sourceNet.pinIds.forEach(pinId => {
      const pin = this.findPin(pinId, data);
      if (pin) pin.netId = targetNetId;
    });
    
    targetNet.pinIds.push(...sourceNet.pinIds);
    targetNet.traceIds.push(...sourceNet.traceIds);
    
    sourceNet.traceIds.forEach(traceId => {
      const trace = data.traces.find(t => t.id === traceId);
      if (trace) trace.netId = targetNetId;
    });
    
    data.nets = data.nets.filter(n => n.id !== sourceNetId);
  }

  deleteTrace(traceId: string): void {
    const data = this.getPCBData();
    const trace = data.traces.find(t => t.id === traceId);
    
    if (!trace) return;
    
    const net = data.nets.find(n => n.id === trace.netId);
    if (net) {
      net.traceIds = net.traceIds.filter(id => id !== traceId);
    }
    
    data.traces = data.traces.filter(t => t.id !== traceId);
    this.pcbDataSubject.next({ ...data });
  }

  setSelectedComponent(componentId: string | null): void {
    this.selectedComponentSubject.next(componentId);
  }

  setSelectedTrace(traceId: string | null): void {
    this.selectedTraceSubject.next(traceId);
  }

  setAnimationState(state: AnimationState): void {
    this.animationStateSubject.next(state);
  }

  updateProblems(problems: Problem[]): void {
    const data = this.getPCBData();
    data.problems = problems;
    this.pcbDataSubject.next({ ...data });
  }

  findSnapPoints(point: Point, data: PCBData = this.getPCBData()): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    const gridPoint = {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE
    };
    snapPoints.push({
      point: gridPoint,
      type: 'grid',
      distance: this.distance(point, gridPoint)
    });
    
    for (const component of data.components) {
      for (const pin of component.pins) {
        const dist = this.distance(point, pin.position);
        if (dist <= SNAP_DISTANCE) {
          snapPoints.push({
            point: { ...pin.position },
            type: 'pin',
            targetId: pin.id,
            distance: dist
          });
        }
      }
    }
    
    for (const trace of data.traces) {
      for (let i = 0; i < trace.points.length - 1; i++) {
        const closestPoint = this.closestPointOnSegment(
          point,
          trace.points[i],
          trace.points[i + 1]
        );
        const dist = this.distance(point, closestPoint);
        if (dist <= SNAP_DISTANCE) {
          snapPoints.push({
            point: closestPoint,
            type: 'trace',
            targetId: trace.id,
            distance: dist
          });
        }
      }
    }
    
    snapPoints.sort((a, b) => a.distance - b.distance);
    return snapPoints;
  }

  private findPin(pinId: string, data: PCBData): Pin | undefined {
    for (const component of data.components) {
      const pin = component.pins.find(p => p.id === pinId);
      if (pin) return pin;
    }
    return undefined;
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  private closestPointOnSegment(point: Point, segStart: Point, segEnd: Point): Point {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    
    if (dx === 0 && dy === 0) return segStart;
    
    const t = Math.max(0, Math.min(1,
      ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / (dx * dx + dy * dy)
    ));
    
    return {
      x: segStart.x + t * dx,
      y: segStart.y + t * dy
    };
  }
}
