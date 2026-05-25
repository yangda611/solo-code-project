import { useOpticsStore } from '@/store/useOpticsStore';
import { Trash2, Plus, Play, Pause } from 'lucide-react';

export const LensControlPanel = () => {
  const { 
    lenses, 
    updateLens, 
    addLens, 
    removeLens, 
    calculateRays,
    isPlaying,
    setIsPlaying,
    rayCount,
    setRayCount
  } = useOpticsStore();

  const handleParameterChange = (lensId: string, param: string, value: number) => {
    updateLens(lensId, { [param]: value });
    setTimeout(() => calculateRays(), 50);
  };

  const handleAddLens = () => {
    const lastLens = lenses[lenses.length - 1];
    const newPosition = lastLens ? lastLens.position + lastLens.thickness + 2 : 2;
    
    addLens({
      id: `lens-${Date.now()}`,
      position: newPosition,
      radius1: 3,
      radius2: -3,
      thickness: 0.8,
      refractiveIndex: 1.5,
      aperture: 1.2
    });
    setTimeout(() => calculateRays(), 50);
  };

  const handleRemoveLens = (id: string) => {
    removeLens(id);
    setTimeout(() => calculateRays(), 50);
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">
          透镜参数
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`
              p-2 rounded-lg transition-all
              ${isPlaying 
                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                : 'bg-slate-700 text-slate-400 border-slate-600'
              }
              border
            `}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleAddLens}
            className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 
                       hover:bg-cyan-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
        <label className="block text-xs text-slate-400 mb-2">
          光线数量: {rayCount}
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={rayCount}
          onChange={(e) => {
            setRayCount(parseInt(e.target.value));
            setTimeout(() => calculateRays(), 50);
          }}
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer
                     accent-cyan-400"
        />
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {lenses.map((lens, index) => (
          <div 
            key={lens.id} 
            className="p-3 bg-slate-700/30 rounded-lg border border-slate-600"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300 font-medium">
                透镜 #{index + 1}
              </span>
              {lenses.length > 1 && (
                <button
                  onClick={() => handleRemoveLens(lens.id)}
                  className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <ParameterSlider
                label="前曲率半径"
                value={lens.radius1}
                min="-10"
                max="10"
                step="0.1"
                onChange={(v) => handleParameterChange(lens.id, 'radius1', v)}
              />
              <ParameterSlider
                label="后曲率半径"
                value={lens.radius2}
                min="-10"
                max="10"
                step="0.1"
                onChange={(v) => handleParameterChange(lens.id, 'radius2', v)}
              />
              <ParameterSlider
                label="厚度"
                value={lens.thickness}
                min="0.1"
                max="3"
                step="0.1"
                onChange={(v) => handleParameterChange(lens.id, 'thickness', v)}
              />
              <ParameterSlider
                label="折射率"
                value={lens.refractiveIndex}
                min="1.3"
                max="2.0"
                step="0.01"
                onChange={(v) => handleParameterChange(lens.id, 'refractiveIndex', v)}
              />
              <ParameterSlider
                label="孔径"
                value={lens.aperture}
                min="0.5"
                max="3"
                step="0.1"
                onChange={(v) => handleParameterChange(lens.id, 'aperture', v)}
              />
              <ParameterSlider
                label="位置"
                value={lens.position}
                min="0"
                max="15"
                step="0.5"
                onChange={(v) => handleParameterChange(lens.id, 'position', v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ParameterSliderProps {
  label: string;
  value: number;
  min: string;
  max: string;
  step: string;
  onChange: (value: number) => void;
}

const ParameterSlider = ({ label, value, min, max, step, onChange }: ParameterSliderProps) => {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-cyan-400 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer
                   accent-cyan-400"
      />
    </div>
  );
};
