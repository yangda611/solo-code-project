const ReplayState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PLAYING: 'playing',
    PAUSED: 'paused',
    COMPLETED: 'completed'
};

class Frame {
    constructor(time) {
        this.time = time;
        this.nodes = [];
        this.beams = [];
        this.vehicles = [];
        this.events = [];
    }

    captureState(nodes, beams, vehicles) {
        for (const node of nodes) {
            this.nodes.push({
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                isBroken: node.state === NodeState.BROKEN
            });
        }
        
        for (const beam of beams) {
            this.beams.push({
                id: beam.id,
                isBroken: beam.isBroken,
                stressRatio: beam.stressRatio,
                currentForce: beam.currentForce,
                fracturePosition: beam.fracturePosition
            });
        }
        
        for (const vehicle of vehicles) {
            this.vehicles.push({
                id: vehicle.id,
                x: vehicle.position.x,
                y: vehicle.position.y,
                state: vehicle.state,
                isCompleted: vehicle.isCompleted,
                isFallen: vehicle.isFallen
            });
        }
    }

    restoreState(nodes, beams, vehicles, nodeMap, beamMap, vehicleMap) {
        for (const nodeData of this.nodes) {
            const node = nodeMap[nodeData.id];
            if (node) {
                node.position.x = nodeData.x;
                node.position.y = nodeData.y;
                node.state = nodeData.isBroken ? NodeState.BROKEN : NodeState.NORMAL;
            }
        }
        
        for (const beamData of this.beams) {
            const beam = beamMap[beamData.id];
            if (beam) {
                beam.isBroken = beamData.isBroken;
                beam.stressRatio = beamData.stressRatio;
                beam.currentForce = beamData.currentForce;
                beam.fracturePosition = beamData.fracturePosition;
                
                if (beamData.isBroken) {
                    beam.state = BeamState.BROKEN;
                } else {
                    beam.state = BeamState.NORMAL;
                }
            }
        }
        
        for (const vehicleData of this.vehicles) {
            const vehicle = vehicleMap[vehicleData.id];
            if (vehicle) {
                vehicle.position.x = vehicleData.x;
                vehicle.position.y = vehicleData.y;
                vehicle.state = vehicleData.state;
                vehicle.isCompleted = vehicleData.isCompleted;
                vehicle.isFallen = vehicleData.isFallen;
            }
        }
    }
}

class Recorder {
    constructor(game) {
        this.game = game;
        this.state = ReplayState.IDLE;
        
        this.frames = [];
        this.currentFrameIndex = 0;
        
        this.startTime = 0;
        this.recordedTime = 0;
        this.lastFrameTime = 0;
        
        this.frameInterval = 1000 / 60;
        this.maxFrames = 60 * 60;
        
        this.nodeMap = {};
        this.beamMap = {};
        this.vehicleMap = {};
        
        this.playbackSpeed = 1.0;
        this.isSlowMotion = false;
        this.slowMotionSpeed = 0.3;
        
        this.onPlaybackComplete = null;
        this.onBreakEvent = null;
        
        this.breakEvents = [];
    }

    startRecording() {
        if (this.state === ReplayState.RECORDING) return;
        
        this.frames = [];
        this.breakEvents = [];
        this.currentFrameIndex = 0;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
        this.state = ReplayState.RECORDING;
        
        this.buildMaps();
    }

    stopRecording() {
        this.state = ReplayState.IDLE;
        this.recordedTime = performance.now() - this.startTime;
    }

    buildMaps() {
        this.nodeMap = {};
        this.beamMap = {};
        this.vehicleMap = {};
        
        for (const node of this.game.nodes) {
            this.nodeMap[node.id] = node;
        }
        
        for (const beam of this.game.beams) {
            this.beamMap[beam.id] = beam;
        }
        
        for (const vehicle of this.game.vehicles) {
            this.vehicleMap[vehicle.id] = vehicle;
        }
    }

    recordFrame() {
        if (this.state !== ReplayState.RECORDING) return;
        
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        
        if (elapsed >= this.frameInterval) {
            const frameTime = now - this.startTime;
            const frame = new Frame(frameTime);
            frame.captureState(this.game.nodes, this.game.beams, this.game.vehicles);
            
            this.frames.push(frame);
            this.lastFrameTime = now;
            
            if (this.frames.length > this.maxFrames) {
                this.frames.shift();
            }
        }
    }

    recordBreakEvent(beam) {
        if (this.state !== ReplayState.RECORDING) return;
        
        this.breakEvents.push({
            time: performance.now() - this.startTime,
            beamId: beam.id,
            beam: beam
        });
    }

    startPlayback() {
        if (this.frames.length === 0) return false;
        
        this.currentFrameIndex = 0;
        this.state = ReplayState.PLAYING;
        
        this.game.setTestingState(true);
        
        return true;
    }

    pausePlayback() {
        if (this.state === ReplayState.PLAYING) {
            this.state = ReplayState.PAUSED;
        }
    }

    resumePlayback() {
        if (this.state === ReplayState.PAUSED) {
            this.state = ReplayState.PLAYING;
        }
    }

    stopPlayback() {
        this.state = ReplayState.IDLE;
        this.currentFrameIndex = 0;
    }

    updatePlayback(deltaTime) {
        if (this.state !== ReplayState.PLAYING) return;
        
        const actualSpeed = this.isSlowMotion ? this.slowMotionSpeed : this.playbackSpeed;
        const step = Math.max(1, Math.round(actualSpeed));
        
        this.currentFrameIndex += step;
        
        if (this.currentFrameIndex >= this.frames.length) {
            this.currentFrameIndex = this.frames.length - 1;
            this.state = ReplayState.COMPLETED;
            
            if (this.onPlaybackComplete) {
                this.onPlaybackComplete();
            }
            return;
        }
        
        const frame = this.frames[this.currentFrameIndex];
        if (frame) {
            frame.restoreState(
                this.game.nodes,
                this.game.beams,
                this.game.vehicles,
                this.nodeMap,
                this.beamMap,
                this.vehicleMap
            );
        }
    }

    toggleSlowMotion() {
        this.isSlowMotion = !this.isSlowMotion;
        return this.isSlowMotion;
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = MathUtil.clamp(speed, 0.1, 5.0);
    }

    getPlaybackProgress() {
        if (this.frames.length === 0) return 0;
        return this.currentFrameIndex / this.frames.length;
    }

    getPlaybackTime() {
        if (this.frames.length === 0 || this.currentFrameIndex >= this.frames.length) {
            return 0;
        }
        return this.frames[this.currentFrameIndex].time;
    }

    getTotalTime() {
        if (this.frames.length === 0) return 0;
        return this.frames[this.frames.length - 1].time;
    }

    seekTo(progress) {
        if (this.frames.length === 0) return;
        
        this.currentFrameIndex = Math.floor(MathUtil.clamp(progress, 0, 1) * (this.frames.length - 1));
        
        const frame = this.frames[this.currentFrameIndex];
        if (frame) {
            frame.restoreState(
                this.game.nodes,
                this.game.beams,
                this.game.vehicles,
                this.nodeMap,
                this.beamMap,
                this.vehicleMap
            );
        }
    }

    hasRecording() {
        return this.frames.length > 0;
    }

    isRecording() {
        return this.state === ReplayState.RECORDING;
    }

    isPlaying() {
        return this.state === ReplayState.PLAYING || this.state === ReplayState.PAUSED;
    }

    isPaused() {
        return this.state === ReplayState.PAUSED;
    }

    getBreakEvents() {
        return this.breakEvents;
    }

    getStatistics() {
        const breakCount = this.breakEvents.length;
        const hasVehicleCompleted = this.vehicles.some(v => v.isCompleted);
        
        let maxStress = 0;
        for (const frame of this.frames) {
            for (const beamData of frame.beams) {
                if (beamData.stressRatio > maxStress) {
                    maxStress = beamData.stressRatio;
                }
            }
        }
        
        return {
            frameCount: this.frames.length,
            duration: this.recordedTime,
            breakCount: breakCount,
            maxStress: maxStress,
            hasVehicleCompleted: hasVehicleCompleted
        };
    }

    clear() {
        this.frames = [];
        this.breakEvents = [];
        this.currentFrameIndex = 0;
        this.nodeMap = {};
        this.beamMap = {};
        this.vehicleMap = {};
        this.state = ReplayState.IDLE;
    }

    toJSON() {
        return {
            frames: this.frames.map(f => ({
                time: f.time,
                nodes: f.nodes,
                beams: f.beams,
                vehicles: f.vehicles
            })),
            breakEvents: this.breakEvents,
            recordedTime: this.recordedTime
        };
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Recorder, ReplayState, Frame };
}
