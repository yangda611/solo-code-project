import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ThreeDViewer from './components/ThreeDViewer';
import ControlPanel from './components/ControlPanel';
import PresetSelector from './components/PresetSelector';
import ResultsChart from './components/ResultsChart';

function App() {
  const [config, setConfig] = useState({
    gridSizeX: 32,
    gridSizeY: 20,
    gridSizeZ: 8,
    reynoldsMin: 10,
    reynoldsMax: 1000,
    pressureDropConstraint: 50,
    minFeatureSize: 2
  });
  
  const [boundaries, setBoundaries] = useState({
    inlet: [],
    outlet: [],
    solid: []
  });
  
  const [optimizationData, setOptimizationData] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [projectId, setProjectId] = useState(null);
  const [densityField, setDensityField] = useState(null);
  
  const eventSourceRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  const initOptimizer = async () => {
    try {
      const response = await fetch('/api/topology/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        setProjectId(data.projectId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Init error:', error);
      return false;
    }
  };
  
  const setBoundariesRemote = async () => {
    try {
      const response = await fetch('/api/topology/boundaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...boundaries, projectId })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Boundary error:', error);
      return false;
    }
  };
  
  const startOptimization = async () => {
    try {
      const initialized = await initOptimizer();
      if (!initialized) {
        alert('初始化优化器失败，请检查后端是否正常运行');
        return;
      }
      
      await setBoundariesRemote();
      
      setIsOptimizing(true);
      setOptimizationData([]);
      
      const url = projectId 
        ? `/api/topology/optimize?iterations=20&projectId=${projectId}`
        : '/api/topology/optimize?iterations=20';
      
      eventSourceRef.current = new EventSource(url);
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            console.error('Server error:', data.error);
            setIsOptimizing(false);
            eventSourceRef.current.close();
            return;
          }
          
          setOptimizationData(prev => [...prev, data]);
          setCurrentIteration(data.iteration);
          
          if (data.densityField) {
            setDensityField(data.densityField);
          }
          
          if (data.complete) {
            setIsOptimizing(false);
            eventSourceRef.current.close();
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource error:', error);
        setIsOptimizing(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    } catch (error) {
      console.error('Start optimization error:', error);
      alert('启动优化失败: ' + error.message);
      setIsOptimizing(false);
    }
  };
  
  const stopOptimization = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsOptimizing(false);
  };
  
  const loadPreset = async (presetId) => {
    try {
      const response = await fetch(`/api/presets/${presetId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        const { name, inlet, outlet, solid, ...rest } = data.preset;
        setConfig(rest);
        setBoundaries({ 
          inlet: inlet || [], 
          outlet: outlet || [], 
          solid: solid || [] 
        });
        console.log(`Loaded preset: ${name}`);
      } else {
        console.error('Failed to load preset:', data.error);
        alert('加载预设失败: ' + data.error);
      }
    } catch (error) {
      console.error('Load preset error:', error);
      alert('加载预设失败: ' + error.message);
    }
  };
  
  const addBoundary = (type, position) => {
    const newBoundary = {
      x: position.x || 0,
      y: position.y || 0,
      z: position.z || 0,
      sx: 2,
      sy: 2,
      sz: 2,
      type,
      value: type === 'inlet' ? 1.0 : 0
    };
    
    setBoundaries(prev => ({
      ...prev,
      [type === 'solid' ? 'solid' : type === 'inlet' ? 'inlet' : 'outlet']: 
        [...prev[type === 'solid' ? 'solid' : type === 'inlet' ? 'inlet' : 'outlet'], newBoundary]
    }));
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>流体通道拓扑优化系统</h1>
        <p>基于 SIMP 方法的稳态 Navier-Stokes 求解器</p>
      </header>
      
      <div className="main-content">
        <div className="left-panel">
          <PresetSelector onLoadPreset={loadPreset} />
          <ControlPanel 
            config={config}
            setConfig={setConfig}
            boundaries={boundaries}
            setBoundaries={setBoundaries}
            onStartOptimization={startOptimization}
            onStopOptimization={stopOptimization}
            isOptimizing={isOptimizing}
            currentIteration={currentIteration}
            onAddBoundary={addBoundary}
          />
          <ResultsChart data={optimizationData} />
        </div>
        
        <div className="right-panel">
          <ThreeDViewer 
            config={config}
            boundaries={boundaries}
            densityField={densityField}
            isOptimizing={isOptimizing}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
