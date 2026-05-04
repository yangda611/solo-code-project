<script lang="ts">
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';
  import type { AquariumScene } from '$lib/utils/aquariumScene';
  import { 
    createAquariumScene, 
    updateSceneFromConfig, 
    createFish,
    triggerFeeding,
    disposeScene,
    getSceneConfigFromState
  } from '$lib/utils/aquariumScene';
  import type { FullState, Device } from '$lib/types';

  export let state: FullState | null = null;
  export let onSceneReady?: (scene: AquariumScene) => void;

  let canvas: HTMLCanvasElement;
  let aquarium: AquariumScene | null = null;
  let isInitialized = false;

  onMount(() => {
    if (canvas && !isInitialized) {
      aquarium = createAquariumScene(canvas);
      isInitialized = true;
      
      if (onSceneReady && aquarium) {
        onSceneReady(aquarium);
      }

      if (state) {
        updateScene();
      }
    }
  });

  onDestroy(() => {
    if (aquarium) {
      disposeScene(aquarium);
    }
  });

  $: if (aquarium && state) {
    updateScene();
  }

  function updateScene() {
    if (!aquarium || !state) return;

    const config = getSceneConfigFromState(state.waterParams, state.devices);
    updateSceneFromConfig(aquarium, config);

    const totalFish = state.fish.reduce((sum, f) => sum + f.quantity, 0);
    createFish(aquarium, Math.min(totalFish, 10));
  }

  function handleFeeding() {
    if (aquarium) {
      triggerFeeding(aquarium);
    }
  }

  export { handleFeeding };
</script>

<div class="scene-container">
  <canvas bind:this={canvas} class="aquarium-canvas"></canvas>
  
  {#if state}
    <div class="scene-overlay">
      <div class="preset-indicator">
        <span class="preset-name">{state.preset.name}</span>
        {#if state.alerts.length > 0}
          <span class="alert-badge {state.alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning'}">
            {state.alerts.length}
          </span>
        {/if}
      </div>
      
      <div class="quick-stats">
        <div class="stat">
          <span class="stat-label">温度</span>
          <span class="stat-value {state.waterParams?.temperature > 28 ? 'warning' : ''}">
            {state.waterParams?.temperature?.toFixed(1)}°C
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">pH</span>
          <span class="stat-value {state.waterParams?.ph < 7.5 || state.waterParams?.ph > 8.5 ? 'warning' : ''}">
            {state.waterParams?.ph?.toFixed(1)}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">氧气</span>
          <span class="stat-value {state.waterParams?.oxygen < 5 ? 'danger' : ''}">
            {state.waterParams?.oxygen?.toFixed(1)} mg/L
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">透明度</span>
          <span class="stat-value {state.waterParams?.clarity < 50 ? 'warning' : ''}">
            {state.waterParams?.clarity?.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .scene-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .aquarium-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .scene-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 10;
  }

  .preset-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, transparent 100%);
  }

  .preset-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #e2e8f0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .alert-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    animation: pulse 2s ease-in-out infinite;
  }

  .alert-badge.warning {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
  }

  .alert-badge.critical {
    background: rgba(244, 63, 94, 0.2);
    color: #f43f5e;
    border: 1px solid rgba(244, 63, 94, 0.3);
    animation: pulse-fast 1s ease-in-out infinite;
  }

  .quick-stats {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.25rem 0.75rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 0.375rem;
    border: 1px solid rgba(71, 85, 105, 0.3);
  }

  .stat-label {
    font-size: 0.625rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .stat-value.warning {
    color: #fbbf24;
  }

  .stat-value.danger {
    color: #f43f5e;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @keyframes pulse-fast {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4);
    }
    50% {
      opacity: 0.8;
      box-shadow: 0 0 0 8px rgba(244, 63, 94, 0);
    }
  }
</style>
