const HistoryActionType = {
    ADD_NODE: 'add_node',
    REMOVE_NODE: 'remove_node',
    ADD_BEAM: 'add_beam',
    REMOVE_BEAM: 'remove_beam',
    MOVE_NODE: 'move_node',
    CLEAR_ALL: 'clear_all',
    BATCH: 'batch'
};

class HistoryAction {
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
        this.timestamp = Date.now();
    }

    static addNode(node) {
        return new HistoryAction(HistoryActionType.ADD_NODE, {
            nodeId: node.id,
            nodeData: {
                x: node.position.x,
                y: node.position.y,
                isFixed: node.isFixed,
                isGround: node.isGround,
                mass: node.mass,
                userCreated: node.userCreated
            }
        });
    }

    static removeNode(node, nodeIndex) {
        return new HistoryAction(HistoryActionType.REMOVE_NODE, {
            nodeId: node.id,
            nodeIndex: nodeIndex,
            nodeData: {
                x: node.position.x,
                y: node.position.y,
                isFixed: node.isFixed,
                isGround: node.isGround,
                mass: node.mass,
                userCreated: node.userCreated
            }
        });
    }

    static addBeam(beam) {
        return new HistoryAction(HistoryActionType.ADD_BEAM, {
            beamId: beam.id,
            beamData: {
                nodeAId: beam.nodeA.id,
                nodeBId: beam.nodeB.id,
                materialType: beam.material.type,
                restLength: beam.restLength,
                userCreated: beam.userCreated
            }
        });
    }

    static removeBeam(beam, beamIndex) {
        return new HistoryAction(HistoryActionType.REMOVE_BEAM, {
            beamId: beam.id,
            beamIndex: beamIndex,
            beamData: {
                nodeAId: beam.nodeA.id,
                nodeBId: beam.nodeB.id,
                materialType: beam.material.type,
                restLength: beam.restLength,
                userCreated: beam.userCreated
            }
        });
    }

    static moveNode(node, oldX, oldY, newX, newY) {
        return new HistoryAction(HistoryActionType.MOVE_NODE, {
            nodeId: node.id,
            oldPosition: { x: oldX, y: oldY },
            newPosition: { x: newX, y: newY }
        });
    }

    static clearAll(nodes, beams) {
        const savedNodes = nodes.map((node, index) => ({
            id: node.id,
            index: index,
            data: {
                x: node.position.x,
                y: node.position.y,
                isFixed: node.isFixed,
                isGround: node.isGround,
                mass: node.mass,
                userCreated: node.userCreated
            }
        }));
        
        const savedBeams = beams.map((beam, index) => ({
            id: beam.id,
            index: index,
            data: {
                nodeAId: beam.nodeA.id,
                nodeBId: beam.nodeB.id,
                materialType: beam.material.type,
                restLength: beam.restLength,
                userCreated: beam.userCreated
            }
        }));
        
        return new HistoryAction(HistoryActionType.CLEAR_ALL, {
            nodes: savedNodes,
            beams: savedBeams
        });
    }

    static batch(actions, description = '批量操作') {
        return new HistoryAction(HistoryActionType.BATCH, {
            actions: actions,
            description: description
        });
    }
}

class HistoryManager {
    constructor(game) {
        this.game = game;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 100;
        
        this.isBatching = false;
        this.batchActions = [];
        this.batchDescription = '';
    }

    startBatch(description = '批量操作') {
        this.isBatching = true;
        this.batchActions = [];
        this.batchDescription = description;
    }

    endBatch() {
        if (!this.isBatching) return;
        
        this.isBatching = false;
        
        if (this.batchActions.length > 0) {
            const batchAction = HistoryAction.batch(this.batchActions, this.batchDescription);
            this.pushAction(batchAction);
        }
        
        this.batchActions = [];
    }

    pushAction(action) {
        if (this.isBatching) {
            this.batchActions.push(action);
            return;
        }
        
        this.undoStack.push(action);
        this.redoStack = [];
        
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        
        this.updateUI();
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    undo() {
        if (!this.canUndo()) return false;
        
        const action = this.undoStack.pop();
        this.executeUndo(action);
        this.redoStack.push(action);
        
        this.updateUI();
        return true;
    }

    redo() {
        if (!this.canRedo()) return false;
        
        const action = this.redoStack.pop();
        this.executeRedo(action);
        this.undoStack.push(action);
        
        this.updateUI();
        return true;
    }

    executeUndo(action) {
        switch (action.type) {
            case HistoryActionType.ADD_NODE:
                this.undoAddNode(action.data);
                break;
                
            case HistoryActionType.REMOVE_NODE:
                this.undoRemoveNode(action.data);
                break;
                
            case HistoryActionType.ADD_BEAM:
                this.undoAddBeam(action.data);
                break;
                
            case HistoryActionType.REMOVE_BEAM:
                this.undoRemoveBeam(action.data);
                break;
                
            case HistoryActionType.MOVE_NODE:
                this.undoMoveNode(action.data);
                break;
                
            case HistoryActionType.CLEAR_ALL:
                this.undoClearAll(action.data);
                break;
                
            case HistoryActionType.BATCH:
                this.undoBatch(action.data);
                break;
        }
    }

    executeRedo(action) {
        switch (action.type) {
            case HistoryActionType.ADD_NODE:
                this.redoAddNode(action.data);
                break;
                
            case HistoryActionType.REMOVE_NODE:
                this.redoRemoveNode(action.data);
                break;
                
            case HistoryActionType.ADD_BEAM:
                this.redoAddBeam(action.data);
                break;
                
            case HistoryActionType.REMOVE_BEAM:
                this.redoRemoveBeam(action.data);
                break;
                
            case HistoryActionType.MOVE_NODE:
                this.redoMoveNode(action.data);
                break;
                
            case HistoryActionType.CLEAR_ALL:
                this.redoClearAll(action.data);
                break;
                
            case HistoryActionType.BATCH:
                this.redoBatch(action.data);
                break;
        }
    }

    undoAddNode(data) {
        const node = this.game.getNodeById(data.nodeId);
        if (node) {
            this.game.removeNode(node, false);
        }
    }

    redoAddNode(data) {
        const nodeData = data.nodeData;
        const node = this.game.createNode(nodeData.x, nodeData.y, nodeData.isFixed, nodeData.isGround);
        node.id = data.nodeId;
        node.mass = nodeData.mass;
        node.userCreated = nodeData.userCreated;
    }

    undoRemoveNode(data) {
        const nodeData = data.nodeData;
        const node = new Node(nodeData.x, nodeData.y, nodeData.isFixed);
        node.id = data.nodeId;
        node.isGround = nodeData.isGround;
        node.mass = nodeData.mass;
        node.userCreated = nodeData.userCreated;
        
        this.game.addNodeAt(node, data.nodeIndex);
    }

    redoRemoveNode(data) {
        const node = this.game.getNodeById(data.nodeId);
        if (node) {
            this.game.removeNode(node, false);
        }
    }

    undoAddBeam(data) {
        const beam = this.game.getBeamById(data.beamId);
        if (beam) {
            this.game.removeBeam(beam, false);
        }
    }

    redoAddBeam(data) {
        const beamData = data.beamData;
        const nodeA = this.game.getNodeById(beamData.nodeAId);
        const nodeB = this.game.getNodeById(beamData.nodeBId);
        
        if (nodeA && nodeB) {
            const beam = new Beam(nodeA, nodeB, beamData.materialType);
            beam.id = data.beamId;
            beam.restLength = beamData.restLength;
            beam.userCreated = beamData.userCreated;
            
            this.game.addBeam(beam);
        }
    }

    undoRemoveBeam(data) {
        const beamData = data.beamData;
        const nodeA = this.game.getNodeById(beamData.nodeAId);
        const nodeB = this.game.getNodeById(beamData.nodeBId);
        
        if (nodeA && nodeB) {
            const beam = new Beam(nodeA, nodeB, beamData.materialType);
            beam.id = data.beamId;
            beam.restLength = beamData.restLength;
            beam.userCreated = beamData.userCreated;
            
            this.game.addBeamAt(beam, data.beamIndex);
        }
    }

    redoRemoveBeam(data) {
        const beam = this.game.getBeamById(data.beamId);
        if (beam) {
            this.game.removeBeam(beam, false);
        }
    }

    undoMoveNode(data) {
        const node = this.game.getNodeById(data.nodeId);
        if (node) {
            node.position.x = data.oldPosition.x;
            node.position.y = data.oldPosition.y;
        }
    }

    redoMoveNode(data) {
        const node = this.game.getNodeById(data.nodeId);
        if (node) {
            node.position.x = data.newPosition.x;
            node.position.y = data.newPosition.y;
        }
    }

    undoClearAll(data) {
        for (const savedNode of data.nodes) {
            const nodeData = savedNode.data;
            const node = new Node(nodeData.x, nodeData.y, nodeData.isFixed);
            node.id = savedNode.id;
            node.isGround = nodeData.isGround;
            node.mass = nodeData.mass;
            node.userCreated = nodeData.userCreated;
            
            this.game.addNodeAt(node, savedNode.index);
        }
        
        for (const savedBeam of data.beams) {
            const beamData = savedBeam.data;
            const nodeA = this.game.getNodeById(beamData.nodeAId);
            const nodeB = this.game.getNodeById(beamData.nodeBId);
            
            if (nodeA && nodeB) {
                const beam = new Beam(nodeA, nodeB, beamData.materialType);
                beam.id = savedBeam.id;
                beam.restLength = beamData.restLength;
                beam.userCreated = beamData.userCreated;
                
                this.game.addBeamAt(beam, savedBeam.index);
            }
        }
    }

    redoClearAll(data) {
        this.game.clearUserCreated(false);
    }

    undoBatch(data) {
        for (let i = data.actions.length - 1; i >= 0; i--) {
            this.executeUndo(data.actions[i]);
        }
    }

    redoBatch(data) {
        for (const action of data.actions) {
            this.executeRedo(action);
        }
    }

    updateUI() {
        if (this.game.uiManager) {
            this.game.uiManager.updateUndoRedoButtons(this.canUndo(), this.canRedo());
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.isBatching = false;
        this.batchActions = [];
        this.updateUI();
    }

    getUndoCount() {
        return this.undoStack.length;
    }

    getRedoCount() {
        return this.redoStack.length;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { HistoryManager, HistoryAction, HistoryActionType };
}
