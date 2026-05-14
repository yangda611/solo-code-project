"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MicrofluidicChip from "@/components/MicrofluidicChip";
import ControlPanel from "@/components/ControlPanel";
import StatisticsPanel from "@/components/StatisticsPanel";
import PresetButtons from "@/components/PresetButtons";
import { useSimulationStore } from "@/store/simulationStore";

export default function Home() {
  const { isSimulating } = useSimulationStore();
  const [showStats, setShowStats] = useState(true);

  return (
    <main className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              微流控液滴操控仿真系统
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              T型/流动聚焦型微通道多相流仿真平台
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                isSimulating
                  ? "bg-green-100 text-green-700 simulating"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isSimulating ? "🔄 仿真运行中" : "⏸ 已暂停"}
            </div>
          </div>
        </div>
      </header>

      {/* 预设按钮栏 */}
      <div className="bg-white border-b px-6 py-3">
        <PresetButtons />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex">
        {/* 左侧控制面板 */}
        <div className="w-80 bg-white shadow-lg p-4 overflow-y-auto">
          <ControlPanel />
        </div>

        {/* 中间 3D 视图 */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [10, 8, 10], fov: 50 }}
            className="canvas-container"
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <directionalLight position={[-10, -10, -10]} intensity={0.3} />
            
            <MicrofluidicChip />
            
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={30}
            />
            
            {/* 网格辅助 */}
            <gridHelper args={[20, 20, "#e5e7eb", "#f3f4f6"]} position={[0, -2, 0]} />
          </Canvas>

          {/* 3D 视图控制按钮 */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-white shadow-lg rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {showStats ? "📊 隐藏统计" : "📊 显示统计"}
            </button>
          </div>

          {/* 视图提示 */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-gray-600 shadow">
            🖱 左键旋转 | 右键平移 | 滚轮缩放
          </div>
        </div>

        {/* 右侧统计面板 */}
        {showStats && (
          <div className="w-96 bg-white shadow-lg p-4 overflow-y-auto">
            <StatisticsPanel />
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <footer className="bg-white border-t px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>使用相场法进行两相流界面追踪</span>
          <span>SQLite 本地数据持久化</span>
        </div>
      </footer>
    </main>
  );
}
