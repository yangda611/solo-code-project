class ParkingSystem {
    constructor(floors = 5, spotsPerFloor = 10, elevators = 2) {
        this.floors = floors;
        this.spotsPerFloor = spotsPerFloor;
        this.elevatorCount = elevators;
        
        this.reset();
    }
    
    reset() {
        this.parkingStructure = this._initializeParkingStructure();
        this.elevators = this._initializeElevators();
        this.waitingQueue = [];
        this.pickupQueue = [];
        this.parkedCars = new Map();
        this.time = 0;
        this.history = [];
    }
    
    _initializeParkingStructure() {
        const structure = [];
        for (let f = 0; f < this.floors; f++) {
            const floor = {
                floorNumber: f,
                spots: []
            };
            for (let s = 0; s < this.spotsPerFloor; s++) {
                floor.spots.push({
                    spotNumber: s,
                    occupied: false,
                    carId: null,
                    parkTime: null
                });
            }
            structure.push(floor);
        }
        return structure;
    }
    
    _initializeElevators() {
        const elevators = [];
        for (let i = 0; i < this.elevatorCount; i++) {
            elevators.push({
                id: i,
                currentFloor: 0,
                targetFloor: null,
                direction: 'idle',
                isFault: false,
                currentCar: null,
                pendingTasks: []
            });
        }
        return elevators;
    }
    
    getState() {
        return {
            floors: this.floors,
            spotsPerFloor: this.spotsPerFloor,
            elevatorCount: this.elevatorCount,
            time: this.time,
            parkingStructure: this.parkingStructure,
            elevators: this.elevators,
            waitingQueue: this.waitingQueue,
            pickupQueue: this.pickupQueue,
            parkedCars: Object.fromEntries(this.parkedCars),
            availableSpots: this._getAvailableSpotsCount(),
            history: this.history.slice(-20)
        };
    }
    
    _getAvailableSpotsCount() {
        let count = 0;
        for (const floor of this.parkingStructure) {
            for (const spot of floor.spots) {
                if (!spot.occupied) count++;
            }
        }
        return count;
    }
    
    arrive(carId) {
        if (this._getAvailableSpotsCount() === 0) {
            throw new Error('停车场已满，无法停车');
        }
        
        if (this.parkedCars.has(carId)) {
            throw new Error(`车辆 ${carId} 已停放在停车场内`);
        }
        
        if (this.waitingQueue.some(c => c.carId === carId)) {
            throw new Error(`车辆 ${carId} 已在等待队列中`);
        }
        
        const car = {
            carId,
            arrivalTime: this.time,
            status: 'waiting',
            targetSpot: null,
            inElevator: false
        };
        
        this.waitingQueue.push(car);
        this._assignParkingSpot(car);
        this._assignElevatorTask(car, 'park');
        
        this.history.push({
            time: this.time,
            type: 'arrive',
            carId,
            message: `车辆 ${carId} 到达入口`
        });
        
        return { message: `车辆 ${carId} 已加入等待队列` };
    }
    
    _assignParkingSpot(car) {
        for (let f = 0; f < this.parkingStructure.length; f++) {
            for (let s = 0; s < this.parkingStructure[f].spots.length; s++) {
                if (!this.parkingStructure[f].spots[s].occupied) {
                    car.targetSpot = {
                        floor: f,
                        spot: s
                    };
                    return;
                }
            }
        }
    }
    
    _assignElevatorTask(car, taskType) {
        const availableElevators = this.elevators.filter(e => !e.isFault);
        if (availableElevators.length === 0) return;
        
        let bestElevator = availableElevators[0];
        let minDistance = Math.abs(bestElevator.currentFloor - (taskType === 'park' ? car.targetSpot?.floor || 0 : car.currentFloor));
        
        for (const elevator of availableElevators) {
            const targetFloor = taskType === 'park' ? car.targetSpot?.floor || 0 : car.currentFloor;
            const distance = Math.abs(elevator.currentFloor - targetFloor);
            if (distance < minDistance || (distance === minDistance && elevator.pendingTasks.length < bestElevator.pendingTasks.length)) {
                minDistance = distance;
                bestElevator = elevator;
            }
        }
        
        const task = {
            car,
            type: taskType,
            targetFloor: taskType === 'park' ? car.targetSpot?.floor || 0 : 0
        };
        
        bestElevator.pendingTasks.push(task);
        
        if (bestElevator.direction === 'idle') {
            this._processElevatorTask(bestElevator);
        }
    }
    
    _processElevatorTask(elevator) {
        if (elevator.pendingTasks.length === 0 || elevator.isFault) {
            elevator.direction = 'idle';
            elevator.targetFloor = null;
            return;
        }
        
        const task = elevator.pendingTasks[0];
        
        if (elevator.currentFloor !== task.targetFloor) {
            elevator.targetFloor = task.targetFloor;
            elevator.direction = elevator.currentFloor < task.targetFloor ? 'up' : 'down';
        } else {
            this._executeTask(elevator, task);
        }
    }
    
    _executeTask(elevator, task) {
        const car = task.car;
        
        if (task.type === 'park') {
            if (!car.inElevator) {
                car.inElevator = true;
                car.status = 'in_elevator';
                elevator.currentCar = car;
                
                this.history.push({
                    time: this.time,
                    type: 'elevator_board',
                    carId: car.carId,
                    elevatorId: elevator.id,
                    message: `车辆 ${car.carId} 进入升降机 ${elevator.id}`
                });
            } else {
                const spot = this.parkingStructure[car.targetSpot.floor].spots[car.targetSpot.spot];
                spot.occupied = true;
                spot.carId = car.carId;
                spot.parkTime = this.time;
                
                this.parkedCars.set(car.carId, {
                    carId: car.carId,
                    floor: car.targetSpot.floor,
                    spot: car.targetSpot.spot,
                    parkTime: this.time
                });
                
                car.status = 'parked';
                car.currentFloor = car.targetSpot.floor;
                car.inElevator = false;
                elevator.currentCar = null;
                
                const queueIndex = this.waitingQueue.findIndex(c => c.carId === car.carId);
                if (queueIndex !== -1) {
                    this.waitingQueue.splice(queueIndex, 1);
                }
                
                elevator.pendingTasks.shift();
                
                this.history.push({
                    time: this.time,
                    type: 'parked',
                    carId: car.carId,
                    floor: car.targetSpot.floor,
                    spot: car.targetSpot.spot,
                    message: `车辆 ${car.carId} 停放在 ${car.targetSpot.floor} 层 ${car.targetSpot.spot} 号车位`
                });
            }
        } else if (task.type === 'pickup') {
            if (!car.inElevator) {
                const spot = this.parkingStructure[car.currentFloor].spots[car.currentSpot];
                spot.occupied = false;
                spot.carId = null;
                spot.parkTime = null;
                
                car.inElevator = true;
                car.status = 'in_elevator';
                elevator.currentCar = car;
                
                this.history.push({
                    time: this.time,
                    type: 'elevator_board_pickup',
                    carId: car.carId,
                    elevatorId: elevator.id,
                    message: `车辆 ${car.carId} 从 ${car.currentFloor} 层进入升降机 ${elevator.id}`
                });
            } else {
                car.status = 'exiting';
                car.inElevator = false;
                elevator.currentCar = null;
                
                this.parkedCars.delete(car.carId);
                
                const queueIndex = this.pickupQueue.findIndex(c => c.carId === car.carId);
                if (queueIndex !== -1) {
                    this.pickupQueue.splice(queueIndex, 1);
                }
                
                elevator.pendingTasks.shift();
                
                this.history.push({
                    time: this.time,
                    type: 'exited',
                    carId: car.carId,
                    waitTime: this.time - car.requestTime,
                    message: `车辆 ${car.carId} 已驶出，等待时间 ${this.time - car.requestTime} 单位`
                });
            }
        }
    }
    
    requestPickup(carId) {
        if (!this.parkedCars.has(carId)) {
            throw new Error(`车辆 ${carId} 不在停车场内`);
        }
        
        if (this.pickupQueue.some(c => c.carId === carId)) {
            throw new Error(`车辆 ${carId} 已在取车队列中`);
        }
        
        const parkedInfo = this.parkedCars.get(carId);
        const car = {
            carId,
            currentFloor: parkedInfo.floor,
            currentSpot: parkedInfo.spot,
            requestTime: this.time,
            status: 'waiting_pickup',
            inElevator: false
        };
        
        this.pickupQueue.push(car);
        this._assignElevatorTask(car, 'pickup');
        
        this.history.push({
            time: this.time,
            type: 'pickup_request',
            carId,
            message: `车辆 ${carId} 请求取车`
        });
        
        return { message: `车辆 ${carId} 已加入取车队列` };
    }
    
    setElevatorFault(elevatorId, isFault) {
        const elevator = this.elevators.find(e => e.id === elevatorId);
        if (!elevator) {
            throw new Error(`升降机 ${elevatorId} 不存在`);
        }
        
        elevator.isFault = isFault;
        
        if (isFault) {
            this.history.push({
                time: this.time,
                type: 'elevator_fault',
                elevatorId,
                message: `升降机 ${elevatorId} 发生故障`
            });
        } else {
            this.history.push({
                time: this.time,
                type: 'elevator_repair',
                elevatorId,
                message: `升降机 ${elevatorId} 已修复`
            });
        }
    }
    
    step() {
        this.time++;
        
        for (const elevator of this.elevators) {
            if (elevator.isFault) continue;
            
            if (elevator.direction !== 'idle' && elevator.targetFloor !== null) {
                if (elevator.currentFloor < elevator.targetFloor) {
                    elevator.currentFloor++;
                } else if (elevator.currentFloor > elevator.targetFloor) {
                    elevator.currentFloor--;
                }
                
                if (elevator.currentFloor === elevator.targetFloor) {
                    this._processElevatorTask(elevator);
                }
            } else if (elevator.pendingTasks.length > 0) {
                this._processElevatorTask(elevator);
            }
        }
        
        return { message: `时间步进至 ${this.time}` };
    }
}

module.exports = ParkingSystem;
