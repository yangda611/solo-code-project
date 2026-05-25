<template>
  <div class="state-graph-container" ref="container">
    <svg :width="width" :height="height" class="graph-svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
        </marker>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0" />
          <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0" />
        </linearGradient>
      </defs>

      <g v-for="(row, i) in model.transitionMatrix" :key="'edges-' + i">
        <g v-for="(prob, j) in row" :key="'edge-' + i + '-' + j" v-if="prob > 0 && i !== j">
          <line :x1="nodePositions[i]?.x" :y1="nodePositions[i]?.y"
                :x2="nodePositions[j]?.x" :y2="nodePositions[j]?.y"
                :stroke="getEdgeColor(prob)" :stroke-width="1 + prob * 8"
                stroke-opacity="0.4" marker-end="url(#arrowhead)" />
          <line v-if="animate" 
                class="flow-line"
                :x1="nodePositions[i]?.x" :y1="nodePositions[i]?.y"
                :x2="nodePositions[j]?.x" :y2="nodePositions[j]?.y"
                stroke="url(#flowGradient)" :stroke-width="2 + prob * 6"
                :style="{ animationDelay: (i * 0.3) + 's' }" />
        </g>
        <circle v-if="row[i] > 0.5" 
                :cx="nodePositions[i]?.x" 
                :cy="nodePositions[i]?.y - 45" 
                :r="15 + row[i] * 10" 
                fill="none" 
                :stroke="getEdgeColor(row[i])" stroke-width="2" />
      </g>

      <g v-for="(state, i) in model.states" :key="'node-group-' + i">
        <circle class="state-node-circle"
                :cx="nodePositions[i]?.x" 
                :cy="nodePositions[i]?.y" 
                :r="40 + (steadyState ? steadyState[i] * 20 : 0)"
                :fill="getFillColor(i)"
                :stroke="stateColors[i % stateColors.length]"
                stroke-width="3"
                :class="{ active: steadyState && steadyState[i] > 0.5, absorbing: isAbsorbing(i) }" />
        <text :x="nodePositions[i]?.x" :y="nodePositions[i]?.y + 5" 
              text-anchor="middle" fill="white" font-size="12" font-weight="bold">
          {{ state }}
        </text>
        <text v-if="steadyState" 
              :x="nodePositions[i]?.x" :y="nodePositions[i]?.y + 25" 
              text-anchor="middle" fill="#a5b4fc" font-size="10">
          {{ (steadyState[i] * 100).toFixed(1) }}%
        </text>
      </g>
    </svg>
    
    <div class="legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #10b981"></span>
        <span>高概率转移</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #6366f1"></span>
        <span>中等概率转移</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #f59e0b"></span>
        <span>低概率转移</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';

export default {
  name: 'StateGraph',
  props: {
    model: Object,
    steadyState: Array,
    animate: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const container = ref(null);
    const width = ref(700);
    const height = ref(500);

    const stateColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    const nodePositions = computed(() => {
      const n = props.model.states.length;
      const positions = [];
      const centerX = width.value / 2;
      const centerY = height.value / 2;
      const radius = Math.min(width.value, height.value) * 0.35;

      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      }
      return positions;
    });

    const getEdgeColor = (prob) => {
      if (prob > 0.6) return '#10b981';
      if (prob > 0.3) return '#6366f1';
      if (prob > 0.1) return '#f59e0b';
      return '#ef4444';
    };

    const getFillColor = (i) => {
      const baseColor = stateColors[i % stateColors.length];
      const prob = props.steadyState ? props.steadyState[i] : 0.3;
      const alpha = Math.floor(prob * 200).toString(16).padStart(2, '0');
      return baseColor + alpha;
    };

    const isAbsorbing = (i) => {
      return props.model.transitionMatrix[i][i] > 0.9;
    };

    return {
      container, width, height, nodePositions,
      stateColors, getEdgeColor, getFillColor, isAbsorbing
    };
  }
};
</script>

<style scoped>
.state-graph-container {
  position: relative;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border-radius: 16px;
  padding: 20px;
  overflow: hidden;
}

.graph-svg {
  display: block;
}

.state-node-circle {
  transition: all 0.5s ease;
  cursor: pointer;
}

.state-node-circle:hover {
  filter: brightness(1.2);
  transform-origin: center;
}

.state-node-circle.active {
  animation: pulse-glow 2s ease-in-out infinite;
}

.state-node-circle.absorbing {
  stroke-dasharray: 5, 5;
  animation: dash-rotate 3s linear infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 10px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 30px currentColor);
  }
}

@keyframes dash-rotate {
  to {
    stroke-dashoffset: -100;
  }
}

.flow-line {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: flow 3s ease-in-out infinite;
}

@keyframes flow {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -100;
    opacity: 0;
  }
}

.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(30, 27, 75, 0.9);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #6366f1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  color: #a5b4fc;
  font-size: 12px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 20px;
  height: 4px;
  border-radius: 2px;
}
</style>
