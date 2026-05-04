<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    currentState, 
    loadPresets, 
    loadCurrentState, 
    switchPreset,
    activePreset,
    activeAlerts,
    activeDevices,
    activeWaterParams,
    loading,
    hasCriticalAlerts
  } from '$lib/stores';
  import type { AquariumScene } from '$lib/utils/aquariumScene';
  import { triggerFeeding } from '$lib/utils/aquariumScene';
  import AquariumSceneComponent from '$lib/components/AquariumScene.svelte';
  import PresetSelector from '$lib/components/PresetSelector.svelte';
  import StatusPanel from '$lib/components/StatusPanel.svelte';
  import AlertPanel from '$lib/components/AlertPanel.svelte';

  let aquariumScene: AquariumScene | null = null;
  let autoRefresh: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    await loadPresets();
    await loadCurrentState();

    autoRefresh = setInterval(async () => {
      try {
        await loadCurrentState();
      } catch (err) {
        console.error('Failed to refresh state:', err);
      }
    }, 5000);
  });

  function onSceneReady(scene: AquariumScene) {
    aquariumScene = scene;
  }

  async function handleFeed() {
    if (aquariumScene) {
      triggerFeeding(aquariumScene);
    }
  }

  async function handleRefresh() {
    if (!$loading) {
      await loadCurrentState();
    }
  }
</script>

<svelte:head>
  <title>AquaBiome Console - 水族馆生态维护后台</title>
</svelte:head>

<div class="app-container" class:has-critical={$hasCriticalAlerts}>
  <header class="app-header">
    <div class="logo-section">
      <h1 class="app-title">
        <span class="logo-icon">🐠</span>
        AquaBiome Console
      </h1>
      <span class="app-subtitle">水族馆生态维护后台</span>
    </div>
    
    <div class="header-actions">
      <PresetSelector activePreset={$activePreset} />
      
      <div class="action-buttons">
        <button 
          class="action-btn refresh-btn"
          on:click={handleRefresh}
          disabled={$loading}
          title="刷新状态"
        >
          <svg class="icon {$loading ? 'spinning' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <button 
          class="action-btn feed-btn"
          on:click={handleFeed}
          title="立即投喂"
        >
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>投喂</span>
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="left-panel">
      <div class="scene-wrapper">
        {#if $currentState}
          <AquariumSceneComponent 
            state={$currentState}
            onSceneReady={onSceneReady}
          />
        {:else if $loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
        {:else}
          <div class="empty-scene">
            <span class="empty-icon">🌊</span>
            <span>等待数据加载...</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="right-panel">
      <div class="status-section">
        {#if $currentState}
          <StatusPanel 
            devices={$activeDevices} 
            waterParams={$activeWaterParams}
          />
        {/if}
      </div>
      
      <div class="alert-section">
        <AlertPanel alerts={$activeAlerts} />
      </div>
    </div>
  </main>

  {#if $hasCriticalAlerts}
    <div class="critical-alert-banner">
      <span class="banner-icon">🚨</span>
      <span class="banner-text">检测到严重异常，请立即处理！</span>
    </div>
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    overflow: hidden;
    position: relative;
  }

  .app-container.has-critical {
    animation: background-pulse 2s ease-in-out infinite;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    border-bottom: 1px solid rgba(71, 85, 105, 0.5);
    backdrop-filter: blur(10px);
    z-index: 100;
  }

  .logo-section {
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }

  .app-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #e2e8f0;
    background: linear-gradient(90deg, #0ea5e9, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .app-subtitle {
    font-size: 0.75rem;
    color: #64748b;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .refresh-btn {
    background: rgba(71, 85, 105, 0.3);
    color: #e2e8f0;
    border-color: rgba(71, 85, 105, 0.5);
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(100, 116, 139, 0.3);
  }

  .feed-btn {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
  }

  .feed-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  }

  .icon {
    width: 1rem;
    height: 1rem;
  }

  .icon.spinning {
    animation: spin 1s linear infinite;
  }

  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .scene-wrapper {
    flex: 1;
    min-height: 0;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(71, 85, 105, 0.3);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: #64748b;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(71, 85, 105, 0.3);
    border-top-color: #0ea5e9;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .empty-scene {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: hidden;
  }

  .status-section {
    flex: 0 0 auto;
    max-height: 50%;
    overflow-y: auto;
  }

  .alert-section {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .critical-alert-banner {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: linear-gradient(90deg, rgba(244, 63, 94, 0.9), rgba(225, 29, 72, 0.9));
    color: white;
    font-weight: 600;
    animation: banner-slide 0.3s ease-out;
    z-index: 200;
  }

  .banner-icon {
    font-size: 1.25rem;
  }

  .banner-text {
    font-size: 0.875rem;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes background-pulse {
    0%, 100% {
      background: linear-gradient(180deg, #1a0f1a 0%, #2d1f2d 100%);
    }
    50% {
      background: linear-gradient(180deg, #1a0f1a 0%, #3d1f2d 100%);
    }
  }

  @keyframes banner-slide {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
