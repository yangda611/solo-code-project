
import { useStore } from '../../store/useStore'
import { presets } from '../../presets'

export function StatusBar() {
  const { stats, currentPreset } = useStore()
  const preset = presets[currentPreset]

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getNutritionColor = (remaining: number, total: number) => {
    const ratio = remaining / total
    if (ratio > 0.5) return 'text-green-400'
    if (ratio > 0.2) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
      <div className="bg-black/70 backdrop-blur-md rounded-xl px-6 py-3 border border-green-500/30">
        <div className="flex items-center gap-8 font-mono text-sm">
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">当前预设</div>
            <div className="text-green-400 font-bold">{preset.name}</div>
          </div>
          
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">帧率 FPS</div>
            <div className={`font-bold ${getFpsColor(stats.fps)}`}>
              {stats.fps}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">节点总数</div>
            <div className="text-cyan-400 font-bold">{stats.totalNodes}</div>
          </div>
          
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">活跃分支</div>
            <div className="text-blue-400 font-bold">{stats.activeBranches}</div>
          </div>
          
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">最大深度</div>
            <div className="text-purple-400 font-bold">{stats.maxDepthReached}</div>
          </div>
          
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">碰撞次数</div>
            <div className="text-orange-400 font-bold">{stats.collisionCount}</div>
          </div>
          
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">剩余营养</div>
            <div className={`font-bold ${getNutritionColor(stats.nutritionRemaining, 200)}`}>
              {stats.nutritionRemaining.toFixed(1)}
            </div>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-green-500/20">
          <p className="text-white/50 text-xs text-center">
            {preset.description}
          </p>
        </div>
      </div>
    </div>
  )
}
