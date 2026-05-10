<script lang="ts">
    import { onMount, tick } from 'svelte';
    import type { EvolutionResult } from './types';

    export let simulationResult: EvolutionResult | null;

    let bars: HTMLDivElement;
    let animationFrame: number;
    let targetHeights: number[] = [];
    let currentHeights: number[] = [];

    function animateBars() {
        if (!simulationResult) return;

        const maxProb = Math.max(
            ...simulationResult.measurementProbabilities.map(p => p.probability)
        );
        
        targetHeights = simulationResult.measurementProbabilities.map(p => 
            maxProb > 0 ? (p.probability / maxProb) * 100 : 0
        );

        if (currentHeights.length === 0) {
            currentHeights = new Array(targetHeights.length).fill(0);
        }
    }

    function smoothAnimation() {
        let needsUpdate = false;
        
        currentHeights = currentHeights.map((current, i) => {
            const target = targetHeights[i] || 0;
            const diff = target - current;
            
            if (Math.abs(diff) > 0.1) {
                needsUpdate = true;
                return current + diff * 0.1;
            }
            return target;
        });

        if (needsUpdate) {
            animationFrame = requestAnimationFrame(smoothAnimation);
        }
    }

    $: if (simulationResult) {
        animateBars();
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(smoothAnimation);
    }
</script>

<div class="probability-container">
    {#if simulationResult && simulationResult.measurementProbabilities.length > 0}
        <div class="bars-container">
            {#each simulationResult.measurementProbabilities as prob, i}
                <div class="bar-wrapper" style="animation: bounce 0.5s ease-out" key={prob.bitstring}>
                    <div 
                        class="bar" 
                        style="height: {currentHeights[i] || 0}%;
                        background: linear-gradient(to top, 
                            hsl({200 + prob.probability * 120}, 80%, 50%),
                            hsl({200 + prob.probability * 120}, 80%, 30%
                        );
                        box-shadow: 0 0 20px hsla({200 + prob.probability * 120}, 80%, 60%, 0.5;">
                        <div class="bar-glow"></div>
                    </div>
                    <div class="bar-label">{prob.bitstring}</div>
                    <div class="bar-value">{(prob.probability * 100).toFixed(1)}%</div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="placeholder">
            <p>运行模拟以查看测量概率分布</p>
        </div>
    {/if}
</div>

<style>
    .probability-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .bars-container {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 8px;
        height: 100%;
        min-height: 200px;
        padding: 1rem;
        overflow-x: auto;
    }

    .bar-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 40px;
        height: 100%;
    }

    .bar {
        width: 100%;
        min-height: 4px;
        border-radius: 4px 4px 0 0;
        position: relative;
        overflow: hidden;
        transition: height 0.3s ease-out;
    }

    .bar-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
        border-radius: 4px 4px 0 0;
    }

    .bar-label {
        margin-top: 8px;
        font-size: 10px;
        font-family: monospace;
        color: #8cf;
    }

    .bar-value {
        font-size: 10px;
        color: #4cf;
        font-weight: bold;
    }

    .placeholder {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #668;
    }

    @keyframes bounce {
        0% { transform: scaleY(0); }
        50% { transform: scaleY(1.1); }
        100% { transform: scaleY(1); }
    }
</style>
