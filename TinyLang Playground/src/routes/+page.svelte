<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { WorkerManager } from '$lib/workerManager';
	import { presets, type Preset } from '$lib/presets';
	import type {
		ASTNode,
		TinyLangError,
		ParseResult,
		ExecutionState,
		Program
	} from '$lib/tinylang/types';
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import AstVisualizer from '$lib/components/AstVisualizer.svelte';
	import VariableTable from '$lib/components/VariableTable.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import OutputPanel from '$lib/components/OutputPanel.svelte';
	import PresetSelector from '$lib/components/PresetSelector.svelte';
	import ExecutionTimeline from '$lib/components/ExecutionTimeline.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';

	let workerManager: WorkerManager;
	let code = $state(`// TinyLang 示例程序
// 支持变量、函数、循环、条件判断、数组

// 变量声明
let x = 10;
let y = 20;
let result = x + y;

print("x + y = " + result);

// 函数定义
fn factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

let fact = factorial(5);
print("factorial(5) = " + fact);

// 循环
let sum = 0;
for (let i = 0; i < 10; i = i + 1) {
    sum = sum + i;
}
print("sum 0-9 = " + sum);

// 数组
let arr = [1, 2, 3, 4, 5];
print("数组长度: " + len(arr));
print("第一个元素: " + arr[0]);`);

	let ast: Program | null = $state(null);
	let tokens: unknown[] = $state([]);
	let parseErrors: TinyLangError[] = $state([]);
	let executionState: (ExecutionState & { variables: Record<string, unknown> }) | null = $state(null);
	let outputLines: string[] = $state([]);
	let currentError: TinyLangError | null = $state(null);
	let currentNode: ASTNode | null = $state(null);
	let currentStep = $state(0);
	let isRunning = $state(false);
	let isPaused = $state(false);
	let selectedPreset: Preset | null = $state(null);
	let expandedNodes: Set<string> = $state(new Set());
	let variableChanges: Map<string, { oldValue: unknown; newValue: unknown }> = $state(new Map());
	let errorLine = $state(-1);

	let leftPanelWidth = $state(50);
	let rightPanelWidth = $state(50);
	let editorHeight = $state(60);
	let outputHeight = $state(40);

	let hasErrors = $derived(parseErrors.length > 0 || currentError !== null);

	onMount(async () => {
		workerManager = new WorkerManager();
		await workerManager.init();

		workerManager.setCallbacks(
			handleParseResult,
			handleExecutionState,
			handleAstVisit,
			handleVariableChange,
			handleOutput,
			handleError,
			handleCompleted
		);

		parseCode();
	});

	onDestroy(() => {
		if (workerManager) {
			workerManager.terminate();
		}
	});

	function handleParseResult(result: ParseResult): void {
		ast = result.ast;
		tokens = result.tokens;
		parseErrors = result.errors;

		if (parseErrors.length > 0) {
			currentError = parseErrors[0];
			errorLine = parseErrors[0].line;
		} else {
			currentError = null;
			errorLine = -1;
		}
	}

	function handleExecutionState(
		state: ExecutionState & { variables: Record<string, unknown> }
	): void {
		executionState = state;
		isPaused = state.isPaused;
		isRunning = !state.isTerminated && !state.isPaused;
	}

	function handleAstVisit(node: ASTNode, step: number): void {
		currentNode = node;
		currentStep = step;
	}

	function handleVariableChange(change: {
		name: string;
		oldValue: unknown;
		newValue: unknown;
	}): void {
		variableChanges.set(change.name, {
			oldValue: change.oldValue,
			newValue: change.newValue
		});

		setTimeout(() => {
			variableChanges.delete(change.name);
		}, 1500);
	}

	function handleOutput(output: string): void {
		outputLines = [...outputLines, output];
	}

	function handleError(error: TinyLangError): void {
		currentError = error;
		errorLine = error.line;
		isRunning = false;
	}

	function handleCompleted(result: unknown): void {
		isRunning = false;
		isPaused = false;
	}

	function parseCode(): void {
		if (workerManager) {
			workerManager.parse(code);
		}
	}

	function runCode(): void {
		outputLines = [];
		currentNode = null;
		currentStep = 0;
		currentError = null;
		errorLine = -1;
		variableChanges.clear();

		if (workerManager) {
			workerManager.run();
			isRunning = true;
		}
	}

	function stepCode(): void {
		if (!isRunning) {
			outputLines = [];
			currentNode = null;
			currentStep = 0;
			currentError = null;
			errorLine = -1;
		}

		if (workerManager) {
			workerManager.step();
			isRunning = true;
			isPaused = true;
		}
	}

	function pauseCode(): void {
		if (workerManager) {
			workerManager.pause();
			isPaused = true;
		}
	}

	function resumeCode(): void {
		if (workerManager) {
			workerManager.resume();
			isPaused = false;
		}
	}

	function stopCode(): void {
		if (workerManager) {
			workerManager.stop();
			isRunning = false;
			isPaused = false;
		}
	}

	function resetCode(): void {
		if (workerManager) {
			workerManager.reset();
			isRunning = false;
			isPaused = false;
			outputLines = [];
			currentNode = null;
			currentStep = 0;
			currentError = null;
			errorLine = -1;
			executionState = null;
			variableChanges.clear();
		}
	}

	function loadPreset(preset: Preset): void {
		selectedPreset = preset;
		code = preset.code;
		resetCode();
		setTimeout(() => parseCode(), 100);
	}

	function toggleNode(nodeId: string): void {
		if (expandedNodes.has(nodeId)) {
			expandedNodes.delete(nodeId);
		} else {
			expandedNodes.add(nodeId);
		}
	}

	function codeChanged(newCode: string): void {
		code = newCode;
		parseCode();
	}
</script>

<div class="app">
	<div class="header">
		<div class="header-left">
			<h1>TinyLang Playground</h1>
			<span class="subtitle">交互式编程语言解释器</span>
		</div>
		<div class="header-right">
			<ControlPanel
				isRunning={isRunning}
				isPaused={isPaused}
				hasErrors={hasErrors}
				on:parse={parseCode}
				on:run={runCode}
				on:step={stepCode}
				on:pause={pauseCode}
				on:resume={resumeCode}
				on:stop={stopCode}
				on:reset={resetCode}
			/>
		</div>
	</div>

	<PresetSelector
		presets={presets}
		selectedPreset={selectedPreset}
		on:select={(e) => loadPreset(e.detail)}
	/>

	<div class="main-content">
		<div class="left-panel" style="width: {leftPanelWidth}%">
			<div class="editor-section" style="height: {editorHeight}%">
				<CodeEditor
					code={code}
					highlightLine={currentNode?.startLine ?? -1}
					errorLine={errorLine}
					on:change={(e) => codeChanged(e.detail)}
				/>
			</div>

			<div class="resizer resizer-vertical"></div>

			<div class="output-section" style="height: {outputHeight}%">
				<OutputPanel
					outputLines={outputLines}
					currentError={currentError ?? undefined}
				/>
			</div>
		</div>

		<div class="resizer resizer-horizontal"></div>

		<div class="right-panel" style="width: {rightPanelWidth}%">
			<div class="right-top">
				<div class="ast-panel">
					<AstVisualizer
						ast={ast}
						currentNode={currentNode}
						expandedNodes={expandedNodes}
						on:toggle={(e) => toggleNode(e.detail)}
					/>
				</div>

				<div class="resizer resizer-horizontal"></div>

				<div class="variables-panel">
					<VariableTable
						variables={executionState?.variables ?? {}}
						variableChanges={variableChanges}
					/>
				</div>
			</div>

			<div class="resizer resizer-vertical"></div>

			<div class="timeline-section">
				<ExecutionTimeline
					currentStep={currentStep}
					currentNode={currentNode}
				/>
			</div>
		</div>
	</div>

	{#if currentError}
		<ErrorDisplay
			currentError={currentError}
			on:dismiss={() => (currentError = null)}
		/>
	{/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: var(--bg-primary);
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		background-color: var(--bg-tertiary);
		border-bottom: 1px solid var(--border-color);
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	h1 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.subtitle {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.left-panel {
		display: flex;
		flex-direction: column;
		min-width: 300px;
		overflow: hidden;
	}

	.editor-section {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.output-section {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.right-panel {
		display: flex;
		flex-direction: column;
		min-width: 400px;
		overflow: hidden;
	}

	.right-top {
		display: flex;
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.ast-panel {
		flex: 1;
		min-width: 200px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.variables-panel {
		flex: 1;
		min-width: 200px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.timeline-section {
		height: 100px;
		flex-shrink: 0;
		overflow: hidden;
	}

	.resizer {
		flex-shrink: 0;
		position: relative;
		z-index: 10;
		background-color: var(--bg-tertiary);
	}

	.resizer:hover {
		background-color: var(--accent-blue);
	}
</style>
