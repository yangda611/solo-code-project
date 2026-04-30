<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Preset } from '$lib/presets';

	let { presets, selectedPreset = null }: { presets: Preset[]; selectedPreset?: Preset | null } =
		$props();

	const dispatch = createEventDispatcher();

	function getCategoryIcon(category: string): string {
		switch (category) {
			case 'algorithm':
				return '🔢';
			case 'error':
				return '⚠️';
			case 'feature':
				return '✨';
			default:
				return '📄';
		}
	}
</script>

<div class="preset-selector">
	<span class="label">预设程序:</span>
	<div class="preset-buttons">
		{#each presets as preset}
			<button
				class="preset-btn"
				class:selected={selectedPreset?.id === preset.id}
				onclick={() => dispatch('select', preset)}
				title={preset.description}
			>
				<span class="icon">{getCategoryIcon(preset.category)}</span>
				<span class="name">{preset.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.preset-selector {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 20px;
		background-color: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		overflow-x: auto;
		flex-shrink: 0;
	}

	.label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		flex-shrink: 0;
	}

	.preset-buttons {
		display: flex;
		gap: 8px;
	}

	.preset-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-family: var(--font-sans);
		font-size: 13px;
		color: var(--text-primary);
		background-color: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.preset-btn:hover {
		background-color: var(--bg-hover);
		border-color: var(--text-muted);
	}

	.preset-btn.selected {
		background-color: var(--accent-blue);
		border-color: var(--accent-blue);
		color: white;
	}

	.icon {
		font-size: 14px;
	}

	.name {
		font-weight: 500;
	}
</style>
