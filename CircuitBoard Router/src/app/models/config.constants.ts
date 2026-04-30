import { ComponentType } from './pcb.models';

export const COMPONENT_DEFAULTS: Record<ComponentType, { width: number; height: number; pinSpacing: number }> = {
  chip: { width: 120, height: 60, pinSpacing: 20 },
  resistor: { width: 80, height: 30, pinSpacing: 10 },
  capacitor: { width: 60, height: 40, pinSpacing: 10 },
  connector: { width: 100, height: 40, pinSpacing: 20 }
};

export const COLORS = {
  board: '#0a4d1e',
  boardGrid: '#0d5a25',
  trace: '#ffcc00',
  traceHighlight: '#ffffff',
  pin: '#c0c0c0',
  pinConnected: '#00ff00',
  pinUnconnected: '#ff6666',
  chip: '#1a1a2e',
  chipOutline: '#3b82f6',
  resistor: '#8b4513',
  resistorOutline: '#d2691e',
  capacitor: '#2e7d32',
  capacitorOutline: '#4caf50',
  connector: '#4a148c',
  connectorOutline: '#7c4dff',
  problemShort: '#ef4444',
  problemOpen: '#f59e0b',
  problemCross: '#8b5cf6',
  problemDense: '#f97316',
  problemUnconnected: '#64748b',
  current: '#00ffff',
  spark: '#ff4400',
  snap: '#00ff88',
  scan: '#00ffff',
  complete: '#22c55e'
};

export const ANIMATION_DURATIONS = {
  snap: 300,
  current: 2000,
  spark: 500,
  drag: 100,
  scan: 3000,
  complete: 1000
};

export const GRID_SIZE = 20;
export const TRACE_WIDTH = 4;
export const SNAP_DISTANCE = 15;
export const MIN_COMPONENT_SPACING = 40;
export const DENSITY_THRESHOLD = 0.7;

export const NET_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
  '#6c5ce7', '#00b894', '#e17055', '#0984e3'
];
