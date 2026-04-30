import { 
  Point, Pin, Trace, PCBComponent, Net, Problem, ProblemType,
  WorkerMessage, WorkerResponse, PCBData
} from '../models/pcb.models';
import { 
  GRID_SIZE, TRACE_WIDTH, MIN_COMPONENT_SPACING, DENSITY_THRESHOLD 
} from '../models/config.constants';

interface WorkerPCBData {
  components: PCBComponent[];
  traces: Trace[];
  nets: Net[];
  boardWidth: number;
  boardHeight: number;
}

let pcbData: WorkerPCBData = {
  components: [],
  traces: [],
  nets: [],
  boardWidth: 800,
  boardHeight: 600
};

addEventListener('message', ({ data }: { data: WorkerMessage }) => {
  switch (data.type) {
    case 'analyze':
      handleAnalyze(data.payload as PCBData);
      break;
    case 'checkProblems':
      handleCheckProblems();
      break;
    case 'checkShort':
      handleCheckShort();
      break;
    case 'checkCross':
      handleCheckCross();
      break;
    case 'checkDensity':
      handleCheckDensity();
      break;
    case 'checkUnconnected':
      handleCheckUnconnected();
      break;
  }
});

function handleAnalyze(data: PCBData): void {
  pcbData = {
    components: data.components,
    traces: data.traces,
    nets: data.nets,
    boardWidth: data.board.width,
    boardHeight: data.board.height
  };
  handleCheckProblems();
}

function handleCheckProblems(): void {
  const problems: Problem[] = [];
  
  problems.push(...checkShortCircuits());
  problems.push(...checkOpenCircuits());
  problems.push(...checkCrossingTraces());
  problems.push(...checkComponentDensity());
  problems.push(...checkUnconnectedPins());
  
  const response: WorkerResponse = {
    type: 'problems',
    payload: { problems }
  };
  
  postMessage(response);
}

function handleCheckShort(): void {
  const problems = checkShortCircuits();
  const response: WorkerResponse = {
    type: 'shortResult',
    payload: { 
      problems,
      isShort: problems.length > 0 
    }
  };
  postMessage(response);
}

function handleCheckCross(): void {
  const problems = checkCrossingTraces();
  const response: WorkerResponse = {
    type: 'crossResult',
    payload: { 
      problems,
      isCross: problems.length > 0 
    }
  };
  postMessage(response);
}

function handleCheckDensity(): void {
  const density = calculateBoardDensity();
  const problems = checkComponentDensity();
  const response: WorkerResponse = {
    type: 'densityResult',
    payload: { 
      problems,
      density 
    }
  };
  postMessage(response);
}

function handleCheckUnconnected(): void {
  const problems = checkUnconnectedPins();
  const unconnectedPinIds = problems.map(p => 
    p.affectedComponentIds.map(id => {
      const comp = pcbData.components.find(c => c.id === id);
      return comp?.pins.find(pin => !pin.netId)?.id;
    }).filter(Boolean) as string[]
  ).flat();
  
  const response: WorkerResponse = {
    type: 'unconnectedResult',
    payload: { 
      problems,
      unconnectedPins: unconnectedPinIds 
    }
  };
  postMessage(response);
}

function checkShortCircuits(): Problem[] {
  const problems: Problem[] = [];
  
  for (let i = 0; i < pcbData.traces.length; i++) {
    for (let j = i + 1; j < pcbData.traces.length; j++) {
      const trace1 = pcbData.traces[i];
      const trace2 = pcbData.traces[j];
      
      if (trace1.netId === trace2.netId) continue;
      if (trace1.layer !== trace2.layer) continue;
      
      if (doTracesOverlap(trace1, trace2)) {
        const midPoint = getMidPoint(trace1.points);
        problems.push({
          id: `short-${i}-${j}`,
          type: 'short',
          severity: 'error',
          message: `走线短路：网络 "${getNetName(trace1.netId)}" 和 "${getNetName(trace2.netId)}" 重叠`,
          position: midPoint,
          affectedComponentIds: getComponentIdsFromTraces([trace1, trace2]),
          affectedTraceIds: [trace1.id, trace2.id],
          details: `走线 ${trace1.id} 和 ${trace2.id} 在同一层重叠，可能导致短路。`
        });
      }
    }
  }
  
  return problems;
}

function checkOpenCircuits(): Problem[] {
  const problems: Problem[] = [];
  
  for (const net of pcbData.nets) {
    const connectedPins = new Set<string>();
    const visitedTraces = new Set<string>();
    
    if (net.pinIds.length === 0) continue;
    
    const startPinId = net.pinIds[0];
    const queue = [startPinId];
    connectedPins.add(startPinId);
    
    while (queue.length > 0) {
      const currentPinId = queue.shift()!;
      
      for (const traceId of net.traceIds) {
        if (visitedTraces.has(traceId)) continue;
        
        const trace = pcbData.traces.find(t => t.id === traceId);
        if (!trace) continue;
        
        if (trace.startPinId === currentPinId || trace.endPinId === currentPinId) {
          visitedTraces.add(traceId);
          
          const otherPinId = trace.startPinId === currentPinId ? trace.endPinId : trace.startPinId;
          if (!connectedPins.has(otherPinId)) {
            connectedPins.add(otherPinId);
            queue.push(otherPinId);
          }
        }
      }
    }
    
    const disconnectedPins = net.pinIds.filter(pinId => !connectedPins.has(pinId));
    
    if (disconnectedPins.length > 0) {
      const firstDisconnectedPin = findPinById(disconnectedPins[0]);
      problems.push({
        id: `open-${net.id}`,
        type: 'open',
        severity: 'error',
        message: `网络 "${net.name}" 存在断路：${disconnectedPins.length} 个引脚未连通`,
        position: firstDisconnectedPin?.position || { x: 0, y: 0 },
        affectedComponentIds: getComponentIdsFromPinIds(disconnectedPins),
        affectedTraceIds: Array.from(visitedTraces),
        details: `网络 "${net.name}" 中有 ${disconnectedPins.length} 个引脚与起始引脚未连通。请检查走线连接。`
      });
    }
  }
  
  return problems;
}

function checkCrossingTraces(): Problem[] {
  const problems: Problem[] = [];
  
  for (let i = 0; i < pcbData.traces.length; i++) {
    for (let j = i + 1; j < pcbData.traces.length; j++) {
      const trace1 = pcbData.traces[i];
      const trace2 = pcbData.traces[j];
      
      if (trace1.netId === trace2.netId) continue;
      if (trace1.layer !== trace2.layer) continue;
      
      const crossPoint = findTraceIntersection(trace1, trace2);
      if (crossPoint) {
        problems.push({
          id: `cross-${i}-${j}`,
          type: 'cross',
          severity: 'warning',
          message: `走线交叉：网络 "${getNetName(trace1.netId)}" 和 "${getNetName(trace2.netId)}"`,
          position: crossPoint,
          affectedComponentIds: getComponentIdsFromTraces([trace1, trace2]),
          affectedTraceIds: [trace1.id, trace2.id],
          details: `走线在 (${Math.round(crossPoint.x)}, ${Math.round(crossPoint.y)}) 处交叉。建议使用过孔或重新布线。`
        });
      }
    }
  }
  
  return problems;
}

function checkComponentDensity(): Problem[] {
  const problems: Problem[] = [];
  const density = calculateBoardDensity();
  
  if (density > DENSITY_THRESHOLD) {
    problems.push({
      id: 'density-board',
      type: 'dense',
      severity: 'warning',
      message: `电路板密度过高：${Math.round(density * 100)}%`,
      position: { x: pcbData.boardWidth / 2, y: pcbData.boardHeight / 2 },
      affectedComponentIds: pcbData.components.map(c => c.id),
      affectedTraceIds: [],
      details: `电路板密度为 ${Math.round(density * 100)}%，超过阈值 ${Math.round(DENSITY_THRESHOLD * 100)}%。建议增加板面积或减少元件。`
    });
  }
  
  for (let i = 0; i < pcbData.components.length; i++) {
    for (let j = i + 1; j < pcbData.components.length; j++) {
      const comp1 = pcbData.components[i];
      const comp2 = pcbData.components[j];
      
      const distance = getComponentDistance(comp1, comp2);
      
      if (distance < MIN_COMPONENT_SPACING) {
        const midPoint = {
          x: (comp1.position.x + comp2.position.x) / 2,
          y: (comp1.position.y + comp2.position.y) / 2
        };
        
        problems.push({
          id: `dense-${i}-${j}`,
          type: 'dense',
          severity: 'warning',
          message: `元件过密："${comp1.name}" 和 "${comp2.name}" 间距仅 ${Math.round(distance)}px`,
          position: midPoint,
          affectedComponentIds: [comp1.id, comp2.id],
          affectedTraceIds: [],
          details: `元件 "${comp1.name}" 和 "${comp2.name}" 间距为 ${Math.round(distance)}px，小于最小间距 ${MIN_COMPONENT_SPACING}px。`
        });
      }
    }
  }
  
  return problems;
}

function checkUnconnectedPins(): Problem[] {
  const problems: Problem[] = [];
  const unconnectedPins: Pin[] = [];
  
  for (const component of pcbData.components) {
    for (const pin of component.pins) {
      if (!pin.netId) {
        unconnectedPins.push(pin);
      }
    }
  }
  
  if (unconnectedPins.length > 0) {
    const groupedByComponent = new Map<string, Pin[]>();
    
    for (const pin of unconnectedPins) {
      if (!groupedByComponent.has(pin.componentId)) {
        groupedByComponent.set(pin.componentId, []);
      }
      groupedByComponent.get(pin.componentId)!.push(pin);
    }
    
    for (const [componentId, pins] of groupedByComponent) {
      const component = pcbData.components.find(c => c.id === componentId);
      if (!component) continue;
      
      problems.push({
        id: `unconnected-${componentId}`,
        type: 'unconnected',
        severity: 'info',
        message: `元件 "${component.name}" 有 ${pins.length} 个未连接引脚`,
        position: component.position,
        affectedComponentIds: [componentId],
        affectedTraceIds: [],
        details: `未连接的引脚：${pins.map(p => p.label).join(', ')}`
      });
    }
  }
  
  return problems;
}

function doTracesOverlap(trace1: Trace, trace2: Trace): boolean {
  const points1 = trace1.points;
  const points2 = trace2.points;
  
  for (let i = 0; i < points1.length - 1; i++) {
    for (let j = 0; j < points2.length - 1; j++) {
      const seg1Start = points1[i];
      const seg1End = points1[i + 1];
      const seg2Start = points2[j];
      const seg2End = points2[j + 1];
      
      if (isSameLine(seg1Start, seg1End, seg2Start, seg2End)) {
        if (isPointOnLine(seg1Start, seg1End, seg2Start) ||
            isPointOnLine(seg1Start, seg1End, seg2End) ||
            isPointOnLine(seg2Start, seg2End, seg1Start) ||
            isPointOnLine(seg2Start, seg2End, seg1End)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

function findTraceIntersection(trace1: Trace, trace2: Trace): Point | null {
  const points1 = trace1.points;
  const points2 = trace2.points;
  
  for (let i = 0; i < points1.length - 1; i++) {
    for (let j = 0; j < points2.length - 1; j++) {
      const intersection = lineIntersection(
        points1[i], points1[i + 1],
        points2[j], points2[j + 1]
      );
      
      if (intersection && 
          isPointOnSegment(points1[i], points1[i + 1], intersection) &&
          isPointOnSegment(points2[j], points2[j + 1], intersection)) {
        return intersection;
      }
    }
  }
  
  return null;
}

function lineIntersection(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): Point | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null;
  
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y)
    };
  }
  
  return null;
}

function isSameLine(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  return Math.abs(denom) < 0.0001;
}

function isPointOnLine(lineStart: Point, lineEnd: Point, point: Point): boolean {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;
  
  const px = point.x - lineStart.x;
  const py = point.y - lineStart.y;
  
  const dot = px * dx + py * dy;
  
  if (dot < 0 || dot > lengthSq) return false;
  
  const cross = px * dy - py * dx;
  return Math.abs(cross) < TRACE_WIDTH * 2;
}

function isPointOnSegment(p1: Point, p2: Point, point: Point): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSq = dx * dx + dy * dy;
  
  const px = point.x - p1.x;
  const py = point.y - p1.y;
  
  const dot = px * dx + py * dy;
  
  if (dot < 0 || dot > lengthSq) return false;
  
  const cross = px * dy - py * dx;
  return Math.abs(cross) < 0.001;
}

function getMidPoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  
  const totalLength = calculatePathLength(points);
  const halfLength = totalLength / 2;
  
  let currentLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const segLength = distance(points[i], points[i + 1]);
    
    if (currentLength + segLength >= halfLength) {
      const t = (halfLength - currentLength) / segLength;
      return {
        x: points[i].x + t * (points[i + 1].x - points[i].x),
        y: points[i].y + t * (points[i + 1].y - points[i].y)
      };
    }
    
    currentLength += segLength;
  }
  
  return points[points.length - 1];
}

function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += distance(points[i], points[i + 1]);
  }
  return length;
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getComponentDistance(comp1: PCBComponent, comp2: PCBComponent): number {
  const center1 = {
    x: comp1.position.x + comp1.width / 2,
    y: comp1.position.y + comp1.height / 2
  };
  const center2 = {
    x: comp2.position.x + comp2.width / 2,
    y: comp2.position.y + comp2.height / 2
  };
  
  const dx = Math.abs(center1.x - center2.x) - (comp1.width + comp2.width) / 2;
  const dy = Math.abs(center1.y - center2.y) - (comp1.height + comp2.height) / 2;
  
  if (dx > 0 && dy > 0) {
    return Math.sqrt(dx * dx + dy * dy);
  } else if (dx > 0) {
    return dx;
  } else if (dy > 0) {
    return dy;
  } else {
    return 0;
  }
}

function calculateBoardDensity(): number {
  const boardArea = pcbData.boardWidth * pcbData.boardHeight;
  let componentArea = 0;
  
  for (const component of pcbData.components) {
    componentArea += component.width * component.height;
  }
  
  return componentArea / boardArea;
}

function getNetName(netId: string): string {
  const net = pcbData.nets.find(n => n.id === netId);
  return net?.name || netId;
}

function findPinById(pinId: string): Pin | undefined {
  for (const component of pcbData.components) {
    const pin = component.pins.find(p => p.id === pinId);
    if (pin) return pin;
  }
  return undefined;
}

function getComponentIdsFromTraces(traces: Trace[]): string[] {
  const componentIds = new Set<string>();
  
  for (const trace of traces) {
    const startPin = findPinById(trace.startPinId);
    const endPin = findPinById(trace.endPinId);
    
    if (startPin) componentIds.add(startPin.componentId);
    if (endPin) componentIds.add(endPin.componentId);
  }
  
  return Array.from(componentIds);
}

function getComponentIdsFromPinIds(pinIds: string[]): string[] {
  const componentIds = new Set<string>();
  
  for (const pinId of pinIds) {
    const pin = findPinById(pinId);
    if (pin) componentIds.add(pin.componentId);
  }
  
  return Array.from(componentIds);
}
