import { Lexer } from '../tinylang/lexer';
import { Parser } from '../tinylang/parser';
import { Interpreter } from '../tinylang/interpreter';
import { BreakException, ContinueException, ReturnException } from '../tinylang/interpreter';
import type {
	Program,
	ASTNode,
	RuntimeValue,
	TinyLangError,
	ParseResult,
	ExecutionState
} from '../tinylang/types';
import { WorkerMessageType } from '../tinylang/types';

interface WorkerMessage {
	type: WorkerMessageType;
	data?: unknown;
}

class WorkerInterpreter {
	private source = '';
	private ast: Program | null = null;
	private tokens: { type: string; lexeme: string; line: number; column: number }[] = [];
	private interpreter: Interpreter | null = null;
	private isRunning = false;
	private isPaused = false;
	private stepMode = false;
	private maxSteps = 100000;
	private executionQueue: ASTNode[] = [];
	private currentExecutionIndex = 0;
	private breakpoints: Set<number> = new Set();

	constructor() {
		self.addEventListener('message', this.handleMessage.bind(this));
	}

	private handleMessage(event: MessageEvent<WorkerMessage>): void {
		const { type, data } = event.data;

		switch (type) {
			case WorkerMessageType.PARSE:
				this.parse(data as string);
				break;
			case WorkerMessageType.RUN:
				this.run();
				break;
			case WorkerMessageType.STEP:
				this.step();
				break;
			case WorkerMessageType.PAUSE:
				this.pause();
				break;
			case WorkerMessageType.RESUME:
				this.resume();
				break;
			case WorkerMessageType.STOP:
				this.stop();
				break;
			case WorkerMessageType.RESET:
				this.reset();
				break;
			default:
				console.warn(`Unknown message type: ${type}`);
		}
	}

	private parse(source: string): void {
		this.source = source;
		this.tokens = [];

		try {
			const lexer = new Lexer(source);
			const { tokens, errors: lexerErrors } = lexer.tokenize();

			this.tokens = tokens.map((t) => ({
				type: t.type,
				lexeme: t.lexeme,
				line: t.line,
				column: t.column
			}));

			if (lexerErrors.length > 0) {
				this.sendParseResult(null, lexerErrors);
				return;
			}

			const parser = new Parser(tokens);
			const { ast, errors: parserErrors } = parser.parse();

			if (parserErrors.length > 0) {
				this.sendParseResult(null, parserErrors);
				return;
			}

			this.ast = ast;
			this.sendParseResult(ast, []);
		} catch (e) {
			const error: TinyLangError = {
				message: e instanceof Error ? e.message : 'Unknown parsing error',
				line: 1,
				column: 1,
				type: 'parser'
			};
			this.sendParseResult(null, [error]);
		}
	}

	private sendParseResult(ast: Program | null, errors: TinyLangError[]): void {
		const result: ParseResult = {
			ast,
			tokens: this.tokens as unknown as ParseResult['tokens'],
			errors
		};
		this.postMessage(WorkerMessageType.PARSE_RESULT, result);
	}

	private run(): void {
		if (!this.ast) {
			this.sendError({
				message: 'No AST to execute. Parse first.',
				line: 1,
				column: 1,
				type: 'runtime'
			});
			return;
		}

		if (this.isRunning) return;

		this.isRunning = true;
		this.isPaused = false;
		this.stepMode = false;

		this.interpreter = new Interpreter(this.maxSteps);
		this.interpreter.setCallbacks(
			this.onStep.bind(this),
			this.onOutput.bind(this),
			this.onVariableChange.bind(this)
		);

		try {
			this.executionQueue = this.buildExecutionQueue(this.ast);
			this.currentExecutionIndex = 0;

			this.executeNext();
		} catch (e) {
			this.handleRuntimeError(e);
		}
	}

	private isAstNode(value: unknown): value is ASTNode {
		return value !== null && typeof value === 'object' && 'type' in value;
	}

	private buildExecutionQueue(node: ASTNode): ASTNode[] {
		const queue: ASTNode[] = [];

		const traverse = (n: ASTNode): void => {
			queue.push(n);

			if ('body' in n && Array.isArray(n.body)) {
				for (const child of n.body) {
					if (this.isAstNode(child)) {
						traverse(child);
					}
				}
			}

			if ('expression' in n && this.isAstNode(n.expression)) {
				traverse(n.expression);
			}

			if ('value' in n && this.isAstNode(n.value)) {
				traverse(n.value);
			}

			if ('left' in n && this.isAstNode(n.left)) {
				traverse(n.left);
			}

			if ('right' in n && this.isAstNode(n.right)) {
				traverse(n.right);
			}

			if ('condition' in n && this.isAstNode(n.condition)) {
				traverse(n.condition);
			}

			if ('consequent' in n && this.isAstNode(n.consequent)) {
				traverse(n.consequent);
			}

			if ('alternate' in n && this.isAstNode(n.alternate)) {
				traverse(n.alternate);
			}

			if ('params' in n && Array.isArray(n.params)) {
				for (const param of n.params) {
					if (this.isAstNode(param)) {
						traverse(param);
					}
				}
			}

			if ('arguments' in n && Array.isArray(n.arguments)) {
				for (const arg of n.arguments) {
					if (this.isAstNode(arg)) {
						traverse(arg);
					}
				}
			}

			if ('elements' in n && Array.isArray(n.elements)) {
				for (const el of n.elements) {
					if (this.isAstNode(el)) {
						traverse(el);
					}
				}
			}

			if ('callee' in n && this.isAstNode(n.callee)) {
				traverse(n.callee);
			}

			if ('object' in n && this.isAstNode(n.object)) {
				traverse(n.object);
			}

			if ('property' in n && this.isAstNode(n.property)) {
				traverse(n.property);
			}

			if ('argument' in n && this.isAstNode(n.argument)) {
				traverse(n.argument);
			}

			if ('init' in n && this.isAstNode(n.init)) {
				traverse(n.init);
			}

			if ('update' in n && this.isAstNode(n.update)) {
				traverse(n.update);
			}
		};

		traverse(node);
		return queue;
	}

	private executeNext(): void {
		if (!this.isRunning || this.isPaused) return;
		if (!this.interpreter || !this.ast) return;

		try {
			const result = this.interpreter.executeProgram(this.ast);
			this.isRunning = false;
			this.postMessage(WorkerMessageType.COMPLETED, { result: this.serializeValue(result) });
		} catch (e) {
			this.handleRuntimeError(e);
		}
	}

	private step(): void {
		if (!this.ast) {
			this.sendError({
				message: 'No AST to execute. Parse first.',
				line: 1,
				column: 1,
				type: 'runtime'
			});
			return;
		}

		if (!this.interpreter) {
			this.interpreter = new Interpreter(this.maxSteps);
			this.interpreter.setCallbacks(
				this.onStep.bind(this),
				this.onOutput.bind(this),
				this.onVariableChange.bind(this)
			);
			this.executionQueue = this.buildExecutionQueue(this.ast);
			this.currentExecutionIndex = 0;
		}

		try {
			this.interpreter.executeProgram(this.ast);
		} catch (e) {
			this.handleRuntimeError(e);
		}
	}

	private pause(): void {
		this.isPaused = true;
		this.sendExecutionState();
	}

	private resume(): void {
		if (!this.isRunning) return;
		this.isPaused = false;
		this.executeNext();
	}

	private stop(): void {
		this.isRunning = false;
		this.isPaused = false;
		this.sendExecutionState();
	}

	private reset(): void {
		this.isRunning = false;
		this.isPaused = false;
		this.interpreter = null;
		this.executionQueue = [];
		this.currentExecutionIndex = 0;
		this.postMessage(WorkerMessageType.EXECUTION_STATE, {
			currentNode: null,
			variables: {},
			callStack: [],
			output: [],
			isPaused: false,
			isTerminated: true,
			error: null,
			stepCount: 0,
			maxSteps: this.maxSteps
		});
	}

	private onStep(state: ExecutionState, node: ASTNode): void {
		if (this.breakpoints.has(node.startLine)) {
			this.isPaused = true;
		}

		this.postMessage(WorkerMessageType.AST_VISIT, {
			node: this.serializeNode(node),
			step: state.stepCount
		});

		this.postMessage(WorkerMessageType.EXECUTION_STATE, {
			...state,
			variables: this.serializeMap(state.variables)
		});
	}

	private onOutput(output: string): void {
		this.postMessage(WorkerMessageType.OUTPUT, output);
	}

	private onVariableChange(
		name: string,
		oldValue: RuntimeValue | undefined,
		newValue: RuntimeValue
	): void {
		this.postMessage(WorkerMessageType.VARIABLE_CHANGE, {
			name,
			oldValue: this.serializeValue(oldValue),
			newValue: this.serializeValue(newValue)
		});
	}

	private handleRuntimeError(e: unknown): void {
		this.isRunning = false;

		if (
			e instanceof BreakException ||
			e instanceof ContinueException ||
			e instanceof ReturnException
		) {
			return;
		}

		const error: TinyLangError = {
			message: e instanceof Error ? e.message : 'Unknown runtime error',
			line: 1,
			column: 1,
			type: 'runtime'
		};

		if (e && typeof e === 'object' && 'line' in e && 'column' in e) {
			error.line = (e as { line: number }).line;
			error.column = (e as { column: number }).column;
		}

		this.sendError(error);
	}

	private sendError(error: TinyLangError): void {
		this.postMessage(WorkerMessageType.ERROR, error);
		this.isRunning = false;
	}

	private sendExecutionState(): void {
		if (!this.interpreter) {
			this.postMessage(WorkerMessageType.EXECUTION_STATE, {
				currentNode: null,
				variables: {},
				callStack: [],
				output: [],
				isPaused: this.isPaused,
				isTerminated: !this.isRunning,
				error: null,
				stepCount: 0,
				maxSteps: this.maxSteps
			});
			return;
		}

		const state = this.interpreter.getExecutionState(null);
		this.postMessage(WorkerMessageType.EXECUTION_STATE, {
			...state,
			variables: this.serializeMap(state.variables)
		});
	}

	private serializeNode(node: ASTNode): unknown {
		const serialized: Record<string, unknown> = {
			type: node.type,
			startLine: node.startLine,
			startColumn: node.startColumn,
			endLine: node.endLine,
			endColumn: node.endColumn
		};

		for (const [key, value] of Object.entries(node)) {
			if (key === 'type' || key === 'startLine' || key === 'startColumn' || key === 'endLine' || key === 'endColumn') continue;

			if (value && typeof value === 'object' && 'type' in value) {
				serialized[key] = this.serializeNode(value as ASTNode);
			} else if (Array.isArray(value)) {
				serialized[key] = value.map((item) =>
					item && typeof item === 'object' && 'type' in item
						? this.serializeNode(item as ASTNode)
						: item
				);
			} else {
				serialized[key] = value;
			}
		}

		return serialized;
	}

	private serializeValue(value: RuntimeValue | undefined): unknown {
		if (value === undefined) return undefined;
		if (value === null) return null;

		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			return value;
		}

		if (Array.isArray(value)) {
			return value.map((v) => this.serializeValue(v));
		}

		if (typeof value === 'object') {
			if ('type' in value) {
				if (value.type === 'array') {
					return {
						type: 'array',
						elements: (value as { elements: RuntimeValue[] }).elements.map((e) =>
							this.serializeValue(e)
						)
					};
				}
				if (value.type === 'function') {
					return {
						type: 'function',
						name: (value as { name: string }).name,
						params: (value as { params: string[] }).params
					};
				}
			}
		}

		return String(value);
	}

	private serializeMap(map: Map<string, RuntimeValue>): Record<string, unknown> {
		const obj: Record<string, unknown> = {};
		for (const [key, value] of map) {
			obj[key] = this.serializeValue(value);
		}
		return obj;
	}

	private postMessage(type: WorkerMessageType, data: unknown): void {
		self.postMessage({ type, data });
	}
}

new WorkerInterpreter();
