<template>
  <div class="app-container">
    <header class="app-header">
      <h1>铁路调度模拟系统</h1>
      <div class="preset-buttons">
        <button @click="loadPreset('normal')" class="preset-btn normal">正常调度方案</button>
        <button @click="loadPreset('single-line')" class="preset-btn conflict">单线会车冲突</button>
        <button @click="loadPreset('platform')" class="preset-btn conflict">站台占用冲突</button>
        <button @click="loadPreset('switch')" class="preset-btn conflict">道岔切换错误</button>
      </div>
    </header>
    
    <main class="app-main">
      <div class="track-view">
        <TrackView 
          :tracks="tracks"
          :stations="stations"
          :switches="switches"
          :signals="signals"
          :trains="trains"
          :conflicts="conflicts"
          @switch-toggle="toggleSwitch"
          @signal-toggle="toggleSignal"
        />
      </div>
      
      <div class="control-panel">
        <ControlPanel 
          :simulationState="simulationState"
          :speed="simulationSpeed"
          @start="startSimulation"
          @pause="pauseSimulation"
          @reset="resetSimulation"
          @speed-change="changeSpeed"
        />
        
        <ScheduleEditor 
          :trains="trains"
          :stations="stations"
          @schedule-update="updateSchedule"
        />
      </div>
    </main>
    
    <div v-if="conflicts.length > 0" class="conflict-alert">
      <div class="conflict-header">
        <span class="conflict-icon">⚠️</span>
        <span>检测到 {{ conflicts.length }} 个冲突</span>
      </div>
      <div class="conflict-list">
        <div 
          v-for="(conflict, index) in conflicts" 
          :key="index"
          class="conflict-item"
          :class="conflict.type"
        >
          <span class="conflict-type">{{ getConflictTypeName(conflict.type) }}</span>
          <span class="conflict-message">{{ conflict.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRailwayStore } from './stores/railway'
import TrackView from './components/TrackView.vue'
import ControlPanel from './components/ControlPanel.vue'
import ScheduleEditor from './components/ScheduleEditor.vue'

export default {
  name: 'App',
  components: {
    TrackView,
    ControlPanel,
    ScheduleEditor
  },
  setup() {
    const railwayStore = useRailwayStore()
    
    const tracks = computed(() => railwayStore.tracks)
    const stations = computed(() => railwayStore.stations)
    const switches = computed(() => railwayStore.switches)
    const signals = computed(() => railwayStore.signals)
    const trains = computed(() => railwayStore.trains)
    const conflicts = computed(() => railwayStore.conflicts)
    const simulationState = computed(() => railwayStore.simulationState)
    const simulationSpeed = computed(() => railwayStore.simulationSpeed)
    
    let simulationInterval = null
    
    const loadPreset = (presetType) => {
      pauseSimulation()
      railwayStore.loadPreset(presetType)
    }
    
    const toggleSwitch = (switchId) => {
      railwayStore.toggleSwitch(switchId)
    }
    
    const toggleSignal = (signalId) => {
      railwayStore.toggleSignal(signalId)
    }
    
    const startSimulation = () => {
      if (simulationState.value === 'running') return
      
      railwayStore.startSimulation()
      simulationInterval = setInterval(() => {
        railwayStore.stepSimulation()
      }, 500 / simulationSpeed.value)
    }
    
    const pauseSimulation = () => {
      railwayStore.pauseSimulation()
      if (simulationInterval) {
        clearInterval(simulationInterval)
        simulationInterval = null
      }
    }
    
    const resetSimulation = () => {
      pauseSimulation()
      railwayStore.resetSimulation()
    }
    
    const changeSpeed = (speed) => {
      railwayStore.setSimulationSpeed(speed)
      if (simulationInterval) {
        clearInterval(simulationInterval)
        simulationInterval = setInterval(() => {
          railwayStore.stepSimulation()
        }, 500 / simulationSpeed.value)
      }
    }
    
    const updateSchedule = (trainId, schedule) => {
      railwayStore.updateTrainSchedule(trainId, schedule)
    }
    
    const getConflictTypeName = (type) => {
      const types = {
        'rear-end': '追尾冲突',
        'head-on': '对向冲突',
        'platform': '站台占用冲突',
        'switch': '道岔冲突'
      }
      return types[type] || type
    }
    
    onMounted(() => {
      railwayStore.loadPreset('normal')
    })
    
    onUnmounted(() => {
      if (simulationInterval) {
        clearInterval(simulationInterval)
      }
    })
    
    return {
      tracks,
      stations,
      switches,
      signals,
      trains,
      conflicts,
      simulationState,
      simulationSpeed,
      loadPreset,
      toggleSwitch,
      toggleSignal,
      startSimulation,
      pauseSimulation,
      resetSimulation,
      changeSpeed,
      updateSchedule,
      getConflictTypeName
    }
  }
}
</script>