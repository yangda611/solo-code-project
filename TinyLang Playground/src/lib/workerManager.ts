import type {
	ASTNode,
	TinyLangError,
	ParseResult,
	ExecutionState,
	Program
} from './tinylang/types';
import { WorkerMessageType } from './tinylang/types';
import { Lexer } from './tinylang/lexer';
import { Parser } from './tinylang/parser';

interface WorkerMessage {
	type: WorkerMessageType;
	data?: unknown;
}

export interface VariableChange {
	name: string;
	oldValue: unknown;
	newValue: unknown;
}

export interface ExecutionTimelineEntry {
	step: number;
	node: ASTNode;
	state: {
		variables: Record<string, unknown>;
		output: string[];
	};
}

export class WorkerManager {
	private worker: Worker | null = null;
	private isWorkerAvailable = true;

	private onParseResult: ((result: ParseResult) => void) | null = null;
	private onExecutionState: ((state: ExecutionState & { variables: Record<string, unknown> }) => void) | null =
		null;
	private onAstVisit: ((node: ASTNode, step: number) => void) | null = null;
	private onVariableChange: ((change: VariableChange) => void) | null = null;
	private onOutput: ((output: string) => void) | null = null;
	private onError: ((error: TinyLangError) => void) | null = null;
	private onCompleted: ((result: unknown) => void) | null = null;

	private executionTimeline: ExecutionTimelineEntry[] = [];
	private currentTimelineIndex = -1;

	constructor() {
		this.checkWorkerSupport();
	}

	private checkWorkerSupport(): void {
		try {
			this.isWorkerAvailable = typeof Worker !== 'undefined';
		} catch {
			this.isWorkerAvailable = false;
		}
	}

	async init(): Promise<void> {
		if (!this.isWorkerAvailable) {
			console.warn('Web Worker not available, running in main thread');
			return;
		}

		try {
			const InterpreterWorkerModule = await import(
				'./workers/interpreter.worker?worker'
			);
			const InterpreterWorker = InterpreterWorkerModule.default;
			this.worker = new InterpreterWorker();
			this.worker.addEventListener('message', this.handleMessage.bind(this));
			this.worker.addEventListener('error', this.handleError.bind(this));
		} catch (e) {
			console.warn('Failed to create Web Worker:', e);
			this.isWorkerAvailable = false;
		}
	}

	setCallbacks(
		onParseResult: (result: ParseResult) => void,
		onExecutionState: (state: ExecutionState & { variables: Record<string, unknown> }) => void,
		onAstVisit: (node: ASTNode, step: number) => void,
		onVariableChange: (change: VariableChange) => void,
		onOutput: (output: string) => void,
		onError: (error: TinyLangError) => void,
		onCompleted: (result: unknown) => void
	): void {
		this.onParseResult = onParseResult;
		this.onExecutionState = onExecutionState;
		this.onAstVisit = onAstVisit;
		this.onVariableChange = onVariableChange;
		this.onOutput = onOutput;
		this.onError = onError;
		this.onCompleted = onCompleted;
	}

	parse(source: string): void {
		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.PARSE, source);
		} else {
			this.parseInMainThread(source);
		}
	}

	private parseInMainThread(source: string): void {
		try {
			const lexer = new Lexer(source);
			const { tokens, errors: lexerErrors } = lexer.tokenize();

			if (lexerErrors.length > 0) {
				this.onParseResult?.({ ast: null, tokens, errors: lexerErrors });
				return;
			}

			const parser = new Parser(tokens);
			const { ast, errors: parserErrors } = parser.parse();

			this.onParseResult?.({ ast, tokens, errors: parserErrors });
		} catch (e) {
			const error: TinyLangError = {
				message: e instanceof Error ? e.message : 'Unknown parsing error',
				line: 1,
				column: 1,
				type: 'parser'
			};
			this.onParseResult?.({ ast: null, tokens: [], errors: [error] });
		}
	}

	run(): void {
		this.executionTimeline = [];
		this.currentTimelineIndex = -1;

		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.RUN);
		}
	}

	step(): void {
		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.STEP);
		}
	}

	pause(): void {
		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.PAUSE);
		}
	}

	resume(): void {
		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.RESUME);
		}
	}

	stop(): void {
		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.STOP);
		}
	}

	reset(): void {
		this.executionTimeline = [];
		this.currentTimelineIndex = -1;

		if (this.isWorkerAvailable && this.worker) {
			this.postMessage(WorkerMessageType.RESET);
		}
	}

	getTimeline(): ExecutionTimelineEntry[] {
		return this.executionTimeline;
	}

	getTimelineIndex(): number {
		return this.currentTimelineIndex;
	}

	private handleMessage(event: MessageEvent<WorkerMessage>): void {
		const { type, data } = event.data;

		switch (type) {
			case WorkerMessageType.PARSE_RESULT:
				this.onParseResult?.(data as ParseResult);
				break;

			case WorkerMessageType.EXECUTION_STATE:
				this.onExecutionState?.(
					data as ExecutionState & { variables: Record<string, unknown> }
				);
				break;

			case WorkerMessageType.AST_VISIT: {
				const { node, step } = data as { node: ASTNode; step: number };
				this.onAstVisit?.(node, step);
				break;
			}

			case WorkerMessageType.VARIABLE_CHANGE:
				this.onVariableChange?.(data as VariableChange);
				break;

			case WorkerMessageType.OUTPUT:
				this.onOutput?.(data as string);
				break;

			case WorkerMessageType.ERROR:
				this.onError?.(data as TinyLangError);
				break;

			case WorkerMessageType.COMPLETED:
				this.onCompleted?.((data as { result: unknown }).result);
				break;
		}
	}

	private handleError(event: ErrorEvent): void {
		console.error('Worker error:', event);
		const error: TinyLangError = {
			message: event.message,
			line: event.lineno,
			column: event.colno,
			type: 'runtime'
		};
		this.onError?.(error);
	}

	private postMessage(type: WorkerMessageType, data?: unknown): void {
		if (this.worker) {
			this.worker.postMessage({ type, data });
		}
	}

	terminate(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}
}
