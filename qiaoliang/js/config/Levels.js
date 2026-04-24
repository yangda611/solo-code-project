const Levels = [
    {
        id: 'level_1',
        name: '第1关: 跨越峡谷',
        description: '学习基础桥梁建造，使用木材跨越小型峡谷',
        objective: '建造一座能让小汽车安全通过的桥',
        terrainType: TerrainType.CANYON,
        
        leftBank: { x: 0, y: 450, width: 180 },
        rightBank: { x: 420, y: 450, width: 180 },
        canyonBottom: 700,
        
        startPoint: new Vector2(150, 420),
        endPoint: new Vector2(450, 420),
        
        anchorPoints: [
            new Vector2(180, 450),
            new Vector2(420, 450)
        ],
        
        budgetLimit: 10000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [],
        
        vehicleTypes: ['CAR'],
        vehicleCount: 1,
        vehicleStartX: 50,
        vehicleEndX: 550,
        
        recommendedBudget: 7000,
        
        gridSize: 20,
        snapToGrid: true,
        
        tutorial: {
            steps: [
                '欢迎来到桥梁建造模拟！',
                '点击选择木材工具，然后在画面上点击创建节点',
                '从一个节点拖动到另一个节点来添加梁',
                '连接左右两侧的固定点来建造桥梁',
                '点击"开始测试"让车辆通过'
            ]
        }
    },
    
    {
        id: 'level_2',
        name: '第2关: 三角形桁架',
        description: '学习使用三角形结构增强桥梁强度',
        objective: '使用三角形桁架结构建造更坚固的桥',
        terrainType: TerrainType.CANYON,
        
        leftBank: { x: 0, y: 450, width: 150 },
        rightBank: { x: 450, y: 450, width: 150 },
        canyonBottom: 700,
        
        startPoint: new Vector2(120, 420),
        endPoint: new Vector2(480, 420),
        
        anchorPoints: [
            new Vector2(150, 450),
            new Vector2(450, 450)
        ],
        
        budgetLimit: 15000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [],
        
        vehicleTypes: ['TRUCK'],
        vehicleCount: 1,
        vehicleStartX: 30,
        vehicleEndX: 570,
        
        recommendedBudget: 10000,
        
        gridSize: 20,
        snapToGrid: true,
        
        tutorial: {
            steps: [
                '这次需要让更重的卡车通过',
                '三角形是最稳定的几何结构',
                '尝试在桥面上添加三角形桁架',
                '这将大大增强桥梁的承重能力'
            ]
        }
    },
    
    {
        id: 'level_3',
        name: '第3关: 预算限制',
        description: '在严格的预算限制下完成建造',
        objective: '使用不超过$8000的预算建造桥梁',
        terrainType: TerrainType.CANYON,
        
        leftBank: { x: 0, y: 450, width: 160 },
        rightBank: { x: 440, y: 450, width: 160 },
        canyonBottom: 700,
        
        startPoint: new Vector2(130, 420),
        endPoint: new Vector2(470, 420),
        
        anchorPoints: [
            new Vector2(160, 450),
            new Vector2(440, 450)
        ],
        
        budgetLimit: 8000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [ChallengeType.BUDGET_LIMIT],
        
        vehicleTypes: ['CAR'],
        vehicleCount: 2,
        vehicleStartX: 20,
        vehicleEndX: 580,
        
        recommendedBudget: 6000,
        
        gridSize: 20,
        snapToGrid: true
    },
    
    {
        id: 'level_4',
        name: '第4关: 渡越大河',
        description: '跨越更宽的河流，需要不同的设计策略',
        objective: '设计一座能跨越河流的长桥',
        terrainType: TerrainType.RIVER,
        
        leftBank: { x: 0, y: 450, width: 120 },
        rightBank: { x: 480, y: 450, width: 120 },
        canyonBottom: 550,
        
        startPoint: new Vector2(100, 420),
        endPoint: new Vector2(500, 420),
        
        anchorPoints: [
            new Vector2(120, 450),
            new Vector2(480, 450)
        ],
        
        budgetLimit: 20000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [],
        
        vehicleTypes: ['BUS'],
        vehicleCount: 1,
        vehicleStartX: 10,
        vehicleEndX: 590,
        
        recommendedBudget: 15000,
        
        gridSize: 20,
        snapToGrid: true,
        
        waterLevel: 480
    },
    
    {
        id: 'level_5',
        name: '第5关: 船只通行',
        description: '桥梁必须有足够的净空让船只通过',
        objective: '建造拱桥，确保船只可以从下方通过',
        terrainType: TerrainType.RIVER,
        
        leftBank: { x: 0, y: 450, width: 140 },
        rightBank: { x: 460, y: 450, width: 140 },
        canyonBottom: 580,
        
        startPoint: new Vector2(110, 420),
        endPoint: new Vector2(490, 420),
        
        anchorPoints: [
            new Vector2(140, 450),
            new Vector2(460, 450)
        ],
        
        budgetLimit: 25000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [ChallengeType.SHIP_PASSAGE],
        
        shipPassage: {
            requiredHeight: 100,
            centerX: 300,
            width: 200,
            shipHeight: 80
        },
        
        vehicleTypes: ['TRUCK'],
        vehicleCount: 2,
        vehicleStartX: 20,
        vehicleEndX: 580,
        
        recommendedBudget: 18000,
        
        gridSize: 20,
        snapToGrid: true,
        
        waterLevel: 490
    },
    
    {
        id: 'level_6',
        name: '第6关: 钢索吊桥',
        description: '学习使用绳索建造悬索桥',
        objective: '使用钢索和钢筋建造悬索桥',
        terrainType: TerrainType.CANYON,
        
        leftBank: { x: 0, y: 450, width: 100 },
        rightBank: { x: 500, y: 450, width: 100 },
        canyonBottom: 800,
        
        startPoint: new Vector2(80, 420),
        endPoint: new Vector2(520, 420),
        
        anchorPoints: [
            new Vector2(100, 450),
            new Vector2(100, 300),
            new Vector2(500, 450),
            new Vector2(500, 300)
        ],
        
        budgetLimit: 30000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [],
        
        vehicleTypes: ['BUS'],
        vehicleCount: 2,
        vehicleStartX: 10,
        vehicleEndX: 590,
        
        recommendedBudget: 22000,
        
        gridSize: 20,
        snapToGrid: true
    },
    
    {
        id: 'level_7',
        name: '第7关: 重量限制',
        description: '桥梁自身重量不能超过限制',
        objective: '建造轻质高效的桥梁结构',
        terrainType: TerrainType.CANYON,
        
        leftBank: { x: 0, y: 450, width: 150 },
        rightBank: { x: 450, y: 450, width: 150 },
        canyonBottom: 700,
        
        startPoint: new Vector2(120, 420),
        endPoint: new Vector2(480, 420),
        
        anchorPoints: [
            new Vector2(150, 450),
            new Vector2(450, 450)
        ],
        
        budgetLimit: 20000,
        weightLimit: 300,
        heightLimit: Infinity,
        
        challenges: [ChallengeType.WEIGHT_LIMIT],
        
        vehicleTypes: ['CAR'],
        vehicleCount: 3,
        vehicleStartX: 20,
        vehicleEndX: 580,
        
        recommendedBudget: 15000,
        
        gridSize: 20,
        snapToGrid: true
    },
    
    {
        id: 'level_8',
        name: '第8关: 深谷挑战',
        description: '跨越更深的峡谷，需要多层结构',
        objective: '设计一座能承受重型卡车的多层桁架桥',
        terrainType: TerrainType.VALLEY,
        
        leftBank: { x: 0, y: 400, width: 120 },
        rightBank: { x: 480, y: 400, width: 120 },
        canyonBottom: 900,
        
        startPoint: new Vector2(100, 370),
        endPoint: new Vector2(500, 370),
        
        anchorPoints: [
            new Vector2(120, 400),
            new Vector2(480, 400)
        ],
        
        budgetLimit: 40000,
        weightLimit: Infinity,
        heightLimit: Infinity,
        
        challenges: [],
        
        vehicleTypes: ['HEAVY_TRUCK'],
        vehicleCount: 2,
        vehicleStartX: 10,
        vehicleEndX: 590,
        
        recommendedBudget: 30000,
        
        gridSize: 20,
        snapToGrid: true
    }
];

const LevelManager = {
    levels: Levels,
    currentLevelIndex: 0,
    
    getCurrentLevel() {
        return this.levels[this.currentLevelIndex];
    },
    
    getLevelById(id) {
        return this.levels.find(l => l.id === id);
    },
    
    getLevelByIndex(index) {
        return this.levels[index];
    },
    
    setCurrentLevel(index) {
        if (index >= 0 && index < this.levels.length) {
            this.currentLevelIndex = index;
            return true;
        }
        return false;
    },
    
    nextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            return this.getCurrentLevel();
        }
        return null;
    },
    
    prevLevel() {
        if (this.currentLevelIndex > 0) {
            this.currentLevelIndex--;
            return this.getCurrentLevel();
        }
        return null;
    },
    
    hasNextLevel() {
        return this.currentLevelIndex < this.levels.length - 1;
    },
    
    hasPrevLevel() {
        return this.currentLevelIndex > 0;
    },
    
    getLevelCount() {
        return this.levels.length;
    },
    
    createLevelInstance(index) {
        const levelData = this.getLevelByIndex(index);
        if (!levelData) return null;
        return Level.fromJSON(levelData);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Levels, LevelManager };
}
