const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

let simulationState = {
  tracks: [],
  stations: [],
  switches: [],
  signals: [],
  trains: [],
  conflicts: [],
  state: 'stopped',
  speed: 1,
  time: 0
}

const presets = {
  normal: {
    tracks: [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 200, endY: 150 },
      { id: 't2', from: 's1', to: 's2', type: 'main', startX: 200, startY: 150, endX: 450, endY: 150 },
      { id: 't3', from: 's2', to: 's3', type: 'main', startX: 450, startY: 150, endX: 600, endY: 150 },
      { id: 't4', from: 's3', to: 'end', type: 'main', startX: 600, startY: 150, endX: 750, endY: 150 },
      { id: 't5', from: 's1', to: 'station1', type: 'platform', startX: 200, startY: 150, endX: 150, endY: 200 },
      { id: 't6', from: 's2', to: 'station2', type: 'platform', startX: 450, startY: 150, endX: 400, endY: 200 }
    ],
    stations: [
      { id: 'station1', name: '北京站', x: 150, y: 200, platformCount: 2, occupied: false, connectedTrack: 't5' },
      { id: 'station2', name: '天津站', x: 400, y: 200, platformCount: 2, occupied: false, connectedTrack: 't6' }
    ],
    switches: [
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
    ],
    signals: [
      { id: 'sig1', name: '信号1', x: 100, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' },
      { id: 'sig2', name: '信号2', x: 300, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's2' },
      { id: 'sig3', name: '信号3', x: 500, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's3' },
      { id: 'sig4', name: '信号4', x: 650, y: 150, state: 'green', direction: 'forward', controlledSwitch: null }
    ],
    trains: [
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
  },
  'single-line': {
    tracks: [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 200, endY: 150 },
      { id: 't2', from: 's1', to: 's2', type: 'single', startX: 200, startY: 150, endX: 500, endY: 150 },
      { id: 't3', from: 's2', to: 'end', type: 'main', startX: 500, startY: 150, endX: 750, endY: 150 }
    ],
    stations: [],
    switches: [
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
    ],
    signals: [
      { id: 'sig1', name: '信号1', x: 100, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' },
      { id: 'sig2', name: '信号2', x: 250, y: 150, state: 'green', direction: 'forward', controlledSwitch: null },
      { id: 'sig3', name: '信号3', x: 450, y: 150, state: 'red', direction: 'backward', controlledSwitch: 's2' },
      { id: 'sig4', name: '信号4', x: 600, y: 150, state: 'green', direction: 'backward', controlledSwitch: null }
    ],
    trains: [
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
  },
  platform: {
    tracks: [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 250, endY: 150 },
      { id: 't2', from: 's1', to: 'end', type: 'main', startX: 250, startY: 150, endX: 750, endY: 150 },
      { id: 't3', from: 's1', to: 'station1', type: 'platform', startX: 250, startY: 150, endX: 300, endY: 250 }
    ],
    stations: [
      { id: 'station1', name: '北京南站', x: 300, y: 250, platformCount: 1, occupied: false, connectedTrack: 't3' }
    ],
    switches: [
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
    ],
    signals: [
      { id: 'sig1', name: '信号1', x: 100, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' },
      { id: 'sig2', name: '信号2', x: 400, y: 150, state: 'green', direction: 'forward', controlledSwitch: null }
    ],
    trains: [
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
  },
  switch: {
    tracks: [
      { id: 't1', from: 'start', to: 's1', type: 'main', startX: 50, startY: 150, endX: 300, endY: 150 },
      { id: 't2', from: 's1', to: 'end1', type: 'main', startX: 300, startY: 150, endX: 700, endY: 150 },
      { id: 't3', from: 's1', to: 'end2', type: 'branch', startX: 300, startY: 150, endX: 600, endY: 250 }
    ],
    stations: [],
    switches: [
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
    ],
    signals: [
      { id: 'sig1', name: '信号1', x: 150, y: 150, state: 'green', direction: 'forward', controlledSwitch: 's1' }
    ],
    trains: [
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
}

const detectConflicts = (state) => {
  const conflicts = []
  
  for (let i = 0; i < state.trains.length; i++) {
    for (let j = i + 1; j < state.trains.length; j++) {
      const train1 = state.trains[i]
      const train2 = state.trains[j]
      
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
            conflicts.push({
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
  
  for (let i = 0; i < state.trains.length; i++) {
    for (let j = i + 1; j < state.trains.length; j++) {
      const train1 = state.trains[i]
      const train2 = state.trains[j]
      
      const track1 = state.tracks.find(t => t.id === train1.currentTrack)
      const track2 = state.tracks.find(t => t.id === train2.currentTrack)
      
      if (track1 && track2 && train1.direction !== train2.direction) {
        const distance = Math.abs(train1.x - train2.x)
        
        if (track1.id === track2.id && track1.type === 'single') {
          const approachingEachOther = 
            (train1.direction === 'forward' && train1.x < train2.x) ||
            (train1.direction === 'backward' && train1.x > train2.x)
          
          if (approachingEachOther && distance < 500) {
            conflicts.push({
              type: 'head-on',
              message: `${train1.name} 与 ${train2.name} 在单线区间会车冲突`,
              trains: [train1.id, train2.id],
              position: (train1.x + train2.x) / 2
            })
          }
        }
      }
    }
  }
  
  state.stations.forEach(station => {
    const trainsAtStation = state.trains.filter(train => {
      const currentSchedule = train.schedule[train.currentScheduleIndex]
      if (!currentSchedule) return false
      return currentSchedule.station === station.id
    })

    if (trainsAtStation.length > 1 && station.platformCount < trainsAtStation.length) {
      conflicts.push({
        type: 'platform',
        message: `${station.name} 站台不足，${trainsAtStation.map(t => t.name).join('、')} 同时到站`,
        station: station.id,
        trains: trainsAtStation.map(t => t.id)
      })
    }

    for (let i = 0; i < trainsAtStation.length; i++) {
      for (let j = i + 1; j < trainsAtStation.length; j++) {
        const schedule1 = trainsAtStation[i].schedule.find(s => s.station === station.id)
        const schedule2 = trainsAtStation[j].schedule.find(s => s.station === station.id)
        
        if (schedule1 && schedule2) {
          const arrival1 = schedule1.arrivalTime
          const departure1 = schedule1.departureTime
          const arrival2 = schedule2.arrivalTime
          const departure2 = schedule2.departureTime
          
          if (!(departure1 <= arrival2 || departure2 <= arrival1)) {
            conflicts.push({
              type: 'platform',
              message: `${station.name} 站台占用冲突：${trainsAtStation[i].name}(${arrival1}-${departure1}) 与 ${trainsAtStation[j].name}(${arrival2}-${departure2})`,
              station: station.id,
              trains: [trainsAtStation[i].id, trainsAtStation[j].id]
            })
          }
        }
      }
    }
  })
  
  state.switches.forEach(sw => {
    const nearbyTrains = state.trains.filter(train => {
      return Math.abs(train.x - sw.x) < 100
    })

    if (nearbyTrains.length > 0) {
      const train = nearbyTrains[0]
      let nextTrack = null
      
      if (train.direction === 'forward') {
        if (train.currentTrack === sw.incomingTrack) {
          if (sw.state === 'straight' && sw.straightTrack) {
            nextTrack = sw.straightTrack
          } else if (sw.state === 'diverging' && sw.divergingTrack) {
            nextTrack = sw.divergingTrack
          }
        }
      } else {
        if (train.currentTrack === sw.straightTrack || 
            train.currentTrack === sw.divergingTrack) {
          nextTrack = sw.incomingTrack
        }
      }
      
      if (!nextTrack && train.currentTrack === sw.incomingTrack) {
        conflicts.push({
          type: 'switch',
          message: `${sw.name} 状态错误，${train.name} 无法通过`,
          switch: sw.id,
          train: train.id
        })
      }
    }
  })
  
  return conflicts
}

app.get('/api/state', (req, res) => {
  res.json(simulationState)
})

app.post('/api/preset/:type', (req, res) => {
  const presetType = req.params.type
  const preset = presets[presetType]
  
  if (!preset) {
    return res.status(404).json({ error: '预设不存在' })
  }
  
  simulationState = {
    ...preset,
    state: 'stopped',
    speed: 1,
    time: 0,
    conflicts: detectConflicts(preset)
  }
  
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/simulation/start', (req, res) => {
  simulationState.state = 'running'
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/simulation/pause', (req, res) => {
  simulationState.state = 'paused'
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/simulation/reset', (req, res) => {
  simulationState.state = 'stopped'
  simulationState.time = 0
  simulationState.conflicts = []
  
  simulationState.trains.forEach(train => {
    train.state = 'stopped'
    train.currentScheduleIndex = 0
    train.position = 0
    train.x = train.originalX || 0
    train.y = train.originalY || 150
    train.currentTrack = train.originalTrack || train.currentTrack
  })
  
  simulationState.stations.forEach(station => {
    station.occupied = false
  })
  
  simulationState.tracks.forEach(track => {
    track.occupied = false
  })
  
  simulationState.conflicts = detectConflicts(simulationState)
  
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/simulation/speed', (req, res) => {
  const { speed } = req.body
  simulationState.speed = speed
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/switch/:id/toggle', (req, res) => {
  const switchId = req.params.id
  const switchItem = simulationState.switches.find(s => s.id === switchId)
  
  if (!switchItem) {
    return res.status(404).json({ error: '道岔不存在' })
  }
  
  switchItem.state = switchItem.state === 'straight' ? 'diverging' : 'straight'
  simulationState.conflicts = detectConflicts(simulationState)
  
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/signal/:id/toggle', (req, res) => {
  const signalId = req.params.id
  const signalItem = simulationState.signals.find(s => s.id === signalId)
  
  if (!signalItem) {
    return res.status(404).json({ error: '信号灯不存在' })
  }
  
  const states = ['red', 'yellow', 'green']
  const currentIndex = states.indexOf(signalItem.state)
  signalItem.state = states[(currentIndex + 1) % states.length]
  
  simulationState.conflicts = detectConflicts(simulationState)
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

app.post('/api/train/:id/schedule', (req, res) => {
  const trainId = req.params.id
  const { schedule } = req.body
  
  const train = simulationState.trains.find(t => t.id === trainId)
  
  if (!train) {
    return res.status(404).json({ error: '列车不存在' })
  }
  
  train.schedule = schedule
  simulationState.conflicts = detectConflicts(simulationState)
  
  io.emit('stateUpdate', simulationState)
  res.json(simulationState)
})

io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id)
  
  socket.emit('stateUpdate', simulationState)
  
  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`铁路调度模拟系统后端服务运行在 http://localhost:${PORT}`)
})
