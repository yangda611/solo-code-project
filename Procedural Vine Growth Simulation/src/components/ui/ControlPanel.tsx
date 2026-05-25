
import { useStore } from '../../store/useStore'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

function Slider({ label, value, min, max, step = 0.01, onChange }: SliderProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-green-300 font-mono">{label}</span>
        <span className="text-green-400 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
    </div>
  )
}

export function ControlPanel() {
  const { params, setParams, lightSource, setLightSource, isPaused, togglePause, reset } = useStore()

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20 w-72">
      <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 border border-green-500/30 shadow-2xl">
        <h2 className="text-green-400 font-bold text-lg mb-4 font-mono border-b border-green-500/30 pb-2">
          🌿 生长参数控制
        </h2>

        <div className="mb-4">
          <h3 className="text-green-300 text-sm font-mono mb-2">基础参数</h3>
          <Slider
            label="最大递归深度"
            value={params.maxDepth}
            min={3}
            max={40}
            step={1}
            onChange={(v) => setParams({ maxDepth: v })}
          />
          <Slider
            label="分支角度 (弧度)"
            value={params.branchAngle}
            min={0.1}
            max={Math.PI / 2}
            step={0.05}
            onChange={(v) => setParams({ branchAngle: v })}
          />
          <Slider
            label="生长速度"
            value={params.growthSpeed}
            min={0.1}
            max={5}
            step={0.1}
            onChange={(v) => setParams({ growthSpeed: v })}
          />
          <Slider
            label="分支概率"
            value={params.branchProbability}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setParams({ branchProbability: v })}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-green-300 text-sm font-mono mb-2">营养系统</h3>
          <Slider
            label="总营养值"
            value={params.nutritionTotal}
            min={20}
            max={1000}
            step={10}
            onChange={(v) => setParams({ nutritionTotal: v })}
          />
          <Slider
            label="每段消耗"
            value={params.nutritionCostPerSegment}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => setParams({ nutritionCostPerSegment: v })}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-green-300 text-sm font-mono mb-2">行为权重</h3>
          <Slider
            label="向光性权重"
            value={params.phototropismWeight}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setParams({ phototropismWeight: v })}
          />
          <Slider
            label="避障权重"
            value={params.obstacleAvoidanceWeight}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setParams({ obstacleAvoidanceWeight: v })}
          />
          <Slider
            label="随机性权重"
            value={params.randomnessWeight}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setParams({ randomnessWeight: v })}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-green-300 text-sm font-mono mb-2">光照方向</h3>
          <Slider
            label="X 方向"
            value={lightSource.direction.x}
            min={-1}
            max={1}
            step={0.1}
            onChange={(v) => {
              const newDir = lightSource.direction.clone()
              newDir.x = v
              newDir.normalize()
              setLightSource({ direction: newDir })
            }}
          />
          <Slider
            label="Y 方向"
            value={lightSource.direction.y}
            min={-1}
            max={1}
            step={0.1}
            onChange={(v) => {
              const newDir = lightSource.direction.clone()
              newDir.y = v
              newDir.normalize()
              setLightSource({ direction: newDir })
            }}
          />
          <Slider
            label="Z 方向"
            value={lightSource.direction.z}
            min={-1}
            max={1}
            step={0.1}
            onChange={(v) => {
              const newDir = lightSource.direction.clone()
              newDir.z = v
              newDir.normalize()
              setLightSource({ direction: newDir })
            }}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={togglePause}
            className={`flex-1 py-2 px-4 rounded-lg font-mono text-sm transition-all ${
              isPaused
                ? 'bg-green-500 text-black hover:bg-green-400'
                : 'bg-yellow-500 text-black hover:bg-yellow-400'
            }`}
          >
            {isPaused ? '▶ 继续' : '⏸ 暂停'}
          </button>
          <button
            onClick={reset}
            className="flex-1 py-2 px-4 rounded-lg font-mono text-sm bg-red-500 text-black hover:bg-red-400 transition-all"
          >
            🔄 重置
          </button>
        </div>
      </div>
    </div>
  )
}
