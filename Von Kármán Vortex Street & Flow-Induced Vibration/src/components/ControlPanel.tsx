import React, { memo } from 'react';
import { SimulationParams } from '../types';
import { Play, Pause, RotateCcw, Save, Upload } from 'lucide-react';

interface ControlPanelProps {
  params: SimulationParams;
  isRunning: boolean;
  time: number;
  lift: number;
  drag: number;
  displacement: number;
  onParamsChange: (params: Partial<SimulationParams>) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSave: () => void;
  onLoad: () => void;
}

const ControlPanelComponent: React.FC<ControlPanelProps> = ({
  params,
  isRunning,
  time,
  lift,
  drag,
  displacement,
  onParamsChange,
  onStart,
  onPause,
  onReset,
  onSave,
  onLoad
}) => {
  return (
    <div className="bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-cyan-500/30">
      <h2 className="text-cyan-400 text-lg font-bold mb-4">控制面板</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">
            雷诺数 (Re): {params.reynolds}
          </label>
          <input
            type="range"
            min="10"
            max="2000"
            value={params.reynolds}
            onChange={(e) => onParamsChange({ reynolds: Number(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">
            圆柱直径 (D): {params.diameter.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.05"
            max="0.3"
            step="0.01"
            value={params.diameter}
            onChange={(e) => onParamsChange({ diameter: Number(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">
            弹簧刚度 (k): {params.stiffness.toFixed(1)}
          </label>
          <input
            type="range"
            min="1"
            max="200"
            value={params.stiffness}
            onChange={(e) => onParamsChange({ stiffness: Number(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">
            阻尼比 (ζ): {params.damping.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.001"
            value={params.damping}
            onChange={(e) => onParamsChange({ damping: Number(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">时间 (t):</div>
            <div className="text-cyan-300 font-mono">{time.toFixed(2)}</div>
            <div className="text-gray-400">升力系数 (Cl):</div>
            <div className="text-green-300 font-mono">{lift.toFixed(3)}</div>
            <div className="text-gray-400">阻力系数 (Cd):</div>
            <div className="text-orange-300 font-mono">{drag.toFixed(3)}</div>
            <div className="text-gray-400">位移 (y/D):</div>
            <div className="text-pink-300 font-mono">{(displacement / params.diameter).toFixed(3)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={isRunning ? onPause : onStart}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isRunning
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? '暂停' : '开始'}
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
          >
            <RotateCcw size={16} />
            重置
          </button>
          
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            <Save size={16} />
            保存
          </button>
          
          <button
            onClick={onLoad}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all"
          >
            <Upload size={16} />
            加载
          </button>
        </div>
      </div>
    </div>
  );
};

export const ControlPanel = memo(ControlPanelComponent);
