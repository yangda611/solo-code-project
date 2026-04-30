<script lang="ts">
	let {
		variables,
		variableChanges
	}: {
		variables: Record<string, unknown>;
		variableChanges: Map<string, { oldValue: unknown; newValue: unknown }>;
	} = $props();

	type RuntimeArrayLike = { type: 'array'; elements: unknown[] };
	type RuntimeFunctionLike = { type: 'function'; name: string; params: string[] };

	function isObject(value: unknown): value is Record<string, unknown> {
		return value !== null && typeof value === 'object';
	}

	function isRuntimeArrayLike(value: unknown): value is RuntimeArrayLike {
		return isObject(value) && value.type === 'array' && Array.isArray(value.elements);
	}

	function isRuntimeFunctionLike(value: unknown): value is RuntimeFunctionLike {
		return (
			isObject(value) &&
			value.type === 'function' &&
			typeof value.name === 'string' &&
			Array.isArray(value.params)
		);
	}

	function formatValue(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';

		if (typeof value === 'string') {
			return `"${value}"`;
		}

		if (typeof value === 'number' || typeof value === 'boolean') {
			return String(value);
		}

		if (Array.isArray(value)) {
			return `[${value.map((v) => formatValue(v)).join(', ')}]`;
		}

		if (typeof value === 'object') {
			if (isRuntimeArrayLike(value)) {
				return `[${value.elements.map((v) => formatValue(v)).join(', ')}]`;
			}
			if (isRuntimeFunctionLike(value)) {
				return `<function ${value.name}(${value.params.join(', ')})>`;
			}
			return JSON.stringify(value);
		}

		return String(value);
	}

	function getValueType(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';

		if (typeof value === 'object') {
			if (isRuntimeArrayLike(value)) return 'array';
			if (isRuntimeFunctionLike(value)) return 'function';
			return 'object';
		}

		return typeof value;
	}

	function getTypeColor(type: string): string {
		switch (type) {
			case 'number':
				return 'var(--accent-green)';
			case 'string':
				return 'var(--accent-orange)';
			case 'boolean':
				return 'var(--accent-purple)';
			case 'function':
				return 'var(--accent-yellow)';
			case 'array':
				return 'var(--accent-blue)';
			case 'null':
			case 'undefined':
				return 'var(--text-muted)';
			default:
				return 'var(--text-secondary)';
		}
	}

	function isChanged(name: string): boolean {
		return variableChanges.has(name);
	}

	function getChangeInfo(
		name: string
	): { oldValue: unknown; newValue: unknown } | undefined {
		return variableChanges.get(name);
	}
</script>

<div class="variable-table panel">
	<div class="panel-header">
		<span>变量表</span>
		<span class="var-count">{Object.keys(variables).length} 个变量</span>
	</div>
	<div class="panel-body table-container">
		{#if Object.keys(variables).length > 0}
			<table>
				<thead>
					<tr>
						<th>名称</th>
						<th>类型</th>
						<th>值</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(variables) as [name, value]}
						<tr
							class:changed={isChanged(name)}
							class:just-changed={isChanged(name)}
						>
							<td class="var-name">{name}</td>
							<td class="var-type">
								<span class="type-badge" style="color: {getTypeColor(getValueType(value))}">
									{getValueType(value)}
								</span>
							</td>
							<td class="var-value">
								{formatValue(value)}
								{#if isChanged(name)}
									{@const change = getChangeInfo(name)}
									{#if change && change.oldValue !== undefined}
										<span class="change-indicator">
											<span class="old-value">{formatValue(change.oldValue)}</span>
											<span class="arrow">→</span>
										</span>
									{/if}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="empty-state">
				<svg class="icon" viewBox="0 0 24 24">
					<path
						d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
					/>
				</svg>
				<p>暂无变量</p>
				<p class="hint">运行代码以查看变量状态</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.variable-table {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.table-container {
		flex: 1;
		overflow: auto;
		padding: 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 12px;
	}

	thead {
		position: sticky;
		top: 0;
		background-color: var(--bg-tertiary);
		z-index: 1;
	}

	th {
		padding: 8px 12px;
		text-align: left;
		font-weight: 600;
		color: var(--text-secondary);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--border-color);
	}

	td {
		padding: 6px 12px;
		border-bottom: 1px solid var(--border-color);
		vertical-align: middle;
		transition: background-color var(--transition-fast);
	}

	tbody tr:hover {
		background-color: var(--bg-hover);
	}

	tbody tr.changed {
		background-color: rgba(78, 201, 176, 0.1);
	}

	tbody tr.just-changed {
		animation: variable-change 1.5s ease-out;
	}

	.var-name {
		font-weight: 600;
		color: var(--accent-blue);
	}

	.type-badge {
		font-size: 10px;
		font-weight: 600;
		padding: 2px 6px;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius-sm);
	}

	.var-value {
		color: var(--text-primary);
		word-break: break-all;
	}

	.change-indicator {
		margin-left: 8px;
		opacity: 0.7;
	}

	.old-value {
		text-decoration: line-through;
		color: var(--text-muted);
	}

	.arrow {
		color: var(--accent-green);
		margin: 0 4px;
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
