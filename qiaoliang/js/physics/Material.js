const MaterialType = {
    WOOD: 'wood',
    STEEL: 'steel',
    CABLE: 'cable'
};

const MaterialProperties = {
    [MaterialType.WOOD]: {
        name: '木材',
        cost: 5,
        weightPerMeter: 0.75,
        maxTensileStrength: 6000,
        maxCompressiveStrength: 8000,
        youngsModulus: 10000000,
        dampingRatio: 0.05,
        minLength: 20,
        maxLength: 250,
        color: '#8B4513',
        strokeColor: '#654321',
        thickness: 6,
        canCompress: true,
        canTension: true,
        isFlexible: false
    },
    [MaterialType.STEEL]: {
        name: '钢筋',
        cost: 15,
        weightPerMeter: 2,
        maxTensileStrength: 25000,
        maxCompressiveStrength: 25000,
        youngsModulus: 200000000,
        dampingRatio: 0.03,
        minLength: 20,
        maxLength: 350,
        color: '#C0C0C0',
        strokeColor: '#808080',
        thickness: 8,
        canCompress: true,
        canTension: true,
        isFlexible: false
    },
    [MaterialType.CABLE]: {
        name: '绳索',
        cost: 2.5,
        weightPerMeter: 0.4,
        maxTensileStrength: 12000,
        maxCompressiveStrength: 0,
        youngsModulus: 5000000,
        dampingRatio: 0.08,
        minLength: 30,
        maxLength: 500,
        color: '#DAA520',
        strokeColor: '#B8860B',
        thickness: 4,
        canCompress: false,
        canTension: true,
        isFlexible: true
    }
};

class Material {
    constructor(type) {
        this.type = type;
        this.properties = MaterialProperties[type];
        
        if (!this.properties) {
            throw new Error(`Unknown material type: ${type}`);
        }
    }

    static create(type) {
        return new Material(type);
    }

    get name() { return this.properties.name; }
    get cost() { return this.properties.cost; }
    get weightPerMeter() { return this.properties.weightPerMeter; }
    get maxTensileStrength() { return this.properties.maxTensileStrength; }
    get maxCompressiveStrength() { return this.properties.maxCompressiveStrength; }
    get youngsModulus() { return this.properties.youngsModulus; }
    get dampingRatio() { return this.properties.dampingRatio; }
    get minLength() { return this.properties.minLength; }
    get maxLength() { return this.properties.maxLength; }
    get color() { return this.properties.color; }
    get strokeColor() { return this.properties.strokeColor; }
    get thickness() { return this.properties.thickness; }
    get canCompress() { return this.properties.canCompress; }
    get canTension() { return this.properties.canTension; }
    get isFlexible() { return this.properties.isFlexible; }

    calculateCost(length) {
        return this.cost * Math.ceil(length);
    }

    calculateWeight(length) {
        return this.weightPerMeter * length;
    }

    isLengthValid(length) {
        return length >= this.minLength && length <= this.maxLength;
    }

    getMaxStress(isTension) {
        return isTension ? this.maxTensileStrength : this.maxCompressiveStrength;
    }

    calculateStress(force, crossSectionArea = 0.01) {
        return Math.abs(force) / crossSectionArea;
    }

    calculateStressRatio(force, crossSectionArea = 0.01) {
        const isTension = force > 0;
        const stress = this.calculateStress(force, crossSectionArea);
        const maxStress = this.getMaxStress(isTension);
        
        if (maxStress === 0) return 0;
        return stress / maxStress;
    }

    willBreak(force, crossSectionArea = 0.01) {
        const isTension = force > 0;
        
        if (!isTension && !this.canCompress) {
            return force < 0;
        }
        if (isTension && !this.canTension) {
            return force > 0;
        }
        
        const stressRatio = this.calculateStressRatio(force, crossSectionArea);
        return stressRatio >= 1.0;
    }

    calculateSpringConstant(length, crossSectionArea = 0.01) {
        return (this.youngsModulus * crossSectionArea) / length;
    }

    getStressedColor(stressRatio) {
        const clamped = MathUtil.clamp(stressRatio, 0, 1);
        const baseColor = this.color;
        
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        const stressR = Math.round(MathUtil.lerp(r, 231, clamped));
        const stressG = Math.round(MathUtil.lerp(g, 76, clamped));
        const stressB = Math.round(MathUtil.lerp(b, 60, clamped));
        
        return `rgb(${stressR}, ${stressG}, ${stressB})`;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Material, MaterialType, MaterialProperties };
}
