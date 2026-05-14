<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    import annotationPlugin from 'chartjs-plugin-annotation';
    import type { SimulationResult, BandGap } from '../types';

    export let simulationResult: SimulationResult | null;
    export let animationProgress: number;

    let canvas: HTMLCanvasElement;
    let chart: Chart;
    let animationFrameId: number;
    let localProgress = 0;

    Chart.register(...registerables, annotationPlugin);

    function getBandColors() {
        return [
            'rgba(123, 47, 247, 1)',
            'rgba(241, 7, 163, 1)',
            'rgba(0, 212, 255, 1)',
            'rgba(74, 222, 128, 1)',
            'rgba(250, 204, 21, 1)',
            'rgba(248, 113, 113, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(59, 130, 246, 1)'
        ];
    }

    function createChart() {
        if (!simulationResult) return;

        const bandColors = getBandColors();
        const numBands = Math.max(...simulationResult.bandData.map(d => d.bandIndex)) + 1;
        const datasets = [];

        for (let bandIndex = 0; bandIndex < numBands; bandIndex++) {
            const bandData = simulationResult.bandData.filter(d => d.bandIndex === bandIndex);
            datasets.push({
                label: `能带 ${bandIndex + 1}`,
                data: bandData.map(d => ({ x: d.k, y: d.frequency })),
                borderColor: bandColors[bandIndex % bandColors.length],
                backgroundColor: bandColors[bandIndex % bandColors.length].replace('1)', '0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4
            });
        }

        const annotations: any = {};
        simulationResult.bandGaps.forEach((gap: BandGap, index: number) => {
            annotations[`bandgap${index}`] = {
                type: 'box',
                xMin: 0,
                xMax: 1,
                yMin: gap.startFrequency,
                yMax: gap.endFrequency,
                backgroundColor: 'rgba(241, 7, 163, 0.15)',
                borderColor: 'rgba(241, 7, 163, 0.5)',
                borderWidth: 1,
                drawTime: 'beforeDatasetsDraw'
            };
        });

        const highSymmetryLabels = simulationResult.highSymmetryPath.map(p => p.name);
        const highSymmetryPositions = simulationResult.highSymmetryPath.map((_, i) => i / (highSymmetryLabels.length - 1));

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(canvas, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.9)',
                        titleColor: '#00d4ff',
                        bodyColor: '#ccc',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                            title: (items) => {
                                if (items.length > 0) {
                                    const k = items[0].parsed.x;
                                    const labelIndex = highSymmetryPositions.findIndex((p, i) => {
                                        const nextP = highSymmetryPositions[i + 1] || 1;
                                        return k >= p && k <= nextP;
                                    });
                                    return `k: ${k.toFixed(3)}`;
                                }
                                return '';
                            },
                            label: (item) => {
                                return `频率: ${item.parsed.y.toFixed(4)} ωa/(2πc)`;
                            }
                        }
                    },
                    annotation: {
                        annotations
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: 1,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#888',
                            font: { size: 10 },
                            callback: function(value, index) {
                                const posIndex = highSymmetryPositions.findIndex(p => Math.abs(p - value) < 0.01);
                                return posIndex >= 0 ? highSymmetryLabels[posIndex] : '';
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: Math.max(...simulationResult.bandData.map(d => d.frequency)) * 1.1,
                        title: {
                            display: true,
                            text: 'ωa/(2πc)',
                            color: '#00d4ff',
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#888',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    function animateChart() {
        if (!chart || !simulationResult) return;

        const progress = Math.min(localProgress, animationProgress);
        const numPoints = chart.data.datasets[0].data.length;
        const visiblePoints = Math.floor(numPoints * progress);

        chart.data.datasets.forEach((dataset, bandIndex) => {
            const originalData = simulationResult.bandData.filter(d => d.bandIndex === bandIndex);
            dataset.data = originalData.slice(0, visiblePoints).map(d => ({ x: d.k, y: d.frequency }));
        });

        const annotations: any = {};
        simulationResult.bandGaps.forEach((gap: BandGap, index: number) => {
            if (progress > 0.8) {
                annotations[`bandgap${index}`] = {
                    type: 'box',
                    xMin: 0,
                    xMax: 1 * (progress - 0.8) * 5,
                    yMin: gap.startFrequency,
                    yMax: gap.endFrequency,
                    backgroundColor: 'rgba(241, 7, 163, 0.15)',
                    borderColor: 'rgba(241, 7, 163, 0.5)',
                    borderWidth: 1,
                    drawTime: 'beforeDatasetsDraw'
                };
            }
        });

        (chart.options.plugins as any).annotation.annotations = annotations;
        chart.update('none');

        localProgress += 0.02;
        if (localProgress < 1) {
            animationFrameId = requestAnimationFrame(animateChart);
        }
    }

    $: if (simulationResult && canvas) {
        localProgress = 0;
        createChart();
        animateChart();
    }

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (chart) {
            chart.destroy();
        }
    });
</script>

<div class="chart-container">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    .chart-container {
        width: 100%;
        height: 280px;
        position: relative;
    }
</style>
