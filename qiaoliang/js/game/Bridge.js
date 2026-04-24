class Bridge {
    constructor() {
        this.nodes = [];
        this.beams = [];
        this.selectedNode = null;
        this.selectedBeam = null;
        this.hoveredNode = null;
        this.hoveredBeam = null;
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
            if (beam.nodeA) beam.nodeA.removeConnection(beam);
            if (beam.nodeB) beam.nodeB.removeConnection(beam);
            this.beams.splice(index, 1);
        }
    }

    createNode(x, y, isFixed = false, isGround = false) {
        const node = new Node(x, y, isFixed);
        node.isGround = isGround;
        return this.addNode(node);
    }

    connectNodes(nodeA, nodeB, materialType) {
        const existing = nodeA.getConnectionTo(nodeB);
        if (existing) {
            return { beam: existing, created: false };
        }
        
        const material = new Material(materialType);
        const length = nodeA.distanceTo(nodeB);
        
        if (!material.isLengthValid(length)) {
            return { beam: null, created: false, error: 'invalid_length' };
        }
        
        const beam = new Beam(nodeA, nodeB, materialType);
        beam.userCreated = true;
        nodeA.userCreated = true;
        nodeB.userCreated = true;
        
        this.addBeam(beam);
        
        return { beam: beam, created: true };
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

    selectNode(node) {
        this.deselectAll();
        this.selectedNode = node;
        if (node) {
            node.isSelected = true;
        }
    }

    selectBeam(beam) {
        this.deselectAll();
        this.selectedBeam = beam;
        if (beam) {
            beam.isSelected = true;
        }
    }

    deselectAll() {
        if (this.selectedNode) {
            this.selectedNode.isSelected = false;
            this.selectedNode = null;
        }
        if (this.selectedBeam) {
            this.selectedBeam.isSelected = false;
            this.selectedBeam = null;
        }
    }

    deleteSelected() {
        if (this.selectedNode) {
            this.removeNode(this.selectedNode);
            this.selectedNode = null;
            return true;
        }
        if (this.selectedBeam) {
            this.removeBeam(this.selectedBeam);
            this.selectedBeam = null;
            return true;
        }
        return false;
    }

    clear() {
        this.nodes = [];
        this.beams = [];
        this.selectedNode = null;
        this.selectedBeam = null;
    }

    clearUserCreated() {
        this.beams = this.beams.filter(b => !b.userCreated);
        this.nodes = this.nodes.filter(n => !n.userCreated);
        this.selectedNode = null;
        this.selectedBeam = null;
    }

    getTotalCost() {
        return this.beams
            .filter(b => b.userCreated)
            .reduce((sum, beam) => sum + beam.getCost(), 0);
    }

    getTotalWeight() {
        const nodeWeight = this.nodes.filter(n => n.userCreated).length * 1;
        const beamWeight = this.beams
            .filter(b => b.userCreated)
            .reduce((sum, beam) => sum + beam.getWeight(), 0);
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

    getMaterialStats() {
        const stats = {
            wood: 0,
            steel: 0,
            cable: 0
        };
        
        for (const beam of this.beams) {
            if (!beam.userCreated) continue;
            
            switch (beam.material.type) {
                case MaterialType.WOOD:
                    stats.wood++;
                    break;
                case MaterialType.STEEL:
                    stats.steel++;
                    break;
                case MaterialType.CABLE:
                    stats.cable++;
                    break;
            }
        }
        
        return stats;
    }

    getNodeCount() {
        return this.nodes.filter(n => n.userCreated).length;
    }

    getBeamCount() {
        return this.beams.filter(b => b.userCreated).length;
    }

    saveState() {
        return {
            nodes: this.nodes
                .filter(n => n.userCreated)
                .map(n => ({
                    id: n.id,
                    x: n.position.x,
                    y: n.position.y,
                    isFixed: n.isFixed
                })),
            beams: this.beams
                .filter(b => b.userCreated)
                .map(b => ({
                    id: b.id,
                    nodeAId: b.nodeA.id,
                    nodeBId: b.nodeB.id,
                    materialType: b.material.type,
                    restLength: b.restLength
                }))
        };
    }

    loadState(state, existingNodes = []) {
        const nodeMap = {};
        
        for (const node of existingNodes) {
            nodeMap[node.id] = node;
        }
        
        for (const nodeData of state.nodes) {
            const node = new Node(nodeData.x, nodeData.y, nodeData.isFixed);
            node.id = nodeData.id;
            node.userCreated = true;
            this.addNode(node);
            nodeMap[node.id] = node;
        }
        
        for (const beamData of state.beams) {
            const nodeA = nodeMap[beamData.nodeAId];
            const nodeB = nodeMap[beamData.nodeBId];
            
            if (nodeA && nodeB) {
                const beam = new Beam(nodeA, nodeB, beamData.materialType);
                beam.id = beamData.id;
                beam.restLength = beamData.restLength;
                beam.userCreated = true;
                this.addBeam(beam);
            }
        }
    }

    copy() {
        const copy = new Bridge();
        
        const nodeMap = {};
        
        for (const node of this.nodes) {
            const nodeCopy = node.copy();
            copy.addNode(nodeCopy);
            nodeMap[node.id] = nodeCopy;
        }
        
        for (const beam of this.beams) {
            const nodeA = nodeMap[beam.nodeA.id];
            const nodeB = nodeMap[beam.nodeB.id];
            if (nodeA && nodeB) {
                const beamCopy = beam.copy(nodeA, nodeB);
                copy.addBeam(beamCopy);
            }
        }
        
        return copy;
    }

    merge(other) {
        const nodeMap = {};
        
        for (const node of other.nodes) {
            const existing = this.findNodeNearPoint(node.position, 1);
            if (existing) {
                nodeMap[node.id] = existing;
            } else {
                const nodeCopy = node.copy();
                this.addNode(nodeCopy);
                nodeMap[node.id] = nodeCopy;
            }
        }
        
        for (const beam of other.beams) {
            const nodeA = nodeMap[beam.nodeA.id];
            const nodeB = nodeMap[beam.nodeB.id];
            if (nodeA && nodeB) {
                const existing = nodeA.getConnectionTo(nodeB);
                if (!existing) {
                    const beamCopy = beam.copy(nodeA, nodeB);
                    this.addBeam(beamCopy);
                }
            }
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Bridge };
}
