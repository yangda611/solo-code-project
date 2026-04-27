import { v4 as uuidv4 } from 'uuid'

class SimulationEngine {
  constructor(config = {}) {
    this.intersections = config.intersections || []
    this.roads = config.roads || []
    this.trafficLights = config.trafficLights || []
    this.spawnPoints = config.spawnPoints || []
    this.vehicles = config.vehicles || []
    this.accidents = config.accidents || []
    
    this.stats = {
      total_vehicles: 0,
      congestion_index: 0,
      avg_travel_time: 0,
      accident_risk: 0,
      avg_speed: 0
    }
    
    this.heatMapData = []
    this.time = 0
    this.travelTimeHistory = []
    this.vehicleSpawnTimers = {}
  }

  setData({ intersections, roads, trafficLights, spawnPoints }) {
    this.intersections = intersections || []
    this.roads = roads || []
    this.trafficLights = (trafficLights || []).map(tl => ({
      ...tl,
      current_color: 'red',
      timer: 0
    }))
    this.spawnPoints = spawnPoints || []
  }

  reset() {
    this.vehicles = []
    this.accidents = []
    this.travelTimeHistory = []
    this.vehicleSpawnTimers = {}
    this.time = 0
    this.stats = {
      total_vehicles: 0,
      congestion_index: 0,
      avg_travel_time: 0,
      accident_risk: 0,
      avg_speed: 0
    }
    
    this.trafficLights = this.trafficLights.map(tl => ({
      ...tl,
      current_color: 'red',
      timer: 0
    }))
  }

  update(deltaTimeMs) {
    const deltaTime = deltaTimeMs / 1000
    this.time += deltaTime
    
    this.updateTrafficLights(deltaTime)
    this.spawnVehicles(deltaTime)
    this.updateVehicles(deltaTime)
    this.checkAccidents()
    this.calculateStats()
    this.updateHeatMap()
    
    return {
      vehicles: [...this.vehicles],
      trafficLights: [...this.trafficLights],
      accidents: [...this.accidents],
      stats: { ...this.stats },
      heatMapData: [...this.heatMapData]
    }
  }

  updateTrafficLights(deltaTime) {
    this.trafficLights = this.trafficLights.map(tl => {
      const newTl = { ...tl }
      newTl.timer += deltaTime
      
      const totalCycle = newTl.green_duration + newTl.yellow_duration + newTl.red_duration
      const cyclePosition = newTl.timer % totalCycle
      
      if (cyclePosition < newTl.green_duration) {
        newTl.current_color = 'green'
      } else if (cyclePosition < newTl.green_duration + newTl.yellow_duration) {
        newTl.current_color = 'yellow'
      } else {
        newTl.current_color = 'red'
      }
      
      return newTl
    })
  }

  spawnVehicles(deltaTime) {
    this.spawnPoints.forEach(sp => {
      if (!this.vehicleSpawnTimers[sp.id]) {
        this.vehicleSpawnTimers[sp.id] = 0
      }
      
      this.vehicleSpawnTimers[sp.id] += deltaTime
      
      const spawnInterval = 60 / sp.spawn_rate
      
      if (this.vehicleSpawnTimers[sp.id] >= spawnInterval) {
        this.vehicleSpawnTimers[sp.id] = 0
        
        const road = this.roads.find(r => r.id === sp.road_id)
        if (road) {
          const startInter = this.intersections.find(i => i.id === road.start_intersection_id)
          const endInter = this.intersections.find(i => i.id === road.end_intersection_id)
          
          if (startInter && endInter) {
            const speed = sp.min_speed + Math.random() * (sp.max_speed - sp.min_speed)
            
            const newVehicle = {
              id: uuidv4(),
              road_id: road.id,
              position: sp.position || 0,
              direction: sp.direction === 'backward' ? 'backward' : 'forward',
              speed: speed,
              target_speed: speed,
              is_braking: false,
              spawn_time: this.time,
              route: this.generateRoute(road.id, sp.direction)
            }
            
            this.vehicles.push(newVehicle)
          }
        }
      }
    })
  }

  generateRoute(startRoadId, direction) {
    const route = []
    const visitedRoads = new Set()
    let currentRoadId = startRoadId
    let currentDirection = direction
    
    const maxSteps = 10
    let steps = 0
    
    while (steps < maxSteps) {
      const road = this.roads.find(r => r.id === currentRoadId)
      if (!road) break
      
      if (visitedRoads.has(currentRoadId)) break
      visitedRoads.add(currentRoadId)
      
      route.push({
        road_id: currentRoadId,
        direction: currentDirection
      })
      
      const nextIntersectionId = currentDirection === 'forward' 
        ? road.end_intersection_id 
        : road.start_intersection_id
      
      const connectedRoads = this.roads.filter(r => 
        r.id !== currentRoadId && 
        (r.start_intersection_id === nextIntersectionId || r.end_intersection_id === nextIntersectionId)
      )
      
      if (connectedRoads.length === 0) break
      
      const nextRoad = connectedRoads[Math.floor(Math.random() * connectedRoads.length)]
      const nextDirection = nextRoad.start_intersection_id === nextIntersectionId ? 'forward' : 'backward'
      
      currentRoadId = nextRoad.id
      currentDirection = nextDirection
      steps++
    }
    
    return route
  }

  updateVehicles(deltaTime) {
    const vehiclesToRemove = []
    
    this.vehicles = this.vehicles.map(vehicle => {
      const road = this.roads.find(r => r.id === vehicle.road_id)
      if (!road) return vehicle
      
      const startInter = this.intersections.find(i => i.id === road.start_intersection_id)
      const endInter = this.intersections.find(i => i.id === road.end_intersection_id)
      
      if (!startInter || !endInter) return vehicle
      
      const dx = endInter.x - startInter.x
      const dy = endInter.y - startInter.y
      const roadLength = Math.sqrt(dx * dx + dy * dy)
      
      const vehiclesOnRoad = this.vehicles.filter(v => 
        v.road_id === vehicle.road_id && 
        v.id !== vehicle.id
      )
      
      let shouldBrake = false
      let closestVehicleDistance = Infinity
      
      vehiclesOnRoad.forEach(otherVehicle => {
        const isAhead = vehicle.direction === 'forward'
          ? otherVehicle.position > vehicle.position
          : otherVehicle.position < vehicle.position
        
        if (isAhead) {
          const distance = Math.abs(otherVehicle.position - vehicle.position) * roadLength
          if (distance < closestVehicleDistance) {
            closestVehicleDistance = distance
          }
        }
      })
      
      if (closestVehicleDistance < 30) {
        shouldBrake = true
      }
      
      const currentIntersectionId = vehicle.direction === 'forward'
        ? road.end_intersection_id
        : road.start_intersection_id
      
      const trafficLight = this.trafficLights.find(tl => 
        tl.intersection_id === currentIntersectionId &&
        tl.road_id === vehicle.road_id
      )
      
      if (trafficLight) {
        const distanceToIntersection = vehicle.direction === 'forward'
          ? (1 - vehicle.position) * roadLength
          : vehicle.position * roadLength
        
        if (distanceToIntersection < 40 && distanceToIntersection > 5) {
          if (trafficLight.current_color === 'red' || trafficLight.current_color === 'yellow') {
            shouldBrake = true
          }
        }
      }
      
      let newSpeed = vehicle.speed
      if (shouldBrake) {
        newSpeed = Math.max(0, vehicle.speed - 150 * deltaTime)
      } else {
        const speedLimit = road.speed_limit || 60
        const acceleration = 50
        
        const density = vehiclesOnRoad.length / Math.max(1, road.capacity || 100)
        const trafficMultiplier = Math.max(0.3, 1 - density * 0.8)
        
        const targetSpeed = Math.min(speedLimit * trafficMultiplier, vehicle.target_speed)
        
        if (vehicle.speed < targetSpeed) {
          newSpeed = Math.min(vehicle.speed + acceleration * deltaTime, targetSpeed)
        } else if (vehicle.speed > targetSpeed) {
          newSpeed = Math.max(vehicle.speed - acceleration * deltaTime, targetSpeed)
        }
      }
      
      const speedInPixelsPerSecond = (newSpeed / 3.6) * 0.5
      const positionDelta = (speedInPixelsPerSecond * deltaTime) / Math.max(roadLength, 1)
      
      let newPosition = vehicle.position + (vehicle.direction === 'forward' ? positionDelta : -positionDelta)
      
      let newRoadId = vehicle.road_id
      let newDirection = vehicle.direction
      let newRoute = [...vehicle.route]
      
      if (newPosition >= 1 || newPosition <= 0) {
        if (vehicle.route && vehicle.route.length > 0) {
          const currentRouteIndex = vehicle.route.findIndex(r => 
            r.road_id === vehicle.road_id && r.direction === vehicle.direction
          )
          
          if (currentRouteIndex >= 0 && currentRouteIndex < vehicle.route.length - 1) {
            const nextRoute = vehicle.route[currentRouteIndex + 1]
            newRoadId = nextRoute.road_id
            newDirection = nextRoute.direction
            newPosition = newDirection === 'forward' ? 0 : 1
          } else {
            vehiclesToRemove.push(vehicle.id)
            if (vehicle.spawn_time) {
              const travelTime = this.time - vehicle.spawn_time
              this.travelTimeHistory.push(travelTime)
              if (this.travelTimeHistory.length > 100) {
                this.travelTimeHistory.shift()
              }
            }
          }
        } else {
          if (newPosition >= 1) {
            const connectedRoads = this.roads.filter(r => 
              r.id !== vehicle.road_id && 
              r.start_intersection_id === road.end_intersection_id
            )
            
            if (connectedRoads.length > 0 && Math.random() > 0.3) {
              const nextRoad = connectedRoads[Math.floor(Math.random() * connectedRoads.length)]
              newRoadId = nextRoad.id
              newDirection = 'forward'
              newPosition = 0
              
              newRoute = this.generateRoute(nextRoad.id, 'forward')
            } else {
              vehiclesToRemove.push(vehicle.id)
              if (vehicle.spawn_time) {
                const travelTime = this.time - vehicle.spawn_time
                this.travelTimeHistory.push(travelTime)
                if (this.travelTimeHistory.length > 100) {
                  this.travelTimeHistory.shift()
                }
              }
            }
          } else {
            vehiclesToRemove.push(vehicle.id)
            if (vehicle.spawn_time) {
              const travelTime = this.time - vehicle.spawn_time
              this.travelTimeHistory.push(travelTime)
              if (this.travelTimeHistory.length > 100) {
                this.travelTimeHistory.shift()
              }
            }
          }
        }
      }
      
      return {
        ...vehicle,
        road_id: newRoadId,
        position: Math.max(0, Math.min(1, newPosition)),
        direction: newDirection,
        speed: newSpeed,
        is_braking: shouldBrake,
        route: newRoute
      }
    })
    
    this.vehicles = this.vehicles.filter(v => !vehiclesToRemove.includes(v.id))
  }

  checkAccidents() {
    if (Math.random() > 0.001) return
    
    const roadsWithTraffic = this.roads.filter(road => {
      const vehiclesOnRoad = this.vehicles.filter(v => v.road_id === road.id)
      return vehiclesOnRoad.length > 5
    })
    
    if (roadsWithTraffic.length === 0) return
    
    const riskyRoad = roadsWithTraffic[Math.floor(Math.random() * roadsWithTraffic.length)]
    const vehiclesOnRoad = this.vehicles.filter(v => v.road_id === riskyRoad.id)
    
    if (vehiclesOnRoad.length < 2) return
    
    const startInter = this.intersections.find(i => i.id === riskyRoad.start_intersection_id)
    const endInter = this.intersections.find(i => i.id === riskyRoad.end_intersection_id)
    
    if (!startInter || !endInter) return
    
    const randomVehicle = vehiclesOnRoad[Math.floor(Math.random() * vehiclesOnRoad.length)]
    const accidentX = startInter.x + (endInter.x - startInter.x) * randomVehicle.position
    const accidentY = startInter.y + (endInter.y - startInter.y) * randomVehicle.position
    
    const newAccident = {
      id: uuidv4(),
      x: accidentX,
      y: accidentY,
      road_id: riskyRoad.id,
      time: this.time,
      duration: 15
    }
    
    this.accidents.push(newAccident)
    
    this.vehicles = this.vehicles.filter(v => {
      if (v.road_id === riskyRoad.id) {
        const distance = Math.abs(v.position - randomVehicle.position)
        if (distance < 0.1) {
          return false
        }
      }
      return true
    })
  }

  calculateStats() {
    this.accidents = this.accidents.filter(a => this.time - a.time < a.duration)
    
    this.stats.total_vehicles = this.vehicles.length
    
    if (this.roads.length === 0) {
      this.stats.congestion_index = 0
    } else {
      let totalCongestion = 0
      this.roads.forEach(road => {
        const vehiclesOnRoad = this.vehicles.filter(v => v.road_id === road.id)
        const capacity = road.capacity || 100
        totalCongestion += Math.min(vehiclesOnRoad.length / capacity, 1)
      })
      this.stats.congestion_index = totalCongestion / this.roads.length
    }
    
    if (this.travelTimeHistory.length > 0) {
      this.stats.avg_travel_time = this.travelTimeHistory.reduce((a, b) => a + b, 0) / this.travelTimeHistory.length
    } else {
      this.stats.avg_travel_time = 30
    }
    
    if (this.vehicles.length > 0) {
      this.stats.avg_speed = this.vehicles.reduce((sum, v) => sum + v.speed, 0) / this.vehicles.length
    } else {
      this.stats.avg_speed = 0
    }
    
    let accidentRisk = 0
    
    const congestionRisk = this.stats.congestion_index * 0.5
    
    const activeAccidents = this.accidents.length
    const accidentHistoryRisk = activeAccidents * 0.1
    
    const speedVariance = this.vehicles.length > 1
      ? this.vehicles.reduce((sum, v) => sum + Math.pow(v.speed - this.stats.avg_speed, 2), 0) / this.vehicles.length
      : 0
    const speedVarianceRisk = Math.min(speedVariance / 100, 0.3)
    
    accidentRisk = Math.min(congestionRisk + accidentHistoryRisk + speedVarianceRisk, 1)
    this.stats.accident_risk = accidentRisk
  }

  updateHeatMap() {
    this.heatMapData = []
    
    this.roads.forEach(road => {
      const startInter = this.intersections.find(i => i.id === road.start_intersection_id)
      const endInter = this.intersections.find(i => i.id === road.end_intersection_id)
      
      if (!startInter || !endInter) return
      
      const vehiclesOnRoad = this.vehicles.filter(v => v.road_id === road.id)
      const capacity = road.capacity || 100
      const intensity = Math.min(vehiclesOnRoad.length / capacity, 1)
      
      const midX = (startInter.x + endInter.x) / 2
      const midY = (startInter.y + endInter.y) / 2
      
      this.heatMapData.push({
        x: midX,
        y: midY,
        intensity: intensity
      })
      
      vehiclesOnRoad.forEach(vehicle => {
        const vx = startInter.x + (endInter.x - startInter.x) * vehicle.position
        const vy = startInter.y + (endInter.y - startInter.y) * vehicle.position
        
        this.heatMapData.push({
          x: vx,
          y: vy,
          intensity: intensity * 0.5
        })
      })
    })
    
    this.intersections.forEach(inter => {
      const connectedRoads = this.roads.filter(r => 
        r.start_intersection_id === inter.id || r.end_intersection_id === inter.id
      )
      
      const hasTrafficLight = this.trafficLights.some(tl => tl.intersection_id === inter.id)
      
      if (hasTrafficLight) {
        let totalIntensity = 0
        connectedRoads.forEach(road => {
          const vehiclesOnRoad = this.vehicles.filter(v => v.road_id === road.id)
          const capacity = road.capacity || 100
          totalIntensity += Math.min(vehiclesOnRoad.length / capacity, 1)
        })
        
        if (connectedRoads.length > 0) {
          this.heatMapData.push({
            x: inter.x,
            y: inter.y,
            intensity: totalIntensity / connectedRoads.length
          })
        }
      }
    })
  }
}

export default SimulationEngine
