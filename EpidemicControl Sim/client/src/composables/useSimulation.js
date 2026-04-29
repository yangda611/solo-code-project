import { ref, computed, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const isConnected = ref(false)
const isRunning = ref(false)
const isPaused = ref(false)

const stats = ref({
  susceptible: 0,
  infected: 0,
  recovered: 0,
  isolated: 0,
  vaccinated: 0,
  total: 0
})

const history = ref([])
const people = ref([])
const riskMap = ref([])
const quarantineZones = ref([])

const params = ref({
  gridSize: 50,
  populationDensity: 0.3,
  infectionRate: 0.03,
  recoveryRate: 0.005,
  quarantinePolicy: 0.8,
  travelFrequency: 0.02,
  hospitalCapacity: 100,
  vaccineCoverage: 0.0,
  initialInfected: 5
})

let socket = null

export function useSimulation() {
  const connect = () => {
    if (socket && socket.connected) return

    socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      isConnected.value = true
      console.log('Connected to server')
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      isRunning.value = false
      isPaused.value = false
      console.log('Disconnected from server')
    })

    socket.on('simulation-update', (data) => {
      stats.value = data.stats
      history.value = data.history
      people.value = data.people
      riskMap.value = data.riskMap
      quarantineZones.value = data.quarantineZones
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  const startSimulation = () => {
    if (!socket || !socket.connected) {
      connect()
      setTimeout(() => startSimulation(), 500)
      return
    }
    isRunning.value = true
    isPaused.value = false
    socket.emit('start-simulation', params.value)
  }

  const pauseSimulation = () => {
    if (!socket || !socket.connected) return
    isPaused.value = true
    socket.emit('pause-simulation')
  }

  const resumeSimulation = () => {
    if (!socket || !socket.connected) return
    isPaused.value = false
    socket.emit('resume-simulation')
  }

  const stopSimulation = () => {
    if (!socket || !socket.connected) return
    isRunning.value = false
    isPaused.value = false
    socket.emit('stop-simulation')
  }

  const updateParams = (newParams) => {
    params.value = { ...params.value, ...newParams }
    if (socket && socket.connected && isRunning.value) {
      socket.emit('update-params', newParams)
    }
  }

  const infectionRate = computed(() => {
    if (stats.value.total === 0) return 0
    return ((stats.value.infected / stats.value.total) * 100).toFixed(2)
  })

  const recoveryRate = computed(() => {
    if (stats.value.total === 0) return 0
    return ((stats.value.recovered / stats.value.total) * 100).toFixed(2)
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    isRunning,
    isPaused,
    stats,
    history,
    people,
    riskMap,
    quarantineZones,
    params,
    infectionRate,
    recoveryRate,
    connect,
    disconnect,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    updateParams
  }
}
