class TimeRewindGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 64;
        this.gridWidth = 10;
        this.gridHeight = 7;
        
        this.currentLevel = 0;
        this.moveCount = 0;
        this.isRewinding = false;
        this.isAnimating = false;
        this.rewindSpeed = 2;
        
        this.history = [];
        this.maxHistory = 100;
        
        this.animationQueue = [];
        this.ghostTrails = [];
        
        this.levels = this.createLevels();
        this.init();
    }
    
    createLevels() {
        return [
            {
                name: "初次尝试",
                map: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 0, 0, 0, 2, 0, 0, 0, 0, 1],
                    [1, 0, 0, 0, 0, 0, 3, 0, 0, 1],
                    [1, 0, 4, 0, 0, 0, 0, 0, 5, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 6, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ],
                playerStart: { x: 2, y: 2 },
                boxes: [{ x: 4, y: 3 }],
                switches: [{ x: 3, y: 4, doorId: 0 }],
                doors: [{ x: 8, y: 5, open: false, id: 0 }],
                exit: { x: 8, y: 4 }
            },
            {
                name: "双重机关",
                map: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 0, 2, 0, 0, 2, 0, 0, 5, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 6, 1],
                    [1, 0, 4, 0, 0, 4, 0, 0, 0, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ],
                playerStart: { x: 1, y: 1 },
                boxes: [{ x: 2, y: 2 }, { x: 5, y: 2 }],
                switches: [
                    { x: 2, y: 4, doorId: 0 },
                    { x: 5, y: 4, doorId: 1 }
                ],
                doors: [
                    { x: 8, y: 2, open: false, id: 0 },
                    { x: 8, y: 3, open: false, id: 1 }
                ],
                exit: { x: 8, y: 1 }
            },
            {
                name: "迷宫挑战",
                map: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 0, 2, 0, 1, 0, 3, 0, 5, 1],
                    [1, 0, 0, 0, 1, 0, 0, 0, 6, 1],
                    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
                    [1, 0, 4, 0, 0, 0, 0, 0, 0, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ],
                playerStart: { x: 1, y: 3 },
                boxes: [{ x: 2, y: 2 }],
                switches: [{ x: 2, y: 5, doorId: 0 }],
                doors: [{ x: 8, y: 3, open: false, id: 0 }],
                exit: { x: 8, y: 2 }
            }
        ];
    }
    
    init() {
        this.loadLevel(this.currentLevel);
        this.setupEventListeners();
        this.gameLoop();
    }
    
    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) {
            alert('恭喜你通关了所有关卡！');
            return;
        }
        
        const level = this.levels[levelIndex];
        this.currentLevel = levelIndex;
        this.moveCount = 0;
        this.history = [];
        this.animationQueue = [];
        this.ghostTrails = [];
        this.isRewinding = false;
        this.isAnimating = false;
        
        this.map = JSON.parse(JSON.stringify(level.map));
        this.player = { ...level.playerStart };
        this.boxes = JSON.parse(JSON.stringify(level.boxes));
        this.switches = JSON.parse(JSON.stringify(level.switches));
        this.doors = JSON.parse(JSON.stringify(level.doors));
        this.exit = { ...level.exit };
        
        this.updateUI();
        this.saveState();
    }
    
    saveState() {
        const state = {
            player: { ...this.player },
            boxes: JSON.parse(JSON.stringify(this.boxes)),
            switches: JSON.parse(JSON.stringify(this.switches)),
            doors: JSON.parse(JSON.stringify(this.doors)),
            moveCount: this.moveCount
        };
        
        this.history.push(state);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    rewind() {
        if (this.isRewinding || this.history.length <= 1) return;
        
        this.isRewinding = true;
        this.rewindStep();
    }
    
    rewindStep() {
        if (this.history.length <= 1) {
            this.isRewinding = false;
            return;
        }
        
        const currentState = this.history.pop();
        const prevState = this.history[this.history.length - 1];
        
        this.addGhostTrail(currentState.player, prevState.player, 'player');
        
        for (let i = 0; i < currentState.boxes.length; i++) {
            if (this.hasBoxMoved(currentState.boxes[i], prevState.boxes[i])) {
                this.addGhostTrail(currentState.boxes[i], prevState.boxes[i], 'box');
            }
        }
        
        this.player = { ...prevState.player };
        this.boxes = JSON.parse(JSON.stringify(prevState.boxes));
        this.switches = JSON.parse(JSON.stringify(prevState.switches));
        this.doors = JSON.parse(JSON.stringify(prevState.doors));
        this.moveCount = prevState.moveCount;
        
        this.updateUI();
        
        setTimeout(() => {
            if (this.isRewinding && this.history.length > 1) {
                this.rewindStep();
            } else {
                this.isRewinding = false;
            }
        }, 100);
    }
    
    hasBoxMoved(box1, box2) {
        return box1.x !== box2.x || box1.y !== box2.y;
    }
    
    addGhostTrail(from, to, type) {
        const trail = {
            from: { ...from },
            to: { ...to },
            type: type,
            progress: 0,
            opacity: 0.8
        };
        this.ghostTrails.push(trail);
    }
    
    movePlayer(dx, dy) {
        if (this.isRewinding || this.isAnimating) return;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (newX < 0 || newX >= this.gridWidth || newY < 0 || newY >= this.gridHeight) return;
        
        if (this.map[newY][newX] === 1) return;
        
        const door = this.getDoorAt(newX, newY);
        if (door && !door.open) return;
        
        const boxIndex = this.getBoxAt(newX, newY);
        if (boxIndex !== -1) {
            const box = this.boxes[boxIndex];
            const boxNewX = box.x + dx;
            const boxNewY = box.y + dy;
            
            if (this.canPushBox(boxNewX, boxNewY)) {
                this.isAnimating = true;
                
                this.addAnimation({
                    type: 'player',
                    from: { ...this.player },
                    to: { x: newX, y: newY },
                    duration: 200
                });
                
                this.addAnimation({
                    type: 'box',
                    boxIndex: boxIndex,
                    from: { ...box },
                    to: { x: boxNewX, y: boxNewY },
                    duration: 200
                });
                
                this.player.x = newX;
                this.player.y = newY;
                this.boxes[boxIndex].x = boxNewX;
                this.boxes[boxIndex].y = boxNewY;
                
                this.checkSwitches();
                this.moveCount++;
                this.saveState();
                this.updateUI();
                
                setTimeout(() => {
                    this.isAnimating = false;
                    this.checkWin();
                }, 250);
            }
        } else {
            this.isAnimating = true;
            
            this.addAnimation({
                type: 'player',
                from: { ...this.player },
                to: { x: newX, y: newY },
                duration: 200
            });
            
            this.player.x = newX;
            this.player.y = newY;
            this.moveCount++;
            this.saveState();
            this.updateUI();
            
            setTimeout(() => {
                this.isAnimating = false;
                this.checkWin();
            }, 250);
        }
    }
    
    canPushBox(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
        
        if (this.map[y][x] === 1) return false;
        
        if (this.getBoxAt(x, y) !== -1) return false;
        
        const door = this.getDoorAt(x, y);
        if (door && !door.open) return false;
        
        return true;
    }
    
    getBoxAt(x, y) {
        return this.boxes.findIndex(box => box.x === x && box.y === y);
    }
    
    getDoorAt(x, y) {
        return this.doors.find(door => door.x === x && door.y === y);
    }
    
    checkSwitches() {
        for (const switchObj of this.switches) {
            const hasBoxOnSwitch = this.boxes.some(box => 
                box.x === switchObj.x && box.y === switchObj.y
            );
            
            const door = this.doors.find(d => d.id === switchObj.doorId);
            if (door) {
                if (hasBoxOnSwitch && !door.open) {
                    door.open = true;
                    this.addAnimation({
                        type: 'door',
                        door: door,
                        opening: true,
                        duration: 300
                    });
                } else if (!hasBoxOnSwitch && door.open) {
                    door.open = false;
                    this.addAnimation({
                        type: 'door',
                        door: door,
                        opening: false,
                        duration: 300
                    });
                }
            }
        }
    }
    
    checkWin() {
        if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
            const allDoorsOpen = this.doors.every(door => door.open);
            if (allDoorsOpen || this.doors.length === 0) {
                this.showLevelComplete();
            }
        }
    }
    
    showLevelComplete() {
        document.getElementById('completedLevel').textContent = this.currentLevel + 1;
        document.getElementById('levelComplete').style.display = 'block';
    }
    
    addAnimation(animation) {
        animation.startTime = performance.now();
        this.animationQueue.push(animation);
    }
    
    updateAnimations(currentTime) {
        for (let i = this.animationQueue.length - 1; i >= 0; i--) {
            const anim = this.animationQueue[i];
            const elapsed = currentTime - anim.startTime;
            anim.progress = Math.min(elapsed / anim.duration, 1);
            
            if (anim.progress >= 1) {
                this.animationQueue.splice(i, 1);
            }
        }
        
        for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
            const trail = this.ghostTrails[i];
            trail.progress += 0.05;
            trail.opacity = Math.max(0, 0.8 - trail.progress);
            
            if (trail.opacity <= 0) {
                this.ghostTrails.splice(i, 1);
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.movePlayer(1, 0);
                    break;
                case ' ':
                    e.preventDefault();
                    this.rewind();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    this.loadLevel(this.currentLevel);
                    break;
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
        });
        
        document.getElementById('rewindBtn').addEventListener('click', () => {
            this.rewind();
        });
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            document.getElementById('levelComplete').style.display = 'none';
            this.loadLevel(this.currentLevel + 1);
        });
    }
    
    updateUI() {
        document.getElementById('levelNum').textContent = this.currentLevel + 1;
        document.getElementById('moveCount').textContent = this.moveCount;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMap();
        this.drawSwitches();
        this.drawExit();
        this.drawDoors();
        this.drawBoxes();
        this.drawPlayer();
        this.drawAnimations();
        this.drawGhostTrails();
    }
    
    drawMap() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.map[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                if (tile === 1) {
                    this.ctx.fillStyle = '#2c3e50';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#34495e';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
                    
                    this.ctx.strokeStyle = '#3d566e';
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + 10, py + 10);
                    this.ctx.lineTo(px + this.tileSize - 10, py + this.tileSize - 10);
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + this.tileSize - 10, py + 10);
                    this.ctx.lineTo(px + 10, py + this.tileSize - 10);
                    this.ctx.stroke();
                } else {
                    this.ctx.fillStyle = '#1a1a2e';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#16213e';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
                }
            }
        }
    }
    
    drawSwitches() {
        for (const switchObj of this.switches) {
            const px = switchObj.x * this.tileSize;
            const py = switchObj.y * this.tileSize;
            const isActive = this.boxes.some(box => box.x === switchObj.x && box.y === switchObj.y);
            
            this.ctx.save();
            this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2);
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
            this.ctx.fillStyle = isActive ? '#e74c3c' : '#95a5a6';
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            this.ctx.fillStyle = isActive ? '#c0392b' : '#7f8c8d';
            this.ctx.fill();
            
            if (isActive) {
                this.ctx.shadowColor = '#e74c3c';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }
    
    drawExit() {
        const px = this.exit.x * this.tileSize;
        const py = this.exit.y * this.tileSize;
        
        this.ctx.save();
        this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2);
        
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.2 + 1;
        
        this.ctx.shadowColor = '#2ecc71';
        this.ctx.shadowBlur = 20 * pulse;
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const radius = 25 * pulse;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fill();
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const radius = 15 * pulse;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawDoors() {
        for (const door of this.doors) {
            const px = door.x * this.tileSize;
            const py = door.y * this.tileSize;
            
            this.ctx.save();
            this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2);
            
            if (door.open) {
                this.ctx.fillStyle = '#95a5a6';
                this.ctx.fillRect(-25, -25, 10, 50);
                this.ctx.fillRect(15, -25, 10, 50);
                this.ctx.fillRect(-25, -25, 50, 10);
            } else {
                this.ctx.fillStyle = '#e67e22';
                this.ctx.fillRect(-25, -25, 50, 50);
                
                this.ctx.strokeStyle = '#d35400';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(-22, -22, 44, 44);
                
                this.ctx.fillStyle = '#f39c12';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#34495e';
                this.ctx.fillRect(-4, -2, 8, 10);
            }
            
            this.ctx.restore();
        }
    }
    
    drawBoxes() {
        for (const box of this.boxes) {
            this.drawSingleBox(box.x, box.y, 1);
        }
    }
    
    drawSingleBox(x, y, opacity = 1) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2);
        
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(-25, -25, 50, 50);
        
        this.ctx.strokeStyle = '#2980b9';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-22, -22, 44, 44);
        
        this.ctx.strokeStyle = '#1abc9c';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-20, -10);
        this.ctx.lineTo(-20, 10);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        this.ctx.lineTo(-10, 0);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(20, -10);
        this.ctx.lineTo(20, 10);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(10, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawPlayer() {
        this.drawSinglePlayer(this.player.x, this.player.y, 1);
    }
    
    drawSinglePlayer(x, y, opacity = 1) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2);
        
        this.ctx.beginPath();
        this.ctx.arc(0, -5, 18, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f39c12';
        this.ctx.fill();
        this.ctx.strokeStyle = '#e67e22';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(-6, -8, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(6, -8, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(0, -2, 8, 0, Math.PI);
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(-15, 10, 30, 15);
        this.ctx.strokeStyle = '#2980b9';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-15, 10, 30, 15);
        
        this.ctx.restore();
    }
    
    drawAnimations() {
        const currentTime = performance.now();
        
        for (const anim of this.animationQueue) {
            if (anim.type === 'player') {
                const fromX = anim.from.x * this.tileSize + this.tileSize / 2;
                const fromY = anim.from.y * this.tileSize + this.tileSize / 2;
                const toX = anim.to.x * this.tileSize + this.tileSize / 2;
                const toY = anim.to.y * this.tileSize + this.tileSize / 2;
                
                const currentX = fromX + (toX - fromX) * anim.progress;
                const currentY = fromY + (toY - fromY) * anim.progress;
                
                this.ctx.save();
                this.ctx.globalAlpha = 0.5;
                this.ctx.translate(currentX, currentY);
                this.ctx.scale(1 + anim.progress * 0.2, 1 + anim.progress * 0.2);
                
                this.ctx.beginPath();
                this.ctx.arc(0, -5, 18, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(243, 156, 18, 0.5)';
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
                this.ctx.fillRect(-15, 10, 30, 15);
                
                this.ctx.restore();
                
            } else if (anim.type === 'box') {
                const box = this.boxes[anim.boxIndex];
                const fromX = anim.from.x * this.tileSize + this.tileSize / 2;
                const fromY = anim.from.y * this.tileSize + this.tileSize / 2;
                const toX = anim.to.x * this.tileSize + this.tileSize / 2;
                const toY = anim.to.y * this.tileSize + this.tileSize / 2;
                
                const currentX = fromX + (toX - fromX) * anim.progress;
                const currentY = fromY + (toY - fromY) * anim.progress;
                
                this.ctx.save();
                this.ctx.globalAlpha = 0.6;
                this.ctx.translate(currentX, currentY);
                
                this.ctx.fillStyle = '#3498db';
                this.ctx.fillRect(-25, -25, 50, 50);
                
                this.ctx.strokeStyle = '#2980b9';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(-22, -22, 44, 44);
                
                this.ctx.restore();
            }
        }
    }
    
    drawGhostTrails() {
        for (const trail of this.ghostTrails) {
            const fromX = trail.from.x * this.tileSize + this.tileSize / 2;
            const fromY = trail.from.y * this.tileSize + this.tileSize / 2;
            const toX = trail.to.x * this.tileSize + this.tileSize / 2;
            const toY = trail.to.y * this.tileSize + this.tileSize / 2;
            
            const ghostCount = 5;
            for (let i = 0; i < ghostCount; i++) {
                const progress = i / ghostCount;
                const opacity = trail.opacity * (1 - progress);
                
                const ghostX = fromX + (toX - fromX) * progress;
                const ghostY = fromY + (toY - fromY) * progress;
                
                this.ctx.save();
                this.ctx.globalAlpha = opacity;
                this.ctx.translate(ghostX, ghostY);
                
                if (trail.type === 'player') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, -5, 18, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(243, 156, 18, 0.3)';
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
                    this.ctx.fillRect(-15, 10, 30, 15);
                } else if (trail.type === 'box') {
                    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
                    this.ctx.fillRect(-25, -25, 50, 50);
                }
                
                this.ctx.restore();
            }
        }
    }
    
    gameLoop() {
        const currentTime = performance.now();
        this.updateAnimations(currentTime);
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => {
    new TimeRewindGame();
};
