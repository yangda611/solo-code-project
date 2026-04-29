const express = require('express');
const cors = require('cors');
const ParkingSystem = require('./parkingSystem');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('=== 正在启动服务器 ===');

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
    console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('  Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

let parkingSystem = null;

app.get('/', (req, res) => {
    res.json({ message: '立体停车楼调度系统 API', status: 'running' });
});

app.post('/api/init', (req, res) => {
    console.log('=== 处理 /api/init 请求 ===');
    try {
        const { floors, spotsPerFloor, elevators } = req.body;
        console.log('参数:', { floors, spotsPerFloor, elevators });
        
        parkingSystem = new ParkingSystem(floors, spotsPerFloor, elevators);
        const state = parkingSystem.getState();
        
        console.log('初始化成功!');
        console.log('  - 停车楼结构:', state.parkingStructure.length, '层');
        console.log('  - 升降机:', state.elevators.length, '台');
        
        res.json({ 
            success: true, 
            message: '系统初始化成功', 
            state 
        });
    } catch (error) {
        console.error('初始化失败:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || '初始化失败'
        });
    }
});

app.get('/api/state', (req, res) => {
    if (!parkingSystem) {
        return res.status(400).json({ success: false, message: '系统未初始化' });
    }
    res.json({ success: true, state: parkingSystem.getState() });
});

app.post('/api/arrive', (req, res) => {
    if (!parkingSystem) {
        return res.status(400).json({ success: false, message: '系统未初始化' });
    }
    
    try {
        const { carId } = req.body;
        const result = parkingSystem.arrive(carId);
        res.json({ success: true, message: result.message, state: parkingSystem.getState() });
    } catch (error) {
        console.error('车辆入场失败:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

app.post('/api/request-pickup', (req, res) => {
    if (!parkingSystem) {
        return res.status(400).json({ success: false, message: '系统未初始化' });
    }
    
    try {
        const { carId } = req.body;
        const result = parkingSystem.requestPickup(carId);
        res.json({ success: true, message: result.message, state: parkingSystem.getState() });
    } catch (error) {
        console.error('请求取车失败:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

app.post('/api/step', (req, res) => {
    if (!parkingSystem) {
        return res.status(400).json({ success: false, message: '系统未初始化' });
    }
    
    try {
        const result = parkingSystem.step();
        res.json({ success: true, message: result.message, state: parkingSystem.getState() });
    } catch (error) {
        console.error('时间步进失败:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

app.post('/api/set-elevator-fault', (req, res) => {
    if (!parkingSystem) {
        return res.status(400).json({ success: false, message: '系统未初始化' });
    }
    
    try {
        const { elevatorId, isFault } = req.body;
        parkingSystem.setElevatorFault(elevatorId, isFault);
        res.json({ 
            success: true, 
            message: `升降机 ${elevatorId} ${isFault ? '已故障' : '已恢复'}`, 
            state: parkingSystem.getState() 
        });
    } catch (error) {
        console.error('设置升降机状态失败:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

app.post('/api/reset', (req, res) => {
    if (!parkingSystem) {
        return res.status(400).json({ success: false, message: '系统未初始化' });
    }
    
    try {
        parkingSystem.reset();
        res.json({ success: true, message: '系统已重置', state: parkingSystem.getState() });
    } catch (error) {
        console.error('重置系统失败:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

app.use((req, res) => {
    console.log('=== 404 未找到路由 ===');
    console.log('  请求:', req.method, req.path);
    res.status(404).json({ 
        success: false, 
        message: `路由未找到: ${req.method} ${req.path}`,
        availableRoutes: [
            'GET /',
            'POST /api/init',
            'GET /api/state',
            'POST /api/arrive',
            'POST /api/request-pickup',
            'POST /api/step',
            'POST /api/set-elevator-fault',
            'POST /api/reset'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  立体停车楼调度系统服务器`);
    console.log(`  运行在: http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log('可用路由:');
    console.log('  GET  /');
    console.log('  POST /api/init');
    console.log('  GET  /api/state');
    console.log('  POST /api/arrive');
    console.log('  POST /api/request-pickup');
    console.log('  POST /api/step');
    console.log('  POST /api/set-elevator-fault');
    console.log('  POST /api/reset');
    console.log('========================================\n');
});
