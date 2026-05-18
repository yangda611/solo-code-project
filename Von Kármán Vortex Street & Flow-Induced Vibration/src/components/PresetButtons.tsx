import React, { memo, useMemo } from 'react';
import { PRESETS } from '../config/presets';
import { SimulationParams } from '../types';

interface PresetButtonsProps {
  onLoadPreset: (preset: Partial<SimulationParams>) => void;
}

const PresetButtonsComponent: React.FC<PresetButtonsProps> = ({ onLoadPreset }) => {
  const presets = useMemo(() => [
    {
      key: 'stable',
      name: '低雷诺数稳定',
      description: '对称流动，无涡脱',
      color: 'from-blue-600 to-cyan-500'
    },
    {
      key: 'critical',
      name: '临界涡脱落',
      description: '规则卡门涡街',
      color: 'from-green-600 to-emerald-500'
    },
    {
      key: 'lockin',
      name: '锁定共振',
      description: '频率俘获，大幅振动',
      color: 'from-orange-600 to-amber-500'
    },
    {
      key: 'galloping',
      name: '驰振失稳',
      description: '负阻尼，振幅持续增大',
      color: 'from-red-600 to-rose-500'
    }
  ], []);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-cyan-500/30">
      <h2 className="text-cyan-400 text-lg font-bold mb-3">预设场景</h2>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onLoadPreset(PRESETS[preset.key as keyof typeof PRESETS])}
            className={`relative p-3 rounded-lg bg-gradient-to-r ${preset.color} hover:opacity-90 transition-all transform hover:scale-105 text-left overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
            <div className="relative z-10">
              <div className="text-white font-semibold text-sm">{preset.name}</div>
              <div className="text-white/70 text-xs mt-1">{preset.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const PresetButtons = memo(PresetButtonsComponent);
