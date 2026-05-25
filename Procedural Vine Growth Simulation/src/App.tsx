
import { VineScene } from './components/canvas/VineScene'
import { PresetBar } from './components/ui/PresetBar'
import { ControlPanel } from './components/ui/ControlPanel'
import { StatusBar } from './components/ui/StatusBar'

function App() {
  return (
    <div className="w-full h-full relative">
      <VineScene />
      <PresetBar />
      <ControlPanel />
      <StatusBar />
      
      <div className="fixed top-4 right-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/60 text-xs font-mono">
        <div>🖱️ 左键拖拽旋转</div>
        <div>🔍 滚轮缩放</div>
      </div>
    </div>
  )
}

export default App
