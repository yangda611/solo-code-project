<script lang="ts">
    import { onMount, tick } from 'svelte';
    import type { EvolutionResult } from './types';

    export let simulationResult: EvolutionResult | null;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let animationProgress = 0;

    function drawChart() {
        if (!simulationResult || !ctx) return;

        const data = simulationResult.entropyTrajectory;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(10, 20, 40, 0.9)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height - 2 * padding) * i / 4;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        if (data.length < 2) return;

        const maxEntropy = Math.max(...data.map(d => d.entropy), 1);
        const xScale = (width - 2 * padding) / (data.length - 1);
        const visiblePoints = Math.floor(data.length * animationProgress);

        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(136, 204, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(68, 136, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 102, 68, 0.6)');

        ctx.beginPath();
        ctx.moveTo(
            padding,
            height - padding - data[0].entropy / maxEntropy * (height - 2 * padding)
        );

        for (let i = 1; i < visiblePoints; i++) {
            const x = padding + i * xScale;
            const y = height - padding - data[i].entropy / maxEntropy * (height - 2 * padding);
            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        for (let i = 0; i < visiblePoints; i++) {
            if (i % 10 === 0) {
                const x = padding + i * xScale;
                const y = height - padding - data[i].entropy / maxEntropy * (height - 2 * padding);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(136, 204, 255, 0.9)';
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(136, 204, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        ctx.fillStyle = '#8cf';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('时间步', width / 2, height - 10);

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('冯诺依曼熵', 0, 0);
        ctx.restore();
    }

    function animate() {
        if (animationProgress < 1) {
            animationProgress = Math.min(1, animationProgress + 0.02);
            drawChart();
            requestAnimationFrame(animate);
        }
    }

    onMount(() => {
        ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawChart();
    });

    $: if (simulationResult) {
        animationProgress = 0;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        animate();
    }
</script>

<canvas bind:this={canvas} class="entropy-canvas"></canvas>

<style>
    .entropy-canvas {
        width: 100%;
        height: 100%;
        min-height: 200px;
        flex: 1;
        border-radius: 0.5rem;
    }
</style>
