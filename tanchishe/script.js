document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const finalScoreElement = document.getElementById('final-score');
    const gameOverScreen = document.getElementById('game-over');
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const speedUpBtn = document.getElementById('speed-up-btn');
    const speedDownBtn = document.getElementById('speed-down-btn');
    const controlBtns = document.querySelectorAll('.control-btn');

    // 游戏配置
    const gridSize = 20;
    const gridCount = canvas.width / gridSize;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameSpeed = 150;
    let isPaused = false;
    let gameRunning = false;
    let gameLoop;

    // 蛇的配置
    let snake = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    
    // 食物配置
    let food = { x: 0, y: 0 };
    
    // 流光动画配置
    let glowAnimation = {
        active: false,
        positions: [],
        progress: 0,
        duration: 300,
        startTime: 0
    };

    // 初始化最高分显示
    highScoreElement.textContent = highScore;

    // 初始化游戏
    function initGame() {
        // 重置蛇
        snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        
        // 重置方向
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        
        // 重置分数
        score = 0;
        scoreElement.textContent = score;
        
        // 重置流光动画
        glowAnimation.active = false;
        glowAnimation.positions = [];
        glowAnimation.progress = 0;
        
        // 生成食物
        generateFood();
        
        // 隐藏开始和游戏结束界面
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        // 开始游戏循环
        gameRunning = true;
        isPaused = false;
        pauseBtn.textContent = '暂停';
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameUpdate, gameSpeed);
    }

    // 生成食物
    function generateFood() {
        let validPosition = false;
        while (!validPosition) {
            food = {
                x: Math.floor(Math.random() * gridCount),
                y: Math.floor(Math.random() * gridCount)
            };
            
            // 确保食物不在蛇身上
            validPosition = true;
            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }

    // 游戏更新
    function gameUpdate() {
        if (isPaused || !gameRunning) return;
        
        // 更新方向
        direction = { ...nextDirection };
        
        // 计算蛇头新位置
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
        
        // 检查碰撞
        if (checkCollision(head)) {
            gameOver();
            return;
        }
        
        // 添加新头部
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 吃到食物，增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                highScoreElement.textContent = highScore;
            }
            
            // 触发光流动画
            startGlowAnimation();
            
            // 生成新食物
            generateFood();
        } else {
            // 没吃到食物，移除尾部
            snake.pop();
        }
        
        // 绘制游戏
        drawGame();
    }

    // 开始流光动画
    function startGlowAnimation() {
        glowAnimation.active = true;
        glowAnimation.positions = [...snake];
        glowAnimation.progress = 0;
        glowAnimation.startTime = Date.now();
    }

    // 更新流光动画
    function updateGlowAnimation() {
        if (!glowAnimation.active) return;
        
        const elapsed = Date.now() - glowAnimation.startTime;
        glowAnimation.progress = Math.min(elapsed / glowAnimation.duration, 1);
        
        if (glowAnimation.progress >= 1) {
            glowAnimation.active = false;
        }
    }

    // 检查碰撞
    function checkCollision(head) {
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
            return true;
        }
        
        // 检查自身碰撞
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }
        
        return false;
    }

    // 游戏结束
    function gameOver() {
        gameRunning = false;
        clearInterval(gameLoop);
        
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        drawGrid();
        
        // 更新流光动画
        updateGlowAnimation();
        
        // 绘制蛇
        drawSnake();
        
        // 绘制食物
        drawFood();
    }

    // 绘制网格
    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= gridCount; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }

    // 绘制蛇
    function drawSnake() {
        const tailIndex = snake.length - 1;
        
        // 绘制蛇身
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            const isHead = i === 0;
            const isTail = i === tailIndex;
            
            // 计算颜色渐变
            let color;
            if (isHead) {
                color = '#00dbde';
            } else if (isTail) {
                color = '#fc00ff';
            } else {
                // 中间部分渐变
                const ratio = i / snake.length;
                color = interpolateColor('#00dbde', '#fc00ff', ratio);
            }
            
            // 绘制蛇段
            drawSegment(segment, color, isHead);
            
            // 绘制流光动画
            if (glowAnimation.active && i < glowAnimation.positions.length) {
                const glowProgress = getGlowProgressForSegment(i);
                if (glowProgress > 0) {
                    drawGlowEffect(segment, glowProgress, isTail);
                }
            }
        }
    }

    // 获取特定蛇段的流光进度
    function getGlowProgressForSegment(index) {
        // 从尾部到头部的进度
        const reversedIndex = glowAnimation.positions.length - 1 - index;
        const totalSegments = glowAnimation.positions.length;
        
        // 每个蛇段的开始时间差
        const segmentDelay = 0.1; // 每个蛇段的延迟
        const segmentStart = reversedIndex * segmentDelay;
        const segmentDuration = 0.8; // 每个蛇段的动画持续时间
        
        // 计算当前蛇段的进度
        const adjustedProgress = (glowAnimation.progress - segmentStart) / segmentDuration;
        return Math.max(0, Math.min(1, adjustedProgress));
    }

    // 绘制流光效果
    function drawGlowEffect(segment, progress, isTail) {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 4;
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        
        // 流光颜色
        const glowColor = `rgba(0, 219, 222, ${progress * 0.8})`;
        const outerGlowColor = `rgba(252, 0, 255, ${progress * 0.6})`;
        
        // 外发光
        ctx.save();
        ctx.shadowBlur = 20 * progress;
        ctx.shadowColor = outerGlowColor;
        
        // 绘制流光圆环
        const radius = (size / 2) * (1 + progress * 0.3);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(0.7, `rgba(0, 219, 222, ${progress * 0.4})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // 尾部特殊效果
        if (isTail) {
            // 尾部拖尾效果
            const trailLength = progress * 15;
            const trailGradient = ctx.createLinearGradient(
                centerX - trailLength, centerY,
                centerX, centerY
            );
            trailGradient.addColorStop(0, 'transparent');
            trailGradient.addColorStop(1, `rgba(252, 0, 255, ${progress * 0.7})`);
            
            ctx.fillStyle = trailGradient;
            ctx.fillRect(centerX - trailLength, centerY - 5, trailLength, 10);
        }
    }

    // 绘制蛇段
    function drawSegment(segment, color, isHead) {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 4;
        const radius = 4;
        
        // 绘制蛇段
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // 圆角矩形
        ctx.moveTo(x + 2 + radius, y + 2);
        ctx.lineTo(x + 2 + size - radius, y + 2);
        ctx.quadraticCurveTo(x + 2 + size, y + 2, x + 2 + size, y + 2 + radius);
        ctx.lineTo(x + 2 + size, y + 2 + size - radius);
        ctx.quadraticCurveTo(x + 2 + size, y + 2 + size, x + 2 + size - radius, y + 2 + size);
        ctx.lineTo(x + 2 + radius, y + 2 + size);
        ctx.quadraticCurveTo(x + 2, y + 2 + size, x + 2, y + 2 + size - radius);
        ctx.lineTo(x + 2, y + 2 + radius);
        ctx.quadraticCurveTo(x + 2, y + 2, x + 2 + radius, y + 2);
        
        ctx.fill();
        
        // 头部特殊处理
        if (isHead) {
            // 绘制眼睛
            const eyeSize = 3;
            const eyeOffset = 5;
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + 2 + eyeOffset, y + 2 + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.arc(x + 2 + size - eyeOffset, y + 2 + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制瞳孔
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 2 + eyeOffset, y + 2 + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.arc(x + 2 + size - eyeOffset, y + 2 + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 绘制食物
    function drawFood() {
        const x = food.x * gridSize;
        const y = food.y * gridSize;
        const size = gridSize - 4;
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        
        // 绘制发光效果
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;
        
        ctx.save();
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = '#ff0000';
        
        // 绘制食物主体
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.7, '#ff0000');
        gradient.addColorStop(1, '#cc0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // 绘制食物高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 颜色插值
    function interpolateColor(color1, color2, ratio) {
        // 将颜色转换为RGB
        const c1 = hexToRgb(color1);
        const c2 = hexToRgb(color2);
        
        // 插值
        const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
        const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
        const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
        
        // 转换回十六进制
        return `rgb(${r}, ${g}, ${b})`;
    }

    // 十六进制转RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // 方向键控制
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction.y !== 1) {
                    nextDirection = { x: 0, y: -1 };
                }
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction.y !== -1) {
                    nextDirection = { x: 0, y: 1 };
                }
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction.x !== 1) {
                    nextDirection = { x: -1, y: 0 };
                }
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction.x !== -1) {
                    nextDirection = { x: 1, y: 0 };
                }
                e.preventDefault();
                break;
            case ' ':
                // 空格键暂停/继续
                togglePause();
                e.preventDefault();
                break;
        }
    });

    // 移动端控制
    controlBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const directionType = btn.dataset.direction;
            
            switch(directionType) {
                case 'up':
                    if (direction.y !== 1) {
                        nextDirection = { x: 0, y: -1 };
                    }
                    break;
                case 'down':
                    if (direction.y !== -1) {
                        nextDirection = { x: 0, y: 1 };
                    }
                    break;
                case 'left':
                    if (direction.x !== 1) {
                        nextDirection = { x: -1, y: 0 };
                    }
                    break;
                case 'right':
                    if (direction.x !== -1) {
                        nextDirection = { x: 1, y: 0 };
                    }
                    break;
            }
        });
    });

    // 暂停/继续游戏
    function togglePause() {
        if (!gameRunning) return;
        
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? '继续' : '暂停';
    }

    // 按钮事件
    startBtn.addEventListener('click', initGame);
    restartBtn.addEventListener('click', initGame);
    pauseBtn.addEventListener('click', togglePause);
    
    speedUpBtn.addEventListener('click', () => {
        if (gameSpeed > 50) {
            gameSpeed -= 20;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameUpdate, gameSpeed);
        }
    });
    
    speedDownBtn.addEventListener('click', () => {
        if (gameSpeed < 300) {
            gameSpeed += 20;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameUpdate, gameSpeed);
        }
    });

    // 初始绘制
    drawGame();
});
