<script lang="ts">
  import { presets, selectedPresetId, switchPreset, loading } from '$lib/stores';
  import type { Preset } from '$lib/types';

  export let activePreset: Preset | null = null;

  let isOpen = false;

  async function handleSelectPreset(preset: Preset) {
    if (preset.id !== activePreset?.id) {
      await switchPreset(preset.id);
    }
    isOpen = false;
  }
</script>

<div class="preset-selector" class:open={isOpen}>
  <button 
    class="selector-toggle"
    on:click={() => isOpen = !isOpen}
    disabled={$loading}
  >
    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
    <span class="current-preset">
      {$loading ? '加载中...' : (activePreset?.name || '选择预设')}
    </span>
    <svg class="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="dropdown-menu" on:click|stopPropagation>
      <div class="dropdown-header">
        <span>场景预设</span>
      </div>
      <div class="preset-list">
        {#each $presets as preset}
          <button
            class="preset-item"
            class:active={preset.id === activePreset?.id}
            on:click={() => handleSelectPreset(preset)}
            disabled={$loading}
          >
            <div class="preset-info">
              <span class="preset-name">{preset.name}</span>
              <span class="preset-desc">{preset.description}</span>
            </div>
            {#if preset.id === activePreset?.id}
              <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

{#if isOpen}
  <div class="backdrop" on:click={() => isOpen = false}></div>
{/if}

<style>
  .preset-selector {
    position: relative;
  }

  .selector-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: 0.5rem;
    color: #e2e8f0;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .selector-toggle:hover:not(:disabled) {
    background: rgba(51, 65, 85, 0.8);
    border-color: rgba(100, 116, 139, 0.5);
  }

  .selector-toggle:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #0ea5e9;
  }

  .current-preset {
    flex: 1;
    text-align: left;
    font-weight: 500;
  }

  .chevron {
    width: 1rem;
    height: 1rem;
    transition: transform 0.2s;
  }

  .open .chevron {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    min-width: 280px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: 0.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    backdrop-filter: blur(10px);
  }

  .dropdown-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .preset-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .preset-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #e2e8f0;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
    text-align: left;
  }

  .preset-item:hover:not(:disabled) {
    background: rgba(30, 41, 59, 0.8);
  }

  .preset-item.active {
    background: rgba(14, 165, 233, 0.1);
    border-left: 2px solid #0ea5e9;
  }

  .preset-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .preset-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .preset-desc {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .check-icon {
    width: 1rem;
    height: 1rem;
    color: #0ea5e9;
    flex-shrink: 0;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
  }
</style>
