import { Injectable } from '@angular/core';
import { 
  PCBData, PCBComponent, Trace, Net, Point, 
  ComponentType, PCBBoard
} from '../models/pcb.models';
import { 
  COMPONENT_DEFAULTS, GRID_SIZE, TRACE_WIDTH, NET_COLORS 
} from '../models/config.constants';

type PresetType = 'normal' | 'short' | 'dense' | 'complex';

@Injectable({
  providedIn: 'root'
})
export class PresetService {
  private boardDefaults: PCBBoard = {
    width: 1000,
    height: 800,
    gridSize: GRID_SIZE,
    layers: ['top', 'bottom']
  };

  constructor() {}

  getPreset(presetType: PresetType): PCBData {
    switch (presetType) {
      case 'normal':
        return this.createNormalBoard();
      case 'short':
        return this.createShortCircuitBoard();
      case 'dense':
        return this.createDenseBoard();
      case 'complex':
        return this.createComplexBoard();
      default:
        return this.createNormalBoard();
    }
  }

  getPresetNames(): { type: PresetType; name: string; description: string }[] {
    return [
      { type: 'normal', name: '正常单层板', description: '一个简单的完整电路，无错误' },
      { type: 'short', name: '走线短路板', description: '包含短路问题的示例电路' },
      { type: 'dense', name: '元件过密板', description: '元件过于密集的示例电路' },
      { type: 'complex', name: '多引脚复杂板', description: '多芯片复杂连接的示例电路' }
    ];
  }

  private createNormalBoard(): PCBData {
    const data: PCBData = {
      board: { ...this.boardDefaults },
      components: [],
      traces: [],
      nets: [],
      problems: []
    };

    const microcontroller = this.createComponent(data, 'chip', { x: 400, y: 300 }, '微控制器');
    const resistor = this.createComponent(data, 'resistor', { x: 250, y: 350 }, '限流电阻');
    const ledConnector = this.createComponent(data, 'connector', { x: 100, y: 350 }, 'LED接口');
    const powerConnector = this.createComponent(data, 'connector', { x: 400, y: 100 }, '电源接口');
    const capacitor = this.createComponent(data, 'capacitor', { x: 600, y: 350 }, '滤波电容');

    this.createNet(data, 'VCC', [
      powerConnector.pins[0],
      microcontroller.pins[7],
      capacitor.pins[0]
    ]);

    this.createNet(data, 'GND', [
      powerConnector.pins[3],
      microcontroller.pins[0],
      capacitor.pins[1],
      ledConnector.pins[3]
    ]);

    this.createNet(data, 'LED_CTRL', [
      microcontroller.pins[2],
      resistor.pins[0]
    ]);

    this.createNet(data, 'LED_OUT', [
      resistor.pins[1],
      ledConnector.pins[0]
    ]);

    this.connectPinsWithTrace(data, powerConnector.pins[0], microcontroller.pins[7], [
      powerConnector.pins[0].position,
      { x: powerConnector.pins[0].position.x, y: 340 },
      { x: microcontroller.pins[7].position.x, y: 340 },
      microcontroller.pins[7].position
    ]);

    this.connectPinsWithTrace(data, microcontroller.pins[0], powerConnector.pins[3], [
      microcontroller.pins[0].position,
      { x: microcontroller.pins[0].position.x, y: 140 },
      { x: powerConnector.pins[3].position.x, y: 140 },
      powerConnector.pins[3].position
    ]);

    this.connectPinsWithTrace(data, microcontroller.pins[2], resistor.pins[0], [
      microcontroller.pins[2].position,
      { x: resistor.pins[0].position.x, y: microcontroller.pins[2].position.y },
      resistor.pins[0].position
    ]);

    this.connectPinsWithTrace(data, resistor.pins[1], ledConnector.pins[0], [
      resistor.pins[1].position,
      { x: ledConnector.pins[0].position.x, y: resistor.pins[1].position.y },
      ledConnector.pins[0].position
    ]);

    this.connectPinsWithTrace(data, microcontroller.pins[7], capacitor.pins[0], [
      microcontroller.pins[7].position,
      { x: microcontroller.pins[7].position.x, y: 370 },
      { x: capacitor.pins[0].position.x, y: 370 },
      capacitor.pins[0].position
    ]);

    this.connectPinsWithTrace(data, microcontroller.pins[0], capacitor.pins[1], [
      microcontroller.pins[0].position,
      { x: microcontroller.pins[0].position.x, y: 390 },
      { x: capacitor.pins[1].position.x, y: 390 },
      capacitor.pins[1].position
    ]);

    this.connectPinsWithTrace(data, ledConnector.pins[3], microcontroller.pins[0], [
      ledConnector.pins[3].position,
      { x: ledConnector.pins[3].position.x, y: 320 },
      { x: microcontroller.pins[0].position.x, y: 320 },
      microcontroller.pins[0].position
    ]);

    return data;
  }

  private createShortCircuitBoard(): PCBData {
    const data: PCBData = {
      board: { ...this.boardDefaults },
      components: [],
      traces: [],
      nets: [],
      problems: []
    };

    const chip1 = this.createComponent(data, 'chip', { x: 300, y: 300 }, '芯片1');
    const chip2 = this.createComponent(data, 'chip', { x: 600, y: 300 }, '芯片2');
    const resistor = this.createComponent(data, 'resistor', { x: 450, y: 500 }, '电阻');

    this.createNet(data, 'NET_A', [chip1.pins[2], chip2.pins[2]]);
    this.createNet(data, 'NET_B', [chip1.pins[3], resistor.pins[0]]);

    this.connectPinsWithTrace(data, chip1.pins[2], chip2.pins[2], [
      chip1.pins[2].position,
      { x: chip1.pins[2].position.x, y: 360 },
      { x: chip2.pins[2].position.x, y: 360 },
      chip2.pins[2].position
    ]);

    this.connectPinsWithTrace(data, chip1.pins[3], resistor.pins[0], [
      chip1.pins[3].position,
      { x: chip1.pins[3].position.x, y: 360 },
      { x: resistor.pins[0].position.x, y: 360 },
      { x: resistor.pins[0].position.x, y: resistor.pins[0].position.y },
      resistor.pins[0].position
    ]);

    return data;
  }

  private createDenseBoard(): PCBData {
    const data: PCBData = {
      board: { ...this.boardDefaults },
      components: [],
      traces: [],
      nets: [],
      problems: []
    };

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.createComponent(
          data, 
          'chip' as ComponentType, 
          { x: 300 + i * 100, y: 200 + j * 50 },
          `芯片${i * 3 + j + 1}`
        );
      }
    }

    for (let i = 0; i < 4; i++) {
      this.createComponent(
        data,
        'resistor' as ComponentType,
        { x: 100 + i * 80, y: 450 },
        `电阻${i + 1}`
      );
    }

    return data;
  }

  private createComplexBoard(): PCBData {
    const data: PCBData = {
      board: { ...this.boardDefaults, width: 1200, height: 900 },
      components: [],
      traces: [],
      nets: [],
      problems: []
    };

    const cpu = this.createComponent(data, 'chip', { x: 500, y: 350 }, 'CPU');
    const ram1 = this.createComponent(data, 'chip', { x: 200, y: 200 }, 'RAM1');
    const ram2 = this.createComponent(data, 'chip', { x: 200, y: 500 }, 'RAM2');
    const flash = this.createComponent(data, 'chip', { x: 800, y: 350 }, 'Flash');
    const uart = this.createComponent(data, 'connector', { x: 500, y: 100 }, 'UART');
    const power = this.createComponent(data, 'connector', { x: 100, y: 350 }, '电源');

    for (let i = 0; i < 4; i++) {
      this.createComponent(data, 'capacitor', { x: 400 + i * 60, y: 550 }, `电容${i + 1}`);
    }

    this.createNet(data, 'VCC', [
      power.pins[0],
      cpu.pins[7],
      ram1.pins[7],
      ram2.pins[7],
      flash.pins[7]
    ]);

    this.createNet(data, 'GND', [
      power.pins[3],
      cpu.pins[0],
      ram1.pins[0],
      ram2.pins[0],
      flash.pins[0]
    ]);

    this.createNet(data, 'ADDR0', [cpu.pins[1], ram1.pins[1], ram2.pins[1]]);
    this.createNet(data, 'ADDR1', [cpu.pins[2], ram1.pins[2], ram2.pins[2]]);
    this.createNet(data, 'DATA0', [cpu.pins[3], flash.pins[1]]);
    this.createNet(data, 'DATA1', [cpu.pins[4], flash.pins[2]]);
    this.createNet(data, 'UART_TX', [cpu.pins[5], uart.pins[0]]);
    this.createNet(data, 'UART_RX', [cpu.pins[6], uart.pins[1]]);

    this.connectPinsWithTrace(data, power.pins[0], cpu.pins[7], [
      power.pins[0].position,
      { x: power.pins[0].position.x, y: 370 },
      { x: cpu.pins[7].position.x, y: 370 },
      cpu.pins[7].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[7], ram1.pins[7], [
      cpu.pins[7].position,
      { x: cpu.pins[7].position.x, y: 260 },
      { x: ram1.pins[7].position.x, y: 260 },
      ram1.pins[7].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[7], ram2.pins[7], [
      cpu.pins[7].position,
      { x: cpu.pins[7].position.x, y: 560 },
      { x: ram2.pins[7].position.x, y: 560 },
      ram2.pins[7].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[0], power.pins[3], [
      cpu.pins[0].position,
      { x: cpu.pins[0].position.x, y: 390 },
      { x: power.pins[3].position.x, y: 390 },
      power.pins[3].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[1], ram1.pins[1], [
      cpu.pins[1].position,
      { x: cpu.pins[1].position.x, y: 280 },
      { x: ram1.pins[1].position.x, y: 280 },
      ram1.pins[1].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[1], ram2.pins[1], [
      cpu.pins[1].position,
      { x: cpu.pins[1].position.x, y: 540 },
      { x: ram2.pins[1].position.x, y: 540 },
      ram2.pins[1].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[3], flash.pins[1], [
      cpu.pins[3].position,
      { x: flash.pins[1].position.x, y: cpu.pins[3].position.y },
      flash.pins[1].position
    ]);

    this.connectPinsWithTrace(data, cpu.pins[5], uart.pins[0], [
      cpu.pins[5].position,
      { x: cpu.pins[5].position.x, y: 140 },
      { x: uart.pins[0].position.x, y: 140 },
      uart.pins[0].position
    ]);

    return data;
  }

  private createComponent(
    data: PCBData, 
    type: ComponentType, 
    position: Point,
    name?: string
  ): PCBComponent {
    const defaults = COMPONENT_DEFAULTS[type];
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const componentName = name || this.generateComponentName(type, data.components);
    
    const pins = this.generatePins(type, id, position, defaults);
    
    const component: PCBComponent = {
      id,
      type,
      name: componentName,
      position,
      rotation: 0,
      width: defaults.width,
      height: defaults.height,
      pins
    } as PCBComponent;
    
    data.components.push(component);
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

  private generatePins(
    type: ComponentType, 
    componentId: string, 
    position: Point, 
    defaults: { width: number; height: number; pinSpacing: number }
  ) {
    const pins = [];
    
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
          isPower: i === 0,
          isGround: i === pinsPerSide - 1
        });
        pins.push({
          id: `${componentId}-pin-${pinsPerSide + i + 1}`,
          label: `${pinsPerSide + i + 1}`,
          position: {
            x: position.x + defaults.width,
            y: position.y + (pinsPerSide - i) * defaults.pinSpacing
          },
          componentId,
          isPower: i === pinsPerSide - 1,
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
          isPower: i === 0,
          isGround: i === pinCount - 1
        });
      }
    }
    
    return pins;
  }

  private createNet(data: PCBData, name: string, pins: { id: string; netId?: string }[]): Net {
    const netId = `net-${data.nets.length + 1}`;
    
    const net: Net = {
      id: netId,
      name,
      pinIds: pins.map(p => p.id),
      traceIds: [],
      color: NET_COLORS[data.nets.length % NET_COLORS.length]
    };
    
    pins.forEach(pin => {
      pin.netId = netId;
    });
    
    data.nets.push(net);
    return net;
  }

  private connectPinsWithTrace(
    data: PCBData,
    startPin: { id: string; position: Point; netId?: string },
    endPin: { id: string; position: Point; netId?: string },
    points: Point[]
  ): Trace {
    let netId: string | undefined;
    
    if (startPin.netId) {
      netId = startPin.netId;
    } else if (endPin.netId) {
      netId = endPin.netId;
    }
    
    if (!netId) {
      netId = `net-${data.nets.length + 1}`;
      data.nets.push({
        id: netId,
        name: `Net${data.nets.length}`,
        pinIds: [startPin.id, endPin.id],
        traceIds: [],
        color: NET_COLORS[data.nets.length % NET_COLORS.length]
      });
    }
    
    const trace: Trace = {
      id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startPinId: startPin.id,
      endPinId: endPin.id,
      startPoint: { ...startPin.position },
      endPoint: { ...endPin.position },
      points: [...points],
      width: TRACE_WIDTH,
      layer: 'top',
      netId
    };
    
    const net = data.nets.find(n => n.id === netId);
    if (net) {
      if (!net.traceIds.includes(trace.id)) {
        net.traceIds.push(trace.id);
      }
      if (!net.pinIds.includes(startPin.id)) {
        net.pinIds.push(startPin.id);
      }
      if (!net.pinIds.includes(endPin.id)) {
        net.pinIds.push(endPin.id);
      }
    }
    
    data.traces.push(trace);
    return trace;
  }
}
