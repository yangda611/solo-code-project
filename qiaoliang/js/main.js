class BridgeBuilderGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.canvasContainer = document.getElementById('canvas-container');
        
        this.physicsEngine = new PhysicsEngine();
        this.renderer = null;
        this.heatmapRenderer = null;
        this.uiManager = null;
        this.inputHandler = null;
        this.historyManager = null;
        this.recorder = null;
        
        this.levelManager = LevelManager;
        this.currentLevel = null;
        this.currentLevelIndex = 0;
        
        this.isTesting = false;
        this.isPaused = false;
        this.timeScale = 1.0;
        this.isSlowMotion = false;
        
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        
        this.selectedNode = null;
        this.selectedBeam = null;
        
        this.initialize();
    }

    initialize() {
        this.resizeCanvas();
        this.initializeRenderers();
        this.initializeManagers();
        this.initializeLevel();
        this.bindGameEvents();
        this.startGameLoop();
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    resizeCanvas() {
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.renderer) {
            this.renderer.resize(width, height);
        }
    }

    initializeRenderers() {
        this.renderer = new Renderer(this.canvas);
        this.heatmapRenderer = new HeatmapRenderer(this.renderer);
    }

    initializeManagers() {
        this.uiManager = new UIManager(this);
        this.inputHandler = new InputHandler(this.canvas, this);
        this.historyManager = new HistoryManager(this);
        this.recorder = new Recorder(this);
        
        this.bindInputCallbacks();
    }

    bindInputCallbacks() {
        this.inputHandler.callbacks.onToolChange = (tool) => {
            this.uiManager.updateToolButtons(tool);
            this.updateStatus(`工具: ${this.getToolName(tool)}`);
        };
        
        this.inputHandler.callbacks.onObjectSelect = (type, object) => {
            this.selectedNode = type === 'node' ? object : null;
            this.selectedBeam = type === 'beam' ? object : null;
            
            this.uiManager.updateSelectionInfo(type, object);
            
            if (object) {
                this.updateStatus(`已选中: ${type === 'node' ? '节点' : '连接件'}`);
            }
        };
        
        this.inputHandler.callbacks.onNodeCreate = (node) => {
            this.historyManager.pushAction(HistoryAction.addNode(node));
            this.updateStatistics();
        };
        
        this.inputHandler.callbacks.onBeamCreate = (beam) => {
            this.historyManager.pushAction(HistoryAction.addBeam(beam));
            this.updateStatistics();
            this.updateResources();
        };
        
        this.inputHandler.callbacks.onDelete = (type, object) => {
            this.deleteObject(type, object);
        };
        
        this.inputHandler.callbacks.onUndo = () => {
            this.undo();
        };
        
        this.inputHandler.callbacks.onRedo = () => {
            this.redo();
        };
    }

    bindGameEvents() {
        this.physicsEngine.breakCallback = (beam) => {
            this.recorder.recordBreakEvent(beam);
        };
        
        this.physicsEngine.collapseCallback = (reason) => {
            this.onTestFailed(reason);
        };
        
        this.physicsEngine.completeCallback = () => {
            this.onTestSucceeded();
        };
    }

    initializeLevel() {
        const levelData = this.levelManager.getCurrentLevel();
        if (!levelData) return;
        
        this.currentLevel = Level.fromJSON(levelData);
        this.currentLevelIndex = this.levelManager.currentLevelIndex;
        
        this.physicsEngine.clear();
        this.physicsEngine.groundLevel = this.currentLevel.canyonBottom;
        this.physicsEngine.bounds = this.currentLevel.bounds || this.physicsEngine.bounds;
        this.physicsEngine.leftBank = this.currentLevel.leftBank;
        this.physicsEngine.rightBank = this.currentLevel.rightBank;
        
        this.inputHandler.reset();
        
        this.createLevelNodes();
        this.createLevelVehicles();
        
        this.historyManager.clear();
        this.recorder.clear();
        
        this.uiManager.updateLevelInfo(this.currentLevel);
        this.updateStatistics();
        this.updateResources();
        
        this.updateStatus(`已加载: ${this.currentLevel.name}`);
    }

    createLevelNodes() {
        if (this.currentLevel.anchorPoints) {
            for (const point of this.currentLevel.anchorPoints) {
                const node = this.physicsEngine.createNode(point.x, point.y, true, true);
                node.userCreated = false;
            }
        }
    }

    createLevelVehicles() {
        if (!this.currentLevel.vehicleTypes) return;
        
        for (let i = 0; i < this.currentLevel.vehicleCount; i++) {
            const vehicleType = this.currentLevel.vehicleTypes[i % this.currentLevel.vehicleTypes.length];
            const vehicle = VehicleFactory.create(
                vehicleType,
                this.currentLevel.vehicleStartX,
                this.currentLevel.leftBank.y,
                this.currentLevel.vehicleEndX
            );
            vehicle.userCreated = false;
            this.physicsEngine.addVehicle(vehicle);
        }
    }

    get nodes() {
        return this.physicsEngine.nodes;
    }

    get beams() {
        return this.physicsEngine.beams;
    }

    get vehicles() {
        return this.physicsEngine.vehicles;
    }

    get level() {
        return this.currentLevel;
    }

    createNode(x, y, isFixed = false, isGround = false) {
        return this.physicsEngine.createNode(x, y, isFixed, isGround);
    }

    addNode(node) {
        return this.physicsEngine.addNode(node);
    }

    addNodeAt(node, index) {
        if (index >= 0 && index <= this.physicsEngine.nodes.length) {
            this.physicsEngine.nodes.splice(index, 0, node);
        } else {
            this.physicsEngine.addNode(node);
        }
        return node;
    }

    removeNode(node, recordHistory = true) {
        if (recordHistory) {
            const index = this.physicsEngine.nodes.indexOf(node);
            if (index !== -1) {
                this.historyManager.pushAction(HistoryAction.removeNode(node, index));
            }
        }
        
        this.physicsEngine.removeNode(node);
        this.updateStatistics();
        this.updateResources();
    }

    connectNodes(nodeA, nodeB, materialType) {
        const result = this.physicsEngine.connectNodes(nodeA, nodeB, materialType);
        return { beam: result, created: result !== null };
    }

    addBeam(beam) {
        return this.physicsEngine.addBeam(beam);
    }

    addBeamAt(beam, index) {
        if (index >= 0 && index <= this.physicsEngine.beams.length) {
            this.physicsEngine.beams.splice(index, 0, beam);
        } else {
            this.physicsEngine.addBeam(beam);
        }
        return beam;
    }

    removeBeam(beam, recordHistory = true) {
        if (recordHistory) {
            const index = this.physicsEngine.beams.indexOf(beam);
            if (index !== -1) {
                this.historyManager.pushAction(HistoryAction.removeBeam(beam, index));
            }
        }
        
        this.physicsEngine.removeBeam(beam);
        this.updateStatistics();
        this.updateResources();
    }

    getNodeById(id) {
        return this.physicsEngine.getNodeById(id);
    }

    getBeamById(id) {
        return this.physicsEngine.getBeamById(id);
    }

    findNodeNearPoint(point, threshold = 20) {
        return this.physicsEngine.findNodeNearPoint(point, threshold);
    }

    findBeamNearPoint(point, threshold = 10) {
        return this.physicsEngine.findBeamNearPoint(point, threshold);
    }

    isInBuildZone(point) {
        if (!this.currentLevel) return true;
        return this.currentLevel.isInBuildZone(point);
    }

    deleteObject(type, object) {
        if (!object) return;
        
        if (type === 'node') {
            this.removeNode(object);
            this.selectedNode = null;
        } else if (type === 'beam') {
            this.removeBeam(object);
            this.selectedBeam = null;
        }
        
        this.uiManager.updateSelectionInfo(null, null);
        this.updateStatus('已删除选中元素');
    }

    deleteSelected() {
        if (this.selectedNode) {
            this.deleteObject('node', this.selectedNode);
        } else if (this.selectedBeam) {
            this.deleteObject('beam', this.selectedBeam);
        }
    }

    undo() {
        if (this.historyManager.undo()) {
            this.updateStatistics();
            this.updateResources();
            this.updateStatus('已撤销');
        }
    }

    redo() {
        if (this.historyManager.redo()) {
            this.updateStatistics();
            this.updateResources();
            this.updateStatus('已重做');
        }
    }

    clearUserCreated(recordHistory = true) {
        if (recordHistory) {
            const userNodes = this.physicsEngine.nodes.filter(n => n.userCreated);
            const userBeams = this.physicsEngine.beams.filter(b => b.userCreated);
            
            if (userNodes.length > 0 || userBeams.length > 0) {
                this.historyManager.pushAction(HistoryAction.clearAll(userNodes, userBeams));
            }
        }
        
        const keepNodes = this.physicsEngine.nodes.filter(n => !n.userCreated);
        const keepBeams = this.physicsEngine.beams.filter(b => !b.userCreated);
        
        this.physicsEngine.nodes = keepNodes;
        this.physicsEngine.beams = keepBeams;
        
        this.selectedNode = null;
        this.selectedBeam = null;
        
        this.updateStatistics();
        this.updateResources();
        this.uiManager.updateSelectionInfo(null, null);
        this.updateStatus('已清除所有建造内容');
    }

    setTool(tool) {
        this.inputHandler.setTool(tool);
    }

    getToolName(tool) {
        const names = {
            'select': '选择',
            'wood': '木材',
            'steel': '钢筋',
            'cable': '绳索'
        };
        return names[tool] || tool;
    }

    setTimeScale(scale) {
        this.timeScale = scale;
        this.physicsEngine.timeScale = scale;
    }

    toggleSlowMotion() {
        this.isSlowMotion = !this.isSlowMotion;
        
        if (this.isSlowMotion) {
            this.setTimeScale(0.3);
            this.updateStatus('慢镜头模式已开启');
        } else {
            this.setTimeScale(1.0);
            this.updateStatus('慢镜头模式已关闭');
        }
        
        return this.isSlowMotion;
    }

    startTest() {
        if (this.isTesting) return;
        
        this.physicsEngine.startTesting();
        this.recorder.startRecording();
        this.isTesting = true;
        
        for (const vehicle of this.vehicles) {
            vehicle.start();
        }
        
        this.uiManager.setTestingState(true);
        this.updateStatus('测试开始 - 观察桥梁受力情况');
    }

    stopTest() {
        if (!this.isTesting) return;
        
        this.recorder.stopRecording();
        this.physicsEngine.stopTesting();
        this.isTesting = false;
        
        this.uiManager.setTestingState(false);
        this.updateStatus('测试已停止');
    }

    onTestSucceeded() {
        this.stopTest();
        
        const cost = this.physicsEngine.getTotalCost();
        const weight = this.physicsEngine.getTotalWeight();
        const maxStress = this.physicsEngine.getMaxStressRatio();
        
        const rating = this.currentLevel.getRating(cost, maxStress, true);
        
        this.uiManager.showResultModal(true, {
            cost: cost,
            weight: weight,
            maxStress: maxStress,
            rating: rating
        });
    }

    onTestFailed(reason) {
        this.stopTest();
        
        const cost = this.physicsEngine.getTotalCost();
        const weight = this.physicsEngine.getTotalWeight();
        const maxStress = this.physicsEngine.getMaxStressRatio();
        
        let failureText = '桥梁发生结构性失效';
        if (reason === 'vehicle_fallen') {
            failureText = '车辆掉落 - 桥梁可能不完整或无法支撑';
        } else if (reason === 'structural_failure') {
            failureText = '桥梁发生结构性失效 - 超过50%的连接件断裂';
        }
        
        this.uiManager.showResultModal(false, {
            cost: cost,
            weight: weight,
            maxStress: maxStress,
            reason: reason,
            rating: { stars: 0, text: failureText }
        });
    }

    watchReplay() {
        if (this.recorder.hasRecording()) {
            this.recorder.startPlayback();
            this.updateStatus('回放中...');
        }
    }

    prevLevel() {
        if (this.levelManager.hasPrevLevel()) {
            this.levelManager.prevLevel();
            this.initializeLevel();
        }
    }

    nextLevel() {
        if (this.levelManager.hasNextLevel()) {
            this.levelManager.nextLevel();
            this.initializeLevel();
        }
    }

    restartLevel() {
        this.initializeLevel();
        this.recorder.clear();
        this.updateStatus('关卡已重置');
    }

    hasPrevLevel() {
        return this.levelManager.hasPrevLevel();
    }

    hasNextLevel() {
        return this.levelManager.hasNextLevel();
    }

    setTestingState(isTesting) {
        this.uiManager.setTestingState(isTesting);
    }

    updateStatistics() {
        const stats = {
            nodes: this.physicsEngine.nodes.filter(n => n.userCreated).length,
            beams: this.physicsEngine.beams.filter(b => b.userCreated).length,
            maxStress: this.physicsEngine.getMaxStressRatio()
        };
        
        const materialStats = this.getMaterialStats();
        Object.assign(stats, materialStats);
        
        this.uiManager.updateStatistics(stats);
    }

    getMaterialStats() {
        const stats = { wood: 0, steel: 0, cable: 0 };
        
        for (const beam of this.physicsEngine.beams) {
            if (!beam.userCreated) continue;
            
            switch (beam.material.type) {
                case MaterialType.WOOD: stats.wood++; break;
                case MaterialType.STEEL: stats.steel++; break;
                case MaterialType.CABLE: stats.cable++; break;
            }
        }
        
        return stats;
    }

    updateResources() {
        if (!this.currentLevel) return;
        
        const cost = this.physicsEngine.getTotalCost();
        const weight = this.physicsEngine.getTotalWeight();
        
        this.uiManager.updateResources(cost, weight, this.currentLevel.budgetLimit);
    }

    updateStatus(message) {
        this.uiManager.updateStatus(message);
    }

    updateCoordinates(x, y) {
        this.uiManager.updateCoordinates(x, y);
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;
        
        this.update(deltaTime);
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.recorder.isPlaying()) {
            this.recorder.updatePlayback(deltaTime);
        } else if (this.isTesting) {
            this.physicsEngine.step(deltaTime);
            this.recorder.recordFrame();
            this.updateStatistics();
        }
    }

    render() {
        this.renderer.clear();
        this.renderer.drawGrid();
        
        this.renderer.drawLevel(this.currentLevel);
        
        if (this.heatmapRenderer.enabled && this.isTesting) {
            this.heatmapRenderer.drawAll(this.physicsEngine.beams, this.physicsEngine.nodes);
        }
        
        for (const beam of this.physicsEngine.beams) {
            this.renderer.drawBeam(beam);
        }
        
        if (this.renderer.viewOptions.showNodes) {
            for (const node of this.physicsEngine.nodes) {
                this.renderer.drawNode(node);
            }
        }
        
        for (const vehicle of this.physicsEngine.vehicles) {
            this.renderer.drawVehicle(vehicle);
        }
        
        this.drawPreview();
        
        if (this.heatmapRenderer.enabled) {
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            
            this.heatmapRenderer.drawLegend(
                canvasWidth - 220,
                canvasHeight - 80
            );
        }
    }

    drawPreview() {
        if (!this.inputHandler.isConnecting()) return;
        
        const start = this.inputHandler.getPreviewStart();
        const end = this.inputHandler.getPreviewEnd();
        
        if (!start || !end) return;
        
        const isValid = this.inputHandler.isPreviewValid();
        const tool = this.inputHandler.selectedTool;
        const materialType = tool === 'select' ? MaterialType.WOOD : tool;
        
        this.renderer.drawPreviewLine(start, end, materialType, isValid);
        
        const existingEnd = this.findNodeNearPoint(end, 15);
        if (!existingEnd) {
            this.renderer.drawPreviewNode(end);
        }
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new BridgeBuilderGame();
});

if (typeof module !== 'undefined') {
    module.exports = { BridgeBuilderGame };
}
