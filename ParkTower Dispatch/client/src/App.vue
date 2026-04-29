<script setup>
import { ref, reactive, onMounted } from 'vue';
import { parkingApi } from './services/api.js';
import ParkingTower from './components/ParkingTower.vue';
import ControlPanel from './components/ControlPanel.vue';

const state = ref({
    floors: 5,
    spotsPerFloor: 10,
    elevatorCount: 2,
    time: 0,
    parkingStructure: [],
    elevators: [],
    waitingQueue: [],
    pickupQueue: [],
    parkedCars: {},
    availableSpots: 0,
    history: []
});

const isInitialized = ref(false);
const isSimulating = ref(false);
const simulationInterval = ref(null);
const animatingCars = ref([]);
const highlightPaths = ref([]);
const messages = ref([]);
const messageIdCounter = ref(0);
const processedHistoryIndex = ref(-1);

const addMessage = (text, type = 'info') => {
    messageIdCounter.value++;
    const msg = {
        id: messageIdCounter.value,
        text,
        type,
        timestamp: new Date().toLocaleTimeString()
    };
    messages.value.unshift(msg);
    if (messages.value.length > 50) {
        messages.value.pop();
    }
};

const initSystem = async (config) => {
    try {
        const result = await parkingApi.init(config);
        if (result.success) {
            state.value = result.state;
            isInitialized.value = true;
            addMessage('系统初始化成功', 'success');
        } else {
            addMessage(result.message, 'error');
        }
    } catch (error) {
        addMessage(`初始化失败: ${error.message}`, 'error');
    }
};

const refreshState = async () => {
    if (!isInitialized.value) return;
    try {
        const result = await parkingApi.getState();
        if (result.success) {
            state.value = result.state;
        }
    } catch (error) {
        console.error('刷新状态失败:', error);
    }
};

const handleArrive = async (carId) => {
    try {
        const result = await parkingApi.arrive(carId);
        if (result.success) {
            state.value = result.state;
            addMessage(result.message, 'success');
            triggerArriveAnimation(carId);
        } else {
            addMessage(result.message, 'error');
        }
    } catch (error) {
        addMessage(`操作失败: ${error.message}`, 'error');
    }
};

const handleRequestPickup = async (carId) => {
    try {
        const result = await parkingApi.requestPickup(carId);
        if (result.success) {
            state.value = result.state;
            addMessage(result.message, 'success');
        } else {
            addMessage(result.message, 'error');
        }
    } catch (error) {
        addMessage(`操作失败: ${error.message}`, 'error');
    }
};

const handleStep = async () => {
    try {
        const result = await parkingApi.step();
        if (result.success) {
            state.value = result.state;
            checkAnimations();
        }
    } catch (error) {
        addMessage(`操作失败: ${error.message}`, 'error');
    }
};

const handleSetElevatorFault = async ({ elevatorId, isFault }) => {
    try {
        const result = await parkingApi.setElevatorFault(elevatorId, isFault);
        if (result.success) {
            state.value = result.state;
            addMessage(result.message, isFault ? 'warning' : 'success');
        } else {
            addMessage(result.message, 'error');
        }
    } catch (error) {
        addMessage(`操作失败: ${error.message}`, 'error');
    }
};

const handleReset = async () => {
    try {
        const result = await parkingApi.reset();
        if (result.success) {
            state.value = result.state;
            isInitialized.value = false;
            stopSimulation();
            messageIdCounter.value = 0;
            processedHistoryIndex.value = -1;
            addMessage('系统已重置', 'info');
        } else {
            addMessage(result.message, 'error');
        }
    } catch (error) {
        addMessage(`操作失败: ${error.message}`, 'error');
    }
};

const triggerArriveAnimation = (carId) => {
    const car = {
        carId,
        animationType: 'arriving',
        x: -100,
        y: (state.value.floors || 5) * 60 + 40
    };
    animatingCars.value.push(car);
    
    setTimeout(() => {
        const index = animatingCars.value.findIndex(c => c.carId === carId);
        if (index !== -1) {
            animatingCars.value.splice(index, 1);
        }
    }, 500);
};

const checkAnimations = () => {
    const history = state.value.history || [];
    if (history.length === 0) return;
    
    const startIndex = processedHistoryIndex.value + 1;
    if (startIndex >= history.length) return;
    
    for (let i = startIndex; i < history.length; i++) {
        const event = history[i];
        if (event.type === 'parked') {
            addMessage(event.message, 'success');
        } else if (event.type === 'exited') {
            addMessage(event.message, 'info');
        } else if (event.type === 'elevator_fault') {
            addMessage(event.message, 'warning');
        }
    }
    
    processedHistoryIndex.value = history.length - 1;
};

const handlePresetScenario = async (scenario) => {
    addMessage(`正在加载预设场景: ${getScenarioName(scenario)}...`, 'info');
    
    switch (scenario) {
        case 'morning-rush':
            await runMorningRushScenario();
            break;
        case 'pickup-congestion':
            await runPickupCongestionScenario();
            break;
        case 'elevator-fault':
            await runElevatorFaultScenario();
            break;
        case 'optimal-scheduling':
            await runOptimalSchedulingScenario();
            break;
    }
};

const getScenarioName = (scenario) => {
    const names = {
        'morning-rush': '早高峰入库',
        'pickup-congestion': '集中取车拥堵',
        'elevator-fault': '升降机故障',
        'optimal-scheduling': '最优调度方案'
    };
    return names[scenario] || scenario;
};

const runMorningRushScenario = async () => {
    const cars = ['A001', 'A002', 'A003', 'A004', 'A005', 'A006', 'A007', 'A008'];
    
    for (const carId of cars) {
        await handleArrive(carId);
        await new Promise(r => setTimeout(r, 200));
    }
    
    addMessage('早高峰场景已加载: 8辆车同时到达入口', 'success');
    startAutoSimulation();
};

const runPickupCongestionScenario = async () => {
    const parkedCars = Object.keys(state.value.parkedCars || {});
    
    if (parkedCars.length < 4) {
        addMessage('请先停放至少4辆车，或运行早高峰场景', 'warning');
        return;
    }
    
    const carsToPickup = parkedCars.slice(0, 4);
    
    for (const carId of carsToPickup) {
        await handleRequestPickup(carId);
        await new Promise(r => setTimeout(r, 200));
    }
    
    addMessage(`集中取车场景已加载: ${carsToPickup.length}辆车同时请求取车`, 'success');
    startAutoSimulation();
};

const runElevatorFaultScenario = async () => {
    if (!state.value.elevators || state.value.elevators.length < 2) {
        addMessage('需要至少2台升降机才能演示故障场景', 'warning');
        return;
    }
    
    const cars = ['F001', 'F002', 'F003', 'F004', 'F005'];
    for (const carId of cars) {
        await handleArrive(carId);
        await new Promise(r => setTimeout(r, 200));
    }
    
    for (let i = 0; i < 5; i++) {
        await handleStep();
        await new Promise(r => setTimeout(r, 300));
    }
    
    await handleSetElevatorFault({ elevatorId: 0, isFault: true });
    
    const moreCars = ['F006', 'F007'];
    for (const carId of moreCars) {
        await handleArrive(carId);
        await new Promise(r => setTimeout(r, 200));
    }
    
    addMessage('升降机故障场景已加载: 升降机0故障，观察剩余升降机工作', 'success');
    startAutoSimulation();
};

const runOptimalSchedulingScenario = async () => {
    if (isInitialized.value) {
        await handleReset();
        await new Promise(r => setTimeout(r, 300));
    }
    
    await initSystem({
        floors: 6,
        spotsPerFloor: 12,
        elevators: 3
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    const cars = [
        'OPT01', 'OPT02', 'OPT03', 'OPT04', 'OPT05',
        'OPT06', 'OPT07', 'OPT08', 'OPT09', 'OPT10',
        'OPT11', 'OPT12'
    ];
    
    for (const carId of cars) {
        await handleArrive(carId);
        await new Promise(r => setTimeout(r, 150));
    }
    
    addMessage('最优调度场景已加载: 3台升降机调度12辆车，观察智能分配', 'success');
    startAutoSimulation();
};

const startAutoSimulation = () => {
    if (simulationInterval.value) {
        clearInterval(simulationInterval.value);
    }
    
    isSimulating.value = true;
    simulationInterval.value = setInterval(async () => {
        await handleStep();
    }, 800);
    
    addMessage('自动模拟已启动', 'info');
};

const stopSimulation = () => {
    if (simulationInterval.value) {
        clearInterval(simulationInterval.value);
        simulationInterval.value = null;
    }
    isSimulating.value = false;
};

const toggleSimulation = () => {
    if (isSimulating.value) {
        stopSimulation();
        addMessage('自动模拟已停止', 'info');
    } else {
        startAutoSimulation();
    }
};
</script>

<template>
    <div class="app-container">
        <header class="app-header">
            <h1>🏢 立体停车楼调度系统</h1>
            <div class="header-controls" v-if="isInitialized">
                <button 
                    @click="toggleSimulation" 
                    :class="['sim-btn', isSimulating ? 'stop' : 'start']"
                >
                    {{ isSimulating ? '⏸️ 暂停' : '▶️ 自动模拟' }}
                </button>
                <span class="time-display">
                    ⏱️ 时间: {{ state.time }}
                </span>
            </div>
        </header>
        
        <main class="main-content">
            <div class="visualization-area">
                <ParkingTower 
                    :state="state"
                    :animating-cars="animatingCars"
                    :highlight-paths="highlightPaths"
                />
                
                <div class="message-panel" v-if="messages.length > 0">
                    <h4>系统日志</h4>
                    <div class="message-list">
                        <div 
                            v-for="msg in messages" 
                            :key="msg.id"
                            class="message-item"
                            :class="msg.type"
                        >
                            <span class="msg-time">[{{ msg.timestamp }}]</span>
                            <span class="msg-text">{{ msg.text }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="control-area">
                <ControlPanel 
                    :state="state"
                    :is-initialized="isInitialized"
                    @init="initSystem"
                    @arrive="handleArrive"
                    @request-pickup="handleRequestPickup"
                    @step="handleStep"
                    @set-elevator-fault="handleSetElevatorFault"
                    @reset="handleReset"
                    @preset-scenario="handlePresetScenario"
                />
            </div>
        </main>
        
        <footer class="app-footer">
            <p>Vue + Node.js 立体停车楼调度系统 | 支持多层调度、多升降机、智能分配</p>
        </footer>
    </div>
</template>

<style scoped>
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
    background: rgba(255, 255, 255, 0.95);
    padding: 16px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
    margin: 0;
    font-size: 24px;
    color: #1e293b;
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.sim-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.sim-btn.start {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
}

.sim-btn.start:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.sim-btn.stop {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
}

.sim-btn.stop:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.time-display {
    padding: 10px 16px;
    background: #f1f5f9;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #475569;
}

.main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    padding: 24px;
}

.visualization-area {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.control-area {
    display: flex;
    flex-direction: column;
}

.message-panel {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-panel h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
}

.message-list {
    max-height: 150px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.message-item {
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    gap: 8px;
}

.message-item .msg-time {
    color: #94a3b8;
    font-family: monospace;
    flex-shrink: 0;
}

.message-item .msg-text {
    color: #334155;
}

.message-item.success {
    background: #dcfce7;
    border-left: 3px solid #22c55e;
}

.message-item.error {
    background: #fee2e2;
    border-left: 3px solid #ef4444;
}

.message-item.warning {
    background: #fef3c7;
    border-left: 3px solid #f59e0b;
}

.message-item.info {
    background: #dbeafe;
    border-left: 3px solid #3b82f6;
}

.app-footer {
    background: rgba(0, 0, 0, 0.2);
    padding: 12px 32px;
    text-align: center;
}

.app-footer p {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 1200px) {
    .main-content {
        grid-template-columns: 1fr;
    }
}
</style>
