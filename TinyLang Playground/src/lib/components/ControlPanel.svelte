<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let {
		isRunning,
		isPaused,
		hasErrors
	}: {
		isRunning: boolean;
		isPaused: boolean;
		hasErrors: boolean;
	} = $props();

	const dispatch = createEventDispatcher();
</script>

<div class="control-panel">
	<button
		class="btn btn-icon"
		title="解析代码 (Parse)"
		onclick={() => dispatch('parse')}
		disabled={isRunning && !isPaused}
	>
		<svg class="icon" viewBox="0 0 24 24">
			<path
				d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
			/>
		</svg>
	</button>

	<div class="divider"></div>

	{#if !isRunning}
		<button
			class="btn btn-icon btn-primary"
			title="运行 (Run)"
			onclick={() => dispatch('run')}
			disabled={hasErrors}
		>
			<svg class="icon" viewBox="0 0 24 24">
				<path d="M8 5v14l11-7z" />
			</svg>
		</button>
	{:else if isPaused}
		<button
			class="btn btn-icon btn-primary"
			title="继续 (Resume)"
			onclick={() => dispatch('resume')}
		>
			<svg class="icon" viewBox="0 0 24 24">
				<path d="M8 5v14l11-7z" />
			</svg>
		</button>
	{:else}
		<button
			class="btn btn-icon"
			title="暂停 (Pause)"
			onclick={() => dispatch('pause')}
		>
			<svg class="icon" viewBox="0 0 24 24">
				<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
			</svg>
		</button>
	{/if}

	<button
		class="btn btn-icon"
		title="单步执行 (Step)"
		onclick={() => dispatch('step')}
		disabled={isRunning && !isPaused}
	>
		<svg class="icon" viewBox="0 0 24 24">
			<path
				d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
			/>
		</svg>
	</button>

	<button
		class="btn btn-icon btn-danger"
		title="停止 (Stop)"
		onclick={() => dispatch('stop')}
		disabled={!isRunning && !isPaused}
	>
		<svg class="icon" viewBox="0 0 24 24">
			<path d="M6 6h12v12H6z" />
		</svg>
	</button>

	<div class="divider"></div>

	<button
		class="btn btn-icon"
		title="重置 (Reset)"
		onclick={() => dispatch('reset')}
	>
		<svg class="icon" viewBox="0 0 24 24">
			<path
				d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
			/>
		</svg>
	</button>

	<div class="status-indicator">
		<span class="status-dot" class:running={isRunning} class:paused={isPaused}></span>
		<span class="status-text">
			{#if isRunning && !isPaused}
				运行中
			{:else if isPaused}
				已暂停
			{:else}
				就绪
			{/if}
		</span>
	</div>
</div>

<style>
	.control-panel {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.divider {
		width: 1px;
		height: 24px;
		background-color: var(--border-color);
		margin: 0 4px;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: 12px;
		padding: 6px 12px;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius-sm);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--text-muted);
		transition: all var(--transition-fast);
	}

	.status-dot.running {
		background-color: var(--accent-green);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.status-dot.paused {
		background-color: var(--accent-yellow);
	}

	.status-text {
		font-size: 12px;
		color: var(--text-secondary);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
