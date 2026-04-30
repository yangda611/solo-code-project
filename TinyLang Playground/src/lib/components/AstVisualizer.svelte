<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Program, ASTNode } from '$lib/tinylang/types';
	import { ASTNodeType } from '$lib/tinylang/types';

	let {
		ast,
		currentNode = null,
		expandedNodes = new Set<string>()
	}: {
		ast: Program | null;
		currentNode?: ASTNode | null;
		expandedNodes?: Set<string>;
	} = $props();

	const dispatch = createEventDispatcher();

	function getNodeId(node: ASTNode): string {
		return `${node.type}-${node.startLine}-${node.startColumn}`;
	}

	function isExpanded(node: ASTNode): boolean {
		return expandedNodes.has(getNodeId(node));
	}

	function isCurrentNode(node: ASTNode): boolean {
		if (!currentNode) return false;
		return (
			node.type === currentNode.type &&
			node.startLine === currentNode.startLine &&
			node.startColumn === currentNode.startColumn
		);
	}

	function toggleExpand(node: ASTNode): void {
		dispatch('toggle', getNodeId(node));
	}

	function getNodeColor(type: string): string {
		switch (type) {
			case ASTNodeType.PROGRAM:
				return 'var(--accent-purple)';
			case ASTNodeType.LET_STATEMENT:
			case ASTNodeType.FUNCTION_DECLARATION:
			case ASTNodeType.RETURN_STATEMENT:
				return 'var(--accent-yellow)';
			case ASTNodeType.IF_STATEMENT:
			case ASTNodeType.WHILE_STATEMENT:
			case ASTNodeType.FOR_STATEMENT:
			case ASTNodeType.BREAK_STATEMENT:
			case ASTNodeType.CONTINUE_STATEMENT:
				return 'var(--accent-orange)';
			case ASTNodeType.ASSIGNMENT_EXPRESSION:
			case ASTNodeType.BINARY_EXPRESSION:
			case ASTNodeType.UNARY_EXPRESSION:
				return 'var(--accent-green)';
			case ASTNodeType.CALL_EXPRESSION:
			case ASTNodeType.MEMBER_EXPRESSION:
				return 'var(--accent-blue)';
			case ASTNodeType.IDENTIFIER:
			case ASTNodeType.NUMBER_LITERAL:
			case ASTNodeType.STRING_LITERAL:
			case ASTNodeType.BOOLEAN_LITERAL:
			case ASTNodeType.NULL_LITERAL:
			case ASTNodeType.ARRAY_LITERAL:
				return 'var(--text-secondary)';
			default:
				return 'var(--text-primary)';
		}
	}

	function getNodeName(type: string): string {
		return type;
	}

	function getNodeValue(node: ASTNode): string | null {
		if ('name' in node && typeof node.name === 'string') {
			return node.name;
		}
		if ('value' in node && node.value !== undefined && node.value !== null) {
			return String(node.value);
		}
		if ('operator' in node && typeof node.operator === 'string') {
			return node.operator;
		}
		return null;
	}

	function hasChildren(node: ASTNode): boolean {
		return (
			('body' in node && Array.isArray(node.body) && node.body.length > 0) ||
			('params' in node && Array.isArray(node.params) && node.params.length > 0) ||
			('elements' in node && Array.isArray(node.elements) && node.elements.length > 0) ||
			('arguments' in node && Array.isArray(node.arguments) && node.arguments.length > 0) ||
			('left' in node && node.left !== undefined) ||
			('right' in node && node.right !== undefined) ||
			('callee' in node && node.callee !== undefined) ||
			('object' in node && node.object !== undefined) ||
			('property' in node && node.property !== undefined) ||
			('condition' in node && node.condition !== undefined) ||
			('consequent' in node && node.consequent !== undefined) ||
			('alternate' in node && node.alternate !== undefined) ||
			('expression' in node && node.expression !== undefined) ||
			('argument' in node && node.argument !== undefined) ||
			('init' in node && node.init !== undefined) ||
			('update' in node && node.update !== undefined)
		);
	}
</script>

<div class="ast-visualizer panel">
	<div class="panel-header">
		<span>AST 结构</span>
		<span class="node-count">
			{#if ast}
				已解析
			{:else}
				等待解析
			{/if}
		</span>
	</div>
	<div class="panel-body ast-tree">
		{#if ast}
			{#snippet renderNode(node: ASTNode, depth: number)}
				<div
					class="ast-node"
					class:expanded={isExpanded(node)}
					class:current={isCurrentNode(node)}
					class:has-children={hasChildren(node)}
					style="--depth: {depth}"
				>
					{#if hasChildren(node)}
						<div
							class="node-header"
							role="button"
							tabindex={0}
							onclick={() => toggleExpand(node)}
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleExpand(node);
								}
							}}
						>
							<span class="expand-icon">
								{isExpanded(node) ? '▼' : '▶'}
							</span>
							<span class="node-type" style="color: {getNodeColor(node.type)}">
								{getNodeName(node.type)}
							</span>
							{#if getNodeValue(node)}
								<span class="node-value">"{getNodeValue(node)}"</span>
							{/if}
							<span class="node-location">
								{node.startLine}:{node.startColumn}
							</span>
						</div>
					{:else}
						<div class="node-header">
							<span class="expand-icon spacer"></span>
							<span class="node-type" style="color: {getNodeColor(node.type)}">
								{getNodeName(node.type)}
							</span>
							{#if getNodeValue(node)}
								<span class="node-value">"{getNodeValue(node)}"</span>
							{/if}
							<span class="node-location">
								{node.startLine}:{node.startColumn}
							</span>
						</div>
					{/if}

					{#if hasChildren(node) && isExpanded(node)}
						<div class="node-children">
							{#if 'body' in node && Array.isArray(node.body)}
								{#each node.body as child}
									{#if child}
										{@render renderNode(child as ASTNode, depth + 1)}
									{/if}
								{/each}
							{/if}

							{#if 'name' in node && node.name && typeof node.name === 'object' && 'type' in node.name}
								{@render renderNode(node.name as ASTNode, depth + 1)}
							{/if}

							{#if 'value' in node && node.value && typeof node.value === 'object' && 'type' in node.value}
								{@render renderNode(node.value as ASTNode, depth + 1)}
							{/if}

							{#if 'expression' in node && node.expression}
								{@render renderNode(node.expression as ASTNode, depth + 1)}
							{/if}

							{#if 'condition' in node && node.condition}
								{@render renderNode(node.condition as ASTNode, depth + 1)}
							{/if}

							{#if 'consequent' in node && node.consequent}
								{@render renderNode(node.consequent as ASTNode, depth + 1)}
							{/if}

							{#if 'alternate' in node && node.alternate}
								{@render renderNode(node.alternate as ASTNode, depth + 1)}
							{/if}

							{#if 'left' in node && node.left}
								{@render renderNode(node.left as ASTNode, depth + 1)}
							{/if}

							{#if 'right' in node && node.right}
								{@render renderNode(node.right as ASTNode, depth + 1)}
							{/if}

							{#if 'callee' in node && node.callee}
								{@render renderNode(node.callee as ASTNode, depth + 1)}
							{/if}

							{#if 'object' in node && node.object}
								{@render renderNode(node.object as ASTNode, depth + 1)}
							{/if}

							{#if 'property' in node && node.property}
								{@render renderNode(node.property as ASTNode, depth + 1)}
							{/if}

							{#if 'argument' in node && node.argument}
								{@render renderNode(node.argument as ASTNode, depth + 1)}
							{/if}

							{#if 'init' in node && node.init}
								{@render renderNode(node.init as ASTNode, depth + 1)}
							{/if}

							{#if 'update' in node && node.update}
								{@render renderNode(node.update as ASTNode, depth + 1)}
							{/if}

							{#if 'params' in node && Array.isArray(node.params) && node.params.length > 0}
								<div class="node-group-label">params:</div>
								{#each node.params as param}
									{@render renderNode(param as ASTNode, depth + 1)}
								{/each}
							{/if}

							{#if 'elements' in node && Array.isArray(node.elements) && node.elements.length > 0}
								<div class="node-group-label">elements:</div>
								{#each node.elements as el}
									{@render renderNode(el as ASTNode, depth + 1)}
								{/each}
							{/if}

							{#if 'arguments' in node && Array.isArray(node.arguments) && node.arguments.length > 0}
								<div class="node-group-label">arguments:</div>
								{#each node.arguments as arg}
									{@render renderNode(arg as ASTNode, depth + 1)}
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{/snippet}

			{@render renderNode(ast, 0)}
		{:else}
			<div class="empty-state">
				<svg class="icon" viewBox="0 0 24 24">
					<path
						d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
					/>
				</svg>
				<p>点击"解析"按钮生成 AST</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.ast-visualizer {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.ast-tree {
		flex: 1;
		overflow: auto;
		padding: 8px;
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.ast-node {
		margin: 2px 0;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.ast-node.current {
		background-color: rgba(0, 122, 204, 0.2);
		border-left: 3px solid var(--accent-blue);
		animation: ast-node-expand 0.3s ease-out;
	}

	.node-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 6px;
		cursor: default;
		border-radius: var(--radius-sm);
		transition: background-color var(--transition-fast);
	}

	.ast-node.has-children > .node-header {
		cursor: pointer;
	}

	.ast-node.has-children > .node-header:hover {
		background-color: var(--bg-hover);
	}

	.expand-icon {
		width: 12px;
		font-size: 8px;
		color: var(--text-muted);
		transition: transform var(--transition-fast);
		flex-shrink: 0;
	}

	.expand-icon.spacer {
		opacity: 0;
	}

	.ast-node.expanded .expand-icon {
		transform: rotate(90deg);
	}

	.node-type {
		font-weight: 600;
	}

	.node-value {
		color: var(--accent-orange);
	}

	.node-location {
		color: var(--text-muted);
		font-size: 11px;
		margin-left: auto;
	}

	.node-children {
		margin-left: 20px;
		border-left: 1px solid var(--border-color);
		padding-left: 8px;
		animation: ast-node-expand 0.2s ease-out;
	}

	.node-group-label {
		color: var(--text-muted);
		font-size: 11px;
		padding: 2px 6px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		text-align: center;
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
	}
</style>
