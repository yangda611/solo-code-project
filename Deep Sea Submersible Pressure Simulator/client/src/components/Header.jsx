import { useSimulationStore } from '../store/simulationStore'

function Header() {
  const {
    material,
    design,
    analysisResult,
    failureState
  } = useSimulationStore()

  const hasCritical = failureState.criticalZones?.some(z => z.severity === 'critical' || z.severity === 'catastrophic')

  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-4">
      <div className="flex justify-between items-start">
        <div className="glass-panel rounded-xl px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🌊</div>
            <div>
              <h1 className="text-xl font-bold text-ocean-200">
                深海潜水器耐压舱体结构设计与压力分析系统
              </h1>
              <p className="text-xs text-ocean-500">
                Deep Sea Submersible Pressure Hull Simulator
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl px-4 py-2">
          <div className="text-xs text-ocean-500 mb-1">当前状态</div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] text-ocean-500">材料</div>
              <div className="text-sm font-medium text-ocean-300">{material.name.split(' ')[0]}</div>
            </div>
            <div className="w-px h-8 bg-ocean-700" />
            <div className="text-center">
              <div className="text-[10px] text-ocean-500">壁厚</div>
              <div className="text-sm font-medium text-ocean-300">{(design.thickness * 100).toFixed(0)} mm</div>
            </div>
            <div className="w-px h-8 bg-ocean-700" />
            <div className="text-center">
              <div className="text-[10px] text-ocean-500">观察窗</div>
              <div className="text-sm font-medium text-ocean-300">{design.windowCount} 个</div>
            </div>
            {analysisResult && (
              <>
                <div className="w-px h-8 bg-ocean-700" />
                <div className="text-center">
                  <div className="text-[10px] text-ocean-500">SCF</div>
                  <div className={`text-sm font-medium ${
                    analysisResult.stressConcentrationFactor > 4 ? 'text-red-400' : 'text-ocean-300'
                  }`}>
                    {analysisResult.stressConcentrationFactor.toFixed(2)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {hasCritical && (
        <div className="mt-2 animate-pulse">
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <span className="text-red-300 text-sm">检测到关键失效风险 - 请检查设计参数</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Header
