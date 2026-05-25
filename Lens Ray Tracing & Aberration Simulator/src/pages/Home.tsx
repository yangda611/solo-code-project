import { OpticsScene } from '@/components/three/OpticsScene';
import { PresetSelector } from '@/components/ui/PresetSelector';
import { LensControlPanel } from '@/components/ui/LensControlPanel';
import { AberrationDisplay } from '@/components/ui/AberrationDisplay';
import { Info } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                透镜光线追踪模拟器
              </h1>
              <p className="text-[10px] text-slate-500">Lens Ray Tracing & Aberration Simulator</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4" />
            <span>拖拽旋转 · 滚轮缩放</span>
          </div>
        </div>
      </header>

      <main className="flex h-screen pt-16">
        <div className="flex-1 relative">
          <OpticsScene />
          
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-medium">光学原理：</span>
                本系统基于斯涅尔定律（Snell's Law）计算光线折射，
                展示球差、色差、彗差等像差现象，以及全反射临界条件。
              </p>
            </div>
          </div>
        </div>

        <aside className="w-80 bg-slate-900/50 backdrop-blur-sm border-l border-slate-700/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <PresetSelector />
            <LensControlPanel />
            <AberrationDisplay />
          </div>
        </aside>
      </main>
    </div>
  );
}