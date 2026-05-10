import { useEffect } from 'react'
import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'
import Header from './components/Header'
import DepthGauge from './components/DepthGauge'
import { useSimulationStore } from './store/simulationStore'
import api from './services/api'

function App() {
  const {
    setMaterials,
    setPresets
  } = useSimulationStore()

  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.getHealth()
        const [materials, presets] = await Promise.all([
          api.getMaterials(),
          api.getPresets()
        ])
        setMaterials(materials)
        setPresets(presets)
      } catch (error) {
        console.warn('后端服务不可用，使用默认数据')
      }
    }
    checkServer()
  }, [setMaterials, setPresets])

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-ocean-950 to-ocean-900">
      <div className="absolute inset-0">
        <Scene3D />
      </div>

      <Header />

      <div className="absolute top-24 right-4 z-10">
        <ControlPanel />
      </div>

      <DepthGauge />

      <PresetQuickButtons />
    </div>
  )
}

function PresetQuickButtons() {
  const {
    presets,
    activePreset,
    loadPreset,
    setActivePreset
  } = useSimulationStore()

  if (presets.length === 0) return null

  return (
    <div className="absolute top-24 left-4 z-10">
      <div className="glass-panel rounded-xl p-3">
        <div className="text-xs text-ocean-500 mb-2">快速预设</div>
        <div className="space-y-2">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                loadPreset(preset)
              }}
              className={`preset-btn w-full p-2 rounded-lg text-left flex items-center gap-2 ${
                activePreset === preset.id
                  ? 'active bg-ocean-600/40 border border-ocean-400'
                  : 'glass-panel-dark border border-ocean-800/50'
              }`}
            >
              <span className="text-xl">{preset.icon}</span>
              <div>
                <div className="text-xs font-medium text-ocean-200">{preset.name}</div>
                <div className="text-[10px] text-ocean-500">
                  {preset.target_depth >= 1000
                    ? `${(preset.target_depth / 1000).toFixed(1)} km`
                    : `${preset.target_depth} m`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
