class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {
            levelName: document.getElementById('level-name'),
            levelObjective: document.getElementById('level-objective'),
            budgetDisplay: document.getElementById('budget-display'),
            weightDisplay: document.getElementById('weight-display'),
            
            toolButtons: document.querySelectorAll('.tool-btn'),
            btnTest: document.getElementById('btn-test'),
            btnStop: document.getElementById('btn-stop'),
            btnSlowmo: document.getElementById('btn-slowmo'),
            speedSlider: document.getElementById('speed-slider'),
            speedDisplay: document.getElementById('speed-display'),
            
            showHeatmap: document.getElementById('show-heatmap'),
            showForces: document.getElementById('show-forces'),
            showGrid: document.getElementById('show-grid'),
            showNodes: document.getElementById('show-nodes'),
            
            detailType: document.getElementById('detail-type'),
            detailSpan: document.getElementById('detail-span'),
            detailBudget: document.getElementById('detail-budget'),
            detailWeight: document.getElementById('detail-weight'),
            detailSpecial: document.getElementById('detail-special'),
            detailSpecialValue: document.getElementById('detail-special-value'),
            
            selectionInfo: document.getElementById('selection-info'),
            statNodes: document.getElementById('stat-nodes'),
            statBeams: document.getElementById('stat-beams'),
            statWood: document.getElementById('stat-wood'),
            statSteel: document.getElementById('stat-steel'),
            statCable: document.getElementById('stat-cable'),
            statMaxStress: document.getElementById('stat-max-stress'),
            
            btnUndo: document.getElementById('btn-undo'),
            btnRedo: document.getElementById('btn-redo'),
            btnDelete: document.getElementById('btn-delete'),
            btnClear: document.getElementById('btn-clear'),
            
            btnPrevLevel: document.getElementById('btn-prev-level'),
            btnRestart: document.getElementById('btn-restart'),
            btnNextLevel: document.getElementById('btn-next-level'),
            
            modalOverlay: document.getElementById('modal-overlay'),
            resultModal: document.getElementById('result-modal'),
            resultTitle: document.getElementById('result-title'),
            resultStatus: document.getElementById('result-status'),
            resultText: document.getElementById('result-text'),
            resultCost: document.getElementById('result-cost'),
            resultWeight: document.getElementById('result-weight'),
            resultStress: document.getElementById('result-stress'),
            ratingStars: document.getElementById('rating-stars'),
            ratingText: document.getElementById('rating-text'),
            btnWatchReplay: document.getElementById('btn-watch-replay'),
            btnRetry: document.getElementById('btn-retry'),
            btnNext: document.getElementById('btn-next'),
            
            statusText: document.getElementById('status-text'),
            coordinates: document.getElementById('coordinates'),
            
            canvas: document.getElementById('game-canvas'),
            canvasContainer: document.getElementById('canvas-container')
        };
    }

    bindEvents() {
        this.elements.toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.game.setTool(tool);
                this.updateToolButtons(tool);
            });
        });
        
        this.elements.btnTest.addEventListener('click', () => {
            this.game.startTest();
        });
        
        this.elements.btnStop.addEventListener('click', () => {
            this.game.stopTest();
        });
        
        this.elements.btnSlowmo.addEventListener('click', () => {
            this.game.toggleSlowMotion();
        });
        
        this.elements.speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.game.setTimeScale(speed);
            this.elements.speedDisplay.textContent = `${speed.toFixed(1)}x`;
        });
        
        this.elements.showHeatmap.addEventListener('change', (e) => {
            this.game.renderer.viewOptions.showHeatmap = e.target.checked;
            this.game.heatmapRenderer.enabled = e.target.checked;
        });
        
        this.elements.showForces.addEventListener('change', (e) => {
            this.game.renderer.viewOptions.showForces = e.target.checked;
        });
        
        this.elements.showGrid.addEventListener('change', (e) => {
            this.game.renderer.viewOptions.showGrid = e.target.checked;
            this.game.inputHandler.snapToGrid = e.target.checked;
        });
        
        this.elements.showNodes.addEventListener('change', (e) => {
            this.game.renderer.viewOptions.showNodes = e.target.checked;
        });
        
        this.elements.btnUndo.addEventListener('click', () => {
            this.game.undo();
        });
        
        this.elements.btnRedo.addEventListener('click', () => {
            this.game.redo();
        });
        
        this.elements.btnDelete.addEventListener('click', () => {
            this.game.deleteSelected();
        });
        
        this.elements.btnClear.addEventListener('click', () => {
            if (confirm('确定要清除所有建造内容吗？')) {
                this.game.clearUserCreated();
            }
        });
        
        this.elements.btnPrevLevel.addEventListener('click', () => {
            this.game.prevLevel();
        });
        
        this.elements.btnRestart.addEventListener('click', () => {
            if (confirm('确定要重新开始当前关卡吗？')) {
                this.game.restartLevel();
            }
        });
        
        this.elements.btnNextLevel.addEventListener('click', () => {
            this.game.nextLevel();
        });
        
        this.elements.btnWatchReplay.addEventListener('click', () => {
            this.game.watchReplay();
            this.hideModal();
        });
        
        this.elements.btnRetry.addEventListener('click', () => {
            this.hideModal();
            this.game.restartLevel();
        });
        
        this.elements.btnNext.addEventListener('click', () => {
            this.hideModal();
            this.game.nextLevel();
        });
        
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.hideModal();
            }
        });
    }

    updateToolButtons(selectedTool) {
        this.elements.toolButtons.forEach(btn => {
            if (btn.dataset.tool === selectedTool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateLevelInfo(level) {
        if (!level) return;
        
        this.elements.levelName.textContent = level.name;
        this.elements.levelObjective.textContent = `目标: ${level.objective}`;
        
        this.elements.detailType.textContent = this.getTerrainTypeName(level.terrainType);
        this.elements.detailSpan.textContent = `${level.getSpan()}m`;
        this.elements.detailBudget.textContent = this.formatCurrency(level.budgetLimit);
        
        if (level.weightLimit === Infinity) {
            this.elements.detailWeight.textContent = '无限制';
        } else {
            this.elements.detailWeight.textContent = `${level.weightLimit} kg`;
        }
        
        if (level.challenges.length > 0) {
            this.elements.detailSpecial.classList.remove('hidden');
            this.elements.detailSpecialValue.textContent = this.getChallengeDescription(level.challenges);
        } else {
            this.elements.detailSpecial.classList.add('hidden');
        }
        
        this.updateLevelButtons();
    }

    getTerrainTypeName(type) {
        const names = {
            [TerrainType.CANYON]: '峡谷',
            [TerrainType.RIVER]: '河流',
            [TerrainType.FLAT]: '平地',
            [TerrainType.VALLEY]: '山谷'
        };
        return names[type] || type;
    }

    getChallengeDescription(challenges) {
        const descriptions = {
            [ChallengeType.BUDGET_LIMIT]: '预算限制',
            [ChallengeType.WEIGHT_LIMIT]: '重量限制',
            [ChallengeType.SHIP_PASSAGE]: '船只通行',
            [ChallengeType.HEIGHT_LIMIT]: '高度限制'
        };
        
        return challenges.map(c => descriptions[c] || c).join(', ');
    }

    updateResources(cost, weight, budgetLimit) {
        const budgetPercent = (cost / budgetLimit) * 100;
        this.elements.budgetDisplay.textContent = `${this.formatCurrency(cost)} / ${this.formatCurrency(budgetLimit)}`;
        
        if (budgetPercent > 90) {
            this.elements.budgetDisplay.style.color = '#e74c3c';
        } else if (budgetPercent > 70) {
            this.elements.budgetDisplay.style.color = '#f39c12';
        } else {
            this.elements.budgetDisplay.style.color = '#27ae60';
        }
        
        this.elements.weightDisplay.textContent = `${Math.round(weight)} kg`;
    }

    updateStatistics(stats) {
        this.elements.statNodes.textContent = stats.nodes || 0;
        this.elements.statBeams.textContent = stats.beams || 0;
        this.elements.statWood.textContent = stats.wood || 0;
        this.elements.statSteel.textContent = stats.steel || 0;
        this.elements.statCable.textContent = stats.cable || 0;
        
        const stressPercent = Math.round((stats.maxStress || 0) * 100);
        this.elements.statMaxStress.textContent = `${stressPercent}%`;
        
        this.elements.statMaxStress.className = '';
        if (stressPercent > 80) {
            this.elements.statMaxStress.classList.add('high');
        } else if (stressPercent > 50) {
            this.elements.statMaxStress.classList.add('medium');
        } else {
            this.elements.statMaxStress.classList.add('low');
        }
    }

    updateSelectionInfo(type, object) {
        if (!object) {
            this.elements.selectionInfo.innerHTML = '<p>未选中任何元素</p>';
            this.elements.selectionInfo.classList.add('empty-info');
            this.elements.btnDelete.disabled = true;
            return;
        }
        
        this.elements.selectionInfo.classList.remove('empty-info');
        this.elements.btnDelete.disabled = false;
        
        let html = '';
        
        if (type === 'node') {
            html = `
                <div class="selection-detail">
                    <div class="detail-label">类型</div>
                    <div class="detail-value">${object.isFixed ? '固定节点' : '自由节点'}</div>
                </div>
                <div class="selection-detail">
                    <div class="detail-label">位置</div>
                    <div class="detail-value">(${Math.round(object.position.x)}, ${Math.round(object.position.y)})</div>
                </div>
                <div class="selection-detail">
                    <div class="detail-label">连接数</div>
                    <div class="detail-value">${object.connections.length}</div>
                </div>
            `;
        } else if (type === 'beam') {
            const stressPercent = Math.round(object.stressRatio * 100);
            html = `
                <div class="selection-detail">
                    <div class="detail-label">类型</div>
                    <div class="detail-value">${object.material.name}</div>
                </div>
                <div class="selection-detail">
                    <div class="detail-label">长度</div>
                    <div class="detail-value">${object.restLength.toFixed(1)}m</div>
                </div>
                <div class="selection-detail">
                    <div class="detail-label">费用</div>
                    <div class="detail-value">${this.formatCurrency(object.getCost())}</div>
                </div>
                <div class="selection-detail">
                    <div class="detail-label">应力</div>
                    <div class="detail-value stress-${stressPercent > 80 ? 'high' : stressPercent > 50 ? 'medium' : 'low'}">
                        ${stressPercent}%
                    </div>
                </div>
            `;
        }
        
        this.elements.selectionInfo.innerHTML = html;
    }

    updateUndoRedoButtons(canUndo, canRedo) {
        this.elements.btnUndo.disabled = !canUndo;
        this.elements.btnRedo.disabled = !canRedo;
    }

    updateLevelButtons() {
        const hasPrev = this.game.hasPrevLevel();
        const hasNext = this.game.hasNextLevel();
        
        this.elements.btnPrevLevel.disabled = !hasPrev;
        this.elements.btnNextLevel.disabled = !hasNext;
    }

    setTestingState(isTesting) {
        this.elements.btnTest.disabled = isTesting;
        this.elements.btnStop.disabled = !isTesting;
        
        this.elements.toolButtons.forEach(btn => {
            btn.disabled = isTesting;
        });
        
        this.elements.btnUndo.disabled = isTesting;
        this.elements.btnRedo.disabled = isTesting;
        this.elements.btnDelete.disabled = isTesting;
        this.elements.btnClear.disabled = isTesting;
    }

    updateStatus(message) {
        this.elements.statusText.textContent = message;
    }

    updateCoordinates(x, y) {
        this.elements.coordinates.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    }

    showResultModal(success, result) {
        this.elements.modalOverlay.classList.remove('hidden');
        this.elements.resultModal.classList.remove('hidden');
        
        if (success) {
            this.elements.resultTitle.textContent = '测试成功！';
            this.elements.resultStatus.className = 'result-success';
            this.elements.resultText.innerHTML = '<span class="icon">✓</span> 桥梁测试成功！';
        } else {
            this.elements.resultTitle.textContent = '测试失败';
            this.elements.resultStatus.className = 'result-failure';
            this.elements.resultText.innerHTML = '<span class="icon">✗</span> 桥梁发生结构性失效';
        }
        
        this.elements.resultCost.textContent = this.formatCurrency(result.cost || 0);
        this.elements.resultWeight.textContent = `${Math.round(result.weight || 0)} kg`;
        this.elements.resultStress.textContent = `${Math.round((result.maxStress || 0) * 100)}%`;
        
        this.updateRating(result.rating);
    }

    updateRating(rating) {
        if (!rating) {
            this.elements.ratingStars.innerHTML = '';
            this.elements.ratingText.textContent = '-';
            return;
        }
        
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            const isFilled = i < rating.stars;
            starsHtml += `<span class="star ${isFilled ? '' : 'empty'}">★</span>`;
        }
        this.elements.ratingStars.innerHTML = starsHtml;
        this.elements.ratingText.textContent = rating.text || '';
    }

    hideModal() {
        this.elements.modalOverlay.classList.add('hidden');
        this.elements.resultModal.classList.add('hidden');
    }

    formatCurrency(amount) {
        if (amount === Infinity) return '∞';
        return `$${amount.toLocaleString()}`;
    }

    resizeCanvas() {
        const container = this.elements.canvasContainer;
        const canvas = this.elements.canvas;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        return { width: canvas.width, height: canvas.height };
    }
}

if (typeof module !== 'undefined') {
    module.exports = { UIManager };
}
