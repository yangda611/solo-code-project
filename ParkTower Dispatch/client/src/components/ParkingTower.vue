<script setup>
import { computed } from 'vue';

const props = defineProps({
    state: {
        type: Object,
        required: true
    },
    animatingCars: {
        type: Array,
        default: () => []
    },
    highlightPaths: {
        type: Array,
        default: () => []
    }
});

const SPOT_SIZE = 40;
const FLOOR_HEIGHT = 60;
const ELEVATOR_WIDTH = 50;
const MARGIN = 20;

const config = computed(() => ({
    floors: props.state.floors || 5,
    spotsPerFloor: props.state.spotsPerFloor || 10,
    elevatorCount: props.state.elevatorCount || 2
}));

const towerWidth = computed(() => {
    return config.value.spotsPerFloor * SPOT_SIZE + ELEVATOR_WIDTH + 100;
});

const towerHeight = computed(() => {
    return config.value.floors * FLOOR_HEIGHT + 100;
});

const parkingStructure = computed(() => {
    return props.state.parkingStructure || [];
});

const floors = computed(() => {
    const structure = parkingStructure.value;
    if (!structure || structure.length === 0) {
        return [];
    }
    return [...structure].reverse().map((floor, index) => ({
        ...floor,
        displayIndex: index
    }));
});

const elevators = computed(() => {
    return props.state.elevators || [];
});

const getElevatorPosition = (elevator) => {
    const maxFloor = config.value.floors - 1;
    const y = (maxFloor - elevator.currentFloor) * FLOOR_HEIGHT + MARGIN;
    return {
        x: config.value.spotsPerFloor * SPOT_SIZE + 40,
        y: y
    };
};

const getSpotColor = (spot) => {
    if (spot.occupied) {
        return '#ef4444';
    }
    return '#22c55e';
};

const getElevatorColor = (elevator) => {
    if (elevator.isFault) {
        return '#78716c';
    }
    if (elevator.direction === 'up') {
        return '#3b82f6';
    }
    if (elevator.direction === 'down') {
        return '#f59e0b';
    }
    return '#60a5fa';
};

const getHighlightPath = (path) => {
    if (!path || path.length < 2) return '';
    
    let d = `M ${path[0].x} ${path[0].y}`;
    for (let i = 1; i < path.length; i++) {
        d += ` L ${path[i].x} ${path[i].y}`;
    }
    return d;
};
</script>

<template>
    <div class="parking-tower-container" :style="{ width: towerWidth + 150 + 'px', height: towerHeight + 100 + 'px' }">
        <svg 
            :width="towerWidth + 150" 
            :height="towerHeight + 100"
            class="parking-svg"
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                </marker>
            </defs>
            
            <g class="floors">
                <g 
                    v-for="(floor, floorIndex) in floors" 
                    :key="floor.floorNumber"
                    class="floor"
                >
                    <line 
                        :x1="MARGIN - 10" 
                        :y1="floorIndex * FLOOR_HEIGHT + MARGIN"
                        :x2="config.spotsPerFloor * SPOT_SIZE + MARGIN + ELEVATOR_WIDTH + 50"
                        :y2="floorIndex * FLOOR_HEIGHT + MARGIN"
                        stroke="#e5e7eb"
                        stroke-width="2"
                    />
                    
                    <text 
                        :x="MARGIN - 30"
                        :y="floorIndex * FLOOR_HEIGHT + MARGIN + 20"
                        class="floor-label"
                        font-size="12"
                        fill="#6b7280"
                        text-anchor="end"
                    >
                        {{ floor.floorNumber }}层
                    </text>
                    
                    <g class="spots">
                        <g 
                            v-for="(spot, spotIndex) in floor.spots" 
                            :key="spot.spotNumber"
                            class="spot"
                        >
                            <rect 
                                :x="spotIndex * SPOT_SIZE + MARGIN"
                                :y="floorIndex * FLOOR_HEIGHT + MARGIN + 10"
                                :width="SPOT_SIZE - 5"
                                :height="SPOT_SIZE - 5"
                                :fill="getSpotColor(spot)"
                                stroke="#d1d5db"
                                stroke-width="1"
                                rx="4"
                                class="spot-rect"
                                :class="{ 'occupied': spot.occupied, 'available': !spot.occupied }"
                            />
                            
                            <text 
                                v-if="spot.occupied"
                                :x="spotIndex * SPOT_SIZE + MARGIN + (SPOT_SIZE - 5) / 2"
                                :y="floorIndex * FLOOR_HEIGHT + MARGIN + 32"
                                font-size="10"
                                fill="white"
                                text-anchor="middle"
                                font-weight="bold"
                            >
                                {{ spot.carId }}
                            </text>
                        </g>
                    </g>
                </g>
            </g>
            
            <g class="elevators" v-if="elevators.length > 0">
                <g 
                    v-for="elevator in elevators" 
                    :key="elevator.id"
                    class="elevator"
                >
                    <rect 
                        :x="config.spotsPerFloor * SPOT_SIZE + MARGIN + 10"
                        :y="MARGIN - 5"
                        :width="ELEVATOR_WIDTH"
                        :height="config.floors * FLOOR_HEIGHT + 10"
                        fill="#f3f4f6"
                        stroke="#9ca3af"
                        stroke-width="2"
                    />
                    
                    <g class="elevator-car">
                        <rect 
                            :x="config.spotsPerFloor * SPOT_SIZE + MARGIN + 15"
                            :y="getElevatorPosition(elevator).y"
                            :width="ELEVATOR_WIDTH - 10"
                            :height="FLOOR_HEIGHT - 20"
                            :fill="getElevatorColor(elevator)"
                            stroke="#374151"
                            stroke-width="2"
                            rx="4"
                            class="elevator-rect"
                            :class="{ 'fault': elevator.isFault }"
                        />
                        
                        <text 
                            :x="config.spotsPerFloor * SPOT_SIZE + MARGIN + 15 + (ELEVATOR_WIDTH - 10) / 2"
                            :y="getElevatorPosition(elevator).y + (FLOOR_HEIGHT - 20) / 2 + 4"
                            font-size="12"
                            fill="white"
                            text-anchor="middle"
                            font-weight="bold"
                        >
                            {{ elevator.id }}
                        </text>
                        
                        <text 
                            v-if="elevator.currentCar"
                            :x="config.spotsPerFloor * SPOT_SIZE + MARGIN + 15 + (ELEVATOR_WIDTH - 10) / 2"
                            :y="getElevatorPosition(elevator).y + (FLOOR_HEIGHT - 20) / 2 + 20"
                            font-size="10"
                            fill="white"
                            text-anchor="middle"
                        >
                            {{ elevator.currentCar.carId }}
                        </text>
                        
                        <text 
                            v-if="!elevator.isFault"
                            :x="config.spotsPerFloor * SPOT_SIZE + MARGIN + 15 + (ELEVATOR_WIDTH - 10) / 2"
                            :y="getElevatorPosition(elevator).y + (FLOOR_HEIGHT - 20) + 15"
                            font-size="16"
                            :fill="elevator.direction === 'up' ? '#22c55e' : elevator.direction === 'down' ? '#ef4444' : '#9ca3af'"
                            text-anchor="middle"
                        >
                            {{ elevator.direction === 'up' ? '↑' : elevator.direction === 'down' ? '↓' : '◯' }}
                        </text>
                    </g>
                </g>
            </g>
            
            <g class="entry-point">
                <rect 
                    :x="MARGIN"
                    :y="config.floors * FLOOR_HEIGHT + MARGIN"
                    :width="80"
                    :height="40"
                    fill="#dbeafe"
                    stroke="#3b82f6"
                    stroke-width="2"
                    rx="4"
                />
                <text 
                    :x="MARGIN + 40"
                    :y="config.floors * FLOOR_HEIGHT + MARGIN + 25"
                    font-size="12"
                    fill="#1e40af"
                    text-anchor="middle"
                    font-weight="bold"
                >
                    入口
                </text>
            </g>
            
            <g class="highlight-paths" v-if="highlightPaths && highlightPaths.length > 0">
                <path 
                    v-for="(path, pathIndex) in highlightPaths" 
                    :key="pathIndex"
                    :d="getHighlightPath(path.points)"
                    stroke="#f59e0b"
                    stroke-width="3"
                    fill="none"
                    stroke-dasharray="5,5"
                    marker-end="url(#arrowhead)"
                    class="path-highlight"
                />
            </g>
            
            <g v-if="floors.length === 0" class="empty-state">
                <rect 
                    :x="MARGIN"
                    :y="MARGIN"
                    :width="towerWidth"
                    :height="config.floors * FLOOR_HEIGHT"
                    fill="#f3f4f6"
                    stroke="#d1d5db"
                    stroke-width="2"
                    stroke-dasharray="10,5"
                    rx="8"
                />
                <text 
                    :x="MARGIN + towerWidth / 2"
                    :y="MARGIN + config.floors * FLOOR_HEIGHT / 2"
                    font-size="14"
                    fill="#9ca3af"
                    text-anchor="middle"
                >
                    请点击"初始化系统"
                </text>
            </g>
        </svg>
        
        <div class="waiting-queue" v-if="state.waitingQueue && state.waitingQueue.length > 0">
            <div class="queue-label">等待队列:</div>
            <div class="queue-cars">
                <div 
                    v-for="(car, index) in state.waitingQueue" 
                    :key="car.carId"
                    class="queue-car"
                    :style="{ 
                        animationDelay: `${index * 0.2}s`,
                        transform: `translateX(${-index * 40}px)`
                    }"
                >
                    <div class="car-icon">🚗</div>
                    <div class="car-id">{{ car.carId }}</div>
                </div>
            </div>
        </div>
        
        <div class="pickup-queue" v-if="state.pickupQueue && state.pickupQueue.length > 0">
            <div class="queue-label">取车队列:</div>
            <div class="queue-cars">
                <div 
                    v-for="(car, index) in state.pickupQueue" 
                    :key="car.carId"
                    class="queue-car pickup"
                    :style="{ 
                        animationDelay: `${index * 0.2}s`,
                        transform: `translateX(${-index * 40}px)`
                    }"
                >
                    <div class="car-icon">🚙</div>
                    <div class="car-id">{{ car.carId }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.parking-tower-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.parking-svg {
    background: linear-gradient(to bottom, #f9fafb, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spot-rect {
    transition: fill 0.3s ease;
}

.spot-rect.occupied {
    animation: spot-pulse 2s infinite;
}

.spot-rect.available:hover {
    fill: #16a34a;
    cursor: pointer;
}

.elevator-rect {
    transition: y 0.5s ease-in-out, fill 0.3s ease;
}

.elevator-rect.fault {
    animation: fault-flash 1s infinite;
}

.waiting-queue,
.pickup-queue {
    position: absolute;
    left: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.waiting-queue {
    bottom: 60px;
}

.pickup-queue {
    bottom: 120px;
}

.queue-label {
    font-size: 12px;
    font-weight: bold;
    color: #374151;
    white-space: nowrap;
}

.queue-cars {
    display: flex;
    position: relative;
}

.queue-car {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 8px;
    background: #dbeafe;
    border: 2px solid #3b82f6;
    border-radius: 6px;
    animation: queue-bounce 0.5s ease-out;
}

.queue-car.pickup {
    background: #fef3c7;
    border-color: #f59e0b;
}

.car-icon {
    font-size: 16px;
}

.car-id {
    font-size: 10px;
    font-weight: bold;
    color: #1e40af;
    margin-top: 2px;
}

.queue-car.pickup .car-id {
    color: #92400e;
}

.path-highlight {
    animation: path-dash 1s linear infinite;
}

@keyframes spot-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}

@keyframes fault-flash {
    0%, 100% { fill: #78716c; }
    50% { fill: #ef4444; }
}

@keyframes drive-in {
    from {
        transform: translateX(-50px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes queue-bounce {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes path-dash {
    to {
        stroke-dashoffset: -10;
    }
}
</style>
