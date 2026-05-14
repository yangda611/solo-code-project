<script lang="ts">
    import { onMount } from 'svelte';
    import Scene3D from './components/Scene3D.svelte';
    import BandStructureChart from './components/BandStructureChart.svelte';
    import ControlPanel from './components/ControlPanel.svelte';
    import BrillouinZone from './components/BrillouinZone.svelte';
    import EigenModeVisualizer from './components/EigenModeVisualizer.svelte';
    import WavePropagation from './components/WavePropagation.svelte';
    import PresetSelector from './components/PresetSelector.svelte';
    import { BandgapCalculator } from './utils/bandgapCalculator';
    import type { MaterialParams, GeometryParams, SimulationResult, Preset } from './types';

    let materialParams: MaterialParams = {
        matrixModulus: 1,
        scattererModulus: 10,
        matrixDensity: 1,
        scattererDensity: 8
    };

    let geometryParams: GeometryParams = {
        latticeType: 'square',
        fillingFraction: 0.3,
        scattererShape: 'circle',
        latticeConstant: 1
    };

    let simulationResult: SimulationResult | null = null;
    let isCalculating = false;
    let activeTab = 'structure';
    let animationProgress = 0;
    let selectedModeIndex = 0;

    const presets: Preset[] = [
        {
            id: 'square-2d',
            name: '二维正方晶格',
            description: '经典的二维声子晶体，展示完整带隙',
            materialParams: {
                matrixModulus: 1,
                scattererModulus: 10,
                matrixDensity: 1,
                scattererDensity: 8
            },
            geometryParams: {
                latticeType: 'square',
                fillingFraction: 0.35,
                scattererShape: 'circle',
                latticeConstant: 1
            }
        },
        {
            id: 'diamond-3d',
            name: '三维金刚石结构',
            description: '具有宽带隙的三维声子晶体',
            materialParams: {
                matrixModulus: 1,
                scattererModulus: 15,
                matrixDensity: 1,
                scattererDensity: 12
            },
            geometryParams: {
                latticeType: 'diamond',
                fillingFraction: 0.25,
                scattererShape: 'sphere',
                latticeConstant: 1
            }
        },
        {
            id: 'gradient-index',
            name: '梯度折射率透镜',
            description: '具有梯度材料参数的声子透镜',
            materialParams: {
                matrixModulus: 1,
                scattererModulus: 5,
                matrixDensity: 1,
                scattererDensity: 4
            },
            geometryParams: {
                latticeType: 'square',
                fillingFraction: 0.4,
                scattererShape: 'circle',
                latticeConstant: 1
            }
        },
        {
            id: 'topological-edge',
            name: '拓扑边界态',
            description: '展示受拓扑保护的边界态',
            materialParams: {
                matrixModulus: 1,
                scattererModulus: 8,
                matrixDensity: 1,
                scattererDensity: 6
            },
            geometryParams: {
                latticeType: 'hexagonal',
                fillingFraction: 0.3,
                scattererShape: 'circle',
                latticeConstant: 1
            }
        }
    ];

    async function calculateBandgap() {
        isCalculating = true;
        animationProgress = 0;
        
        const animateInterval = setInterval(() => {
            animationProgress += 0.02;
            if (animationProgress >= 1) {
                clearInterval(animateInterval);
            }
        }, 50);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            simulationResult = BandgapCalculator.calculate(materialParams, geometryParams);
        } finally {
            isCalculating = false;
            animationProgress = 1;
        }
    }

    function applyPreset(preset: Preset) {
        materialParams = { ...preset.materialParams };
        geometryParams = { ...preset.geometryParams };
        simulationResult = null;
        animationProgress = 0;
    }

    onMount(() => {
        calculateBandgap();
    });
</script>

<div class="app-container">
    <header class="header">
        <h1>🔬 声子带隙计算与优化系统</h1>
        <p class="subtitle">Phononic Bandgap Designer - 基于有限元法的周期性弹性结构分析</p>
    </header>

    <PresetSelector {presets} onSelect={applyPreset} />

    <div class="main-content">
        <div class="left-panel">
            <ControlPanel
                bind:materialParams
                bind:geometryParams
                onCalculate={calculateBandgap}
                {isCalculating}
                {animationProgress}
            />
        </div>

        <div class="center-panel">
            <div class="tab-buttons">
                <button 
                    class:active={activeTab === 'structure'} 
                    on:click={() => activeTab = 'structure'}
                >
                    📐 晶格结构
                </button>
                <button 
                    class:active={activeTab === 'brillouin'} 
                    on:click={() => activeTab = 'brillouin'}
                >
                    💠 布里渊区
                </button>
                <button 
                    class:active={activeTab === 'mode'} 
                    on:click={() => activeTab = 'mode'}
                >
                    🎵 本征模态
                </button>
                <button 
                    class:active={activeTab === 'wave'} 
                    on:click={() => activeTab = 'wave'}
                >
                    🌊 波传播
                </button>
            </div>

            <div class="visualization-area">
                {#if activeTab === 'structure'}
                    <Scene3D {geometryParams} {materialParams} />
                {:else if activeTab === 'brillouin'}
                    <BrillouinZone {simulationResult} {animationProgress} />
                {:else if activeTab === 'mode'}
                    <EigenModeVisualizer {simulationResult} bind:selectedModeIndex {animationProgress} />
                {:else if activeTab === 'wave'}
                    <WavePropagation {simulationResult} {geometryParams} {animationProgress} />
                {/if}
            </div>
        </div>

        <div class="right-panel">
            <div class="panel-section">
                <h3>📊 能带结构</h3>
                <BandStructureChart {simulationResult} {animationProgress} />
            </div>
            
            {#if simulationResult?.bandGaps && simulationResult.bandGaps.length > 0}
                <div class="panel-section bandgap-info">
                    <h3>🎯 带隙分析结果</h3>
                    {#each simulationResult.bandGaps as gap, i}
                        <div class="bandgap-item">
                            <span class="bandgap-label">带隙 {i + 1}:</span>
                            <span class="bandgap-range">
                                {gap.startFrequency.toFixed(3)} - {gap.endFrequency.toFixed(3)} ωa/(2πc)
                            </span>
                            <div class="bandgap-bar">
                                <div class="bandgap-fill" style="width: {gap.normalizedWidth * 100}%"></div>
                            </div>
                            <span class="bandgap-width">归一化宽度: {(gap.normalizedWidth * 100).toFixed(1)}%</span>
                        </div>
                    {/each}
                </div>
            {/if}

            {#if simulationResult}
                <div class="panel-section">
                    <h3>📈 物理现象展示</h3>
                    <div class="phenomenon-item">
                        <span class="phenomenon-label">杂散能带交叉:</span>
                        <span class="phenomenon-status present">✓ 可见</span>
                    </div>
                    <div class="phenomenon-item">
                        <span class="phenomenon-label">数值奇异性:</span>
                        <span class="phenomenon-status present">✓ 高填充率下</span>
                    </div>
                    <div class="phenomenon-item">
                        <span class="phenomenon-label">带边频率偏移:</span>
                        <span class="phenomenon-status present">✓ 有限尺寸效应</span>
                    </div>
                    <div class="phenomenon-item">
                        <span class="phenomenon-label">能带简并解除:</span>
                        <span class="phenomenon-status present">✓ 各向异性材料</span>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .app-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        overflow: hidden;
    }

    .header {
        padding: 15px 30px;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    }

    .header h1 {
        font-size: 1.5rem;
        margin: 0;
        background: linear-gradient(90deg, #00d4ff, #7b2ff7, #f107a3);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subtitle {
        font-size: 0.85rem;
        color: #888;
        margin: 5px 0 0 0;
    }

    .main-content {
        display: flex;
        flex: 1;
        gap: 15px;
        padding: 15px;
        overflow: hidden;
    }

    .left-panel {
        width: 280px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .center-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .right-panel {
        width: 380px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        overflow-y: auto;
    }

    .tab-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
    }

    .tab-buttons button {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: #aaa;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tab-buttons button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    .tab-buttons button.active {
        background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%);
        color: white;
        border-color: transparent;
    }

    .visualization-area {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
    }

    .panel-section {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .panel-section h3 {
        font-size: 0.95rem;
        margin: 0 0 12px 0;
        color: #00d4ff;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .bandgap-info {
        background: linear-gradient(135deg, rgba(123, 47, 247, 0.1) 0%, rgba(241, 7, 163, 0.1) 100%);
    }

    .bandgap-item {
        padding: 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        margin-bottom: 10px;
    }

    .bandgap-label {
        font-weight: 600;
        color: #fff;
        display: block;
        margin-bottom: 5px;
    }

    .bandgap-range {
        font-size: 0.8rem;
        color: #aaa;
        display: block;
        margin-bottom: 8px;
    }

    .bandgap-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 5px;
    }

    .bandgap-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #7b2ff7);
        border-radius: 4px;
        transition: width 0.5s ease;
    }

    .bandgap-width {
        font-size: 0.75rem;
        color: #00d4ff;
        font-weight: 500;
    }

    .phenomenon-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .phenomenon-item:last-child {
        border-bottom: none;
    }

    .phenomenon-label {
        font-size: 0.85rem;
        color: #ccc;
    }

    .phenomenon-status {
        font-size: 0.8rem;
        font-weight: 500;
    }

    .phenomenon-status.present {
        color: #4ade80;
    }

    .left-panel::-webkit-scrollbar,
    .right-panel::-webkit-scrollbar {
        width: 6px;
    }

    .left-panel::-webkit-scrollbar-track,
    .right-panel::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
    }

    .left-panel::-webkit-scrollbar-thumb,
    .right-panel::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
</style>
