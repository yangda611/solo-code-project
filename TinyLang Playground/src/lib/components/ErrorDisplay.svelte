<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { TinyLangError } from '$lib/tinylang/types';

	let {
		currentError
	}: {
		currentError: TinyLangError;
	} = $props();

	const dispatch = createEventDispatcher();

	function getErrorIcon(type: string): string {
		switch (type) {
			case 'lexer':
				return '🔍';
			case 'parser':
				return '📊';
			case 'runtime':
				return '⚡';
			default:
				return '❌';
		}
	}

	function getErrorTitle(type: string): string {
		switch (type) {
			case 'lexer':
				return '词法分析错误';
			case 'parser':
				return '语法分析错误';
			case 'runtime':
				return '运行时错误';
			default:
				return '错误';
		}
	}
</script>

<div
	class="error-display-overlay"
	role="button"
	tabindex="0"
	onclick={(e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			dispatch('dismiss');
		}
	}}
	onkeydown={(e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			dispatch('dismiss');
		}
	}}
>
	<div class="error-display">
		<div class="error-header">
			<div class="error-icon">{getErrorIcon(currentError.type)}</div>
			<div class="error-info">
				<h3 class="error-title">{getErrorTitle(currentError.type)}</h3>
				<p class="error-location">
					位置: 第 <span class="highlight">{currentError.line}</span> 行, 第
					<span class="highlight">{currentError.column}</span> 列
				</p>
			</div>
			<button class="close-btn btn btn-icon" onclick={() => dispatch('dismiss')} title="关闭">
				<svg class="icon" viewBox="0 0 24 24">
					<path
						d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
					/>
				</svg>
			</button>
		</div>

		<div class="error-body">
			<div class="error-message-container">
				<span class="message-label">错误信息:</span>
				<p class="error-message">{currentError.message}</p>
			</div>

			<div class="error-hint">
				<svg class="icon" viewBox="0 0 24 24">
					<path
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
					/>
				</svg>
				<p>请检查代码并重新运行</p>
			</div>
		</div>

		<div class="error-actions">
			<button class="btn btn-primary" onclick={() => dispatch('dismiss')}>
				确定
			</button>
		</div>
	</div>
</div>

<style>
	.error-display-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fade-in 0.2s ease-out;
	}

	.error-display {
		background-color: var(--bg-secondary);
		border: 1px solid var(--accent-red);
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 500px;
		margin: 20px;
		box-shadow: var(--shadow-lg);
		animation: error-shake 0.5s ease-in-out;
	}

	.error-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border-color);
	}

	.error-icon {
		font-size: 40px;
		line-height: 1;
		flex-shrink: 0;
	}

	.error-info {
		flex: 1;
		min-width: 0;
	}

	.error-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--accent-red);
		margin-bottom: 4px;
	}

	.error-location {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.error-location .highlight {
		color: var(--accent-orange);
		font-weight: 600;
		font-family: var(--font-mono);
	}

	.close-btn {
		flex-shrink: 0;
	}

	.error-body {
		padding: 20px;
	}

	.error-message-container {
		margin-bottom: 16px;
	}

	.message-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 8px;
	}

	.error-message {
		font-family: var(--font-mono);
		font-size: 14px;
		line-height: 1.5;
		color: var(--text-primary);
		background-color: var(--bg-tertiary);
		padding: 12px 16px;
		border-radius: var(--radius-sm);
		border-left: 3px solid var(--accent-red);
		word-break: break-word;
	}

	.error-hint {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
	}

	.error-hint .icon {
		width: 20px;
		height: 20px;
		fill: var(--accent-yellow);
		flex-shrink: 0;
	}

	.error-hint p {
		font-size: 13px;
	}

	.error-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 20px;
		padding-top: 0;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
