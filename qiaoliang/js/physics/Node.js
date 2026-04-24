const NodeState = {
    NORMAL: 'normal',
    BROKEN: 'broken',
    SELECTED: 'selected',
    HOVERED: 'hovered'
};

class Node {
    constructor(x = 0, y = 0, isFixed = false) {
        this.id = this.generateId();
        this.position = new Vector2(x, y);
        this.oldPosition = new Vector2(x, y);
        this.prevPosition = new Vector2(x, y);
        
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        
        this.forces = new Vector2(0, 0);
        
        this.isFixed = isFixed;
        this.isGround = false;
        this.state = NodeState.NORMAL;
        
        this.connections = [];
        this.mass = 1;
        this.damping = 0.98;
        this.radius = 8;
        this.isHovered = false;
        this.isSelected = false;
        this.userCreated = false;
    }

    generateId() {
        return 'node_' + Math.random().toString(36).substr(2, 9);
    }

    static createFixed(x, y) {
        const node = new Node(x, y, true);
        node.isGround = true;
        return node;
    }

    static createDynamic(x, y) {
        return new Node(x, y, false);
    }

    addConnection(beam) {
        if (!this.connections.includes(beam)) {
            this.connections.push(beam);
        }
    }

    removeConnection(beam) {
        const index = this.connections.indexOf(beam);
        if (index !== -1) {
            this.connections.splice(index, 1);
        }
    }

    clearConnections() {
        this.connections = [];
    }

    getConnectedNodes() {
        return this.connections.map(beam => {
            return beam.nodeA === this ? beam.nodeB : beam.nodeA;
        });
    }

    getConnectionTo(node) {
        for (const beam of this.connections) {
            if (beam.nodeA === node || beam.nodeB === node) {
                return beam;
            }
        }
        return null;
    }

    isConnectedTo(node) {
        return this.getConnectionTo(node) !== null;
    }

    applyForce(force) {
        if (!this.isFixed) {
            this.forces.addInPlace(force);
        }
    }

    applyImpulse(impulse) {
        if (!this.isFixed) {
            this.velocity.addInPlace(impulse.divScalar(this.mass));
        }
    }

    updateVerlet(dt, gravity) {
        if (this.isFixed) {
            this.velocity.set(0, 0);
            this.acceleration.set(0, 0);
            this.forces.set(0, 0);
            return;
        }

        this.prevPosition.setVector(this.oldPosition);
        this.oldPosition.setVector(this.position);

        const netForce = this.forces.add(gravity.mulScalar(this.mass));
        const acceleration = netForce.divScalar(this.mass);

        const damping = this.damping;
        const vel = this.position.sub(this.prevPosition).mulScalar(damping);

        const newPosition = this.position.add(vel).add(acceleration.mulScalar(dt * dt));

        this.position.setVector(newPosition);

        this.velocity = this.position.sub(this.oldPosition).divScalar(dt);
        this.acceleration.setVector(acceleration);

        this.forces.set(0, 0);
    }

    updateEuler(dt, gravity) {
        if (this.isFixed) {
            this.velocity.set(0, 0);
            this.acceleration.set(0, 0);
            this.forces.set(0, 0);
            return;
        }

        const netForce = this.forces.add(gravity.mulScalar(this.mass));
        this.acceleration = netForce.divScalar(this.mass);

        this.oldPosition.setVector(this.position);
        this.prevPosition.setVector(this.oldPosition);

        this.velocity.addInPlace(this.acceleration.mulScalar(dt));
        this.velocity.mulScalarInPlace(this.damping);
        this.position.addInPlace(this.velocity.mulScalar(dt));

        this.forces.set(0, 0);
    }

    update(dt, gravity) {
        this.updateVerlet(dt, gravity);
    }

    constrainToBounds(minX, maxX, minY, maxY) {
        if (this.isFixed) return;

        this.position.x = MathUtil.clamp(this.position.x, minX, maxX);
        this.position.y = MathUtil.clamp(this.position.y, minY, maxY);
    }

    distanceTo(other) {
        return this.position.distanceTo(other.position);
    }

    distanceToPoint(point) {
        return this.position.distanceTo(point);
    }

    containsPoint(point, threshold = 15) {
        return this.distanceToPoint(point) < threshold;
    }

    getNetForce() {
        const netForce = new Vector2(0, 0);
        for (const beam of this.connections) {
            if (!beam.isBroken) {
                const force = beam.getForceOnNode(this);
                netForce.addInPlace(force);
            }
        }
        return netForce;
    }

    break() {
        this.state = NodeState.BROKEN;
    }

    isBroken() {
        return this.state === NodeState.BROKEN;
    }

    copy() {
        const copy = new Node(this.position.x, this.position.y, this.isFixed);
        copy.oldPosition.setVector(this.oldPosition);
        copy.prevPosition.setVector(this.prevPosition);
        copy.velocity.setVector(this.velocity);
        copy.acceleration.setVector(this.acceleration);
        copy.mass = this.mass;
        copy.damping = this.damping;
        copy.isGround = this.isGround;
        copy.userCreated = this.userCreated;
        return copy;
    }

    toJSON() {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            isFixed: this.isFixed,
            isGround: this.isGround,
            mass: this.mass,
            userCreated: this.userCreated
        };
    }

    static fromJSON(data) {
        const node = new Node(data.x, data.y, data.isFixed);
        node.id = data.id;
        node.isGround = data.isGround;
        node.mass = data.mass || 1;
        node.userCreated = data.userCreated || false;
        return node;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Node, NodeState };
}
