<script lang="ts">
	import type { ASTNode } from '$lib/tinylang/types';

	let {
		currentStep,
		currentNode
	}: {
		currentStep: number;
		currentNode: ASTNode | null;
	} = $props();

	let currentType = $derived(currentNode?.type ?? 'idle');
	let currentLine = $derived(currentNode?.startLine ?? 0);

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'LetStatement':
				return '📝';
			case 'FunctionDeclaration':
				return '🔧';
			case 'ReturnStatement':
				return '↩️';
			case 'IfStatement':
				return '❓';
			case 'WhileStatement':
			case 'ForStatement':
				return '🔄';
			case 'BreakStatement':
				return '⏹️';
			case 'ContinueStatement':
				return '⏭️';
			case 'CallExpression':
				return '📞';
			case 'AssignmentExpression':
				return '✏️';
			case 'BinaryExpression':
				return '⚡';
			case 'UnaryExpression':
				return '🔢';
			case 'Identifier':
				return '🏷️';
			case 'NumberLiteral':
			case 'StringLiteral':
			case 'BooleanLiteral':
			case 'NullLiteral':
				return '💎';
			case 'ArrayLiteral':
				return '📦';
			default:
				return '📍';
		}
	}
</script>

<div class="execution-timeline panel">
	<div class="panel-header">
		<span>执行时间轴</span>
		<span class="step-counter">步骤: {currentStep}</span>
	</div>
	<div class="timeline-body">
		<div class="timeline-track">
			<div class="timeline-line"></div>

			<div class="timeline-marker current" class:active={currentNode !== null}>
				<div class="marker-icon">
					{getTypeIcon(currentType)}
				</div>
				<div class="marker-content">
					{#if currentNode}
						<div class="marker-title">{currentType}</div>
						<div class="marker-detail">
							行 {currentLine}
						</div>
					{:else}
						<div class="marker-title idle">等待执行...</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="timeline-controls">
			<div class="control-group">
				<span class="control-label">状态:</span>
				<span class="status-badge" class:active={currentNode !== null}>
					{#if currentNode}
						<span class="status-dot"></span>
						执行中
					{:else}
						<span class="status-dot idle"></span>
						等待
					{/if}
				</span>
			</div>

			<div class="control-group">
				<span class="control-label">当前节点:</span>
				<code class="node-type">{currentType}</code>
			</div>
		</div>
	</div>
</div>

<style>
	.execution-timeline {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.timeline-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 12px;
		gap: 12px;
	}

	.timeline-track {
		position: relative;
		padding: 0 20px;
		flex: 1;
		display: flex;
		align-items: center;
	}

	.timeline-line {
		position: absolute;
		left: 20px;
		right: 20px;
		height: 2px;
		background: linear-gradient(
			90deg,
			var(--bg-tertiary),
			var(--accent-blue),
			var(--bg-tertiary)
		);
		border-radius: 1px;
	}

	.timeline-marker {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		margin-left: auto;
		margin-right: auto;
		background-color: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 12px 16px;
		z-index: 2;
		transition: all var(--transition-normal);
	}

	.timeline-marker.active {
		border-color: var(--accent-blue);
		background-color: rgba(0, 122, 204, 0.1);
		animation: timeline-pulse 2s ease-in-out infinite;
	}

	.marker-icon {
		font-size: 28px;
		line-height: 1;
	}

	.marker-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.marker-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.marker-title.idle {
		color: var(--text-muted);
		font-weight: 400;
	}

	.marker-detail {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.timeline-controls {
		display: flex;
		gap: 24px;
		align-items: center;
		justify-content: center;
		padding-top: 8px;
		border-top: 1px solid var(--border-color);
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.control-label {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius-sm);
		font-size: 12px;
		color: var(--text-muted);
	}

	.status-badge.active {
		background-color: rgba(78, 201, 176, 0.1);
		color: var(--accent-green);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--accent-green);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.status-dot.idle {
		background-color: var(--text-muted);
		animation: none;
	}

	.node-type {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 4px 8px;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius-sm);
		color: var(--accent-blue);
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
