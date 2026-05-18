import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavierStokesSolver } from './solvers/CFD/NavierStokesSolver';
import { StructureSolver } from './solvers/Structure/StructureSolver';
import { VorticityCanvas } from './components/VorticityCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PresetButtons } from './components/PresetButtons';
import { LissajousCanvas } from './components/LissajousCanvas';
import { SpectrumCanvas } from './components/SpectrumCanvas';
import { SimulationParams } from './types';
import { DEFAULT_PARAMS } from './config/presets';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const MINI_CANVAS_WIDTH = 300;
const MINI_CANVAS_HEIGHT = 200;
const GRID_NX = 256;
const GRID_NY = 96;
const DT = 0.005;

function App() {
  const [params, setParams] = useState<SimulationParams>({ ...DEFAULT_PARAMS });
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'lissajous' | 'spectrum'>('lissajous');
  
  const [displacementHistory, setDisplacementHistory] = useState<number[]>([]);
  const [velocityHistory, setVelocityHistory] = useState<number[]>([]);
  const [liftHistory, setLiftHistory] = useState<number[]>([]);
  const [dragHistory, setDragHistory] = useState<number[]>([]);
  
  const [currentLift, setCurrentLift] = useState(0);
  const [currentDrag, setCurrentDrag] = useState(0);
  const [currentDisplacement, setCurrentDisplacement] = useState(0);
  
  const cfSolverRef = useRef<NavierStokesSolver | null>(null);
  const structureSolverRef = useRef<StructureSolver | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  useEffect(() => {
    const dx = 4.0 / GRID_NX;
    const dy = 1.5 / GRID_NY;
    
    cfSolverRef.current = new NavierStokesSolver(GRID_NX, GRID_NY, dx, dy, DT);
    cfSolverRef.current.setReynolds(params.reynolds, params.inflowVelocity);
    
    const equilibriumY = (GRID_NY * dy) / 2;
    structureSolverRef.current = new StructureSolver(
      params.mass,
      params.stiffness,
      params.damping,
      equilibriumY
    );
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  const resetSimulation = useCallback(() => {
    if (cfSolverRef.current) {
      cfSolverRef.current.reset(DEFAULT_PARAMS.inflowVelocity);
      cfSolverRef.current.setReynolds(params.reynolds, DEFAULT_PARAMS.inflowVelocity);
    }
    
    if (structureSolverRef.current) {
      const dy = 1.5 / GRID_NY;
      const equilibriumY = (GRID_NY * dy) / 2;
      structureSolverRef.current = new StructureSolver(
        params.mass,
        params.stiffness,
        params.damping,
        equilibriumY
      );
    }
    
    setTime(0);
    setDisplacementHistory([]);
    setVelocityHistory([]);
    setLiftHistory([]);
    setDragHistory([]);
    setCurrentLift(0);
    setCurrentDrag(0);
    setCurrentDisplacement(0);
  }, [params.reynolds, params.mass, params.stiffness, params.damping]);
  
  const simulationStep = useCallback(() => {
    if (!cfSolverRef.current || !structureSolverRef.current) return;
    
    const cfSolver = cfSolverRef.current;
    const structureSolver = structureSolverRef.current;
    
    cfSolver.setCylinderPosition(structureSolver.y);
    
    for (let i = 0; i < 3; i++) {
      cfSolver.step(params.inflowVelocity);
    }
    
    const [lift, drag] = cfSolver.computeForces(params.inflowVelocity);
    
    const forceScale = 0.1;
    structureSolver.step(lift * forceScale, DT * 3);
    
    const displacement = structureSolver.getDisplacement();
    const velocity = structureSolver.getVelocity();
    
    setTime(t => t + DT * 3);
    setCurrentLift(lift);
    setCurrentDrag(drag);
    setCurrentDisplacement(displacement);
    
    setDisplacementHistory(h => [...h.slice(-500), displacement]);
    setVelocityHistory(h => [...h.slice(-500), velocity]);
    setLiftHistory(h => [...h.slice(-500), lift]);
    setDragHistory(h => [...h.slice(-500), drag]);
  }, [params.inflowVelocity]);
  
  useEffect(() => {
    if (!isRunning) return;
    
    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= 16) {
        simulationStep();
        lastTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, simulationStep]);
  
  const handleParamsChange = useCallback((newParams: Partial<SimulationParams>) => {
    setParams(p => ({ ...p, ...newParams }));
  }, []);
  
  const handleLoadPreset = useCallback((preset: Partial<SimulationParams>) => {
    setParams(p => ({ ...p, ...preset }));
    setTimeout(() => {
      if (cfSolverRef.current && structureSolverRef.current) {
        const dy = 1.5 / GRID_NY;
        const equilibriumY = (GRID_NY * dy) / 2;
        cfSolverRef.current.reset(DEFAULT_PARAMS.inflowVelocity);
        cfSolverRef.current.setReynolds(preset.reynolds || DEFAULT_PARAMS.reynolds, DEFAULT_PARAMS.inflowVelocity);
        structureSolverRef.current = new StructureSolver(
          preset.mass || DEFAULT_PARAMS.mass,
          preset.stiffness || DEFAULT_PARAMS.stiffness,
          preset.damping || DEFAULT_PARAMS.damping,
          equilibriumY
        );
      }
      setTime(0);
      setDisplacementHistory([]);
      setVelocityHistory([]);
      setLiftHistory([]);
      setDragHistory([]);
      setCurrentLift(0);
      setCurrentDrag(0);
      setCurrentDisplacement(0);
    }, 10);
  }, []);
  
  const handleSave = useCallback(() => {
    const data = {
      params,
      displacementHistory,
      velocityHistory,
      liftHistory,
      dragHistory,
      time
    };
    localStorage.setItem('cfd-simulation', JSON.stringify(data));
    alert('模拟数据已保存！');
  }, [params, displacementHistory, velocityHistory, liftHistory, dragHistory, time]);
  
  const handleLoad = useCallback(() => {
    const saved = localStorage.getItem('cfd-simulation');
    if (saved) {
      const data = JSON.parse(saved);
      setParams(data.params);
      setDisplacementHistory(data.displacementHistory || []);
      setVelocityHistory(data.velocityHistory || []);
      setLiftHistory(data.liftHistory || []);
      setDragHistory(data.dragHistory || []);
      setTime(data.time || 0);
      alert('模拟数据已加载！');
    } else {
      alert('没有找到保存的数据！');
    }
  }, []);
  
  const grid = cfSolverRef.current?.grid || null;
  const cylinderX = cfSolverRef.current?.cylinderX || 0;
  const cylinderY = cfSolverRef.current?.cylinderY || 0;
  const cylinderR = cfSolverRef.current?.cylinderR || 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            圆柱绕流与流致振动耦合模拟系统
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            基于二维不可压 Navier-Stokes 方程 · 投影法 · 交错网格 · 双向流固耦合
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-cyan-500/20">
              <h2 className="text-cyan-400 text-sm font-semibold mb-3">涡量场实时显示</h2>
              <div className="flex justify-center">
                <VorticityCanvas
                  grid={grid}
                  cylinderX={cylinderX}
                  cylinderY={cylinderY}
                  cylinderR={cylinderR}
                  vorticityScale={5.0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                />
              </div>
              <div className="flex justify-center gap-8 mt-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
                  <span className="text-gray-400">负涡量</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white rounded"></div>
                  <span className="text-gray-400">零涡量</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-600 rounded"></div>
                  <span className="text-gray-400">正涡量</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-cyan-500/20">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab('lissajous')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'lissajous'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  李萨如图 (相图)
                </button>
                <button
                  onClick={() => setActiveTab('spectrum')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'spectrum'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  升力系数频谱
                </button>
              </div>
              <div className="flex justify-center">
                {activeTab === 'lissajous' ? (
                  <LissajousCanvas
                    displacementHistory={displacementHistory}
                    velocityHistory={velocityHistory}
                    width={MINI_CANVAS_WIDTH}
                    height={MINI_CANVAS_HEIGHT}
                  />
                ) : (
                  <SpectrumCanvas
                    liftHistory={liftHistory}
                    timeStep={DT}
                    width={MINI_CANVAS_WIDTH}
                    height={MINI_CANVAS_HEIGHT}
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <ControlPanel
              params={params}
              isRunning={isRunning}
              time={time}
              lift={currentLift}
              drag={currentDrag}
              displacement={currentDisplacement}
              onParamsChange={handleParamsChange}
              onStart={() => setIsRunning(true)}
              onPause={() => setIsRunning(false)}
              onReset={resetSimulation}
              onSave={handleSave}
              onLoad={handleLoad}
            />
            
            <PresetButtons onLoadPreset={handleLoadPreset} />
            
            <div className="bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-yellow-500/30">
              <h3 className="text-yellow-400 text-sm font-bold mb-2">⚠️ 数值现象说明</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• <span className="text-cyan-400">二维假设</span>: 高Re下三维不稳定性被抑制</li>
                <li>• <span className="text-green-400">时间步长</span>: 不匹配可能导致能量非物理传递</li>
                <li>• <span className="text-orange-400">频率锁定</span>: 涡脱频率被结构频率俘获</li>
                <li>• <span className="text-red-400">驰振</span>: 负气动阻尼导致振幅发散</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
