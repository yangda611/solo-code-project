import { useMemo } from 'react'
import { useSimulationStore } from '../store/simulationStore'

function DepthGauge() {
  const { depth, targetDepth, analysisResult, isAnalyzing, failureState } = useSimulationStore()

  const maxDepth = 11000

  const normalizedDepth = Math.min(depth / maxDepth, 1)
  const normalizedTarget = Math.min(targetDepth / maxDepth, 1)

  const hasCritical = failureState.criticalZones?.some(z => z.severity === 'critical' || z.severity === 'catastrophic')

  const pressureText = analysisResult
    ? `压力: ${(analysisResult.externalPressure / 1e6).toFixed(2)} MPa`
    : '正在计算...'

  const safetyText = analysisResult
    ? `安全系数: ${analysisResult.safetyFactor.toFixed(2)}`
    : '—'

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className={`glass-panel rounded-2xl p-4 transition-all ${
        hasCritical ? 'border-red-500/50 bg-red-900/20' : ''
      }`}>
        <div className="flex items-end gap-6">
          <div className="text-center">
            <div className="text-xs text-ocean-500 mb-1">当前深度</div>
            <div className={`text-3xl font-mono font-bold ${
              depth >= 6000 ? 'text-red-400' :
              depth >= 2000 ? 'text-orange-400' :
              depth >= 500 ? 'text-yellow-400' : 'text-green-400'
            } ${hasCritical ? 'critical-pulse' : ''}`}>
              {depth >= 1000
                ? `${(depth / 1000).toFixed(2)} km`
                : `${depth.toFixed(0)} m`
              }
            </div>
            <div className="text-xs text-ocean-500 mt-1">{pressureText}</div>
          </div>

          <div className="relative w-48 h-4">
            <div className="absolute inset-0 bg-ocean-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500 transition-all duration-300"
                style={{ width: `${normalizedTarget * 100}%` }}
              />
            </div>

            <div
              className="absolute top-0 h-full w-1 bg-white rounded-full transition-all duration-300 shadow-lg"
              style={{ left: `calc(${normalizedDepth * 100}% - 2px)` }}
            />

            <div className="flex justify-between text-[10px] text-ocean-500 mt-1">
              <span>0</span>
              <span>2km</span>
              <span>6km</span>
              <span>11km</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-ocean-500 mb-1">安全状态</div>
            <div className={`text-lg font-mono font-bold ${
              !analysisResult ? 'text-ocean-500' :
              analysisResult.safetyFactor >= 3.0 ? 'text-green-400' :
              analysisResult.safetyFactor >= 2.0 ? 'text-yellow-400' :
              analysisResult.safetyFactor >= 1.5 ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {safetyText}
            </div>
            {isAnalyzing && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-2 h-2 bg-ocean-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-ocean-500">分析中</span>
              </div>
            )}
          </div>
        </div>

        <DepthIndicator depth={depth} maxDepth={maxDepth} />
      </div>
    </div>
  )
}

function DepthIndicator({ depth, maxDepth }) {
  const segments = useMemo(() => {
    const count = 20
    const segments = []
    const depthRatio = depth / maxDepth

    for (let i = 0; i < count; i++) {
      const ratio = i / count
      const isActive = ratio <= depthRatio

      let color
      if (ratio > 0.9) color = 'bg-red-500'
      else if (ratio > 0.7) color = 'bg-orange-500'
      else if (ratio > 0.5) color = 'bg-yellow-500'
      else if (ratio > 0.3) color = 'bg-lime-500'
      else color = 'bg-green-500'

      segments.push({ index: i, isActive, color })
    }
    return segments
  }, [depth, maxDepth])

  return (
    <div className="flex gap-1 mt-4 justify-center">
      {segments.map(seg => (
        <div
          key={seg.index}
          className={`w-2 h-4 rounded transition-all duration-300 ${
            seg.isActive ? seg.color : 'bg-ocean-800/50'
          }`}
          style={{
            opacity: seg.isActive ? 0.6 + (seg.index / segments.length) * 0.4 : 0.3
          }}
        />
      ))}
    </div>
  )
}

export default DepthGauge
