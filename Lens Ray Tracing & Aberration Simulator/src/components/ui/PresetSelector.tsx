import { PRESETS } from '@/config/presets';
import { useOpticsStore } from '@/store/useOpticsStore';
import { Layers, Eye, Droplets, Zap } from 'lucide-react';

const presetIcons = {
  'preset-1': Layers,
  'preset-2': Droplets,
  'preset-3': Eye,
  'preset-4': Zap
};

export const PresetSelector = () => {
  const { currentPresetId, loadPreset, setCurrentPresetId, calculateRays } = useOpticsStore();

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      loadPreset(preset);
      setCurrentPresetId(presetId);
      setTimeout(() => calculateRays(), 50);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
      <h3 className="text-cyan-400 font-bold mb-3 text-sm uppercase tracking-wider">
        预设场景
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const Icon = presetIcons[preset.id as keyof typeof presetIcons] || Layers;
          const isActive = currentPresetId === preset.id;
          
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`
                p-3 rounded-lg text-left transition-all duration-300
                ${isActive 
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20' 
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }
                border
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {preset.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
