import React, { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import TrafficCanvas from './components/TrafficCanvas'
import Toolbar from './components/Toolbar'
import StatsPanel from './components/StatsPanel'
import SimulationEngine from './utils/SimulationEngine'
import './App.css'

const App = () => {
  const [intersections, setIntersections] = useState([])
  const [roads, setRoads] = useState([])
  const [trafficLights, setTrafficLights] = useState([])
  const [spawnPoints, setSpawnPoints] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [accidents, setAccidents] = useState([])
  const [stats, setStats] = useState({
    total_vehicles: 0,
    congestion_index: 0,
    avg_travel_time: 0,
    accident_risk: 0,
    avg_speed: 0
  })
  const [selectedTool, setSelectedTool] = useState('select')
  const [selectedRoad, setSelectedRoad] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [heatMapData, setHeatMapData] = useState([])
  
  const simulationEngineRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    simulationEngineRef.current = new SimulationEngine({
      intersections,
      roads,
      trafficLights,
      spawnPoints,
      vehicles,
      accidents
    })
  }, [])

  const handleCreateIntersection = useCallback((x, y) => {
    const newIntersection = {
      id: uuidv4(),
      x,
      y,
      name: `路口${intersections.length + 1}`,
      type: 'normal'
    }
    setIntersections(prev => [...prev, newIntersection])
  }, [intersections.length])

  const handleCreateRoad = useCallback((startIntersection, endIntersection) => {
    if (startIntersection.id === endIntersection.id) return
    
    const dx = endIntersection.x - startIntersection.x
    const dy = endIntersection.y - startIntersection.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    const newRoad = {
      id: uuidv4(),
      start_intersection_id: startIntersection.id,
      end_intersection_id: endIntersection.id,
      name: `道路${roads.length + 1}`,
      length,
      lanes: 2,
      speed_limit: 60,
      capacity: 100,
      direction: 'two-way',
      start_x: startIntersection.x,
      start_y: startIntersection.y,
      end_x: endIntersection.x,
      end_y: endIntersection.y
    }
    setRoads(prev => [...prev, newRoad])
  }, [roads.length])

  const handleCreateTrafficLight = useCallback((intersection, road) => {
    const existingLight = trafficLights.find(
      tl => tl.intersection_id === intersection.id && tl.road_id === road.id
    )
    if (existingLight) return
    
    const newLight = {
      id: uuidv4(),
      intersection_id: intersection.id,
      road_id: road.id,
      phase: 0,
      green_duration: 30,
      yellow_duration: 3,
      red_duration: 30,
      current_color: 'red',
      timer: 0,
      intersection_x: intersection.x,
      intersection_y: intersection.y
    }
    setTrafficLights(prev => [...prev, newLight])
  }, [trafficLights])

  const handleCreateSpawnPoint = useCallback((road, position) => {
    const newSpawnPoint = {
      id: uuidv4(),
      road_id: road.id,
      position: position || 0,
      direction: 'forward',
      spawn_rate: 5,
      min_speed: 40,
      max_speed: 60
    }
    setSpawnPoints(prev => [...prev, newSpawnPoint])
  }, [])

  const handleDeleteItem = useCallback((type, id) => {
    switch (type) {
      case 'intersection':
        setIntersections(prev => prev.filter(i => i.id !== id))
        setRoads(prev => prev.filter(r => r.start_intersection_id !== id && r.end_intersection_id !== id))
        setTrafficLights(prev => prev.filter(tl => tl.intersection_id !== id))
        break
      case 'road':
        setRoads(prev => prev.filter(r => r.id !== id))
        setTrafficLights(prev => prev.filter(tl => tl.road_id !== id))
        setSpawnPoints(prev => prev.filter(sp => sp.road_id !== id))
        break
      case 'traffic_light':
        setTrafficLights(prev => prev.filter(tl => tl.id !== id))
        break
      case 'spawn_point':
        setSpawnPoints(prev => prev.filter(sp => sp.id !== id))
        break
    }
  }, [])

  const startSimulation = useCallback(() => {
    simulationEngineRef.current.setData({
      intersections,
      roads,
      trafficLights,
      spawnPoints
    })
    simulationEngineRef.current.reset()
    setIsSimulating(true)
  }, [intersections, roads, trafficLights, spawnPoints])

  const stopSimulation = useCallback(() => {
    setIsSimulating(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isSimulating) return

    const simulationLoop = () => {
      const result = simulationEngineRef.current.update(16)
      
      setVehicles(result.vehicles)
      setTrafficLights(result.trafficLights)
      setAccidents(result.accidents)
      setStats(result.stats)
      setHeatMapData(result.heatMapData)
      
      animationFrameRef.current = requestAnimationFrame(simulationLoop)
    }

    simulationLoop()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSimulating])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏙️ UrbanFlow Simulator - 城市交通拥堵仿真平台</h1>
      </header>
      
      <div className="app-content">
        <Toolbar
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          isSimulating={isSimulating}
          onStartSimulation={startSimulation}
          onStopSimulation={stopSimulation}
          intersections={intersections}
          roads={roads}
        />
        
        <TrafficCanvas
          intersections={intersections}
          roads={roads}
          trafficLights={trafficLights}
          spawnPoints={spawnPoints}
          vehicles={vehicles}
          accidents={accidents}
          heatMapData={heatMapData}
          selectedTool={selectedTool}
          selectedRoad={selectedRoad}
          onSelectRoad={setSelectedRoad}
          onCreateIntersection={handleCreateIntersection}
          onCreateRoad={handleCreateRoad}
          onCreateTrafficLight={handleCreateTrafficLight}
          onCreateSpawnPoint={handleCreateSpawnPoint}
          onDeleteItem={handleDeleteItem}
          isSimulating={isSimulating}
        />
        
        <StatsPanel stats={stats} />
      </div>
    </div>
  )
}

export default App
