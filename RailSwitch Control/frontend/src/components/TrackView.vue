<template>
  <div class="track-view-container">
    <svg class="track-svg" viewBox="0 0 800 400">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#4a5568" />
        </marker>
      </defs>
      
      <g v-for="track in tracks" :key="track.id" class="track-group">
        <line 
          :class="['track-line', { highlight: isTrackHighlighted(track.id) }]"
          :x1="getTrackStartX(track)"
          :y1="getTrackStartY(track)"
          :x2="getTrackEndX(track)"
          :y2="getTrackEndY(track)"
        />
      </g>
      
      <g v-for="station in stations" :key="station.id" class="station" @click="onStationClick(station)">
        <rect 
          :class="['station-platform', { occupied: station.occupied }]"
          :x="station.x - 40"
          :y="station.y - 15"
          width="80"
          height="30"
          rx="4"
        />
        <text 
          class="station-label"
          :x="station.x"
          :y="station.y + 5"
          text-anchor="middle"
        >
          {{ station.name }}
        </text>
      </g>
      
      <g v-for="sw in switches" :key="sw.id" class="switch" @click="$emit('switch-toggle', sw.id)">
        <circle 
          class="switch-body"
          :cx="sw.x"
          :cy="sw.y"
          r="15"
        />
        <line 
          v-if="getSwitchArmEnd(sw)"
          class="switch-arm"
          :x1="sw.x"
          :y1="sw.y"
          :x2="getSwitchArmEnd(sw).x"
          :y2="getSwitchArmEnd(sw).y"
          stroke="#00d4ff"
          stroke-width="4"
          stroke-linecap="round"
        />
        <text 
          :x="sw.x"
          :y="sw.y - 25"
          text-anchor="middle"
          font-size="10"
          fill="#a0aec0"
        >
          {{ sw.name }}
        </text>
      </g>
      
      <g v-for="signal in signals" :key="signal.id" class="signal" @click="$emit('signal-toggle', signal.id)">
        <rect 
          class="signal-body"
          :x="signal.x - 8"
          :y="signal.y - 25"
          width="16"
          height="50"
          rx="3"
        />
        <circle 
          :class="['signal-light', getSignalLightClass(signal, 'top')]"
          :cx="signal.x"
          :cy="signal.y - 15"
          r="5"
        />
        <circle 
          :class="['signal-light', getSignalLightClass(signal, 'middle')]"
          :cx="signal.x"
          :cy="signal.y"
          r="5"
        />
        <circle 
          :class="['signal-light', getSignalLightClass(signal, 'bottom')]"
          :cx="signal.x"
          :cy="signal.y + 15"
          r="5"
        />
        <text 
          :x="signal.x"
          :y="signal.y + 35"
          text-anchor="middle"
          font-size="10"
          fill="#a0aec0"
        >
          {{ signal.name }}
        </text>
      </g>
      
      <g v-for="train in trains" :key="train.id" 
         :class="['train', { 'train-conflict': isTrainInConflict(train.id) }]">
        <rect 
          :class="['train-body', train.type]"
          :x="train.x - 20"
          :y="train.y - 10"
          width="40"
          height="20"
          rx="3"
        />
        <text 
          class="train-label"
          :x="train.x"
          :y="train.y + 4"
          text-anchor="middle"
        >
          {{ train.name }}
        </text>
        <polygon 
          v-if="train.direction === 'forward'"
          :points="`${train.x + 25},${train.y - 5} ${train.x + 35},${train.y} ${train.x + 25},${train.y + 5}`"
          fill="#00d4ff"
        />
        <polygon 
          v-else
          :points="`${train.x - 25},${train.y - 5} ${train.x - 35},${train.y} ${train.x - 25},${train.y + 5}`"
          fill="#00d4ff"
        />
      </g>
      
      <g v-for="(conflict, index) in conflicts" :key="index" class="conflict-marker">
        <circle 
          :cx="getConflictPosition(conflict)"
          :cy="150"
          r="25"
          fill="none"
          stroke="#ff4444"
          stroke-width="3"
          stroke-dasharray="5,5"
          class="conflict-ring"
        >
          <animate attributeName="r" from="25" to="40" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite" />
        </circle>
        <text 
          :x="getConflictPosition(conflict)"
          :y="155"
          text-anchor="middle"
          font-size="24"
          fill="#ff4444"
        >
          ⚠️
        </text>
      </g>
    </svg>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'TrackView',
  props: {
    tracks: {
      type: Array,
      required: true
    },
    stations: {
      type: Array,
      required: true
    },
    switches: {
      type: Array,
      required: true
    },
    signals: {
      type: Array,
      required: true
    },
    trains: {
      type: Array,
      required: true
    },
    conflicts: {
      type: Array,
      required: true
    }
  },
  emits: ['switch-toggle', 'signal-toggle'],
  setup(props, { emit }) {
    const getTrackStartX = (track) => {
      if (track.startX !== undefined) return track.startX
      
      if (track.from === 'start') return 50
      if (track.from === 'station1') return 150
      if (track.from === 'station2') return 400
      
      const sw = props.switches.find(s => s.id === track.from)
      if (sw) return sw.x
      
      return 100
    }
    
    const getTrackStartY = (track) => {
      if (track.startY !== undefined) return track.startY
      
      if (track.from === 'station1') return 200
      if (track.from === 'station2') return 200
      return 150
    }
    
    const getTrackEndX = (track) => {
      if (track.endX !== undefined) return track.endX
      
      if (track.to === 'end') return 750
      if (track.to === 'end1') return 750
      if (track.to === 'end2') return 650
      if (track.to === 'station1') return 150
      if (track.to === 'station2') return 400
      
      const sw = props.switches.find(s => s.id === track.to)
      if (sw) return sw.x
      
      return 700
    }
    
    const getTrackEndY = (track) => {
      if (track.endY !== undefined) return track.endY
      
      if (track.to === 'station1') return 200
      if (track.to === 'station2') return 200
      if (track.to === 'end2') return 250
      return 150
    }
    
    const isTrackHighlighted = (trackId) => {
      return props.trains.some(train => train.currentTrack === trackId && train.state === 'running')
    }
    
    const isTrainInConflict = (trainId) => {
      return props.conflicts.some(conflict => 
        conflict.trains && conflict.trains.includes(trainId)
      )
    }
    
    const getSignalLightClass = (signal, position) => {
      if (signal.state === 'red' && position === 'top') return 'red'
      if (signal.state === 'yellow' && position === 'middle') return 'yellow'
      if (signal.state === 'green' && position === 'bottom') return 'green'
      return 'off'
    }
    
    const getConflictPosition = (conflict) => {
      if (conflict.position) return conflict.position
      if (conflict.station) {
        const station = props.stations.find(s => s.id === conflict.station)
        if (station) return station.x
      }
      return 400
    }
    
    const onStationClick = (station) => {
      console.log('Station clicked:', station)
    }
    
    const getSwitchArmEnd = (sw) => {
      let targetTrackId = null
      if (sw.state === 'straight' && sw.straightTrack) {
        targetTrackId = sw.straightTrack
      } else if (sw.state === 'diverging' && sw.divergingTrack) {
        targetTrackId = sw.divergingTrack
      }
      
      if (!targetTrackId) return null
      
      const track = props.tracks.find(t => t.id === targetTrackId)
      if (!track) return null
      
      const dx = track.endX - sw.x
      const dy = track.endY - sw.y
      
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length === 0) return null
      
      const armLength = 25
      const scale = armLength / length
      return {
        x: sw.x + dx * scale,
        y: sw.y + dy * scale
      }
    }
    
    return {
      getTrackStartX,
      getTrackStartY,
      getTrackEndX,
      getTrackEndY,
      isTrackHighlighted,
      isTrainInConflict,
      getSignalLightClass,
      getConflictPosition,
      onStationClick,
      getSwitchArmEnd
    }
  }
}
</script>