const InputState = {
    IDLE: 'idle',
    DRAGGING: 'dragging',
    PLACING_NODE: 'placing_node',
    CONNECTING: 'connecting',
    SELECTING: 'selecting',
    DELETING: 'deleting'
};

class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = game.renderer;
        
        this.state = InputState.IDLE;
        
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            isDown: false,
            button: 0
        };
        
        this.keys = {};
        this.modifiers = {
            ctrl: false,
            shift: false,
            alt: false
        };
        
        this.selectedTool = 'select';
        this.snapToGrid = true;
        this.gridSize = 20;
        
        this.startNode = null;
        this.previewEnd = null;
        this.dragStart = null;
        this.selectedObject = null;
        
        this.callbacks = {
            onNodeCreate: null,
            onBeamCreate: null,
            onObjectSelect: null,
            onDelete: null,
            onUndo: null,
            onRedo: null,
            onToolChange: null
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    getEventPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    updateMousePosition(e) {
        const pos = this.getEventPosition(e);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        
        const world = this.renderer.toWorld(pos.x, pos.y);
        this.mouse.worldX = world.x;
        this.mouse.worldY = world.y;
        
        if (this.game.updateCoordinates) {
            this.game.updateCoordinates(world.x, world.y);
        }
    }

    getSnappedPosition(x, y) {
        if (!this.snapToGrid) {
            return new Vector2(x, y);
        }
        
        return new Vector2(
            MathUtil.roundToNearest(x, this.gridSize),
            MathUtil.roundToNearest(y, this.gridSize)
        );
    }

    findObjectAtPosition() {
        const worldPos = new Vector2(this.mouse.worldX, this.mouse.worldY);
        
        const node = this.game.findNodeNearPoint(worldPos, 15);
        if (node) {
            return { type: 'node', object: node };
        }
        
        const beam = this.game.findBeamNearPoint(worldPos, 10);
        if (beam) {
            return { type: 'beam', object: beam };
        }
        
        return null;
    }

    handleMouseDown(e) {
        e.preventDefault();
        
        this.updateMousePosition(e);
        this.mouse.isDown = true;
        this.mouse.button = e.button;
        
        const worldPos = new Vector2(this.mouse.worldX, this.mouse.worldY);
        const snappedPos = this.getSnappedPosition(worldPos.x, worldPos.y);
        
        switch (this.selectedTool) {
            case 'select':
                this.handleSelectToolDown(snappedPos);
                break;
                
            case 'wood':
            case 'steel':
            case 'cable':
                if (this.state === InputState.CONNECTING && this.startNode) {
                    this.finishConnection(snappedPos);
                } else {
                    this.handleBuildToolDown(snappedPos);
                }
                break;
                
            default:
                break;
        }
    }

    handleSelectToolDown(pos) {
        const obj = this.findObjectAtPosition();
        
        if (obj) {
            if (this.callbacks.onObjectSelect) {
                this.callbacks.onObjectSelect(obj.type, obj.object);
            }
            
            this.selectedObject = obj;
            this.dragStart = pos.copy();
            this.state = InputState.DRAGGING;
        } else {
            if (this.callbacks.onObjectSelect) {
                this.callbacks.onObjectSelect(null, null);
            }
            this.selectedObject = null;
            this.state = InputState.IDLE;
        }
    }

    handleBuildToolDown(pos) {
        const existingNode = this.game.findNodeNearPoint(pos, 15);
        
        if (existingNode) {
            this.startNode = existingNode;
            this.previewEnd = pos.copy();
            this.state = InputState.CONNECTING;
        } else {
            const anchor = this.game.level ? this.game.level.isNearAnchorPoint(pos, 20) : null;
            
            if (anchor) {
                const anchorNode = this.game.findNodeNearPoint(anchor, 10);
                if (anchorNode) {
                    this.startNode = anchorNode;
                } else {
                    this.startNode = this.game.createNode(anchor.x, anchor.y, true, true);
                }
                this.previewEnd = pos.copy();
                this.state = InputState.CONNECTING;
            } else {
                const newNode = this.game.createNode(pos.x, pos.y, false, false);
                newNode.userCreated = true;
                
                if (this.callbacks.onNodeCreate) {
                    this.callbacks.onNodeCreate(newNode);
                }
                
                this.startNode = newNode;
                this.previewEnd = pos.copy();
                this.state = InputState.CONNECTING;
            }
        }
    }

    handleMouseMove(e) {
        this.updateMousePosition(e);
        
        const worldPos = new Vector2(this.mouse.worldX, this.mouse.worldY);
        const snappedPos = this.getSnappedPosition(worldPos.x, worldPos.y);
        
        this.updateHover(worldPos);
        
        switch (this.state) {
            case InputState.CONNECTING:
                this.previewEnd = snappedPos.copy();
                break;
                
            case InputState.DRAGGING:
                this.handleDrag(snappedPos);
                break;
                
            default:
                break;
        }
    }

    updateHover(worldPos) {
        for (const node of this.game.nodes) {
            node.isHovered = node.distanceToPoint(worldPos) < 15;
        }
        
        for (const beam of this.game.beams) {
            beam.isHovered = beam.containsPoint(worldPos, 10);
        }
    }

    handleDrag(pos) {
        if (!this.selectedObject || this.selectedObject.type !== 'node') return;
        if (this.selectedObject.object.isFixed) return;
        
        const node = this.selectedObject.object;
        
        if (this.game.isInBuildZone(pos)) {
            node.position.setVector(pos);
            
            for (const beam of node.connections) {
                beam.restLength = beam.getCurrentLength();
            }
        }
    }

    handleMouseUp(e) {
        if (!this.mouse.isDown) return;
        
        this.updateMousePosition(e);
        this.mouse.isDown = false;
        
        const worldPos = new Vector2(this.mouse.worldX, this.mouse.worldY);
        const snappedPos = this.getSnappedPosition(worldPos.x, worldPos.y);
        
        switch (this.state) {
            case InputState.DRAGGING:
                this.finishDrag();
                this.state = InputState.IDLE;
                break;
                
            default:
                break;
        }
    }

    finishConnection(pos) {
        if (!this.startNode) return;
        
        let endNode = this.game.findNodeNearPoint(pos, 15);
        
        if (!endNode) {
            const anchor = this.game.level ? this.game.level.isNearAnchorPoint(pos, 20) : null;
            
            if (anchor) {
                endNode = this.game.findNodeNearPoint(anchor, 10);
                if (!endNode) {
                    endNode = this.game.createNode(anchor.x, anchor.y, true, true);
                }
            } else {
                endNode = this.game.createNode(pos.x, pos.y, false, false);
                endNode.userCreated = true;
                
                if (this.callbacks.onNodeCreate) {
                    this.callbacks.onNodeCreate(endNode);
                }
            }
        }
        
        if (endNode !== this.startNode) {
            const existing = this.startNode.getConnectionTo(endNode);
            
            if (!existing) {
                const materialType = this.selectedTool === 'select' ? MaterialType.WOOD : this.selectedTool;
                
                const result = this.game.connectNodes(this.startNode, endNode, materialType);
                
                if (result.created && this.callbacks.onBeamCreate) {
                    this.callbacks.onBeamCreate(result.beam);
                }
            }
            
            this.startNode = endNode;
            this.previewEnd = pos.copy();
            this.state = InputState.CONNECTING;
        }
    }

    finishDrag() {
        this.dragStart = null;
    }

    handleMouseLeave(e) {
        this.mouse.isDown = false;
        this.state = InputState.IDLE;
        this.startNode = null;
        this.previewEnd = null;
        
        for (const node of this.game.nodes) {
            node.isHovered = false;
        }
        for (const beam of this.game.beams) {
            beam.isHovered = false;
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        this.state = InputState.IDLE;
        this.startNode = null;
        this.previewEnd = null;
    }

    handleDoubleClick(e) {
        this.updateMousePosition(e);
        
        const obj = this.findObjectAtPosition();
        if (obj && this.callbacks.onDelete) {
            this.callbacks.onDelete(obj.type, obj.object);
        }
    }

    handleWheel(e) {
        e.preventDefault();
    }

    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        this.modifiers.ctrl = e.ctrlKey || e.metaKey;
        this.modifiers.shift = e.shiftKey;
        this.modifiers.alt = e.altKey;
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case 'v':
                this.setTool('select');
                break;
            case '1':
                this.setTool('wood');
                break;
            case '2':
                this.setTool('steel');
                break;
            case '3':
                this.setTool('cable');
                break;
                
            case 'delete':
            case 'backspace':
                if (this.selectedObject && this.callbacks.onDelete) {
                    e.preventDefault();
                    this.callbacks.onDelete(this.selectedObject.type, this.selectedObject.object);
                }
                break;
                
            case 'z':
                if (this.modifiers.ctrl && this.callbacks.onUndo) {
                    e.preventDefault();
                    this.callbacks.onUndo();
                }
                break;
                
            case 'y':
                if (this.modifiers.ctrl && this.callbacks.onRedo) {
                    e.preventDefault();
                    this.callbacks.onRedo();
                }
                break;
                
            case 'escape':
                this.state = InputState.IDLE;
                this.startNode = null;
                this.previewEnd = null;
                if (this.callbacks.onObjectSelect) {
                    this.callbacks.onObjectSelect(null, null);
                }
                this.selectedObject = null;
                break;
                
            case 'g':
                this.snapToGrid = !this.snapToGrid;
                if (this.game.updateStatus) {
                    this.game.updateStatus(`网格吸附: ${this.snapToGrid ? '开启' : '关闭'}`);
                }
                break;
                
            default:
                break;
        }
    }

    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
        this.modifiers.ctrl = e.ctrlKey || e.metaKey;
        this.modifiers.shift = e.shiftKey;
        this.modifiers.alt = e.altKey;
    }

    reset() {
        this.state = InputState.IDLE;
        this.startNode = null;
        this.previewEnd = null;
        this.dragStart = null;
        this.selectedObject = null;
        
        for (const node of this.game.nodes) {
            node.isHovered = false;
        }
        for (const beam of this.game.beams) {
            beam.isHovered = false;
        }
    }

    setTool(tool) {
        if (this.selectedTool === tool) return;
        
        this.selectedTool = tool;
        this.state = InputState.IDLE;
        this.startNode = null;
        this.previewEnd = null;
        
        if (this.callbacks.onToolChange) {
            this.callbacks.onToolChange(tool);
        }
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] === true;
    }

    getPreviewStart() {
        return this.startNode ? this.startNode.position : null;
    }

    getPreviewEnd() {
        return this.previewEnd;
    }

    isConnecting() {
        return this.state === InputState.CONNECTING && this.startNode && this.previewEnd;
    }

    isPreviewValid() {
        if (!this.isConnecting()) return false;
        
        const start = this.getPreviewStart();
        const end = this.getPreviewEnd();
        const distance = start.distanceTo(end);
        
        const materialType = this.selectedTool === 'select' ? MaterialType.WOOD : this.selectedTool;
        const material = new Material(materialType);
        
        return material.isLengthValid(distance);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { InputHandler, InputState };
}
