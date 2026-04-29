<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    state: {
        type: Object,
        default: () => ({})
    },
    isInitialized: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits([
    'init', 
    'arrive', 
    'request-pickup', 
    'step', 
    'set-elevator-fault', 
    'reset',
    'preset-scenario'
]);

const form = ref({
    floors: 5,
    spotsPerFloor: 10,
    elevators: 2
});

const carIdInput = ref('');
const pickupCarIdInput = ref('');
const faultElevatorId = ref(0);
const isFault = ref(true);

const handleInit = () => {
    emit('init', {
        floors: form.value.floors,
        spotsPerFloor: form.value.spotsPerFloor,
        elevators: form.value.elevators
    });
};

const handleArrive = () => {
    if (carIdInput.value.trim()) {
        emit('arrive', carIdInput.value.trim());
        carIdInput.value = '';
    }
};

const handleRequestPickup = () => {
    if (pickupCarIdInput.value.trim()) {
        emit('request-pickup', pickupCarIdInput.value.trim());
        pickupCarIdInput.value = '';
    }
};

const handleStep = () => {
    emit('step');
};

const handleSetElevatorFault = () => {
    emit('set-elevator-fault', {
        elevatorId: faultElevatorId.value,
        isFault: isFault.value
    });
};

const handleReset = () => {
    emit('reset');
};

const handlePresetScenario = (scenario) => {
    emit('preset-scenario', scenario);
};

const parkedCarsList = () => {
    if (!props.state.parkedCars) return [];
    return Object.entries(props.state.parkedCars).map(([carId, info]) => ({
        carId,
        ...info
    }));
};

const availableElevators = () => {
    if (!props.state.elevators) return [];
    return props.state.elevators;
};
</script>

<template>
    <div class="control-panel">
        <div class="panel-section">
            <h3>系统设置</h3>
            <div class="form-group">
                <label>停车层数:</label>
                <input 
                    v-model.number="form.floors" 
                    type="number" 
                    min="1" 
                    max="20"
                    :disabled="isInitialized"
                />
            </div>
            <div class="form-group">
                <label>每层车位:</label>
                <input 
                    v-model.number="form.spotsPerFloor" 
                    type="number" 
                    min="1" 
                    max="20"
                    :disabled="isInitialized"
                />
            </div>
            <div class="form-group">
                <label>升降机数量:</label>
                <input 
                    v-model.number="form.elevators" 
                    type="number" 
                    min="1" 
                    max="5"
                    :disabled="isInitialized"
                />
            </div>
            <div class="button-group">
                <button 
                    @click="handleInit" 
                    :disabled="isInitialized"
                    class="btn-primary"
                >
                    初始化系统
                </button>
                <button 
                    @click="handleReset" 
                    :disabled="!isInitialized"
                    class="btn-danger"
                >
                    重置系统
                </button>
            </div>
        </div>
        
        <div class="panel-section" v-if="isInitialized">
            <h3>车辆操作</h3>
            <div class="form-group">
                <label>车辆入场:</label>
                <div class="input-group">
                    <input 
                        v-model="carIdInput" 
                        type="text" 
                        placeholder="输入车辆ID"
                        @keyup.enter="handleArrive"
                    />
                    <button @click="handleArrive" class="btn-primary">入场</button>
                </div>
            </div>
            <div class="form-group">
                <label>请求取车:</label>
                <div class="input-group">
                    <input 
                        v-model="pickupCarIdInput" 
                        type="text" 
                        placeholder="输入车辆ID"
                        @keyup.enter="handleRequestPickup"
                    />
                    <button @click="handleRequestPickup" class="btn-warning">取车</button>
                </div>
            </div>
            <div class="button-group">
                <button @click="handleStep" class="btn-success">时间步进 (+1)</button>
            </div>
        </div>
        
        <div class="panel-section" v-if="isInitialized">
            <h3>升降机控制</h3>
            <div class="form-group">
                <label>选择升降机:</label>
                <select v-model.number="faultElevatorId">
                    <option 
                        v-for="elevator in availableElevators()" 
                        :key="elevator.id"
                        :value="elevator.id"
                    >
                        升降机 {{ elevator.id }} ({{ elevator.isFault ? '已故障' : '正常' }})
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label>设置状态:</label>
                <select v-model="isFault">
                    <option :value="true">故障</option>
                    <option :value="false">正常</option>
                </select>
            </div>
            <button @click="handleSetElevatorFault" class="btn-warning">设置状态</button>
        </div>
        
        <div class="panel-section presets" v-if="isInitialized">
            <h3>预设场景</h3>
            <div class="preset-buttons">
                <button 
                    @click="handlePresetScenario('morning-rush')"
                    class="preset-btn rush"
                >
                    🚗 早高峰入库
                </button>
                <button 
                    @click="handlePresetScenario('pickup-congestion')"
                    class="preset-btn congestion"
                >
                    🚙 集中取车拥堵
                </button>
                <button 
                    @click="handlePresetScenario('elevator-fault')"
                    class="preset-btn fault"
                >
                    ⚠️ 升降机故障
                </button>
                <button 
                    @click="handlePresetScenario('optimal-scheduling')"
                    class="preset-btn optimal"
                >
                    ✨ 最优调度方案
                </button>
            </div>
        </div>
        
        <div class="panel-section" v-if="isInitialized">
            <h3>系统状态</h3>
            <div class="status-info">
                <div class="status-item">
                    <span class="label">当前时间:</span>
                    <span class="value">{{ state.time || 0 }}</span>
                </div>
                <div class="status-item">
                    <span class="label">可用车位:</span>
                    <span class="value">{{ state.availableSpots || 0 }}</span>
                </div>
                <div class="status-item">
                    <span class="label">等待队列:</span>
                    <span class="value">{{ state.waitingQueue?.length || 0 }} 辆</span>
                </div>
                <div class="status-item">
                    <span class="label">取车队列:</span>
                    <span class="value">{{ state.pickupQueue?.length || 0 }} 辆</span>
                </div>
            </div>
            
            <div class="parked-list" v-if="parkedCarsList().length > 0">
                <h4>已停放车辆:</h4>
                <div class="car-list">
                    <div 
                        v-for="car in parkedCarsList()" 
                        :key="car.carId"
                        class="car-item"
                    >
                        <span class="car-id">{{ car.carId }}</span>
                        <span class="car-location">
                            {{ car.floor }}层{{ car.spot }}号
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.control-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.panel-section {
    padding: 16px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
}

.panel-section h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 8px;
}

.panel-section.presets h3 {
    border-bottom-color: #f59e0b;
}

.form-group {
    margin-bottom: 12px;
}

.form-group label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 4px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
}

.input-group {
    display: flex;
    gap: 8px;
}

.input-group input {
    flex: 1;
}

.button-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #2563eb;
}

.btn-danger {
    background: #ef4444;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #dc2626;
}

.btn-success {
    background: #22c55e;
    color: white;
}

.btn-success:hover:not(:disabled) {
    background: #16a34a;
}

.btn-warning {
    background: #f59e0b;
    color: white;
}

.btn-warning:hover:not(:disabled) {
    background: #d97706;
}

.preset-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.preset-btn {
    padding: 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.preset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preset-btn.rush {
    background: linear-gradient(135deg, #fecaca, #fca5a5);
    color: #991b1b;
    border: 2px solid #f87171;
}

.preset-btn.congestion {
    background: linear-gradient(135deg, #fef08a, #fde047);
    color: #713f12;
    border: 2px solid #facc15;
}

.preset-btn.fault {
    background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
    color: #4c1d95;
    border: 2px solid #a78bfa;
}

.preset-btn.optimal {
    background: linear-gradient(135deg, #bbf7d0, #86efac);
    color: #14532d;
    border: 2px solid #4ade80;
}

.status-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: #f3f4f6;
    border-radius: 4px;
}

.status-item .label {
    font-size: 11px;
    color: #6b7280;
}

.status-item .value {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
}

.parked-list h4 {
    margin: 12px 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
}

.car-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
}

.car-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 10px;
    background: #dbeafe;
    border: 1px solid #93c5fd;
    border-radius: 4px;
    font-size: 11px;
}

.car-item .car-id {
    font-weight: 600;
    color: #1e40af;
}

.car-item .car-location {
    color: #3b82f6;
    font-size: 10px;
}
</style>
