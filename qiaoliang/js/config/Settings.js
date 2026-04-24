const PhysicsSettings = {
    gravity: new Vector2(0, 9.8),
    timeStep: 1 / 60,
    subSteps: 4,
    globalDamping: 0.98,
    
    defaultNodeMass: 1.0,
    defaultCrossSectionArea: 0.01,
    
    groundY: 800,
    groundFriction: 0.8,
    groundBounce: 0.3,
    
    breakImpulseStrength: 500,
    
    cableMinTension: 100
};

const RenderSettings = {
    backgroundColor: '#0a2463',
    gridColor: 'rgba(45, 90, 154, 0.3)',
    gridMajorColor: 'rgba(62, 146, 204, 0.5)',
    
    nodeRadius: 8,
    nodeFixedScale: 1.3,
    
    beamThicknessScale: 1.0,
    beamHighlightScale: 1.5,
    
    defaultScale: 1.0,
    minScale: 0.5,
    maxScale: 2.0,
    
    forceArrowScale: 0.1,
    maxForceArrowLength: 50,
    
    heatmapTransparency: 0.6,
    
    previewDashPattern: [10, 5],
    snapPointRadius: 12
};

const InputSettings = {
    snapThreshold: 15,
    nodeSelectionThreshold: 15,
    beamSelectionThreshold: 10,
    
    gridSize: 20,
    majorGridSpacing: 100,
    
    dragThreshold: 5,
    
    scrollZoomSpeed: 0.1,
    panSpeed: 1.0,
    
    defaultTool: 'select',
    
    keyBindings: {
        select: 'v',
        wood: '1',
        steel: '2',
        cable: '3',
        undo: 'ctrl+z',
        redo: 'ctrl+y',
        delete: ['delete', 'backspace'],
        escape: 'escape',
        toggleGrid: 'g',
        startTest: 'space',
        stopTest: 'escape'
    }
};

const GameSettings = {
    initialLevel: 0,
    
    defaultTimeScale: 1.0,
    slowMotionTimeScale: 0.3,
    
    maxUndoHistory: 100,
    
    defaultBudgetMultiplier: 1.2,
    
    ratingThresholds: {
        perfect: 0.6,
        excellent: 0.75,
        good: 0.9,
        pass: 1.0
    },
    
    stressWarningThreshold: 0.5,
    stressCriticalThreshold: 0.8,
    
    vehicleSpawnDelay: 2000,
    
    collapseThreshold: 0.5,
    
    saveAutoSaveInterval: 30000
};

const UISettings = {
    statusUpdateInterval: 100,
    
    modalTransitionDuration: 300,
    
    tooltipDelay: 500,
    
    animationDuration: {
        default: 300,
        fast: 150,
        slow: 500
    },
    
    colors: {
        primary: '#3e92cc',
        secondary: '#1a3a7a',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        info: '#3498db',
        light: '#d8e2dc',
        dark: '#0a2463'
    },
    
    fonts: {
        default: "'Consolas', 'Monaco', 'Courier New', monospace",
        title: "'Consolas', 'Monaco', 'Courier New', monospace"
    }
};

const MaterialColors = {
    [MaterialType.WOOD]: {
        base: '#8B4513',
        dark: '#654321',
        light: '#A0522D',
        stress: ['#8B4513', '#CD853F', '#DAA520', '#F4A460', '#E74C3C']
    },
    [MaterialType.STEEL]: {
        base: '#C0C0C0',
        dark: '#808080',
        light: '#E8E8E8',
        stress: ['#C0C0C0', '#A9A9A9', '#F4A460', '#E67E22', '#E74C3C']
    },
    [MaterialType.CABLE]: {
        base: '#DAA520',
        dark: '#B8860B',
        light: '#FFD700',
        stress: ['#DAA520', '#F4A460', '#E67E22', '#D35400', '#E74C3C']
    }
};

const TerrainColors = {
    [TerrainType.CANYON]: {
        ground: '#2d5a3a',
        groundEdge: '#1a3a28',
        rocks: '#5d4e37'
    },
    [TerrainType.RIVER]: {
        ground: '#3d6b4a',
        groundEdge: '#2a4d35',
        water: '#1a5276',
        waterEdge: '#0d3550'
    },
    [TerrainType.FLAT]: {
        ground: '#4a7c59',
        groundEdge: '#3a6248'
    },
    [TerrainType.VALLEY]: {
        ground: '#3a5a3a',
        groundEdge: '#2a4a2a',
        mountains: '#4a6a4a'
    }
};

const StressColorGradient = [
    { ratio: 0.0, r: 46, g: 204, b: 113, a: 0.0 },
    { ratio: 0.2, r: 46, g: 204, b: 113, a: 0.2 },
    { ratio: 0.4, r: 241, g: 196, b: 15, a: 0.3 },
    { ratio: 0.6, r: 243, g: 156, b: 18, a: 0.5 },
    { ratio: 0.8, r: 231, g: 76, b: 60, a: 0.7 },
    { ratio: 1.0, r: 192, g: 57, b: 43, a: 0.9 }
];

function getStressColor(stressRatio, alpha = 1) {
    const clamped = MathUtil.clamp(stressRatio, 0, 1);
    
    for (let i = 0; i < StressColorGradient.length - 1; i++) {
        const stop1 = StressColorGradient[i];
        const stop2 = StressColorGradient[i + 1];
        
        if (clamped >= stop1.ratio && clamped <= stop2.ratio) {
            const t = (clamped - stop1.ratio) / (stop2.ratio - stop1.ratio);
            const r = Math.round(MathUtil.lerp(stop1.r, stop2.r, t));
            const g = Math.round(MathUtil.lerp(stop1.g, stop2.g, t));
            const b = Math.round(MathUtil.lerp(stop1.b, stop2.b, t));
            const a = MathUtil.lerp(stop1.a, stop2.a, t) * alpha;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
    }
    
    const last = StressColorGradient[StressColorGradient.length - 1];
    return `rgba(${last.r}, ${last.g}, ${last.b}, ${last.a * alpha})`;
}

function getRatingText(stars) {
    const texts = {
        0: '未完成',
        1: '勉强通过 - 建议重新设计',
        2: '合格 - 但成本较高',
        3: '良好 - 还有优化空间',
        4: '优秀 - 经济高效的设计',
        5: '完美 - 大师级设计！'
    };
    return texts[stars] || '未完成';
}

function getMaterialName(type) {
    const names = {
        [MaterialType.WOOD]: '木材',
        [MaterialType.STEEL]: '钢筋',
        [MaterialType.CABLE]: '绳索'
    };
    return names[type] || type;
}

function getTerrainName(type) {
    const names = {
        [TerrainType.CANYON]: '峡谷',
        [TerrainType.RIVER]: '河流',
        [TerrainType.FLAT]: '平地',
        [TerrainType.VALLEY]: '山谷'
    };
    return names[type] || type;
}

function formatCurrency(amount) {
    if (amount === Infinity) return '∞';
    return `$${amount.toLocaleString()}`;
}

function formatWeight(kg) {
    if (kg < 1000) {
        return `${Math.round(kg)} kg`;
    }
    return `${(kg / 1000).toFixed(1)} 吨`;
}

function formatLength(meters) {
    if (meters < 1000) {
        return `${meters.toFixed(1)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
}

if (typeof module !== 'undefined') {
    module.exports = {
        PhysicsSettings,
        RenderSettings,
        InputSettings,
        GameSettings,
        UISettings,
        MaterialColors,
        TerrainColors,
        StressColorGradient,
        getStressColor,
        getRatingText,
        getMaterialName,
        getTerrainName,
        formatCurrency,
        formatWeight,
        formatLength
    };
}
