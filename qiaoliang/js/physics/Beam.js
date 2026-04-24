const BeamState = {
    NORMAL: 'normal',
    BROKEN: 'broken',
    STRESSED: 'stressed',
    SELECTED: 'selected',
    HOVERED: 'hovered'
};

const ForceType = {
    TENSION: 'tension',
    COMPRESSION: 'compression',
    NONE: 'none'
};

class Beam {
    constructor(nodeA, nodeB, materialType = MaterialType.WOOD) {
        this.id = this.generateId();
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.material = new Material(materialType);
        
        this.restLength = this.getCurrentLength();
        this.prevLength = this.restLength;
        
        this.currentForce = 0;
        this.stressRatio = 0;
        this.forceType = ForceType.NONE;
        
        this.state = BeamState.NORMAL;
        this.isBroken = false;
        this.breakTime = 0;
        
        this.crossSectionArea = 0.01;
        this.dampingFactor = this.material.dampingRatio;
        
        this.isSelected = false;
        this.isHovered = false;
        this.userCreated = false;
        
        this.fracturePosition = 0.5;
        
        if (nodeA) nodeA.addConnection(this);
        if (nodeB) nodeB.addConnection(this);
    }

    generateId() {
        return 'beam_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentLength() {
        if (!this.nodeA || !this.nodeB) return 0;
        return this.nodeA.position.distanceTo(this.nodeB.position);
    }

    getDirectionVector() {
        if (!this.nodeA || !this.nodeB) return Vector2.zero();
        return this.nodeB.position.sub(this.nodeA.position);
    }

    getUnitVector() {
        const dir = this.getDirectionVector();
        const len = dir.magnitude();
        if (len === 0) return Vector2.zero();
        return dir.divScalar(len);
    }

    getMidPoint() {
        if (!this.nodeA || !this.nodeB) return Vector2.zero();
        return this.nodeA.position.lerp(this.nodeB.position, 0.5);
    }

    getAngle() {
        return this.getDirectionVector().angle();
    }

    calculateCurrentForce(dt) {
        if (this.isBroken || !this.nodeA || !this.nodeB) {
            this.currentForce = 0;
            this.stressRatio = 0;
            this.forceType = ForceType.NONE;
            return 0;
        }

        const currentLength = this.getCurrentLength();
        const deltaLength = currentLength - this.restLength;
        
        const velocity = (currentLength - this.prevLength) / Math.max(dt, 0.001);
        this.prevLength = currentLength;

        const springConstant = this.material.calculateSpringConstant(
            this.restLength, 
            this.crossSectionArea
        );
        
        const springForce = springConstant * deltaLength;
        const dampingForce = this.dampingFactor * velocity;
        
        this.currentForce = springForce + dampingForce;

        if (Math.abs(this.currentForce) < 0.01) {
            this.forceType = ForceType.NONE;
        } else if (this.currentForce > 0) {
            this.forceType = ForceType.TENSION;
        } else {
            this.forceType = ForceType.COMPRESSION;
        }

        this.stressRatio = this.material.calculateStressRatio(
            this.currentForce, 
            this.crossSectionArea
        );

        if (this.forceType === ForceType.COMPRESSION && !this.material.canCompress) {
            this.stressRatio = 1.0;
        }

        if (this.currentForce === 0) {
            this.forceType = ForceType.NONE;
        }

        return this.currentForce;
    }

    applyForces() {
        if (this.isBroken || this.currentForce === 0) return;
        if (!this.nodeA || !this.nodeB) return;

        const unitVector = this.getUnitVector();
        const forceVector = unitVector.mulScalar(this.currentForce);

        this.nodeA.applyForce(forceVector);
        this.nodeB.applyForce(forceVector.mulScalar(-1));
    }

    getForceOnNode(node) {
        if (this.isBroken || this.currentForce === 0) return Vector2.zero();
        
        const isNodeA = node === this.nodeA;
        const unitVector = this.getUnitVector();
        const forceVector = unitVector.mulScalar(this.currentForce);
        
        return isNodeA ? forceVector : forceVector.mulScalar(-1);
    }

    checkBreakage() {
        if (this.isBroken) return false;

        if (this.forceType === ForceType.COMPRESSION && !this.material.canCompress) {
            this.break(0.5);
            return true;
        }

        if (this.forceType === ForceType.TENSION && !this.material.canTension) {
            this.break(0.5);
            return true;
        }

        if (this.stressRatio >= 1.0) {
            this.break(Math.random());
            return true;
        }

        return false;
    }

    break(position = 0.5) {
        this.isBroken = true;
        this.state = BeamState.BROKEN;
        this.fracturePosition = MathUtil.clamp(position, 0.1, 0.9);
        this.breakTime = Date.now();

        if (this.nodeA) this.nodeA.removeConnection(this);
        if (this.nodeB) this.nodeB.removeConnection(this);

        const breakForce = 500;
        const dir = this.getUnitVector();
        const perp = dir.perpendicular().normalize();
        
        if (this.nodeA && !this.nodeA.isFixed) {
            this.nodeA.applyImpulse(perp.mulScalar(breakForce * (0.5 + Math.random() * 0.5)));
        }
        if (this.nodeB && !this.nodeB.isFixed) {
            this.nodeB.applyImpulse(perp.mulScalar(-breakForce * (0.5 + Math.random() * 0.5)));
        }
    }

    repair() {
        this.isBroken = false;
        this.state = BeamState.NORMAL;
        this.currentForce = 0;
        this.stressRatio = 0;
        this.forceType = ForceType.NONE;

        if (this.nodeA) this.nodeA.addConnection(this);
        if (this.nodeB) this.nodeB.addConnection(this);

        if (this.nodeA && this.nodeB) {
            this.restLength = this.getCurrentLength();
            this.prevLength = this.restLength;
        }
    }

    getWeight() {
        return this.material.calculateWeight(this.restLength);
    }

    getCost() {
        return this.material.calculateCost(this.restLength);
    }

    getStressColor() {
        return MathUtil.stressToColor(this.stressRatio);
    }

    containsPoint(point, threshold = 10) {
        if (!this.nodeA || !this.nodeB) return false;
        
        const distance = MathUtil.distanceToLineSegment(
            point.x, point.y,
            this.nodeA.position.x, this.nodeA.position.y,
            this.nodeB.position.x, this.nodeB.position.y
        );
        
        return distance < threshold;
    }

    closestPointOnBeam(point) {
        if (!this.nodeA || !this.nodeB) return point;
        
        return MathUtil.closestPointOnLineSegment(
            point.x, point.y,
            this.nodeA.position.x, this.nodeA.position.y,
            this.nodeB.position.x, this.nodeB.position.y
        );
    }

    getOtherNode(node) {
        if (node === this.nodeA) return this.nodeB;
        if (node === this.nodeB) return this.nodeA;
        return null;
    }

    replaceNode(oldNode, newNode) {
        if (this.nodeA === oldNode) {
            oldNode.removeConnection(this);
            this.nodeA = newNode;
            newNode.addConnection(this);
        } else if (this.nodeB === oldNode) {
            oldNode.removeConnection(this);
            this.nodeB = newNode;
            newNode.addConnection(this);
        }
        this.restLength = this.getCurrentLength();
    }

    copy(newNodeA, newNodeB) {
        const copy = new Beam(newNodeA, newNodeB, this.material.type);
        copy.restLength = this.restLength;
        copy.prevLength = this.prevLength;
        copy.crossSectionArea = this.crossSectionArea;
        copy.dampingFactor = this.dampingFactor;
        copy.userCreated = this.userCreated;
        return copy;
    }

    toJSON() {
        return {
            id: this.id,
            nodeAId: this.nodeA ? this.nodeA.id : null,
            nodeBId: this.nodeB ? this.nodeB.id : null,
            materialType: this.material.type,
            restLength: this.restLength,
            crossSectionArea: this.crossSectionArea,
            userCreated: this.userCreated
        };
    }

    static fromJSON(data, nodeMap) {
        const nodeA = nodeMap[data.nodeAId];
        const nodeB = nodeMap[data.nodeBId];
        
        if (!nodeA || !nodeB) return null;
        
        const beam = new Beam(nodeA, nodeB, data.materialType);
        beam.id = data.id;
        beam.restLength = data.restLength;
        beam.crossSectionArea = data.crossSectionArea || 0.01;
        beam.userCreated = data.userCreated || false;
        
        return beam;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Beam, BeamState, ForceType };
}
