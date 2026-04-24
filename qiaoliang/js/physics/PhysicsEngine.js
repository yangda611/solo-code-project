const PhysicsState = {
    BUILDING: 'building',
    TESTING: 'testing',
    PAUSED: 'paused',
    COLLAPSED: 'collapsed',
    COMPLETED: 'completed'
};

class PhysicsEngine {
    constructor() {
        this.nodes = [];
        this.beams = [];
        this.vehicles = [];
        
        this.state = PhysicsState.BUILDING;
        
        this.gravity = new Vector2(0, 9.8);
        this.timeScale = 1.0;
        this.dt = 1/60;
        this.subSteps = 4;
        
        this.bounds = {
            minX: -1000,
            maxX: 3000,
            minY: -1000,
            maxY: 2000
        };
        
        this.groundY = 800;
        this.groundLevel = 600;
        
        this.leftBank = null;
        this.rightBank = null;
        
        this.breakCallback = null;
        this.collapseCallback = null;
        this.completeCallback = null;
        
        this.frameCount = 0;
        this.simulationTime = 0;
    }

    addNode(node) {
        if (!this.nodes.includes(node)) {
            this.nodes.push(node);
        }
        return node;
    }

    removeNode(node) {
        const index = this.nodes.indexOf(node);
        if (index !== -1) {
            for (let i = this.beams.length - 1; i >= 0; i--) {
                const beam = this.beams[i];
                if (beam.nodeA === node || beam.nodeB === node) {
                    this.removeBeam(beam);
                }
            }
            this.nodes.splice(index, 1);
        }
    }

    addBeam(beam) {
        if (!this.beams.includes(beam)) {
            this.beams.push(beam);
        }
        return beam;
    }

    removeBeam(beam) {
        const index = this.beams.indexOf(beam);
        if (index !== -1) {
            const nodeA = beam.nodeA;
            const nodeB = beam.nodeB;
            
            if (nodeA) nodeA.removeConnection(beam);
            if (nodeB) nodeB.removeConnection(beam);
            this.beams.splice(index, 1);
            
            if (nodeA && nodeA.userCreated && nodeA.connections.length === 0) {
                this.removeNodeInternal(nodeA);
            }
            if (nodeB && nodeB.userCreated && nodeB.connections.length === 0) {
                this.removeNodeInternal(nodeB);
            }
        }
    }

    removeNodeInternal(node) {
        const index = this.nodes.indexOf(node);
        if (index !== -1) {
            for (let i = this.beams.length - 1; i >= 0; i--) {
                const beam = this.beams[i];
                if (beam.nodeA === node || beam.nodeB === node) {
                    this.removeBeam(beam);
                }
            }
            this.nodes.splice(index, 1);
        }
    }

    addVehicle(vehicle) {
        if (!this.vehicles.includes(vehicle)) {
            this.vehicles.push(vehicle);
        }
        return vehicle;
    }

    removeVehicle(vehicle) {
        const index = this.vehicles.indexOf(vehicle);
        if (index !== -1) {
            this.vehicles.splice(index, 1);
        }
    }

    createNode(x, y, isFixed = false, isGround = false) {
        const node = new Node(x, y, isFixed);
        node.isGround = isGround;
        return this.addNode(node);
    }

    createBeam(nodeA, nodeB, materialType = MaterialType.WOOD) {
        const beam = new Beam(nodeA, nodeB, materialType);
        return this.addBeam(beam);
    }

    connectNodes(nodeA, nodeB, materialType) {
        const existing = nodeA.getConnectionTo(nodeB);
        if (existing) return existing;
        
        const material = new Material(materialType);
        const length = nodeA.distanceTo(nodeB);
        
        if (!material.isLengthValid(length)) {
            return null;
        }
        
        const beam = this.createBeam(nodeA, nodeB, materialType);
        beam.userCreated = true;
        return beam;
    }

    clear() {
        this.nodes = [];
        this.beams = [];
        this.vehicles = [];
        this.frameCount = 0;
        this.simulationTime = 0;
    }

    reset() {
        for (const node of this.nodes) {
            if (node.oldPosition) {
                node.position.setVector(node.oldPosition.copy());
            }
            node.velocity.set(0, 0);
            node.acceleration.set(0, 0);
            node.forces.set(0, 0);
            node.state = NodeState.NORMAL;
        }
        
        for (const beam of this.beams) {
            beam.repair();
        }
        
        for (const vehicle of this.vehicles) {
            vehicle.reset();
        }
        
        this.frameCount = 0;
        this.simulationTime = 0;
        this.state = PhysicsState.BUILDING;
    }

    startTesting() {
        if (this.state === PhysicsState.BUILDING) {
            for (const node of this.nodes) {
                node.oldPosition.setVector(node.position.copy());
                node.prevPosition.setVector(node.position.copy());
            }
            
            for (const beam of this.beams) {
                beam.restLength = beam.getCurrentLength();
                beam.prevLength = beam.restLength;
            }
            
            this.state = PhysicsState.TESTING;
            this.frameCount = 0;
            this.simulationTime = 0;
        }
    }

    stopTesting() {
        this.state = PhysicsState.BUILDING;
        this.reset();
    }

    step(dt) {
        if (this.state !== PhysicsState.TESTING) return;

        const scaledDt = dt * this.timeScale;
        const subDt = scaledDt / this.subSteps;

        for (let step = 0; step < this.subSteps; step++) {
            this.applyGravity();
            this.calculateBeamForces(subDt);
            this.applyBeamForces();
            this.updateVehicles(subDt);
            this.updateNodes(subDt);
            this.constrainNodes();
            this.checkBreakages();
            this.applyGroundCollision();
        }

        this.frameCount++;
        this.simulationTime += scaledDt;
        
        this.checkCompletion();
    }

    applyGravity() {
        for (const node of this.nodes) {
            if (!node.isFixed) {
                node.applyForce(this.gravity.mulScalar(node.mass));
            }
        }
    }

    calculateBeamForces(dt) {
        for (const beam of this.beams) {
            if (!beam.isBroken) {
                beam.calculateCurrentForce(dt);
            }
        }
    }

    applyBeamForces() {
        for (const beam of this.beams) {
            if (!beam.isBroken) {
                beam.applyForces();
            }
        }
    }

    updateNodes(dt) {
        for (const node of this.nodes) {
            node.update(dt, this.gravity);
        }
    }

    constrainNodes() {
        for (const node of this.nodes) {
            node.constrainToBounds(
                this.bounds.minX,
                this.bounds.maxX,
                this.bounds.minY,
                this.bounds.maxY
            );
        }
    }

    checkBreakages() {
        for (const beam of this.beams) {
            if (!beam.isBroken && beam.checkBreakage()) {
                this.onBeamBreak(beam);
            }
        }
    }

    applyGroundCollision() {
        const groundY = this.groundLevel;
        
        for (const node of this.nodes) {
            if (node.isFixed) continue;
            
            if (node.position.y > groundY) {
                const penetration = node.position.y - groundY;
                node.position.y = groundY - penetration * 0.1;
                
                const damping = 0.5;
                node.velocity.y *= -damping;
                
                const friction = 0.8;
                node.velocity.x *= friction;
                
                if (Math.abs(node.velocity.y) < 0.1) {
                    node.velocity.y = 0;
                }
            }
        }
    }

    updateVehicles(dt) {
        for (const vehicle of this.vehicles) {
            vehicle.update(dt, this.beams, this.nodes, this.leftBank, this.rightBank);
        }
    }

    checkCompletion() {
        for (const vehicle of this.vehicles) {
            if (vehicle.isCompleted) {
                this.state = PhysicsState.COMPLETED;
                if (this.completeCallback) {
                    this.completeCallback();
                }
                return;
            }
            
            if (vehicle.isFallen) {
                this.state = PhysicsState.COLLAPSED;
                if (this.collapseCallback) {
                    this.collapseCallback('vehicle_fallen');
                }
                return;
            }
        }

        const brokenBeams = this.beams.filter(b => b.isBroken).length;
        const totalBeams = this.beams.length;
        
        if (totalBeams > 0 && brokenBeams / totalBeams > 0.5) {
            this.state = PhysicsState.COLLAPSED;
            if (this.collapseCallback) {
                this.collapseCallback('structural_failure');
            }
        }
    }

    onBeamBreak(beam) {
        if (this.breakCallback) {
            this.breakCallback(beam);
        }
    }

    getTotalCost() {
        return this.beams.reduce((sum, beam) => sum + beam.getCost(), 0);
    }

    getTotalWeight() {
        const nodeWeight = this.nodes.filter(n => n.userCreated).length * 1;
        const beamWeight = this.beams.reduce((sum, beam) => sum + beam.getWeight(), 0);
        return nodeWeight + beamWeight;
    }

    getMaxStressRatio() {
        let maxRatio = 0;
        for (const beam of this.beams) {
            if (!beam.isBroken && beam.stressRatio > maxRatio) {
                maxRatio = beam.stressRatio;
            }
        }
        return maxRatio;
    }

    getNodeById(id) {
        return this.nodes.find(n => n.id === id);
    }

    getBeamById(id) {
        return this.beams.find(b => b.id === id);
    }

    findNodeNearPoint(point, threshold = 20) {
        let closest = null;
        let minDist = threshold;
        
        for (const node of this.nodes) {
            const dist = node.distanceToPoint(point);
            if (dist < minDist) {
                minDist = dist;
                closest = node;
            }
        }
        
        return closest;
    }

    findBeamNearPoint(point, threshold = 10) {
        for (const beam of this.beams) {
            if (beam.containsPoint(point, threshold)) {
                return beam;
            }
        }
        return null;
    }

    toJSON() {
        return {
            nodes: this.nodes.map(n => n.toJSON()),
            beams: this.beams.map(b => b.toJSON()),
            gravity: [this.gravity.x, this.gravity.y],
            bounds: this.bounds,
            groundLevel: this.groundLevel
        };
    }

    fromJSON(data) {
        this.clear();
        
        const nodeMap = {};
        for (const nodeData of data.nodes) {
            const node = Node.fromJSON(nodeData);
            this.addNode(node);
            nodeMap[node.id] = node;
        }
        
        for (const beamData of data.beams) {
            const beam = Beam.fromJSON(beamData, nodeMap);
            if (beam) {
                this.addBeam(beam);
            }
        }
        
        if (data.gravity) {
            this.gravity = new Vector2(data.gravity[0], data.gravity[1]);
        }
        if (data.bounds) {
            this.bounds = data.bounds;
        }
        if (data.groundLevel !== undefined) {
            this.groundLevel = data.groundLevel;
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = { PhysicsEngine, PhysicsState };
}
