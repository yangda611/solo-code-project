export type ComponentType = 'chip' | 'resistor' | 'capacitor' | 'connector';

export interface Point {
  x: number;
  y: number;
}

export interface Pin {
  id: string;
  label: string;
  position: Point;
  componentId: string;
  isPower: boolean;
  isGround: boolean;
  netId?: string;
}

export interface BaseComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: Point;
  rotation: number;
  width: number;
  height: number;
  pins: Pin[];
}

export interface Chip extends BaseComponent {
  type: 'chip';
  package: 'DIP' | 'SOP' | 'QFP';
  pinCount: number;
}

export interface Resistor extends BaseComponent {
  type: 'resistor';
  resistance: number;
  tolerance: number;
}

export interface Capacitor extends BaseComponent {
  type: 'capacitor';
  capacitance: number;
  voltageRating: number;
}

export interface Connector extends BaseComponent {
  type: 'connector';
  connectorType: 'header' | 'socket' | 'USB' | 'Power';
  pinCount: number;
}

export type PCBComponent = Chip | Resistor | Capacitor | Connector;

export interface Trace {
  id: string;
  startPinId: string;
  endPinId: string;
  startPoint: Point;
  endPoint: Point;
  points: Point[];
  width: number;
  layer: 'top' | 'bottom' | 'inner';
  netId: string;
}

export interface Net {
  id: string;
  name: string;
  pinIds: string[];
  traceIds: string[];
  color: string;
}

export type ProblemType = 'short' | 'open' | 'cross' | 'dense' | 'unconnected';

export interface Problem {
  id: string;
  type: ProblemType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  position: Point;
  affectedComponentIds: string[];
  affectedTraceIds: string[];
  details: string;
}

export interface PCBBoard {
  width: number;
  height: number;
  gridSize: number;
  layers: ('top' | 'bottom' | 'inner')[];
}

export interface PCBData {
  board: PCBBoard;
  components: PCBComponent[];
  traces: Trace[];
  nets: Net[];
  problems: Problem[];
}

export interface AnimationState {
  type: 'none' | 'snap' | 'current' | 'spark' | 'drag' | 'scan' | 'complete';
  progress: number;
  targetId?: string;
  path?: Point[];
  color?: string;
}

export interface SnapPoint {
  point: Point;
  type: 'pin' | 'grid' | 'trace';
  targetId?: string;
  distance: number;
}

export interface WorkerMessage {
  type: 'analyze' | 'checkProblems' | 'checkShort' | 'checkCross' | 'checkDensity' | 'checkUnconnected';
  payload: unknown;
}

export interface WorkerResponse {
  type: string;
  payload: {
    problems?: Problem[];
    isShort?: boolean;
    isCross?: boolean;
    density?: number;
    unconnectedPins?: string[];
  };
}
