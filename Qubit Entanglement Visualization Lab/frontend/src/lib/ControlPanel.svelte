<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { QuantumCircuit, NoiseParameters } from './types';

    export let noiseParams: NoiseParameters;
    export let circuit: QuantumCircuit | null;
    export let isSimulating: boolean;

    const dispatch = createEventDispatcher();

    function getGateName(gate: any): string {
        if (typeof gate === 'string') return gate;
        if (gate.Rx) return `Rx(θ=${gate.Rx.theta.toFixed(2)})`;
        if (gate.Ry) return `Ry(θ=${gate.Ry.theta.toFixed(2)})`;
        if (gate.Rz) return `Rz(θ=${gate.Rz.theta.toFixed(2)})`;
        return 'Unknown';
    }
</script>

<div class="control-panel">
    <section class="panel-section">
        <h3>噪声参数配置</h3>
        
        <div class="slider-group">
            <label>
                <span>退相干速率 (γ)</span>
                <input type="range" min="0" max="2" step="0.01" bind:value={noiseParams.decoherenceRate}>
                <span class="value">{noiseParams.decoherenceRate.toFixed(2)}</span>
            </label>
        </div>
        
        <div class="slider-group">
            <label>
                <span>校准误差</span>
                <input type="range" min="0" max="0.2" step="0.001" bind:value={noiseParams.calibrationError}>
                <span class="value">{noiseParams.calibrationError.toFixed(3)}</span>
            </label>
        </div>
        
        <div class="slider-group">
            <label>
                <span>串扰耦合</span>
                <input type="range" min="0" max="0.5" step="0.01" bind:value={noiseParams.crosstalkCoupling}>
                <span class="value">{noiseParams.crosstalkCoupling.toFixed(2)}</span>
            </label>
        </div>
        
        <div class="slider-group">
            <label>
                <span>测量基偏差</span>
                <input type="range" min="0" max="0.1" step="0.001" bind:value={noiseParams.measurementBasisError}>
                <span class="value">{noiseParams.measurementBasisError.toFixed(3)}</span>
            </label>
        </div>
        
        <div class="slider-group">
            <label>
                <span>环境温度 (K)</span>
                <input type="range" min="0" max="1000" step="10" bind:value={noiseParams.temperature}>
                <span class="value">{noiseParams.temperature.toFixed(0)}</span>
            </label>
        </div>
    </section>

    {#if circuit}
        <section class="panel-section">
            <h3>电路信息: {circuit.name}</h3>
            <p class="circuit-info">量子比特数: {circuit.qubitCount}</p>
            <p class="circuit-info">门操作数: {circuit.gates.length}</p>
        </section>

        <section class="panel-section">
            <h3>门操作序列</h3>
            <div class="gate-list">
                {#each circuit.gates as gate, index}
                    <div class="gate-item">
                        <span class="gate-index">{index + 1}</span>
                        <span class="gate-name">{getGateName(gate.gateType)}</span>
                        <span class="gate-qubits">q[{gate.qubits.join(', ')}]</span>
                    </div>
                {/each}
            </div>
        </section>
    {/if}

    <button 
        class="run-btn" 
        class:simulating={isSimulating}
        disabled={!circuit || isSimulating}
        on:click={() => dispatch('run')}
    >
        {#if isSimulating}
            <span class="spinner"></span>
            模拟中...
        {:else if !circuit}
            请先加载预设
        {:else}
            运行模拟
        {/if}
    </button>
</div>

<style>
    .control-panel {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .panel-section {
        background: rgba(20, 30, 60, 0.5);
        border-radius: 0.75rem;
        padding: 1rem;
    }

    h3 {
        margin: 0 0 1rem 0;
        color: #8cf;
        font-size: 1rem;
        border-bottom: 1px solid rgba(100, 150, 255, 0.3);
        padding-bottom: 0.5rem;
    }

    .slider-group {
        margin-bottom: 1rem;
    }

    .slider-group label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .slider-group span:first-child {
        font-size: 0.9rem;
        color: #a0b0ff;
    }

    .slider-group input[type="range"] {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: linear-gradient(90deg, #246, #48f);
        appearance: none;
        cursor: pointer;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #8cf;
        box-shadow: 0 0 10px rgba(136, 204, 255, 0.5);
    }

    .value {
        font-family: monospace;
        color: #4cf;
        font-size: 0.9rem;
    }

    .circuit-info {
        margin: 0.5rem 0;
        color: #a0b0ff;
        font-size: 0.9rem;
    }

    .gate-list {
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .gate-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        background: rgba(40, 60, 100, 0.5);
        border-radius: 0.5rem;
        font-size: 0.85rem;
    }

    .gate-index {
        background: linear-gradient(135deg, #4af, #86f);
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: bold;
    }

    .gate-name {
        color: #8cf;
        font-family: monospace;
        flex: 1;
    }

    .gate-qubits {
        color: #a0f0ff;
        font-family: monospace;
    }

    .run-btn {
        margin-top: auto;
        padding: 1rem;
        background: linear-gradient(135deg, #4af, #86f);
        border: none;
        border-radius: 0.75rem;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .run-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(70, 130, 255, 0.5);
    }

    .run-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .run-btn.simulating {
        background: linear-gradient(135deg, #4a8, #6f8);
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
</style>
