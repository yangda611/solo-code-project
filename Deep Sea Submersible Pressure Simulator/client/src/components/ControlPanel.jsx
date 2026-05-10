import { useState, useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { formatPressure, formatStress, formatDepth, getSafetyFactorColor, getSeverityColor } from '../utils/stressColor'
import api from '../services/api'

function ControlPanel() {
  const [activeTab, setActiveTab] = useState('design')

  const {
    depth,
    targetDepth,
    temperature,
    design,
    material,
    materials,
    presets,
    activePreset,
    analysisResult,
    showStressHeatmap,
    showDeformation,
    showWireframe,
    showRibs,
    showWindows,
    deformationScale,
    bubbleIntensity,
    isAnalyzing,
    failureState,
    setTargetDepth,
    setTemperature,
    updateDesign,
    setMaterial,
    loadPreset,
    setActivePreset,
    toggleStressHeatmap,
    toggleDeformation,
    toggleWireframe,
    toggleRibs,
    toggleWindows,
    setDeformationScale,
    setBubbleIntensity,
    setMaterials,
    setPresets
  } = useSimulationStore()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matData, presetData] = await Promise.all([
          api.getMaterials(),
          api.getPresets()
        ])
        setMaterials(matData)
        setPresets(presetData)
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    }
    loadData()
  }, [setMaterials, setPresets])

  const tabs = [
    { id: 'design', label: '结构设计', icon: '🔧' },
    { id: 'material', label: '材料选择', icon: '⚙️' },
    { id: 'depth', label: '深度控制', icon: '🌊' },
    { id: 'analysis', label: '分析结果', icon: '📊' },
    { id: 'display', label: '显示选项', icon: '👁️' }
  ]

  return (
    <div className="glass-panel rounded-2xl p-4 w-96 max-h-[95vh] overflow-y-auto">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-ocean-700">
        <div className="text-2xl">🌊</div>
        <div>
          <h2 className="text-lg font-bold text-ocean-300">耐压舱体分析</h2>
          <p className="text-xs text-ocean-500">深海结构压力模拟系统</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-ocean-600 text-white shadow-lg'
                : 'bg-ocean-900/50 text-ocean-400 hover:bg-ocean-800/50'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'design' && <DesignPanel design={design} updateDesign={updateDesign} isAnalyzing={isAnalyzing} />}
      {activeTab === 'material' && <MaterialPanel material={material} materials={materials} setMaterial={setMaterial} />}
      {activeTab === 'depth' && <DepthPanel depth={depth} targetDepth={targetDepth} temperature={temperature} setTargetDepth={setTargetDepth} setTemperature={setTemperature} presets={presets} activePreset={activePreset} loadPreset={loadPreset} setActivePreset={setActivePreset} />}
      {activeTab === 'analysis' && <AnalysisPanel result={analysisResult} failureState={failureState} isAnalyzing={isAnalyzing} />}
      {activeTab === 'display' && <DisplayPanel showStressHeatmap={showStressHeatmap} showDeformation={showDeformation} showWireframe={showWireframe} showRibs={showRibs} showWindows={showWindows} deformationScale={deformationScale} bubbleIntensity={bubbleIntensity} toggleStressHeatmap={toggleStressHeatmap} toggleDeformation={toggleDeformation} toggleWireframe={toggleWireframe} toggleRibs={toggleRibs} toggleWindows={toggleWindows} setDeformationScale={setDeformationScale} setBubbleIntensity={setBubbleIntensity} />}
    </div>
  )
}

function SliderControl({ label, value, min, max, step, onChange, unit = '', format }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-ocean-300">{label}</span>
        <span className="text-sm font-mono text-ocean-400">
          {format ? format(value) : value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function DesignPanel({ design, updateDesign, isAnalyzing }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-ocean-400 mb-3 flex items-center gap-2">
        <span>📐</span> 舱体几何参数
        {isAnalyzing && <span className="animate-pulse text-yellow-400 text-xs">分析中...</span>}
      </div>

      <SliderControl
        label="外径 (R)"
        value={design.outerRadius}
        min={0.5}
        max={2.0}
        step={0.01}
        unit=" m"
        onChange={(v) => updateDesign({ outerRadius: v, innerRadius: Math.max(v - 0.5, 0.3) })}
      />

      <SliderControl
        label="内径 (r)"
        value={design.innerRadius}
        min={0.3}
        max={design.outerRadius - 0.01}
        step={0.01}
        unit=" m"
        onChange={(v) => updateDesign({ innerRadius: v })}
      />

      <SliderControl
        label="壁厚 (t)"
        value={design.thickness}
        min={0.02}
        max={0.5}
        step={0.01}
        unit=" m"
        onChange={(v) => updateDesign({
          thickness: v,
          innerRadius: design.outerRadius - v
        })}
      />

      <SliderControl
        label="舱体长度 (L)"
        value={design.length}
        min={2.0}
        max={8.0}
        step={0.1}
        unit=" m"
        onChange={(v) => updateDesign({ length: v })}
      />

      <div className="text-sm font-semibold text-ocean-400 mt-6 mb-3 flex items-center gap-2">
        <span>🪟</span> 观察窗参数
      </div>

      <SliderControl
        label="观察窗数量"
        value={design.windowCount}
        min={0}
        max={8}
        step={1}
        onChange={(v) => updateDesign({ windowCount: Math.round(v) })}
      />

      <SliderControl
        label="观察窗直径"
        value={design.windowDiameter}
        min={0.1}
        max={0.6}
        step={0.01}
        unit=" m"
        onChange={(v) => updateDesign({ windowDiameter: v })}
      />

      <div className="text-sm font-semibold text-ocean-400 mt-6 mb-3 flex items-center gap-2">
        <span>🛡️</span> 加强筋参数
      </div>

      <SliderControl
        label="加强筋数量"
        value={design.ribCount}
        min={0}
        max={20}
        step={1}
        onChange={(v) => updateDesign({ ribCount: Math.round(v) })}
      />

      <SliderControl
        label="加强筋高度"
        value={design.ribHeight}
        min={0}
        max={0.2}
        step={0.005}
        unit=" m"
        onChange={(v) => updateDesign({ ribHeight: v })}
      />

      <div className="text-sm font-semibold text-ocean-400 mt-6 mb-3 flex items-center gap-2">
        <span>🔧</span> 端盖类型 / 焊接质量
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {['hemispherical', 'spherical', 'ellipsoidal', 'flat'].map(type => (
          <button
            key={type}
            onClick={() => updateDesign({ endCapType: type })}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
              design.endCapType === type
                ? 'bg-ocean-600 text-white'
                : 'bg-ocean-900/50 text-ocean-400 hover:bg-ocean-800/50'
            }`}
          >
            {type === 'hemispherical' && '半球形'}
            {type === 'spherical' && '球形'}
            {type === 'ellipsoidal' && '椭圆形'}
            {type === 'flat' && '平板'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'class_aa', label: 'AA级(最高)' },
          { id: 'class_a', label: 'A级(标准)' },
          { id: 'class_b', label: 'B级' },
          { id: 'class_c', label: 'C级' }
        ].map(weld => (
          <button
            key={weld.id}
            onClick={() => updateDesign({ weldQuality: weld.id })}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
              design.weldQuality === weld.id
                ? 'bg-ocean-600 text-white'
                : 'bg-ocean-900/50 text-ocean-400 hover:bg-ocean-800/50'
            }`}
          >
            {weld.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MaterialPanel({ material, materials, setMaterial }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-ocean-400 mb-2 flex items-center gap-2">
        <span>⚙️</span> 材料力学参数库
      </div>

      {materials.map(mat => (
        <button
          key={mat.id}
          onClick={() => setMaterial(mat)}
          className={`w-full text-left p-3 rounded-lg transition-all ${
            material.id === mat.id
              ? 'bg-ocean-600/40 border border-ocean-400'
              : 'bg-ocean-900/30 border border-ocean-800/50 hover:bg-ocean-800/30'
          }`}
        >
          <div className="font-medium text-ocean-200 text-sm mb-1">{mat.name}</div>
          <div className="text-xs text-ocean-400 mb-2">{mat.description}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-ocean-500">屈服强度:</span>
              <span className="text-ocean-300 ml-1">{formatStress(mat.yield_strength)}</span>
            </div>
            <div>
              <span className="text-ocean-500">弹性模量:</span>
              <span className="text-ocean-300 ml-1">{(mat.youngs_modulus / 1e9).toFixed(1)} GPa</span>
            </div>
            <div>
              <span className="text-ocean-500">密度:</span>
              <span className="text-ocean-300 ml-1">{mat.density} kg/m³</span>
            </div>
            <div>
              <span className="text-ocean-500">韧脆转变:</span>
              <span className="text-ocean-300 ml-1">{(mat.ductile_brittle_transition - 273.15).toFixed(0)}°C</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function DepthPanel({ depth, targetDepth, temperature, setTargetDepth, setTemperature, presets, activePreset, loadPreset, setActivePreset }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-ocean-400 mb-2 flex items-center gap-2">
        <span>🏗️</span> 预设任务场景
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => {
              loadPreset(preset)
            }}
            className={`preset-btn p-3 rounded-lg text-left ${
              activePreset === preset.id
                ? 'active bg-ocean-600/40 border border-ocean-400'
                : 'glass-panel-dark border border-ocean-800/50'
            }`}
          >
            <div className="text-xl mb-1">{preset.icon}</div>
            <div className="font-medium text-ocean-200 text-xs mb-1">{preset.name}</div>
            <div className="text-xs text-ocean-500">{preset.description}</div>
            <div className="mt-2 text-xs font-mono text-ocean-400">
              目标深度: {formatDepth(preset.target_depth)}
            </div>
          </button>
        ))}
      </div>

      <div className="text-sm font-semibold text-ocean-400 mb-2 flex items-center gap-2">
        <span>🌊</span> 深度与温度控制
      </div>

      <SliderControl
        label="当前下潜深度"
        value={targetDepth}
        min={0}
        max={11000}
        step={10}
        unit=" m"
        format={(v) => v >= 1000 ? `${(v/1000).toFixed(1)} km` : `${v} m`}
        onChange={setTargetDepth}
      />

      <div className="glass-panel-dark p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-ocean-300">实时深度</span>
          <span className={`text-lg font-mono font-bold ${
            depth >= 6000 ? 'text-red-400' : depth >= 2000 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {formatDepth(depth)}
          </span>
        </div>
        <div className="w-full h-2 bg-ocean-900 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 depth-indicator"
            style={{ width: `${(depth / 11000) * 100}%` }}
          />
        </div>
      </div>

      <SliderControl
        label="海水温度"
        value={temperature}
        min={263}
        max={303}
        step={1}
        format={(v) => `${(v - 273.15).toFixed(0)}°C`}
        onChange={setTemperature}
      />

      <div className="glass-panel-dark p-3 rounded-lg mt-4">
        <div className="text-xs text-ocean-500 mb-2">深度参考</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-ocean-400">🏖️ 浅海（0-200m）</span>
            <span className="text-green-400">低压</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-400">🌊 大陆坡（200-2000m）</span>
            <span className="text-yellow-400">中压</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-400">🌑 深海平原（2000-6000m）</span>
            <span className="text-orange-400">高压</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-400">🏆 海沟（6000-11000m）</span>
            <span className="text-red-400">超高压</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalysisPanel({ result, failureState, isAnalyzing }) {
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-ocean-600 border-t-ocean-400 rounded-full animate-spin mb-4" />
        <div className="text-ocean-400">正在进行结构应力分析...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <div className="text-ocean-400 mb-2">调整参数开始分析</div>
        <div className="text-xs text-ocean-600">修改设计参数或深度以获取实时应力分析结果</div>
      </div>
    )
  }

  const hasCriticalFailure = failureState.criticalZones?.some(z => z.severity === 'critical' || z.severity === 'catastrophic')

  return (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg ${hasCriticalFailure ? 'bg-red-900/30 border border-red-500/50' : 'bg-ocean-900/30 border border-ocean-700/50'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-ocean-300">安全系数 (SF)</span>
          <span
            className="text-xl font-mono font-bold"
            style={{ color: getSafetyFactorColor(result.safetyFactor) }}
          >
            {result.safetyFactor.toFixed(3)}
          </span>
        </div>
        <div className="w-full h-2 bg-ocean-900 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(100, (result.safetyFactor / 5) * 100)}%`,
              backgroundColor: getSafetyFactorColor(result.safetyFactor)
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-ocean-500 mt-1">
          <span>危险</span>
          <span>安全</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="环向应力"
          value={formatStress(result.maxHoopStress)}
          critical={result.maxHoopStress > result.yieldStrength * 0.8}
        />
        <StatCard
          label="轴向应力"
          value={formatStress(result.maxLongitudinalStress)}
          critical={false}
        />
        <StatCard
          label="径向应力"
          value={formatStress(Math.abs(result.maxRadialStress))}
          critical={false}
        />
        <StatCard
          label="冯·米塞斯应力"
          value={formatStress(result.maxVonMisesStress)}
          critical={result.maxVonMisesStress > result.yieldStrength}
        />
      </div>

      <div className="glass-panel-dark p-3 rounded-lg">
        <div className="text-sm font-semibold text-ocean-400 mb-3">压力与变形</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-ocean-500">外部压力</span>
            <span className="text-ocean-300 font-mono">{formatPressure(result.externalPressure)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-500">径向变形</span>
            <span className="text-ocean-300 font-mono">{(result.deformation.radial * 1000).toFixed(2)} mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-500">轴向变形</span>
            <span className="text-ocean-300 font-mono">{(result.deformation.longitudinal * 1000).toFixed(2)} mm</span>
          </div>
        </div>
      </div>

      <div className="glass-panel-dark p-3 rounded-lg">
        <div className="text-sm font-semibold text-ocean-400 mb-3">临界值与极限</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-ocean-500">临界屈曲压力</span>
            <span className="text-ocean-300 font-mono">{formatPressure(result.bucklingPressure)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-500">爆破压力</span>
            <span className="text-ocean-300 font-mono">{formatPressure(result.burstPressure)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-500">材料屈服强度</span>
            <span className="text-ocean-300 font-mono">{formatStress(result.yieldStrength)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ocean-500">应力集中系数 (SCF)</span>
            <span className={`font-mono ${result.stressConcentrationFactor > 4 ? 'text-red-400' : 'text-ocean-300'}`}>
              {result.stressConcentrationFactor.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {result.isBrittleTransition && (
        <div className="bg-orange-900/30 border border-orange-500/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400">⚠️</span>
            <span className="text-sm font-medium text-orange-300">低温脆性转变</span>
          </div>
          <div className="text-xs text-orange-400">
            当前温度低于韧脆转变温度，材料屈服强度下降至 {(result.temperatureFactor * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {failureState.criticalZones?.length > 0 && (
        <div className={`p-3 rounded-lg ${hasCriticalFailure ? 'bg-red-900/30 border border-red-500/50' : 'bg-yellow-900/30 border border-yellow-500/50'}`}>
          <div className="text-sm font-semibold text-ocean-400 mb-2">⚠️ 失效风险分析</div>
          <div className="space-y-2">
            {failureState.criticalZones.map((zone, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getSeverityColor(zone.severity) }}
                  />
                  <span className="font-medium" style={{ color: getSeverityColor(zone.severity) }}>
                    {zone.type}: {zone.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel-dark p-3 rounded-lg">
        <div className="text-sm font-semibold text-ocean-400 mb-2">疲劳寿命预估</div>
        <div className="text-xs text-ocean-300">
          预计循环次数: {result.fatigueLife === Infinity ? '∞ (疲劳极限以下)' : result.fatigueLife.toExponential(2)} 次
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-ocean-500 mb-2">应力色标</div>
        <div className="h-4 stress-gradient rounded-full" />
        <div className="flex justify-between text-xs text-ocean-500 mt-1">
          <span>低应力</span>
          <span>中应力</span>
          <span>高应力</span>
          <span>临界</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, critical }) {
  return (
    <div className={`glass-panel-dark p-2 rounded-lg ${critical ? 'border border-red-500/50' : ''}`}>
      <div className="text-xs text-ocean-500 mb-1">{label}</div>
      <div className={`text-sm font-mono font-bold ${critical ? 'text-red-400' : 'text-ocean-300'}`}>
        {value}
      </div>
    </div>
  )
}

function DisplayPanel({
  showStressHeatmap,
  showDeformation,
  showWireframe,
  showRibs,
  showWindows,
  deformationScale,
  bubbleIntensity,
  toggleStressHeatmap,
  toggleDeformation,
  toggleWireframe,
  toggleRibs,
  toggleWindows,
  setDeformationScale,
  setBubbleIntensity
}) {
  const Toggle = ({ label, value, onChange }) => (
    <div className="flex justify-between items-center mb-3">
      <span className="text-sm text-ocean-300">{label}</span>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-all ${
          value ? 'bg-ocean-500' : 'bg-ocean-800'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition-all shadow ${
            value ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-ocean-400 mb-2 flex items-center gap-2">
        <span>🎨</span> 可视化选项
      </div>

      <Toggle label="应力热力图" value={showStressHeatmap} onChange={toggleStressHeatmap} />
      <Toggle label="结构形变显示" value={showDeformation} onChange={toggleDeformation} />
      <Toggle label="网格线框" value={showWireframe} onChange={toggleWireframe} />
      <Toggle label="加强筋" value={showRibs} onChange={toggleRibs} />
      <Toggle label="观察窗" value={showWindows} onChange={toggleWindows} />

      {showDeformation && (
        <SliderControl
          label="形变放大倍数"
          value={deformationScale}
          min={1}
          max={100}
          step={1}
          unit="x"
          onChange={setDeformationScale}
        />
      )}

      <div className="text-sm font-semibold text-ocean-400 mt-4 mb-2 flex items-center gap-2">
        <span>💨</span> 环境效果
      </div>

      <SliderControl
        label="气泡粒子密度"
        value={bubbleIntensity}
        min={0}
        max={1}
        step={0.05}
        format={(v) => `${(v * 100).toFixed(0)}%`}
        onChange={setBubbleIntensity}
      />

      <div className="glass-panel-dark p-3 rounded-lg mt-4">
        <div className="text-xs text-ocean-500 mb-2">操作提示</div>
        <div className="space-y-1 text-xs text-ocean-400">
          <div>🖱️ 左键拖拽：旋转视角</div>
          <div>🖱️ 右键拖拽：平移视角</div>
          <div>🔍 滚轮：缩放视图</div>
          <div>⚡ 调整参数：实时分析</div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
