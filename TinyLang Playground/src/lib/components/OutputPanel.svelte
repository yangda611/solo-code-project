<script lang="ts">
	import type { TinyLangError } from '$lib/tinylang/types';

	let {
		outputLines,
		currentError
	}: {
		outputLines: string[];
		currentError?: TinyLangError;
	} = $props();
</script>

<div class="output-panel panel">
	<div class="panel-header">
		<span>输出</span>
		<span class="line-count">{outputLines.length} 行</span>
	</div>
	<div class="panel-body output-body">
		{#if outputLines.length > 0 || currentError}
			<div class="output-lines">
				{#each outputLines as line, index}
					<div class="output-line">
						<span class="line-number">{index + 1}</span>
						<span class="line-content">{line}</span>
					</div>
				{/each}

				{#if currentError}
					<div class="output-line error-line">
						<span class="line-number error-marker">!</span>
						<span class="line-content">
							<span class="error-type">[{currentError.type.toUpperCase()}]</span>
							<span class="error-location">({currentError.line}:{currentError.column})</span>
							<span class="error-message">{currentError.message}</span>
						</span>
					</div>
				{/if}
			</div>
		{:else}
			<div class="empty-state">
				<svg class="icon" viewBox="0 0 24 24">
					<path
						d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
					/>
				</svg>
				<p>暂无输出</p>
				<p class="hint">运行代码以查看输出</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.output-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.output-body {
		flex: 1;
		overflow: auto;
		padding: 0;
		background-color: var(--bg-primary);
	}

	.output-lines {
		padding: 8px;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.5;
	}

	.output-line {
		display: flex;
		gap: 12px;
		padding: 2px 0;
	}

	.line-number {
		color: var(--text-muted);
		user-select: none;
		min-width: 24px;
		text-align: right;
		flex-shrink: 0;
	}

	.line-number.error-marker {
		color: var(--accent-red);
		font-weight: bold;
	}

	.line-content {
		flex: 1;
		color: var(--text-primary);
		word-break: break-word;
	}

	.error-line {
		background-color: rgba(241, 76, 76, 0.1);
		padding: 8px 4px;
		margin: 4px 0;
		border-left: 3px solid var(--accent-red);
		border-radius: var(--radius-sm);
		animation: error-shake 0.5s ease-in-out;
	}

	.error-type {
		color: var(--accent-red);
		font-weight: 600;
		margin-right: 8px;
	}

	.error-location {
		color: var(--text-muted);
		margin-right: 8px;
	}

	.error-message {
		color: var(--accent-red);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		text-align: center;
		padding: 20px;
	}

	.empty-state .icon {
		width: 48px;
		height: 48px;
		margin-bottom: 12px;
		fill: var(--text-muted);
		opacity: 0.5;
	}

	.empty-state p {
		font-size: 13px;
		margin: 4px 0;
	}

	.empty-state .hint {
		font-size: 11px;
		color: var(--text-muted);
	}
</style>
