
import { useStore } from '../../store/useStore'
import { presets } from '../../presets'
import type { PresetId } from '../../types/vine'

export function PresetBar() {
  const { currentPreset, setPreset } = useStore()

  const presetIds = Object.keys(presets) as PresetId[]

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-xl p-2 border border-green-500/30">
        {presetIds.map((presetId) => (
          <button
            key={presetId}
            onClick={() => setPreset(presetId)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all duration-300 ${
              currentPreset === presetId
                ? 'bg-green-500 text-black shadow-lg shadow-green-500/50 scale-105'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            {presets[presetId].name}
          </button>
        ))}
      </div>
    </div>
  )
}
