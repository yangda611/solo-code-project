import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRailwayStore = defineStore('railway', () => {
  const tracks = ref([])
  const stations = ref([])
  const switches = ref([])
  const signals = ref([])
  const trains = ref([])
  const conflicts = ref([])
  const simulationState = ref('stopped')
  const simulationSpeed = ref(1)
  const simulationTime = ref(0)
  
  const originalState = ref({
    tracks: [],
    stations: [],
    switches: [],
    signals: [],
    trains: []
  })

  const saveOriginalState = () => {
    originalState.value = {
      tracks: JSON.parse(JSON.stringify(tracks.value)),
      stations: JSON.parse(JSON.stringify(stations.value)),
      switches: JSON.parse(JSON.stringify(switches.value)),
      signals: JSON.parse(JSON.stringify(signals.value)),
      trains: JSON.parse(JSON.stringify(trains.value))
    }
  }

  const loadPreset = (presetType) => {
    resetSimulation()
    
    switch (presetType) {
      case 'normal':
        loadNormalPreset()
        break
      case 'single-line':
        loadSingleLineConflictPreset()
        break
      case 'platform':
        loadPlatformConflictPreset()
        break
      case 'switch':
        loadSwitchConflictPreset()
        break
      default:
        loadNormalPreset()
    }
    
    saveOriginalState()
  }

  const loadNormalPreset = () => {
    tracks.value = [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 200, endY: 150 },
      { id: 't2', from: 's1', to: 's2', type: 'main', startX: 200, startY: 150, endX: 450, endY: 150 },
      { id: 't3', from: 's2', to: 's3', type: 'main', startX: 450, startY: 150, endX: 600, endY: 150 },
      { id: 't4', from: 's3', to: 'end', type: 'main', startX: 600, startY: 150, endX: 750, endY: 150 },
      { id: 't5', from: 's1', to: 'station1', type: 'platform', startX: 200, startY: 150, endX: 250, endY: 200 },
      { id: 't6', from: 's2', to: 'station2', type: 'platform', startX: 450, startY: 150, endX: 500, endY: 200 }
    ]

    stations.value = [
      { id: 'station1', name: '北京站', x: 250, y: 200, platformCount: 2, occupied: false, connectedTrack: 't5' },
      { id: 'station2', name: '天津站', x: 500, y: 200, platformCount: 2, occupied: false, connectedTrack: 't6' }
    ]

    switches.value = [
      { 
        id: 's1', 
        name: '道岔1', 
        x: 200, 
        y: 150, 
        state: 'straight',
        incomingTrack: 't1',
        straightTrack: 't2',
        divergingTrack: 't5',
        connectedTracks: ['t1', 't2', 't5']
      },
      { 
        id: 's2', 
        name: '道岔2', 
        x: 450, 
        y: 150, 
        state: 'straight',
        incomingTrack: 't2',
        straightTrack: 't3',
        divergingTrack: 't6',
        connectedTracks: ['t2', 't3', 't6']
      },
      { 
        id: 's3', 
        name: '道岔3', 
        x: 600, 
        y: 150, 
        state: 'straight',
        incomingTrack: 't3',
        straightTrack: 't4',
        divergingTrack: null,
        connectedTracks: ['t3', 't4']
      }
    ]

    signals.value = [
      { id: 'sig1', name: '信号1', x: 100, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' },
      { id: 'sig2', name: '信号2', x: 300, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's2' },
      { id: 'sig3', name: '信号3', x: 500, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's3' },
      { id: 'sig4', name: '信号4', x: 650, y: 150, state: 'green', direction: 'forward', controlledSwitch: null }
    ]

    trains.value = [
      {
        id: 'train1',
        name: 'G101',
        type: 'fast',
        speed: 2,
        currentTrack: 't1',
        position: 0,
        direction: 'forward',
        state: 'stopped',
        schedule: [
          { station: 'station1', arrivalTime: 5, departureTime: 8 },
          { station: 'station2', arrivalTime: 15, departureTime: 18 }
        ],
        currentScheduleIndex: 0,
        x: 50,
        y: 150,
        originalX: 50,
        originalY: 150,
        originalTrack: 't1'
      },
      {
        id: 'train2',
        name: 'G102',
        type: 'fast',
        speed: 2,
        currentTrack: 't4',
        position: 100,
        direction: 'backward',
        state: 'stopped',
        schedule: [
          { station: 'station2', arrivalTime: 10, departureTime: 13 },
          { station: 'station1', arrivalTime: 20, departureTime: 23 }
        ],
        currentScheduleIndex: 0,
        x: 700,
        y: 150,
        originalX: 700,
        originalY: 150,
        originalTrack: 't4'
      }
    ]
  }

  const loadSingleLineConflictPreset = () => {
    tracks.value = [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 200, endY: 150 },
      { id: 't2', from: 's1', to: 's2', type: 'single', startX: 200, startY: 150, endX: 500, endY: 150 },
      { id: 't3', from: 's2', to: 'end', type: 'main', startX: 500, startY: 150, endX: 750, endY: 150 }
    ]

    stations.value = []

    switches.value = [
      { 
        id: 's1', 
        name: '道岔1', 
        x: 200, 
        y: 150, 
        state: 'straight',
        incomingTrack: 't1',
        straightTrack: 't2',
        divergingTrack: null,
        connectedTracks: ['t1', 't2']
      },
      { 
        id: 's2', 
        name: '道岔2', 
        x: 500, 
        y: 150, 
        state: 'straight',
        incomingTrack: 't2',
        straightTrack: 't3',
        divergingTrack: null,
        connectedTracks: ['t2', 't3']
      }
    ]

    signals.value = [
      { id: 'sig1', name: '信号1', x: 100, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' },
      { id: 'sig2', name: '信号2', x: 250, y: 150, state: 'green', direction: 'forward', controlledSwitch: null },
      { id: 'sig3', name: '信号3', x: 450, y: 150, state: 'red', direction: 'backward', controlledSwitch: 's2' },
      { id: 'sig4', name: '信号4', x: 600, y: 150, state: 'green', direction: 'backward', controlledSwitch: null }
    ]

    trains.value = [
      {
        id: 'train1',
        name: 'G101',
        type: 'fast',
        speed: 1.5,
        currentTrack: 't1',
        position: 0,
        direction: 'forward',
        state: 'stopped',
        schedule: [],
        currentScheduleIndex: 0,
        x: 80,
        y: 150,
        originalX: 80,
        originalY: 150,
        originalTrack: 't1'
      },
      {
        id: 'train2',
        name: 'G102',
        type: 'fast',
        speed: 1.5,
        currentTrack: 't3',
        position: 100,
        direction: 'backward',
        state: 'stopped',
        schedule: [],
        currentScheduleIndex: 0,
        x: 620,
        y: 150,
        originalX: 620,
        originalY: 150,
        originalTrack: 't3'
      }
    ]
  }

  const loadPlatformConflictPreset = () => {
    tracks.value = [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 250, endY: 150 },
      { id: 't2', from: 's1', to: 'end', type: 'main', startX: 250, startY: 150, endX: 750, endY: 150 },
      { id: 't3', from: 's1', to: 'station1', type: 'platform', startX: 250, startY: 150, endX: 300, endY: 250 }
    ]

    stations.value = [
      { id: 'station1', name: '北京南站', x: 300, y: 250, platformCount: 1, occupied: false, connectedTrack: 't3' }
    ]

    switches.value = [
      { 
        id: 's1', 
        name: '道岔1', 
        x: 250, 
        y: 150, 
        state: 'straight',
        incomingTrack: 't1',
        straightTrack: 't2',
        divergingTrack: 't3',
        connectedTracks: ['t1', 't2', 't3']
      }
    ]

    signals.value = [
      { id: 'sig1', name: '信号1', x: 100, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' },
      { id: 'sig2', name: '信号2', x: 400, y: 150, state: 'green', direction: 'forward', controlledSwitch: null }
    ]

    trains.value = [
      {
        id: 'train1',
        name: 'G101',
        type: 'fast',
        speed: 1,
        currentTrack: 't1',
        position: 0,
        direction: 'forward',
        state: 'stopped',
        schedule: [
          { station: 'station1', arrivalTime: 5, departureTime: 15 }
        ],
        currentScheduleIndex: 0,
        x: 50,
        y: 150,
        originalX: 50,
        originalY: 150,
        originalTrack: 't1'
      },
      {
        id: 'train2',
        name: 'G102',
        type: 'fast',
        speed: 1.5,
        currentTrack: 't1',
        position: -50,
        direction: 'forward',
        state: 'stopped',
        schedule: [
          { station: 'station1', arrivalTime: 8, departureTime: 12 }
        ],
        currentScheduleIndex: 0,
        x: 20,
        y: 150,
        originalX: 20,
        originalY: 150,
        originalTrack: 't1'
      }
    ]
  }

  const loadSwitchConflictPreset = () => {
    tracks.value = [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 300, endY: 150 },
      { id: 't2', from: 's1', to: 'end1', type: 'main', startX: 300, startY: 150, endX: 700, endY: 150 },
      { id: 't3', from: 's1', to: 'end2', type: 'branch', startX: 300, startY: 150, endX: 600, endY: 250 }
    ]

    stations.value = []

    switches.value = [
      { 
        id: 's1', 
        name: '道岔1', 
        x: 300, 
        y: 150, 
        state: 'diverging',
        incomingTrack: 't1',
        straightTrack: 't2',
        divergingTrack: 't3',
        connectedTracks: ['t1', 't2', 't3']
      }
    ]

    signals.value = [
      { id: 'sig1', name: '信号1', x: 150, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' }
    ]

    trains.value = [
      {
        id: 'train1',
        name: 'G101',
        type: 'fast',
        speed: 1,
        currentTrack: 't1',
        position: 0,
        direction: 'forward',
        state: 'stopped',
        schedule: [],
        currentScheduleIndex: 0,
        x: 100,
        y: 150,
        originalX: 100,
        originalY: 150,
        originalTrack: 't1'
      }
    ]
  }

  const toggleSwitch = (switchId) => {
    const switchItem = switches.value.find(s => s.id === switchId)
    if (switchItem) {
      if (switchItem.state === 'straight') {
        if (switchItem.divergingTrack) {
          switchItem.state = 'diverging'
        }
      } else {
        if (switchItem.straightTrack) {
          switchItem.state = 'straight'
        }
      }
      detectConflicts()
    }
  }

  const toggleSignal = (signalId) => {
    const signalItem = signals.value.find(s => s.id === signalId)
    if (signalItem) {
      const states = ['red', 'yellow', 'green']
      const currentIndex = states.indexOf(signalItem.state)
      signalItem.state = states[(currentIndex + 1) % states.length]
      detectConflicts()
    }
  }

  const startSimulation = () => {
    simulationState.value = 'running'
    trains.value.forEach(train => {
      train.state = 'running'
    })
  }

  const pauseSimulation = () => {
    simulationState.value = 'paused'
    trains.value.forEach(train => {
      if (train.state === 'running') {
        train.state = 'waiting'
      }
    })
  }

  const resetSimulation = () => {
    simulationState.value = 'stopped'
    simulationTime.value = 0
    conflicts.value = []
    
    if (originalState.value.trains.length > 0) {
      tracks.value = JSON.parse(JSON.stringify(originalState.value.tracks))
      stations.value = JSON.parse(JSON.stringify(originalState.value.stations))
      switches.value = JSON.parse(JSON.stringify(originalState.value.switches))
      signals.value = JSON.parse(JSON.stringify(originalState.value.signals))
      trains.value = JSON.parse(JSON.stringify(originalState.value.trains))
    } else {
      trains.value.forEach(train => {
        train.state = 'stopped'
        train.currentScheduleIndex = 0
        train.position = 0
        train.x = train.originalX || 0
        train.y = train.originalY || 150
        train.currentTrack = train.originalTrack || train.currentTrack
      })
      
      stations.value.forEach(station => {
        station.occupied = false
      })
      
      tracks.value.forEach(track => {
        track.occupied = false
      })
    }
  }

  const setSimulationSpeed = (speed) => {
    simulationSpeed.value = speed
  }

  const updateTrainSchedule = (trainId, schedule) => {
    const train = trains.value.find(t => t.id === trainId)
    if (train) {
      train.schedule = schedule
      detectConflicts()
    }
  }

  const stepSimulation = () => {
    if (simulationState.value !== 'running') return

    simulationTime.value += simulationSpeed.value * 0.1

    trains.value.forEach(train => {
      if (train.state !== 'running') return

      moveTrain(train)
      checkTrainSchedule(train)
    })

    detectConflicts()
  }

  const moveTrain = (train) => {
    const moveDistance = train.speed * simulationSpeed.value * 0.5
    
    const currentTrack = tracks.value.find(t => t.id === train.currentTrack)
    if (!currentTrack) return

    if (train.direction === 'forward') {
      train.position += moveDistance
      train.x += moveDistance
    } else {
      train.position -= moveDistance
      train.x -= moveDistance
    }

    currentTrack.occupied = true

    checkAndHandleSwitch(train, currentTrack)
  }

  const checkAndHandleSwitch = (train, currentTrack) => {
    if (train.direction === 'forward') {
      if (train.x >= currentTrack.endX - 5) {
        const sw = findSwitchAtTrackEnd(currentTrack.id, 'end')
        if (sw) {
          const nextTrack = getNextTrackAfterSwitch(train, sw)
          if (nextTrack) {
            switchToTrack(train, nextTrack, 'forward')
          } else {
            train.state = 'stopped'
            train.x = currentTrack.endX - 20
          }
        } else {
          train.state = 'stopped'
          train.x = currentTrack.endX - 20
        }
      }
    } else {
      if (train.x <= currentTrack.startX + 5) {
        const sw = findSwitchAtTrackEnd(currentTrack.id, 'start')
        if (sw) {
          const nextTrack = getNextTrackAfterSwitch(train, sw)
          if (nextTrack) {
            switchToTrack(train, nextTrack, 'backward')
          } else {
            train.state = 'stopped'
            train.x = currentTrack.startX + 20
          }
        } else {
          train.state = 'stopped'
          train.x = currentTrack.startX + 20
        }
      }
    }
  }

  const findSwitchAtTrackEnd = (trackId, endType) => {
    return switches.value.find(sw => {
      if (endType === 'end') {
        return sw.incomingTrack === trackId
      } else {
        return sw.straightTrack === trackId || sw.divergingTrack === trackId
      }
    })
  }

  const switchToTrack = (train, nextTrackId, direction) => {
    train.currentTrack = nextTrackId
    
    const newTrack = tracks.value.find(t => t.id === nextTrackId)
    if (newTrack) {
      if (direction === 'forward') {
        train.x = newTrack.startX + 5
        train.y = newTrack.startY
      } else {
        train.x = newTrack.endX - 5
        train.y = newTrack.endY
      }
    }
  }

  const getNextTrackAfterSwitch = (train, switchItem) => {
    if (train.direction === 'forward') {
      if (train.currentTrack === switchItem.incomingTrack) {
        if (switchItem.state === 'straight' && switchItem.straightTrack) {
          return switchItem.straightTrack
        } else if (switchItem.state === 'diverging' && switchItem.divergingTrack) {
          return switchItem.divergingTrack
        }
      }
    } else {
      if (train.currentTrack === switchItem.straightTrack || 
          train.currentTrack === switchItem.divergingTrack) {
        return switchItem.incomingTrack
      }
    }
    
    return null
  }

  const checkTrainSchedule = (train) => {
    if (train.schedule.length === 0) return

    const currentSchedule = train.schedule[train.currentScheduleIndex]
    if (!currentSchedule) return

    const station = stations.value.find(s => s.id === currentSchedule.station)
    if (!station) return

    const distanceToStation = Math.abs(train.x - station.x) + Math.abs(train.y - station.y)
    
    if (distanceToStation < 50) {
      if (train.state === 'running') {
        train.state = 'stopped'
        station.occupied = true
        
        setTimeout(() => {
          if (train.state === 'stopped') {
            train.state = 'running'
            station.occupied = false
            if (train.currentScheduleIndex < train.schedule.length - 1) {
              train.currentScheduleIndex++
            }
          }
        }, 3000 / simulationSpeed.value)
      }
    }
  }

  const detectConflicts = () => {
    conflicts.value = []
    
    detectRearEndConflicts()
    detectHeadOnConflicts()
    detectPlatformConflicts()
    detectSwitchConflicts()
  }

  const detectRearEndConflicts = () => {
    for (let i = 0; i < trains.value.length; i++) {
      for (let j = i + 1; j < trains.value.length; j++) {
        const train1 = trains.value[i]
        const train2 = trains.value[j]
        
        if (train1.currentTrack === train2.currentTrack && 
            train1.direction === train2.direction) {
          const distance = Math.abs(train1.x - train2.x)
          if (distance < 100 && distance > 0) {
            const leadingTrain = train1.x > train2.x ? 
              (train1.direction === 'forward' ? train1 : train2) :
              (train1.direction === 'forward' ? train2 : train1)
            const followingTrain = train1.x > train2.x ? 
              (train1.direction === 'forward' ? train2 : train1) :
              (train1.direction === 'forward' ? train1 : train2)
            
            if (followingTrain.speed >= leadingTrain.speed) {
              conflicts.value.push({
                type: 'rear-end',
                message: `${followingTrain.name} 可能追尾 ${leadingTrain.name}`,
                trains: [followingTrain.id, leadingTrain.id],
                position: (train1.x + train2.x) / 2
              })
            }
          }
        }
      }
    }
  }

  const detectHeadOnConflicts = () => {
    for (let i = 0; i < trains.value.length; i++) {
      for (let j = i + 1; j < trains.value.length; j++) {
        const train1 = trains.value[i]
        const train2 = trains.value[j]
        
        const track1 = tracks.value.find(t => t.id === train1.currentTrack)
        const track2 = tracks.value.find(t => t.id === train2.currentTrack)
        
        if (track1 && track2 && train1.direction !== train2.direction) {
          const distance = Math.abs(train1.x - train2.x)
          
          if (track1.id === track2.id && track1.type === 'single') {
            const approachingEachOther = 
              (train1.direction === 'forward' && train1.x < train2.x) ||
              (train1.direction === 'backward' && train1.x > train2.x)
            
            if (approachingEachOther && distance < 500) {
              conflicts.value.push({
                type: 'head-on',
                message: `${train1.name} 与 ${train2.name} 在单线区间会车冲突`,
                trains: [train1.id, train2.id],
                position: (train1.x + train2.x) / 2
              })
            }
          }
          
          if (track1.type === 'single' || track2.type === 'single') {
            const willEnterSingleTrack = checkWillEnterSameSingleTrack(train1, train2)
            if (willEnterSingleTrack && distance < 600) {
              conflicts.value.push({
                type: 'head-on',
                message: `${train1.name} 与 ${train2.name} 即将在单线区间会车冲突`,
                trains: [train1.id, train2.id],
                position: (train1.x + train2.x) / 2
              })
            }
          }
        }
      }
    }
  }

  const checkWillEnterSameSingleTrack = (train1, train2) => {
    const track1 = tracks.value.find(t => t.id === train1.currentTrack)
    const track2 = tracks.value.find(t => t.id === train2.currentTrack)
    
    if (!track1 || !track2) return false
    
    if (track1.type === 'single' || track2.type === 'single') {
      const singleTracks = tracks.value.filter(t => t.type === 'single')
      
      for (const singleTrack of singleTracks) {
        const train1WillEnter = trainWillEnterTrack(train1, singleTrack)
        const train2WillEnter = trainWillEnterTrack(train2, singleTrack)
        
        if (train1WillEnter && train2WillEnter) {
          return true
        }
      }
    }
    
    return false
  }

  const trainWillEnterTrack = (train, targetTrack) => {
    const currentTrack = tracks.value.find(t => t.id === train.currentTrack)
    if (!currentTrack) return false
    
    if (currentTrack.id === targetTrack.id) return true
    
    for (const sw of switches.value) {
      if (sw.connectedTracks.includes(train.currentTrack) && 
          sw.connectedTracks.includes(targetTrack.id)) {
        if (train.direction === 'forward') {
          if (train.currentTrack === sw.incomingTrack) {
            if ((sw.state === 'straight' && sw.straightTrack === targetTrack.id) ||
                (sw.state === 'diverging' && sw.divergingTrack === targetTrack.id)) {
              return true
            }
          }
        } else {
          if (targetTrack.id === sw.incomingTrack &&
              (train.currentTrack === sw.straightTrack || 
               train.currentTrack === sw.divergingTrack)) {
            return true
          }
        }
      }
    }
    
    return false
  }

  const detectPlatformConflicts = () => {
    stations.value.forEach(station => {
      const trainsActuallyAtStation = trains.value.filter(train => {
        const distanceToStation = Math.abs(train.x - station.x) + Math.abs(train.y - station.y)
        return distanceToStation < 80 && train.state === 'stopped'
      })

      if (trainsActuallyAtStation.length > 1 && station.platformCount < trainsActuallyAtStation.length) {
        conflicts.value.push({
          type: 'platform',
          message: `${station.name} 站台不足，${trainsActuallyAtStation.map(t => t.name).join('、')} 同时到站`,
          station: station.id,
          trains: trainsActuallyAtStation.map(t => t.id)
        })
      }

      for (let i = 0; i < trainsActuallyAtStation.length; i++) {
        for (let j = i + 1; j < trainsActuallyAtStation.length; j++) {
          conflicts.value.push({
            type: 'platform',
            message: `${station.name} 站台占用冲突：${trainsActuallyAtStation[i].name} 与 ${trainsActuallyAtStation[j].name} 同时占用站台`,
            station: station.id,
            trains: [trainsActuallyAtStation[i].id, trainsActuallyAtStation[j].id]
          })
        }
      }
    })
  }

  const detectSwitchConflicts = () => {
    switches.value.forEach(sw => {
      const nearbyTrains = trains.value.filter(train => {
        return Math.abs(train.x - sw.x) < 100
      })

      if (nearbyTrains.length > 0) {
        const train = nearbyTrains[0]
        const nextTrack = getNextTrackAfterSwitch(train, sw)
        
        if (!nextTrack && train.currentTrack === sw.incomingTrack) {
          conflicts.value.push({
            type: 'switch',
            message: `${sw.name} 状态错误，${train.name} 无法通过`,
            switch: sw.id,
            train: train.id
          })
        }
      }
    })
  }

  return {
    tracks,
    stations,
    switches,
    signals,
    trains,
    conflicts,
    simulationState,
    simulationSpeed,
    simulationTime,
    loadPreset,
    toggleSwitch,
    toggleSignal,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSimulationSpeed,
    updateTrainSchedule,
    stepSimulation,
    detectConflicts
  }
})
