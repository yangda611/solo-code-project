import React, { useRef, useEffect, useState, useCallback } from 'react'

const TrafficCanvas = ({
  intersections,
  roads,
  trafficLights,
  spawnPoints,
  vehicles,
  accidents,
  heatMapData,
  selectedTool,
  selectedRoad,
  onSelectRoad,
  onCreateIntersection,
  onCreateRoad,
  onCreateTrafficLight,
  onCreateSpawnPoint,
  onDeleteItem,
  isSimulating
}) => {
  const canvasRef = useRef(null)
  const [roadStartIntersection, setRoadStartIntersection] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const animationTimeRef = useRef(0)

  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])

  const findIntersectionAt = useCallback((x, y, threshold = 20) => {
    return intersections.find(inter => {
      const dx = inter.x - x
      const dy = inter.y - y
      return Math.sqrt(dx * dx + dy * dy) < threshold
    })
  }, [intersections])

  const findRoadAt = useCallback((x, y, threshold = 15) => {
    for (const road of roads) {
      const startX = road.start_x ?? intersections.find(i => i.id === road.start_intersection_id)?.x
      const startY = road.start_y ?? intersections.find(i => i.id === road.start_intersection_id)?.y
      const endX = road.end_x ?? intersections.find(i => i.id === road.end_intersection_id)?.x
      const endY = road.end_y ?? intersections.find(i => i.id === road.end_intersection_id)?.y
      
      if (startX === undefined || startY === undefined || endX === undefined || endY === undefined) continue
      
      const A = x - startX
      const B = y - startY
      const C = endX - startX
      const D = endY - startY
      
      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1
      
      if (lenSq !== 0) param = dot / lenSq
      
      let xx, yy
      if (param < 0) {
        xx = startX
        yy = startY
      } else if (param > 1) {
        xx = endX
        yy = endY
      } else {
        xx = startX + param * C
        yy = startY + param * D
      }
      
      const dx = x - xx
      const dy = y - yy
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < threshold) {
        return { road, param }
      }
    }
    return null
  }, [roads, intersections])

  const handleCanvasClick = useCallback((e) => {
    const coords = getCanvasCoords(e)
    
    if (isSimulating && selectedTool !== 'select') return
    
    switch (selectedTool) {
      case 'intersection':
        if (!isSimulating) {
          onCreateIntersection(coords.x, coords.y)
        }
        break
        
      case 'road':
        if (!isSimulating) {
          const clickedIntersection = findIntersectionAt(coords.x, coords.y)
          if (clickedIntersection) {
            if (!roadStartIntersection) {
              setRoadStartIntersection(clickedIntersection)
            } else if (roadStartIntersection.id !== clickedIntersection.id) {
              onCreateRoad(roadStartIntersection, clickedIntersection)
              setRoadStartIntersection(null)
            }
          }
        }
        break
        
      case 'traffic_light':
        if (!isSimulating) {
          const clickedIntersection = findIntersectionAt(coords.x, coords.y)
          if (clickedIntersection) {
            const connectedRoads = roads.filter(
              r => r.start_intersection_id === clickedIntersection.id || 
                   r.end_intersection_id === clickedIntersection.id
            )
            if (connectedRoads.length > 0) {
              onCreateTrafficLight(clickedIntersection, connectedRoads[0])
            }
          }
        }
        break
        
      case 'spawn_point':
        if (!isSimulating) {
          const roadResult = findRoadAt(coords.x, coords.y)
          if (roadResult) {
            onCreateSpawnPoint(roadResult.road, roadResult.param)
          }
        }
        break
        
      case 'delete':
        if (!isSimulating) {
          const clickedIntersection = findIntersectionAt(coords.x, coords.y)
          if (clickedIntersection) {
            onDeleteItem('intersection', clickedIntersection.id)
            return
          }
          
          const roadResult = findRoadAt(coords.x, coords.y)
          if (roadResult) {
            onDeleteItem('road', roadResult.road.id)
          }
        }
        break
        
      case 'select':
        const roadResult = findRoadAt(coords.x, coords.y)
        if (roadResult) {
          onSelectRoad(roadResult.road.id === selectedRoad ? null : roadResult.road.id)
        }
        break
    }
  }, [
    selectedTool, isSimulating, getCanvasCoords,
    onCreateIntersection, findIntersectionAt, roadStartIntersection,
    onCreateRoad, roads, onCreateTrafficLight, findRoadAt,
    onCreateSpawnPoint, onDeleteItem, selectedRoad, onSelectRoad
  ])

  const handleMouseMove = useCallback((e) => {
    const coords = getCanvasCoords(e)
    setMousePos(coords)
  }, [getCanvasCoords])

  const getRoadCongestionColor = useCallback((roadId, vehiclesOnRoad) => {
    const road = roads.find(r => r.id === roadId)
    if (!road) return '#4a4a6a'
    
    const capacity = road.capacity || 100
    const congestionRatio = Math.min(vehiclesOnRoad.length / capacity, 1)
    
    if (congestionRatio < 0.3) {
      return `hsl(${120 - congestionRatio * 60}, 70%, ${40 + congestionRatio * 20}%)`
    } else if (congestionRatio < 0.6) {
      return `hsl(${60 - (congestionRatio - 0.3) * 120}, 70%, ${46 + (congestionRatio - 0.3) * 20}%)`
    } else {
      return `hsl(${24 - (congestionRatio - 0.6) * 80}, 80%, ${52 - (congestionRatio - 0.6) * 20}%)`
    }
  }, [roads])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    
    const draw = () => {
      const time = animationTimeRef.current
      animationTimeRef.current += 16
      
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      
      if (heatMapData && heatMapData.length > 0) {
        heatMapData.forEach(point => {
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 80)
          const alpha = point.intensity * 0.3
          
          if (point.intensity > 0.7) {
            gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`)
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.5})`)
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
          } else if (point.intensity > 0.4) {
            gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha})`)
            gradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.5})`)
            gradient.addColorStop(1, 'rgba(255, 200, 0, 0)')
          } else {
            gradient.addColorStop(0, `rgba(0, 255, 100, ${alpha})`)
            gradient.addColorStop(0.5, `rgba(0, 200, 100, ${alpha * 0.5})`)
            gradient.addColorStop(1, 'rgba(0, 255, 100, 0)')
          }
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(point.x, point.y, 80, 0, Math.PI * 2)
          ctx.fill()
        })
      }
      
      roads.forEach(road => {
        const startInter = intersections.find(i => i.id === road.start_intersection_id)
        const endInter = intersections.find(i => i.id === road.end_intersection_id)
        
        if (!startInter || !endInter) return
        
        const vehiclesOnRoad = vehicles.filter(v => v.road_id === road.id)
        const congestionColor = getRoadCongestionColor(road.id, vehiclesOnRoad)
        
        const dx = endInter.x - startInter.x
        const dy = endInter.y - startInter.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const perpX = -dy / len * (road.lanes * 12)
        const perpY = dx / len * (road.lanes * 12)
        
        ctx.strokeStyle = '#2a2a4a'
        ctx.lineWidth = road.lanes * 24
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(startInter.x, startInter.y)
        ctx.lineTo(endInter.x, endInter.y)
        ctx.stroke()
        
        if (vehiclesOnRoad.length > 0) {
          const pulseAlpha = 0.3 + Math.sin(time / 200) * 0.1
          ctx.strokeStyle = congestionColor
          ctx.lineWidth = road.lanes * 20
          ctx.globalAlpha = pulseAlpha
          ctx.beginPath()
          ctx.moveTo(startInter.x, startInter.y)
          ctx.lineTo(endInter.x, endInter.y)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([20, 15])
        ctx.beginPath()
        ctx.moveTo(startInter.x, startInter.y)
        ctx.lineTo(endInter.x, endInter.y)
        ctx.stroke()
        ctx.setLineDash([])
        
        ctx.strokeStyle = congestionColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(startInter.x + perpX, startInter.y + perpY)
        ctx.lineTo(endInter.x + perpX, endInter.y + perpY)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(startInter.x - perpX, startInter.y - perpY)
        ctx.lineTo(endInter.x - perpX, endInter.y - perpY)
        ctx.stroke()
        
        if (selectedRoad === road.id) {
          ctx.strokeStyle = '#e94560'
          ctx.lineWidth = 2
          ctx.setLineDash([8, 8])
          ctx.beginPath()
          ctx.moveTo(startInter.x, startInter.y)
          ctx.lineTo(endInter.x, endInter.y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      })
      
      if (selectedTool === 'road' && roadStartIntersection) {
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.6)'
        ctx.lineWidth = 8
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.moveTo(roadStartIntersection.x, roadStartIntersection.y)
        ctx.lineTo(mousePos.x, mousePos.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      spawnPoints.forEach(sp => {
        const road = roads.find(r => r.id === sp.road_id)
        if (!road) return
        
        const startInter = intersections.find(i => i.id === road.start_intersection_id)
        const endInter = intersections.find(i => i.id === road.end_intersection_id)
        if (!startInter || !endInter) return
        
        const pos = sp.position || 0
        const x = startInter.x + (endInter.x - startInter.x) * pos
        const y = startInter.y + (endInter.y - startInter.y) * pos
        
        const pulseSize = 15 + Math.sin(time / 150) * 3
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize + 10)
        gradient.addColorStop(0, 'rgba(74, 222, 128, 0.4)')
        gradient.addColorStop(1, 'rgba(74, 222, 128, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, pulseSize + 10, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#4ade80'
        ctx.beginPath()
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#1a1a2e'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🚗', x, y)
      })
      
      intersections.forEach(inter => {
        const hasTrafficLight = trafficLights.some(tl => tl.intersection_id === inter.id)
        const baseSize = hasTrafficLight ? 20 : 15
        
        const gradient = ctx.createRadialGradient(inter.x, inter.y, 0, inter.x, inter.y, baseSize + 15)
        gradient.addColorStop(0, hasTrafficLight ? 'rgba(251, 191, 36, 0.3)' : 'rgba(139, 92, 246, 0.3)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(inter.x, inter.y, baseSize + 15, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = hasTrafficLight ? '#fbbf24' : '#8b5cf6'
        ctx.beginPath()
        ctx.arc(inter.x, inter.y, baseSize, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.strokeStyle = hasTrafficLight ? '#f59e0b' : '#7c3aed'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(inter.x, inter.y, baseSize, 0, Math.PI * 2)
        ctx.stroke()
        
        ctx.fillStyle = '#1a1a2e'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(hasTrafficLight ? '🚦' : '🔘', inter.x, inter.y)
        
        ctx.fillStyle = '#e0e0e0'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(inter.name, inter.x, inter.y + baseSize + 15)
      })
      
      trafficLights.forEach(tl => {
        const inter = intersections.find(i => i.id === tl.intersection_id)
        if (!inter) return
        
        const road = roads.find(r => r.id === tl.road_id)
        if (!road) return
        
        const startInter = intersections.find(i => i.id === road.start_intersection_id)
        const endInter = intersections.find(i => i.id === road.end_intersection_id)
        if (!startInter || !endInter) return
        
        const dx = endInter.x - startInter.x
        const dy = endInter.y - startInter.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const offsetX = -dy / len * 35
        const offsetY = dx / len * 35
        
        const lightX = inter.x + offsetX
        const lightY = inter.y + offsetY
        
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(lightX - 12, lightY - 30, 24, 60)
        ctx.strokeStyle = '#0f3460'
        ctx.lineWidth = 2
        ctx.strokeRect(lightX - 12, lightY - 30, 24, 60)
        
        const lightColors = {
          red: tl.current_color === 'red' ? '#ef4444' : '#4a4a4a',
          yellow: tl.current_color === 'yellow' ? '#fbbf24' : '#4a4a4a',
          green: tl.current_color === 'green' ? '#22c55e' : '#4a4a4a'
        }
        
        const redGlow = tl.current_color === 'red' ? Math.sin(time / 100) * 0.3 + 0.7 : 0.3
        const yellowGlow = tl.current_color === 'yellow' ? Math.sin(time / 80) * 0.3 + 0.7 : 0.3
        const greenGlow = tl.current_color === 'green' ? Math.sin(time / 120) * 0.3 + 0.7 : 0.3
        
        ctx.fillStyle = `rgba(239, 68, 68, ${redGlow})`
        ctx.beginPath()
        ctx.arc(lightX, lightY - 20, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = lightColors.red
        ctx.beginPath()
        ctx.arc(lightX, lightY - 20, 6, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = `rgba(251, 191, 36, ${yellowGlow})`
        ctx.beginPath()
        ctx.arc(lightX, lightY, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = lightColors.yellow
        ctx.beginPath()
        ctx.arc(lightX, lightY, 6, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = `rgba(34, 197, 94, ${greenGlow})`
        ctx.beginPath()
        ctx.arc(lightX, lightY + 20, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = lightColors.green
        ctx.beginPath()
        ctx.arc(lightX, lightY + 20, 6, 0, Math.PI * 2)
        ctx.fill()
      })
      
      vehicles.forEach(vehicle => {
        const road = roads.find(r => r.id === vehicle.road_id)
        if (!road) return
        
        const startInter = intersections.find(i => i.id === road.start_intersection_id)
        const endInter = intersections.find(i => i.id === road.end_intersection_id)
        if (!startInter || !endInter) return
        
        const pos = vehicle.position
        const x = startInter.x + (endInter.x - startInter.x) * pos
        const y = startInter.y + (endInter.y - startInter.y) * pos
        
        const dx = endInter.x - startInter.x
        const dy = endInter.y - startInter.y
        const angle = Math.atan2(dy, dx) + (vehicle.direction === 'backward' ? Math.PI : 0)
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        
        const vehicleGradient = ctx.createLinearGradient(-12, 0, 12, 0)
        vehicleGradient.addColorStop(0, '#3b82f6')
        vehicleGradient.addColorStop(1, '#1d4ed8')
        
        ctx.fillStyle = vehicleGradient
        ctx.fillRect(-12, -6, 24, 12)
        
        ctx.fillStyle = '#60a5fa'
        ctx.fillRect(6, -5, 4, 10)
        
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(12, -4, 2, 0, Math.PI * 2)
        ctx.arc(12, 4, 2, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(-12, -4, 2, 0, Math.PI * 2)
        ctx.arc(-12, 4, 2, 0, Math.PI * 2)
        ctx.fill()
        
        if (vehicle.is_braking) {
          ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(time / 50) * 0.3})`
          ctx.beginPath()
          ctx.arc(-14, 0, 6, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.restore()
      })
      
      accidents.forEach(accident => {
        const blinkAlpha = Math.sin(time / 100) > 0 ? 1 : 0.3
        
        const gradient = ctx.createRadialGradient(accident.x, accident.y, 0, accident.x, accident.y, 50)
        gradient.addColorStop(0, `rgba(255, 0, 0, ${0.6 * blinkAlpha})`)
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.3 * blinkAlpha})`)
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(accident.x, accident.y, 50, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💥', accident.x, accident.y)
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${blinkAlpha})`
        ctx.lineWidth = 3
        const crossSize = 30 + Math.sin(time / 150) * 5
        ctx.beginPath()
        ctx.moveTo(accident.x - crossSize, accident.y - crossSize)
        ctx.lineTo(accident.x + crossSize, accident.y + crossSize)
        ctx.moveTo(accident.x + crossSize, accident.y - crossSize)
        ctx.lineTo(accident.x - crossSize, accident.y + crossSize)
        ctx.stroke()
      })
      
      if (selectedTool === 'intersection' && !isSimulating) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.arc(mousePos.x, mousePos.y, 15, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
    
    const animationId = requestAnimationFrame(function animate() {
      draw()
      requestAnimationFrame(animate)
    })
    
    return () => cancelAnimationFrame(animationId)
  }, [
    intersections, roads, trafficLights, spawnPoints, vehicles, accidents,
    heatMapData, selectedTool, roadStartIntersection, mousePos, selectedRoad,
    getRoadCongestionColor
  ])

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="traffic-canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
        />
        <div className="canvas-info">
          <p>当前工具: <span className="tool-name">
            {selectedTool === 'select' ? '选择' :
             selectedTool === 'intersection' ? '路口' :
             selectedTool === 'road' ? '道路' :
             selectedTool === 'traffic_light' ? '红绿灯' :
             selectedTool === 'spawn_point' ? '车辆生成点' :
             selectedTool === 'delete' ? '删除' : '选择'}
          </span></p>
          {roadStartIntersection && (
            <p style={{ color: '#e94560' }}>已选择起点: {roadStartIntersection.name}，请点击另一个路口</p>
          )}
          {isSimulating && (
            <p style={{ color: '#4ade80' }}>▶ 仿真运行中...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrafficCanvas
