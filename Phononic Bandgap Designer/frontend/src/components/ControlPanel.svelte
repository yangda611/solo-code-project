<script lang="ts">
    import type { MaterialParams, GeometryParams } from '../types';

    export let materialParams: MaterialParams;
    export let geometryParams: GeometryParams;
    export let onCalculate: () => void;
    export let isCalculating: boolean;
    export let animationProgress: number;

    const latticeTypes = [
        { value: 'square', label: '正方晶格' },
        { value: 'hexagonal', label: '六角晶格' },
        { value: 'diamond', label: '金刚石结构' },
        { value: 'cubic', label: '立方晶格' }
    ];

    const scattererShapes = [
        { value: 'circle', label: '圆形' },
        { value: 'square', label: '正方形' },
        { value: 'sphere', label: '球体' },
        { value: 'cube', label: '立方体' }
    ];
</script>

<div class="control-panel">
    <div class="section">
        <h3>📐 几何参数</h3>
        
        <div class="control-group">
            <label>晶格类型</label>
            <select bind:value={geometryParams.latticeType}>
                {#each latticeTypes as type}
                    <option value={type.value}>{type.label}</option>
                {/each}
            </select>
        </div>

        <div class="control-group">
            <label>散射体形状</label>
            <select bind:value={geometryParams.scattererShape}>
                {#each scattererShapes as shape}
                    <option value={shape.value}>{shape.label}</option>
                {/each}
            </select>
        </div>

        <div class="control-group">
            <label>填充率: {geometryParams.fillingFraction.toFixed(2)}</label>
            <input 
                type="range" 
                min="0.1" 
                max="0.6" 
                step="0.01" 
                bind:value={geometryParams.fillingFraction}
            />
        </div>

        <div class="control-group">
            <label>晶格常数: {geometryParams.latticeConstant.toFixed(2)}</label>
            <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                bind:value={geometryParams.latticeConstant}
            />
        </div>
    </div>

    <div class="section">
        <h3>🔬 材料参数</h3>
        
        <div class="control-group">
            <label>基体弹性模量: {materialParams.matrixModulus.toFixed(1)}</label>
            <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.1" 
                bind:value={materialParams.matrixModulus}
            />
        </div>

        <div class="control-group">
            <label>散射体弹性模量: {materialParams.scattererModulus.toFixed(1)}</label>
            <input 
                type="range" 
                min="1" 
                max="30" 
                step="0.5" 
                bind:value={materialParams.scattererModulus}
            />
        </div>

        <div class="control-group">
            <label>基体密度: {materialParams.matrixDensity.toFixed(1)}</label>
            <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.1" 
                bind:value={materialParams.matrixDensity}
            />
        </div>

        <div class="control-group">
            <label>散射体密度: {materialParams.scattererDensity.toFixed(1)}</label>
            <input 
                type="range" 
                min="1" 
                max="20" 
                step="0.5" 
                bind:value={materialParams.scattererDensity}
            />
        </div>
    </div>

    <div class="section">
        <h3>⚡ 计算控制</h3>
        
        <button 
            class="calculate-btn" 
            on:click={onCalculate}
            disabled={isCalculating}
        >
            {#if isCalculating}
                <span class="spinner"></span>
                计算中...
            {:else}
                🚀 计算能带结构
            {/if}
        </button>

        {#if animationProgress > 0}
            <div class="progress-bar">
                <div class="progress-fill" style="width: {animationProgress * 100}%"></div>
            </div>
            <p class="progress-text">
                {#if animationProgress < 0.3}
                    初始化有限元网格...
                {:else if animationProgress < 0.6}
                    求解本征频率...
                {:else if animationProgress < 0.9}
                    构建能带结构...
                {:else}
                    绘制可视化结果...
                {/if}
            </p>
        {/if}
    </div>

    <div class="section info-section">
        <h3>ℹ️ 物理现象说明</h3>
        <ul class="info-list">
            <li><strong>能带交叉:</strong> 模态密集区域出现杂散能带交叉</li>
            <li><strong>数值奇异性:</strong> 高填充率下散射体接触导致</li>
            <li><strong>带边偏移:</strong> 有限尺寸效应引起的频率偏移</li>
            <li><strong>简并解除:</strong> 各向异性材料导致能带简并不完全</li>
        </ul>
    </div>
</div>

<style>
    .control-panel {
        display: flex;
        flex-direction: column;
        gap: 15px;
        overflow-y: auto;
        padding-right: 5px;
    }

    .section {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section h3 {
        margin: 0 0 15px 0;
        font-size: 0.95rem;
        color: #00d4ff;
    }

    .control-group {
        margin-bottom: 12px;
    }

    .control-group:last-child {
        margin-bottom: 0;
    }

    .control-group label {
        display: block;
        font-size: 0.8rem;
        color: #ccc;
        margin-bottom: 6px;
    }

    .control-group select,
    .control-group input[type="range"] {
        width: 100%;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #fff;
        font-size: 0.85rem;
    }

    .control-group select {
        cursor: pointer;
    }

    .control-group select option {
        background: #1a1a2e;
        color: #fff;
    }

    .control-group input[type="range"] {
        padding: 0;
        height: 6px;
        -webkit-appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }

    .control-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(123, 47, 247, 0.5);
    }

    .calculate-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .calculate-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(123, 47, 247, 0.4);
    }

    .calculate-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .progress-bar {
        margin-top: 12px;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #7b2ff7, #f107a3);
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .progress-text {
        margin: 8px 0 0 0;
        font-size: 0.75rem;
        color: #888;
        text-align: center;
    }

    .info-section {
        background: rgba(0, 212, 255, 0.05);
        border-color: rgba(0, 212, 255, 0.2);
    }

    .info-list {
        margin: 0;
        padding-left: 18px;
        font-size: 0.75rem;
        color: #999;
        line-height: 1.8;
    }

    .info-list li {
        margin-bottom: 6px;
    }

    .info-list strong {
        color: #00d4ff;
    }

    .control-panel::-webkit-scrollbar {
        width: 4px;
    }

    .control-panel::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
    }

    .control-panel::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
    }
</style>
