<script lang="ts">
    import { onMount } from 'svelte';
    import BlochSphere from '$lib/BlochSphere.svelte';
    import HilbertSpace from '$lib/HilbertSpace.svelte';
    import ControlPanel from '$lib/ControlPanel.svelte';
    import ProbabilityBars from '$lib/ProbabilityBars.svelte';
    import EntropyChart from '$lib/EntropyChart.svelte';
    import type { QuantumCircuit, NoiseParameters, EvolutionResult } from '$lib/types';

    let circuit: QuantumCircuit | null = null;
    let simulationResult: EvolutionResult | null = null;
    let noiseParams: NoiseParameters = {
        decoherenceRate: 0.1,
        calibrationError: 0.01,
        crosstalkCoupling: 0.05,
        measurementBasisError: 0.02,
        temperature: 300
    };
    let isSimulating = false;
    let presets: Array<{id: string; name: string; description: string}> = [];

    const API_BASE = 'http://localhost:3001';

    onMount(async () => {
        try {
            const response = await fetch(`${API_BASE}/presets`);
            presets = await response.json();
        } catch (e) {
            console.error('Failed to load presets:', e);
        }
    });

    async function loadPreset(presetId: string) {
        try {
            const response = await fetch(`${API_BASE}/presets/${presetId}`);
            circuit = await response.json();
            simulationResult = null;
        } catch (e) {
            console.error('Failed to load preset:', e);
        }
    }

    async function runSimulation() {
        if (!circuit) return;
        
        isSimulating = true;
        try {
            const response = await fetch(`${API_BASE}/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qubitCount: circuit.qubitCount,
                    gates: circuit.gates,
                    noiseParams: {
                        decoherence_rate: noiseParams.decoherenceRate,
                        calibration_error: noiseParams.calibrationError,
                        crosstalk_coupling: noiseParams.crosstalkCoupling,
                        measurement_basis_error: noiseParams.measurementBasisError,
                        temperature: noiseParams.temperature
                    },
                    steps: 100,
                    dt: 0.01
                })
            });
            simulationResult = await response.json();
        } catch (e) {
            console.error('Simulation failed:', e);
        } finally {
            isSimulating = false;
        }
    }
</script>

<main class="app-container">
    <header>
        <h1>量子纠缠态演化与测量模拟实验室</h1>
        <div class="preset-buttons">
            {#each presets as preset}
                <button 
                    class="preset-btn" 
                    on:click={() => loadPreset(preset.id)}
                    title={preset.description}
                >
                    {preset.name}
                </button>
            {/each}
        </div>
    </header>

    <div class="main-content">
        <aside class="left-panel">
            <ControlPanel 
                bind:noiseParams={noiseParams}
                bind:circuit={circuit}
                {isSimulating}
                on:run={runSimulation}
            />
        </aside>

        <section class="visualization-area">
            <div class="visualization-row">
                <div class="visualization-card">
                    <h3>布洛赫球视图</h3>
                    <BlochSphere {circuit} {simulationResult} />
                </div>
                <div class="visualization-card">
                    <h3>希尔伯特空间视图</h3>
                    <HilbertSpace {circuit} {simulationResult} />
                </div>
            </div>
            
            <div class="visualization-row">
                <div class="visualization-card">
                    <h3>测量概率分布</h3>
                    <ProbabilityBars {simulationResult} />
                </div>
                <div class="visualization-card">
                    <h3>冯诺依曼熵演化</h3>
                    <EntropyChart {simulationResult} />
                </div>
            </div>
        </section>
    </div>
</main>

<style>
    .app-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a2a 100%);
        color: #e0e0ff;
        font-family: 'Segoe UI', system-ui, sans-serif;
    }

    header {
        padding: 1rem 2rem;
        background: rgba(0, 0, 30, 0.8);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(100, 150, 255, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        background: linear-gradient(90deg, #4af, #8cf, #4af);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .preset-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .preset-btn {
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, rgba(70, 130, 255, 0.3), rgba(130, 80, 255, 0.3));
        border: 1px solid rgba(100, 150, 255, 0.5);
        color: #8cf;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.85rem;
    }

    .preset-btn:hover {
        background: linear-gradient(135deg, rgba(70, 130, 255, 0.5), rgba(130, 80, 255, 0.5));
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(70, 130, 255, 0.3);
    }

    .main-content {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1rem;
        padding: 1rem;
        height: calc(100vh - 80px);
    }

    .left-panel {
        background: rgba(0, 0, 30, 0.6);
        border-radius: 1rem;
        padding: 1rem;
        border: 1px solid rgba(100, 150, 255, 0.2);
        overflow-y: auto;
    }

    .visualization-area {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: hidden;
    }

    .visualization-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        height: 50%;
    }

    .visualization-card {
        background: rgba(0, 0, 30, 0.6);
        border-radius: 1rem;
        padding: 1rem;
        border: 1px solid rgba(100, 150, 255, 0.2);
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .visualization-card h3 {
        margin: 0 0 0.5rem 0;
        color: #8cf;
        font-size: 1rem;
    }
</style>
