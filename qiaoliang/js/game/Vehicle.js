const VehicleState = {
    IDLE: 'idle',
    MOVING: 'moving',
    FALLEN: 'fallen',
    COMPLETED: 'completed'
};

class Vehicle {
    constructor(config = {}) {
        this.id = 'vehicle_' + Math.random().toString(36).substr(2, 9);
        
        this.position = new Vector2(config.x || 0, config.y || 0);
        this.velocity = new Vector2(config.velocityX || 0, config.velocityY || 0);
        
        this.width = config.width || 40;
        this.height = config.height || 25;
        this.mass = config.mass || 500;
        
        this.speed = config.speed || 100;
        this.startPosition = new Vector2(config.x || 0, config.y || 0);
        this.targetX = config.targetX || 2000;
        
        this.wheels = [
            { offset: -this.width * 0.35, radius: 8 },
            { offset: this.width * 0.35, radius: 8 }
        ];
        
        this.state = VehicleState.IDLE;
        this.currentBeam = null;
        this.currentNode = null;
        
        this.travelDistance = 0;
        this.isCompleted = false;
        this.isFallen = false;
        
        this.gravity = new Vector2(0, 9.8);
        this.damping = 0.98;
        
        this.weightDistributed = true;
    }

    reset() {
        this.position.setVector(this.startPosition.copy());
        this.velocity.set(0, 0);
        this.state = VehicleState.IDLE;
        this.currentBeam = null;
        this.currentNode = null;
        this.travelDistance = 0;
        this.isCompleted = false;
        this.isFallen = false;
    }

    start() {
        this.state = VehicleState.MOVING;
    }

    stop() {
        this.state = VehicleState.IDLE;
        this.velocity.set(0, 0);
    }

    update(dt, beams, nodes, leftBank = null, rightBank = null) {
        if (this.state !== VehicleState.MOVING) return;

        this.velocity.x = this.speed;
        this.position.x += this.velocity.x * dt;
        this.travelDistance += this.velocity.x * dt;

        this.applyWeightToBridge(beams, nodes, leftBank, rightBank, dt);

        if (this.position.x >= this.targetX) {
            this.complete();
            return;
        }

        if (this.position.y > 1000) {
            this.fall();
            return;
        }
    }

    isOnBank(leftBank, rightBank) {
        if (!leftBank && !rightBank) return { onBank: false, bankY: null };
        
        for (const wheel of this.wheels) {
            const wheelX = this.position.x + wheel.offset;
            
            if (leftBank) {
                const leftBankEndX = leftBank.x + leftBank.width;
                if (wheelX >= leftBank.x && wheelX <= leftBankEndX) {
                    return { onBank: true, bankY: leftBank.y };
                }
            }
            
            if (rightBank) {
                if (wheelX >= rightBank.x) {
                    return { onBank: true, bankY: rightBank.y };
                }
            }
        }
        
        return { onBank: false, bankY: null };
    }

    applyWeightToBridge(beams, nodes, leftBank = null, rightBank = null, dt = 0) {
        const vehicleTop = this.position.y - this.height / 2;
        const vehicleBottom = this.position.y + this.height / 2;
        
        let onBridge = false;
        let closestY = Infinity;
        
        const bankInfo = this.isOnBank(leftBank, rightBank);
        if (bankInfo.onBank) {
            const groundY = bankInfo.bankY;
            const minWheelRadius = Math.min(...this.wheels.map(w => w.radius));
            this.position.y = groundY - this.height / 2 - minWheelRadius;
            this.velocity.y = 0;
            onBridge = true;
        }
        
        if (!onBridge) {
            for (const wheel of this.wheels) {
                const wheelX = this.position.x + wheel.offset;
                
                for (const beam of beams) {
                    if (beam.isBroken) continue;
                    
                    const nodeA = beam.nodeA;
                    const nodeB = beam.nodeB;
                    
                    if (!nodeA || !nodeB) continue;
                    
                    const minX = Math.min(nodeA.position.x, nodeB.position.x);
                    const maxX = Math.max(nodeA.position.x, nodeB.position.x);
                    
                    if (wheelX >= minX && wheelX <= maxX) {
                        const dx = nodeB.position.x - nodeA.position.x;
                        const t = dx !== 0 ? (wheelX - nodeA.position.x) / dx : 0.5;
                        const beamY = nodeA.position.y + (nodeB.position.y - nodeA.position.y) * t;
                        
                        if (beamY < closestY && beamY > this.position.y - 50) {
                            closestY = beamY;
                            this.position.y = beamY - this.height / 2 - wheel.radius;
                            this.velocity.y = 0;
                            onBridge = true;
                            
                            this.applyForceToBeam(beam, wheelX, t);
                        }
                    }
                }
            }
        }
        
        if (!onBridge) {
            this.velocity.addInPlace(this.gravity.mulScalar(dt));
            this.velocity.mulScalarInPlace(this.damping);
            this.position.addInPlace(this.velocity.mulScalar(dt));
            
            if (this.velocity.magnitude() > 50) {
                this.fall();
            }
        }
    }

    applyForceToBeam(beam, wheelX, t) {
        const force = this.mass * this.gravity.y * 0.5;
        const forceVector = new Vector2(0, force);
        
        const nodeA = beam.nodeA;
        const nodeB = beam.nodeB;
        
        if (!nodeA || !nodeB) return;
        
        const clampedT = MathUtil.clamp(t, 0.01, 0.99);
        const weightA = 1 - clampedT;
        const weightB = clampedT;
        
        if (!nodeA.isFixed) {
            nodeA.applyForce(forceVector.mulScalar(weightA));
        }
        if (!nodeB.isFixed) {
            nodeB.applyForce(forceVector.mulScalar(weightB));
        }
        
        this.currentBeam = beam;
    }

    complete() {
        this.state = VehicleState.COMPLETED;
        this.isCompleted = true;
        this.velocity.set(0, 0);
    }

    fall() {
        this.state = VehicleState.FALLEN;
        this.isFallen = true;
    }

    getProgress() {
        const totalDistance = this.targetX - this.startPosition.x;
        if (totalDistance <= 0) return 0;
        return MathUtil.clamp(this.travelDistance / totalDistance, 0, 1);
    }

    getBounds() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    containsPoint(point) {
        const bounds = this.getBounds();
        return MathUtil.pointInRect(
            point.x, point.y,
            bounds.x, bounds.y,
            bounds.width, bounds.height
        );
    }

    toJSON() {
        return {
            id: this.id,
            position: [this.position.x, this.position.y],
            startPosition: [this.startPosition.x, this.startPosition.y],
            velocity: [this.velocity.x, this.velocity.y],
            width: this.width,
            height: this.height,
            mass: this.mass,
            speed: this.speed,
            targetX: this.targetX,
            state: this.state,
            travelDistance: this.travelDistance
        };
    }

    static fromJSON(data) {
        const vehicle = new Vehicle({
            x: data.position[0],
            y: data.position[1],
            velocityX: data.velocity[0],
            velocityY: data.velocity[1],
            width: data.width,
            height: data.height,
            mass: data.mass,
            speed: data.speed,
            targetX: data.targetX
        });
        vehicle.id = data.id;
        vehicle.startPosition = new Vector2(data.startPosition[0], data.startPosition[1]);
        vehicle.state = data.state;
        vehicle.travelDistance = data.travelDistance;
        return vehicle;
    }
}

const VehicleTypes = {
    CAR: {
        name: '小汽车',
        width: 40,
        height: 25,
        mass: 500,
        speed: 120,
        color: '#3498db'
    },
    TRUCK: {
        name: '卡车',
        width: 60,
        height: 35,
        mass: 1500,
        speed: 80,
        color: '#e67e22'
    },
    BUS: {
        name: '公交车',
        width: 80,
        height: 40,
        mass: 2000,
        speed: 70,
        color: '#27ae60'
    },
    HEAVY_TRUCK: {
        name: '重型卡车',
        width: 90,
        height: 45,
        mass: 3500,
        speed: 60,
        color: '#c0392b'
    }
};

class VehicleFactory {
    static create(type, x, y, targetX) {
        const config = VehicleTypes[type];
        if (!config) {
            throw new Error(`Unknown vehicle type: ${type}`);
        }
        
        const vehicle = new Vehicle({
            x: x,
            y: y,
            width: config.width,
            height: config.height,
            mass: config.mass,
            speed: config.speed,
            targetX: targetX
        });
        vehicle.type = type;
        vehicle.color = config.color;
        vehicle.vehicleName = config.name;
        
        return vehicle;
    }

    static createCar(x, y, targetX) {
        return this.create('CAR', x, y, targetX);
    }

    static createTruck(x, y, targetX) {
        return this.create('TRUCK', x, y, targetX);
    }

    static createBus(x, y, targetX) {
        return this.create('BUS', x, y, targetX);
    }

    static createHeavyTruck(x, y, targetX) {
        return this.create('HEAVY_TRUCK', x, y, targetX);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Vehicle, VehicleState, VehicleTypes, VehicleFactory };
}
