import { Component, Output, EventEmitter, Input } from '@angular/core';

type ToolMode = 'select' | 'place-chip' | 'place-resistor' | 'place-capacitor' | 'place-connector' | 'route';

interface Tool {
  id: ToolMode;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  @Input() selectedTool: ToolMode = 'select';
  @Output() toolChange = new EventEmitter<ToolMode>();
  @Output() analyzeClick = new EventEmitter<void>();
  @Output() clearClick = new EventEmitter<void>();

  tools: Tool[] = [
    { id: 'select', name: '选择', icon: '✋', description: '选择和移动元件' },
    { id: 'place-chip', name: '芯片', icon: '💎', description: '放置芯片元件' },
    { id: 'place-resistor', name: '电阻', icon: '⚡', description: '放置电阻元件' },
    { id: 'place-capacitor', name: '电容', icon: '💧', description: '放置电容元件' },
    { id: 'place-connector', name: '接口', icon: '🔌', description: '放置接口元件' },
    { id: 'route', name: '走线', icon: '〰️', description: '绘制电路走线' }
  ];

  selectTool(toolId: ToolMode): void {
    this.selectedTool = toolId;
    this.toolChange.emit(toolId);
  }

  onAnalyze(): void {
    this.analyzeClick.emit();
  }

  onClear(): void {
    if (confirm('确定要清空所有元件和走线吗？')) {
      this.clearClick.emit();
    }
  }

  getToolClass(tool: Tool): string {
    const classes = ['tool-button'];
    if (tool.id === this.selectedTool) {
      classes.push('selected');
    }
    return classes.join(' ');
  }

  trackByToolId(index: number, tool: Tool): string {
    return tool.id;
  }
}
