import { Component, Output, EventEmitter } from '@angular/core';
import { PresetService } from '../../services/preset.service';

type PresetType = 'normal' | 'short' | 'dense' | 'complex';

interface PresetInfo {
  type: PresetType;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-preset-selector',
  templateUrl: './preset-selector.component.html',
  styleUrls: ['./preset-selector.component.scss']
})
export class PresetSelectorComponent {
  @Output() presetSelected = new EventEmitter<PresetType>();

  presets: PresetInfo[] = [
    { type: 'normal', name: '正常单层板', description: '一个完整的示例电路，包含芯片、电阻、电容和接口，无错误', icon: '✓' },
    { type: 'short', name: '走线短路板', description: '演示短路问题的示例电路，两条不同网络的走线重叠', icon: '⚡' },
    { type: 'dense', name: '元件过密板', description: '演示元件过密问题的示例电路，元件间距过小', icon: '📦' },
    { type: 'complex', name: '多引脚复杂板', description: '多芯片复杂连接的示例电路，包含CPU、RAM、Flash等', icon: '🧩' }
  ];

  constructor(private presetService: PresetService) {}

  selectPreset(presetType: PresetType): void {
    this.presetSelected.emit(presetType);
  }

  trackByPresetType(index: number, preset: PresetInfo): string {
    return preset.type;
  }
}
