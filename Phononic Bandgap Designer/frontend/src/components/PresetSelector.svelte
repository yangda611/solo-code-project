<script lang="ts">
    import type { Preset } from '../types';

    export let presets: Preset[];
    export let onSelect: (preset: Preset) => void;
</script>

<div class="preset-selector">
    <div class="preset-header">
        <h3>🎯 快速预设</h3>
        <span class="preset-hint">点击加载预设场景</span>
    </div>
    <div class="preset-grid">
        {#each presets as preset}
            <button class="preset-card" on:click={() => onSelect(preset)}>
                <div class="preset-icon">
                    {#if preset.id === 'square-2d'}
                        ⬜
                    {:else if preset.id === 'diamond-3d'}
                        💎
                    {:else if preset.id === 'gradient-index'}
                        🔮
                    {:else if preset.id === 'topological-edge'}
                        🌀
                    {:else}
                        📦
                    {/if}
                </div>
                <div class="preset-info">
                    <span class="preset-name">{preset.name}</span>
                    <span class="preset-description">{preset.description}</span>
                </div>
            </button>
        {/each}
    </div>
</div>

<style>
    .preset-selector {
        padding: 15px 30px;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .preset-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .preset-header h3 {
        margin: 0;
        font-size: 1rem;
        color: #00d4ff;
    }

    .preset-hint {
        font-size: 0.8rem;
        color: #666;
    }

    .preset-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
    }

    .preset-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
    }

    .preset-card:hover {
        background: rgba(123, 47, 247, 0.15);
        border-color: rgba(123, 47, 247, 0.4);
        transform: translateY(-2px);
    }

    .preset-icon {
        font-size: 1.5rem;
    }

    .preset-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .preset-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #fff;
    }

    .preset-description {
        font-size: 0.7rem;
        color: #888;
    }
</style>
