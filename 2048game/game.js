document.addEventListener('DOMContentLoaded', function() {
    const gridSize = 4;
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let gameWon = false;
    let keepPlaying = false;

    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('bestScore');
    const tileContainer = document.getElementById('tileContainer');
    const gameMessage = document.getElementById('gameMessage');
    const messageText = document.getElementById('messageText');
    const newGameButton = document.getElementById('newGame');
    const tryAgainButton = document.getElementById('tryAgain');
    const continueGameButton = document.getElementById('continueGame');

    function initialize() {
        scoreElement.textContent = score;
        bestScoreElement.textContent = bestScore;
        gameWon = false;
        keepPlaying = false;
        grid = [];
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                grid[i][j] = { value: 0, tile: null };
            }
        }
        tileContainer.innerHTML = '';
        gameMessage.classList.remove('show');
        
        addRandomTile();
        addRandomTile();
    }

    function addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j].value === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            grid[randomCell.row][randomCell.col].value = value;
            createTile(randomCell.row, randomCell.col, value, true);
        }
    }

    function createTile(row, col, value, isNew = false, isMerged = false) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        if (isNew) {
            tile.classList.add('tile-new');
        }
        if (isMerged) {
            tile.classList.add('tile-merged');
        }
        tile.textContent = value;
        
        const gameContainer = document.querySelector('.game-container');
        const containerStyle = window.getComputedStyle(gameContainer);
        const containerPadding = parseFloat(containerStyle.padding);
        const cellSize = window.innerWidth <= 520 ? 65.5 : 106.25;
        const cellGap = window.innerWidth <= 520 ? 15 : 15;
        
        const left = col * (cellSize + cellGap);
        const top = row * (cellSize + cellGap);
        
        tile.style.left = `${left}px`;
        tile.style.top = `${top}px`;
        tile.dataset.row = row;
        tile.dataset.col = col;
        
        tileContainer.appendChild(tile);
        grid[row][col].tile = tile;
        
        if (isNew) {
            setTimeout(() => {
                tile.classList.remove('tile-new');
            }, 300);
        }
        
        if (isMerged) {
            setTimeout(() => {
                tile.classList.remove('tile-merged');
            }, 300);
        }
        
        return tile;
    }

    function moveTile(tile, fromRow, fromCol, toRow, toCol) {
        if (!tile) return;
        
        const cellSize = window.innerWidth <= 520 ? 65.5 : 106.25;
        const cellGap = window.innerWidth <= 520 ? 15 : 15;
        
        const left = toCol * (cellSize + cellGap);
        const top = toRow * (cellSize + cellGap);
        
        tile.style.left = `${left}px`;
        tile.style.top = `${top}px`;
        tile.dataset.row = toRow;
        tile.dataset.col = toCol;
        
        grid[fromRow][fromCol].tile = null;
        grid[toRow][toCol].tile = tile;
    }

    function mergeTiles(row1, col1, row2, col2) {
        const tile1 = grid[row1][col1].tile;
        const tile2 = grid[row2][col2].tile;
        
        if (!tile1 || !tile2) return;
        
        const newValue = grid[row1][col1].value * 2;
        grid[row2][col2].value = newValue;
        grid[row1][col1].value = 0;
        
        moveTile(tile1, row1, col1, row2, col2);
        
        setTimeout(() => {
            if (tile1 && tile1.parentNode) {
                tile1.parentNode.removeChild(tile1);
            }
            if (tile2 && tile2.parentNode) {
                tile2.parentNode.removeChild(tile2);
            }
            grid[row2][col2].tile = createTile(row2, col2, newValue, false, true);
        }, 150);
        
        score += newValue;
        scoreElement.textContent = score;
        
        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('bestScore', bestScore);
        }
        
        if (newValue === 2048 && !gameWon && !keepPlaying) {
            gameWon = true;
            showWinMessage();
        }
    }

    function move(direction) {
        let moved = false;
        let hasMerged = [];
        
        for (let i = 0; i < gridSize; i++) {
            hasMerged[i] = [];
            for (let j = 0; j < gridSize; j++) {
                hasMerged[i][j] = false;
            }
        }
        
        switch (direction) {
            case 'up':
                for (let col = 0; col < gridSize; col++) {
                    for (let row = 1; row < gridSize; row++) {
                        if (grid[row][col].value !== 0) {
                            let newRow = row;
                            while (newRow > 0 && grid[newRow - 1][col].value === 0) {
                                newRow--;
                            }
                            
                            if (newRow > 0 && grid[newRow - 1][col].value === grid[row][col].value && !hasMerged[newRow - 1][col]) {
                                mergeTiles(row, col, newRow - 1, col);
                                hasMerged[newRow - 1][col] = true;
                                moved = true;
                            } else if (newRow !== row) {
                                moveTile(grid[row][col].tile, row, col, newRow, col);
                                grid[newRow][col].value = grid[row][col].value;
                                grid[row][col].value = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
                
            case 'down':
                for (let col = 0; col < gridSize; col++) {
                    for (let row = gridSize - 2; row >= 0; row--) {
                        if (grid[row][col].value !== 0) {
                            let newRow = row;
                            while (newRow < gridSize - 1 && grid[newRow + 1][col].value === 0) {
                                newRow++;
                            }
                            
                            if (newRow < gridSize - 1 && grid[newRow + 1][col].value === grid[row][col].value && !hasMerged[newRow + 1][col]) {
                                mergeTiles(row, col, newRow + 1, col);
                                hasMerged[newRow + 1][col] = true;
                                moved = true;
                            } else if (newRow !== row) {
                                moveTile(grid[row][col].tile, row, col, newRow, col);
                                grid[newRow][col].value = grid[row][col].value;
                                grid[row][col].value = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
                
            case 'left':
                for (let row = 0; row < gridSize; row++) {
                    for (let col = 1; col < gridSize; col++) {
                        if (grid[row][col].value !== 0) {
                            let newCol = col;
                            while (newCol > 0 && grid[row][newCol - 1].value === 0) {
                                newCol--;
                            }
                            
                            if (newCol > 0 && grid[row][newCol - 1].value === grid[row][col].value && !hasMerged[row][newCol - 1]) {
                                mergeTiles(row, col, row, newCol - 1);
                                hasMerged[row][newCol - 1] = true;
                                moved = true;
                            } else if (newCol !== col) {
                                moveTile(grid[row][col].tile, row, col, row, newCol);
                                grid[row][newCol].value = grid[row][col].value;
                                grid[row][col].value = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
                
            case 'right':
                for (let row = 0; row < gridSize; row++) {
                    for (let col = gridSize - 2; col >= 0; col--) {
                        if (grid[row][col].value !== 0) {
                            let newCol = col;
                            while (newCol < gridSize - 1 && grid[row][newCol + 1].value === 0) {
                                newCol++;
                            }
                            
                            if (newCol < gridSize - 1 && grid[row][newCol + 1].value === grid[row][col].value && !hasMerged[row][newCol + 1]) {
                                mergeTiles(row, col, row, newCol + 1);
                                hasMerged[row][newCol + 1] = true;
                                moved = true;
                            } else if (newCol !== col) {
                                moveTile(grid[row][col].tile, row, col, row, newCol);
                                grid[row][newCol].value = grid[row][col].value;
                                grid[row][col].value = 0;
                                moved = true;
                            }
                        }
                    }
                }
                break;
        }
        
        if (moved) {
            setTimeout(() => {
                addRandomTile();
                if (isGameOver()) {
                    showGameOverMessage();
                }
            }, 200);
        }
        
        return moved;
    }

    function isGameOver() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j].value === 0) {
                    return false;
                }
                if (i < gridSize - 1 && grid[i][j].value === grid[i + 1][j].value) {
                    return false;
                }
                if (j < gridSize - 1 && grid[i][j].value === grid[i][j + 1].value) {
                    return false;
                }
            }
        }
        return true;
    }

    function showWinMessage() {
        messageText.textContent = '你赢了!';
        continueGameButton.style.display = 'inline-block';
        gameMessage.classList.add('show');
    }

    function showGameOverMessage() {
        messageText.textContent = '游戏结束!';
        continueGameButton.style.display = 'none';
        gameMessage.classList.add('show');
    }

    function handleKeydown(e) {
        const keyMap = {
            38: 'up',
            40: 'down',
            37: 'left',
            39: 'right'
        };
        
        if (keyMap[e.keyCode]) {
            e.preventDefault();
            move(keyMap[e.keyCode]);
        }
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
    }

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    move('right');
                } else {
                    move('left');
                }
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    move('down');
                } else {
                    move('up');
                }
            }
        }
    }

    newGameButton.addEventListener('click', initialize);
    tryAgainButton.addEventListener('click', initialize);
    continueGameButton.addEventListener('click', function() {
        keepPlaying = true;
        gameMessage.classList.remove('show');
    });

    document.addEventListener('keydown', handleKeydown);
    
    const gameContainer = document.querySelector('.game-container');
    gameContainer.addEventListener('touchstart', handleTouchStart, false);
    gameContainer.addEventListener('touchend', handleTouchEnd, false);

    initialize();
});
