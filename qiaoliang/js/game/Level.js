const TerrainType = {
    CANYON: 'canyon',
    RIVER: 'river',
    FLAT: 'flat',
    VALLEY: 'valley'
};

const ChallengeType = {
    NONE: 'none',
    BUDGET_LIMIT: 'budget_limit',
    WEIGHT_LIMIT: 'weight_limit',
    SHIP_PASSAGE: 'ship_passage',
    HEIGHT_LIMIT: 'height_limit'
};

class Level {
    constructor(config = {}) {
        this.id = config.id || 'level_0';
        this.name = config.name || '未命名关卡';
        this.description = config.description || '';
        this.objective = config.objective || '建造一座能让车辆通过的桥';
        
        this.terrainType = config.terrainType || TerrainType.CANYON;
        
        this.leftBank = config.leftBank || { x: 0, y: 500, width: 200 };
        this.rightBank = config.rightBank || { x: 400, y: 500, width: 200 };
        this.canyonBottom = config.canyonBottom || 700;
        
        this.startPoint = config.startPoint || new Vector2(100, 450);
        this.endPoint = config.endPoint || new Vector2(500, 450);
        
        this.anchorPoints = config.anchorPoints || [];
        
        this.budgetLimit = config.budgetLimit || Infinity;
        this.weightLimit = config.weightLimit || Infinity;
        this.heightLimit = config.heightLimit || Infinity;
        
        this.challenges = config.challenges || [];
        
        this.vehicleTypes = config.vehicleTypes || ['CAR'];
        this.vehicleCount = config.vehicleCount || 1;
        this.vehicleStartX = config.vehicleStartX || 50;
        this.vehicleEndX = config.vehicleEndX || 600;
        
        this.shipPassage = config.shipPassage || null;
        
        this.recommendedBudget = config.recommendedBudget || this.budgetLimit * 0.7;
        
        this.completed = false;
        this.bestScore = 0;
        this.bestCost = Infinity;
        
        this.groundColor = config.groundColor || '#2d5a3a';
        this.waterColor = config.waterColor || '#1a5276';
        this.skyColor = config.skyColor || '#85c1e9';
        
        this.gridSize = config.gridSize || 20;
        this.snapToGrid = config.snapToGrid !== false;
        
        this.prebuiltBeams = [];
        this.prebuiltNodes = [];
    }

    static create(config) {
        return new Level(config);
    }

    getSpan() {
        return this.endPoint.x - this.startPoint.x;
    }

    getDrop() {
        return this.canyonBottom - this.startPoint.y;
    }

    getTerrainPolyline() {
        const points = [];
        
        switch (this.terrainType) {
            case TerrainType.CANYON:
                points.push(new Vector2(-100, this.leftBank.y));
                points.push(new Vector2(this.leftBank.x + this.leftBank.width, this.leftBank.y));
                points.push(new Vector2(this.leftBank.x + this.leftBank.width + 50, this.canyonBottom));
                points.push(new Vector2(this.rightBank.x - 50, this.canyonBottom));
                points.push(new Vector2(this.rightBank.x, this.rightBank.y));
                points.push(new Vector2(800, this.rightBank.y));
                break;
                
            case TerrainType.RIVER:
                points.push(new Vector2(-100, this.leftBank.y));
                points.push(new Vector2(this.leftBank.x + this.leftBank.width, this.leftBank.y));
                points.push(new Vector2(this.leftBank.x + this.leftBank.width + 20, this.leftBank.y + 10));
                points.push(new Vector2(this.rightBank.x - 20, this.rightBank.y + 10));
                points.push(new Vector2(this.rightBank.x, this.rightBank.y));
                points.push(new Vector2(800, this.rightBank.y));
                break;
                
            case TerrainType.VALLEY:
                points.push(new Vector2(-100, this.leftBank.y - 50));
                points.push(new Vector2(this.leftBank.x, this.leftBank.y));
                points.push(new Vector2(this.leftBank.x + this.leftBank.width / 2, this.canyonBottom + 100));
                points.push(new Vector2(this.rightBank.x - this.leftBank.width / 2, this.canyonBottom + 100));
                points.push(new Vector2(this.rightBank.x, this.rightBank.y));
                points.push(new Vector2(800, this.rightBank.y - 50));
                break;
                
            default:
                points.push(new Vector2(-100, this.leftBank.y));
                points.push(new Vector2(800, this.leftBank.y));
        }
        
        return points;
    }

    getWaterPolyline() {
        if (this.terrainType !== TerrainType.RIVER) return null;
        
        return [
            new Vector2(this.leftBank.x + this.leftBank.width, this.leftBank.y + 10),
            new Vector2(this.rightBank.x, this.rightBank.y + 10)
        ];
    }

    isInBuildZone(point) {
        const minX = this.leftBank.x + this.leftBank.width - 50;
        const maxX = this.rightBank.x + 50;
        const minY = this.startPoint.y - 200;
        const maxY = this.canyonBottom;
        
        return point.x >= minX && point.x <= maxX &&
               point.y >= minY && point.y <= maxY;
    }

    isNearAnchorPoint(point, threshold = 30) {
        for (const anchor of this.anchorPoints) {
            if (point.distanceTo(anchor) < threshold) {
                return anchor;
            }
        }
        return null;
    }

    isOnBank(point) {
        const onLeft = point.x <= this.leftBank.x + this.leftBank.width &&
                       point.y <= this.leftBank.y + 20 &&
                       point.y >= this.leftBank.y - 20;
        const onRight = point.x >= this.rightBank.x &&
                        point.y <= this.rightBank.y + 20 &&
                        point.y >= this.rightBank.y - 20;
        return onLeft || onRight;
    }

    validateBudget(cost) {
        if (this.budgetLimit === Infinity) return true;
        return cost <= this.budgetLimit;
    }

    validateWeight(weight) {
        if (this.weightLimit === Infinity) return true;
        return weight <= this.weightLimit;
    }

    validateHeight(maxHeight) {
        if (this.heightLimit === Infinity) return true;
        return maxHeight <= this.heightLimit;
    }

    validateBridge(bridge) {
        const issues = [];
        
        const cost = bridge.getTotalCost();
        if (!this.validateBudget(cost)) {
            issues.push({
                type: 'budget',
                message: `超出预算限制 $${this.budgetLimit}`,
                current: cost,
                limit: this.budgetLimit
            });
        }
        
        const weight = bridge.getTotalWeight();
        if (!this.validateWeight(weight)) {
            issues.push({
                type: 'weight',
                message: `超出重量限制 ${this.weightLimit} kg`,
                current: weight,
                limit: this.weightLimit
            });
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    getRating(actualCost, maxStress, completedSuccessfully) {
        if (!completedSuccessfully) {
            return { stars: 0, text: '未完成' };
        }
        
        const costRatio = actualCost / this.recommendedBudget;
        
        let costStars = 5;
        if (costRatio > 0.6) costStars = 4;
        if (costRatio > 0.75) costStars = 3;
        if (costRatio > 0.9) costStars = 2;
        if (costRatio > 1.0) costStars = 1;
        
        let stressStars = 5;
        if (maxStress > 0.5) stressStars = 4;
        if (maxStress > 0.7) stressStars = 3;
        if (maxStress > 0.85) stressStars = 2;
        if (maxStress > 0.95) stressStars = 1;
        
        const totalStars = Math.round((costStars + stressStars) / 2);
        
        let text = '';
        switch (totalStars) {
            case 5: text = '完美 - 大师级设计！'; break;
            case 4: text = '优秀 - 经济高效的设计'; break;
            case 3: text = '良好 - 还有优化空间'; break;
            case 2: text = '合格 - 但成本较高'; break;
            case 1: text = '勉强通过 - 建议重新设计'; break;
            default: text = '未完成';
        }
        
        return {
            stars: totalStars,
            costStars: costStars,
            stressStars: stressStars,
            text: text,
            costRatio: costRatio,
            maxStress: maxStress
        };
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            objective: this.objective,
            terrainType: this.terrainType,
            leftBank: this.leftBank,
            rightBank: this.rightBank,
            canyonBottom: this.canyonBottom,
            startPoint: [this.startPoint.x, this.startPoint.y],
            endPoint: [this.endPoint.x, this.endPoint.y],
            anchorPoints: this.anchorPoints.map(p => [p.x, p.y]),
            budgetLimit: this.budgetLimit,
            weightLimit: this.weightLimit,
            heightLimit: this.heightLimit,
            challenges: this.challenges,
            vehicleTypes: this.vehicleTypes,
            vehicleCount: this.vehicleCount,
            vehicleStartX: this.vehicleStartX,
            vehicleEndX: this.vehicleEndX,
            shipPassage: this.shipPassage,
            recommendedBudget: this.recommendedBudget,
            gridSize: this.gridSize,
            snapToGrid: this.snapToGrid
        };
    }

    static fromJSON(data) {
        return new Level({
            id: data.id,
            name: data.name,
            description: data.description,
            objective: data.objective,
            terrainType: data.terrainType,
            leftBank: data.leftBank,
            rightBank: data.rightBank,
            canyonBottom: data.canyonBottom,
            startPoint: new Vector2(data.startPoint[0], data.startPoint[1]),
            endPoint: new Vector2(data.endPoint[0], data.endPoint[1]),
            anchorPoints: data.anchorPoints.map(p => new Vector2(p[0], p[1])),
            budgetLimit: data.budgetLimit,
            weightLimit: data.weightLimit,
            heightLimit: data.heightLimit,
            challenges: data.challenges,
            vehicleTypes: data.vehicleTypes,
            vehicleCount: data.vehicleCount,
            vehicleStartX: data.vehicleStartX,
            vehicleEndX: data.vehicleEndX,
            shipPassage: data.shipPassage,
            recommendedBudget: data.recommendedBudget,
            gridSize: data.gridSize,
            snapToGrid: data.snapToGrid
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Level, TerrainType, ChallengeType };
}
