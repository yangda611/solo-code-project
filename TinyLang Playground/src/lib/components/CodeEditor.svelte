<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let {
		code,
		highlightLine = -1,
		errorLine = -1
	}: {
		code: string;
		highlightLine?: number;
		errorLine?: number;
	} = $props();

	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement | undefined = $state();
	let scrollTop = $state(0);
	let scrollLeft = $state(0);

	let lines = $derived(code.split('\n'));
	let lineNumbers = $derived(Array.from({ length: lines.length }, (_, i) => i + 1));

	function handleInput(e: Event): void {
		const target = e.target as HTMLTextAreaElement;
		dispatch('change', target.value);
	}

	function handleScroll(e: Event): void {
		const target = e.target as HTMLElement;
		scrollTop = target.scrollTop;
		scrollLeft = target.scrollLeft;
	}

	function isHighlighted(lineNumber: number): boolean {
		return highlightLine === lineNumber;
	}

	function hasError(lineNumber: number): boolean {
		return errorLine === lineNumber;
	}
</script>

<div class="code-editor-container panel">
	<div class="panel-header">
		<span>代码编辑器</span>
		<span class="line-count">{lines.length} 行</span>
	</div>
	<div class="editor-body">
		<div class="line-numbers" style="top: {-scrollTop}px">
			{#each lineNumbers as num}
				<div
					class="line-number"
					class:highlighted={isHighlighted(num)}
					class:error={hasError(num)}
				>
					{num}
				</div>
			{/each}
		</div>
		<textarea
			bind:this={textarea}
			value={code}
			class="code-editor"
			class:executing={highlightLine > 0}
			oninput={handleInput}
			onscroll={handleScroll}
			spellcheck={false}
			placeholder="在此输入 TinyLang 代码..."
		></textarea>
	</div>
</div>

<style>
	.code-editor-container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.editor-body {
		display: flex;
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.line-numbers {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 1;
		padding: 12px 8px;
		background-color: var(--bg-tertiary);
		border-right: 1px solid var(--border-color);
		font-family: var(--font-mono);
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-muted);
		text-align: right;
		user-select: none;
		min-width: 50px;
	}

	.line-number {
		padding: 0 8px;
		transition: background-color var(--transition-fast);
	}

	.line-number.highlighted {
		background-color: rgba(0, 122, 204, 0.3);
		color: var(--text-primary);
	}

	.line-number.error {
		background-color: rgba(241, 76, 76, 0.3);
		color: var(--accent-red);
	}

	.code-editor {
		flex: 1;
		padding: 12px 16px 12px 70px;
		overflow: auto;
		min-height: 100%;
		background-color: var(--bg-primary);
		tab-size: 4;
	}

	.code-editor::placeholder {
		color: var(--text-muted);
	}

	.code-editor:focus {
		outline: none;
	}

	.executing {
		background-color: rgba(0, 122, 204, 0.05);
	}
</style>
