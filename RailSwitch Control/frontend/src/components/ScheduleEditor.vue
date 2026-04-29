<template>
  <div class="schedule-editor">
    <h3 class="schedule-title">列车时刻表</h3>
    
    <div v-if="trains.length === 0" class="no-trains">
      暂无列车数据，请先加载预设场景
    </div>
    
    <div v-for="train in trains" :key="train.id" class="train-schedule">
      <div class="train-schedule-header">
        <span class="train-schedule-name">{{ train.name }} ({{ getTrainTypeName(train.type) }})</span>
        <span :class="['train-schedule-status', train.state]">
          {{ getTrainStateText(train.state) }}
        </span>
      </div>
      
      <div v-if="train.schedule.length > 0" class="train-schedule-items">
        <div 
          v-for="(item, index) in train.schedule" 
          :key="index"
          class="schedule-item"
          :class="{ current: index === train.currentScheduleIndex }"
        >
          <span class="schedule-item-label">站点:</span>
          <span class="schedule-item-value">{{ getStationName(item.station) }}</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-item-label">到达时间:</span>
          <span class="schedule-item-value">{{ train.schedule[train.currentScheduleIndex]?.arrivalTime }}s</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-item-label">发车时间:</span>
          <span class="schedule-item-value">{{ train.schedule[train.currentScheduleIndex]?.departureTime }}s</span>
        </div>
      </div>
      
      <div v-else class="no-schedule">
        该列车暂无时刻表
      </div>
      
      <div class="train-info">
        <div class="schedule-item">
          <span class="schedule-item-label">速度:</span>
          <span class="schedule-item-value">{{ train.speed }} 单位/s</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-item-label">方向:</span>
          <span class="schedule-item-value">
            {{ train.direction === 'forward' ? '正向' : '反向' }}
          </span>
        </div>
        <div class="schedule-item">
          <span class="schedule-item-label">位置:</span>
          <span class="schedule-item-value">{{ Math.round(train.x) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleEditor',
  props: {
    trains: {
      type: Array,
      required: true
    },
    stations: {
      type: Array,
      required: true
    }
  },
  emits: ['schedule-update'],
  setup(props, { emit }) {
    const getTrainTypeName = (type) => {
      const types = {
        'fast': '高铁',
        'slow': '普快'
      }
      return types[type] || type
    }
    
    const getTrainStateText = (state) => {
      const states = {
        'stopped': '停止',
        'running': '运行',
        'waiting': '等待'
      }
      return states[state] || state
    }
    
    const getStationName = (stationId) => {
      const station = props.stations.find(s => s.id === stationId)
      return station ? station.name : stationId
    }
    
    return {
      getTrainTypeName,
      getTrainStateText,
      getStationName
    }
  }
}
</script>