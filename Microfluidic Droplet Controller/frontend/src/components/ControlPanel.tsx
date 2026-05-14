"use client";

import { useSimulationStore } from "@/store/simulationStore";

export default function ControlPanel() {
  const {
    isSimulating,
    channelGeometry,
    fluidProperties,
    showStreamlines,
    showInterfaceCurvature,
    showWettabilityGradient,
    setSimulating,
    setChannelGeometry,
    setFluidProperties,
    setShowStreamlines,
    setShowInterfaceCurvature,
    setShowWettabilityGradient,
    resetSimulation,
    time,
  } = useSimulationStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">仿真控制</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSimulating(!isSimulating)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all btn-hover ${
                isSimulating
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {isSimulating ? "⏸ 暂停" : "▶ 开始"}
            </button>
            <button
              onClick={resetSimulation}
              className="py-3 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
            >
              🔄 重置
            </button>
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between">
              <span>仿真时间:</span>
              <span className="font-mono font-medium">{time.toFixed(3)} s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">通道几何</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              通道类型
            </label>
            <select
              value={channelGeometry.type}
              onChange={(e) =>
                setChannelGeometry({ type: e.target.value as "t-junction" | "flow-focusing" })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="flow-focusing">流动聚焦型 (Flow Focusing)</option>
              <option value="t-junction">T型结 (T-Junction)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主通道宽度: {channelGeometry.mainChannelWidth} μm
            </label>
            <input
              type="range"
              min="50"
              max="300"
              value={channelGeometry.mainChannelWidth}
              onChange={(e) =>
                setChannelGeometry({ mainChannelWidth: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主通道高度: {channelGeometry.mainChannelHeight} μm
            </label>
            <input
              type="range"
              min="20"
              max="150"
              value={channelGeometry.mainChannelHeight}
              onChange={(e) =>
                setChannelGeometry({ mainChannelHeight: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {channelGeometry.type === "flow-focusing" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                孔口宽度: {channelGeometry.orificeWidth} μm
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={channelGeometry.orificeWidth}
                onChange={(e) =>
                  setChannelGeometry({ orificeWidth: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表面粗糙度: {channelGeometry.surfaceRoughness.toFixed(3)}
            </label>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.001"
              value={channelGeometry.surfaceRoughness}
              onChange={(e) =>
                setChannelGeometry({ surfaceRoughness: Number(e.target.value) })
              }
              className="w-full"
            />
            {channelGeometry.surfaceRoughness > 0.015 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ 高粗糙度可能导致非对称破裂
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              壁面接触角: {channelGeometry.wallContactAngle}°
            </label>
            <input
              type="range"
              min="60"
              max="150"
              value={channelGeometry.wallContactAngle}
              onChange={(e) =>
                setChannelGeometry({ wallContactAngle: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">流体物性</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              流速比 (连续相/分散相): {fluidProperties.flowRateRatio.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={fluidProperties.flowRateRatio}
              onChange={(e) =>
                setFluidProperties({ flowRateRatio: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              界面张力: {fluidProperties.interfacialTension.toFixed(3)} N/m
            </label>
            <input
              type="range"
              min="0.005"
              max="0.1"
              step="0.001"
              value={fluidProperties.interfacialTension}
              onChange={(e) =>
                setFluidProperties({ interfacialTension: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              毛细数: {fluidProperties.capillaryNumber.toFixed(4)}
            </label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={fluidProperties.capillaryNumber}
              onChange={(e) =>
                setFluidProperties({ capillaryNumber: Number(e.target.value) })
              }
              className="w-full"
            />
            {fluidProperties.capillaryNumber > 0.03 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ 高毛细数 → 射流模式 (Jetting)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                连续相粘度 (Pa·s)
              </label>
              <input
                type="number"
                step="0.001"
                value={fluidProperties.continuousPhaseViscosity}
                onChange={(e) =>
                  setFluidProperties({ continuousPhaseViscosity: Number(e.target.value) })
                }
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分散相粘度 (Pa·s)
              </label>
              <input
                type="number"
                step="0.001"
                value={fluidProperties.dispersedPhaseViscosity}
                onChange={(e) =>
                  setFluidProperties({ dispersedPhaseViscosity: Number(e.target.value) })
                }
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">可视化选项</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showStreamlines}
              onChange={(e) => setShowStreamlines(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">显示流线动画</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showInterfaceCurvature}
              onChange={(e) => setShowInterfaceCurvature(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">显示界面曲率</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showWettabilityGradient}
              onChange={(e) => setShowWettabilityGradient(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">显示润湿性梯度</span>
          </label>
        </div>
      </div>
    </div>
  );
}
