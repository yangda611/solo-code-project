import type {
	ASTNode,
	Program,
	Statement,
	Expression,
	BlockStatement,
	LetStatement,
	FunctionDeclaration,
	ReturnStatement,
	IfStatement,
	WhileStatement,
	ForStatement,
	AssignmentExpression,
	BinaryExpression,
	UnaryExpression,
	CallExpression,
	MemberExpression,
	ArrayLiteral,
	Identifier,
	Environment,
	RuntimeValue,
	RuntimeArray,
	RuntimeFunction,
	ExecutionState,
	TinyLangError,
	BreakStatement,
	ContinueStatement
} from './types';
import { ASTNodeType } from './types';

export class BreakException {
	constructor(public readonly node: BreakStatement) {}
}

export class ContinueException {
	constructor(public readonly node: ContinueStatement) {}
}

export class ReturnException {
	constructor(
		public readonly value: RuntimeValue,
		public readonly line: number
	) {}
}

export class Interpreter {
	private globalEnvironment: Environment;
	private currentEnvironment: Environment;
	private output: string[] = [];
	private stepCount = 0;
	private maxSteps: number;
	private isTerminated = false;
	private isPaused = false;
	private onStep?: (state: ExecutionState, node: ASTNode) => void;
	private onOutput?: (output: string) => void;
	private onVariableChange?: (
		name: string,
		oldValue: RuntimeValue | undefined,
		newValue: RuntimeValue
	) => void;

	constructor(maxSteps = 100000) {
		this.globalEnvironment = {
			variables: new Map(),
			parent: undefined
		};
		this.currentEnvironment = this.globalEnvironment;
		this.maxSteps = maxSteps;
		this.setupBuiltins();
	}

	private setupBuiltins(): void {
		this.globalEnvironment.variables.set('print', {
			type: 'function',
			name: 'print',
			params: ['value'],
			body: {
				type: ASTNodeType.BLOCK_STATEMENT,
				body: [],
				startLine: 0,
				startColumn: 0,
				endLine: 0,
				endColumn: 0
			},
			closure: this.globalEnvironment,
			isBuiltin: true
		} as RuntimeFunction & { isBuiltin: boolean });

		this.globalEnvironment.variables.set('len', {
			type: 'function',
			name: 'len',
			params: ['value'],
			body: {
				type: ASTNodeType.BLOCK_STATEMENT,
				body: [],
				startLine: 0,
				startColumn: 0,
				endLine: 0,
				endColumn: 0
			},
			closure: this.globalEnvironment,
			isBuiltin: true
		} as RuntimeFunction & { isBuiltin: boolean });
	}

	setCallbacks(
		onStep?: (state: ExecutionState, node: ASTNode) => void,
		onOutput?: (output: string) => void,
		onVariableChange?: (
			name: string,
			oldValue: RuntimeValue | undefined,
			newValue: RuntimeValue
		) => void
	): void {
		this.onStep = onStep;
		this.onOutput = onOutput;
		this.onVariableChange = onVariableChange;
	}

	reset(): void {
		this.globalEnvironment = {
			variables: new Map(),
			parent: undefined
		};
		this.currentEnvironment = this.globalEnvironment;
		this.setupBuiltins();
		this.output = [];
		this.stepCount = 0;
		this.isTerminated = false;
		this.isPaused = false;
	}

	getExecutionState(currentNode: ASTNode | null): ExecutionState {
		return {
			currentNode,
			variables: this.getAllVariables(),
			callStack: [],
			output: [...this.output],
			isPaused: this.isPaused,
			isTerminated: this.isTerminated,
			error: null,
			stepCount: this.stepCount,
			maxSteps: this.maxSteps
		};
	}

	private getAllVariables(): Map<string, RuntimeValue> {
		const allVars = new Map<string, RuntimeValue>();
		let env: Environment | undefined = this.currentEnvironment;

		while (env) {
			for (const [name, value] of env.variables) {
				if (!allVars.has(name)) {
					allVars.set(name, value);
				}
			}
			env = env.parent;
		}

		return allVars;
	}

	interpret(program: Program): RuntimeValue {
		try {
			return this.executeProgram(program);
		} catch (e) {
			if (e instanceof ReturnException) {
				return e.value;
			}
			throw e;
		}
	}

	executeProgram(program: Program): RuntimeValue {
		let result: RuntimeValue = null;
		for (const stmt of program.body) {
			if (this.isTerminated) break;
			result = this.execute(stmt);
		}
		return result;
	}

	execute(node: Statement | Expression): RuntimeValue {
		if (this.isTerminated) return null;

		this.stepCount++;
		if (this.stepCount > this.maxSteps) {
			throw this.createRuntimeError(
				`Maximum step count (${this.maxSteps}) exceeded - possible infinite loop`,
				node
			);
		}

		if (this.onStep) {
			this.onStep(this.getExecutionState(node), node);
		}

		switch (node.type) {
			case ASTNodeType.BLOCK_STATEMENT:
				return this.executeBlock(node);
			case ASTNodeType.EXPRESSION_STATEMENT:
				return this.evaluate(node.expression);
			case ASTNodeType.LET_STATEMENT:
				return this.executeLetStatement(node);
			case ASTNodeType.FUNCTION_DECLARATION:
				return this.executeFunctionDeclaration(node);
			case ASTNodeType.RETURN_STATEMENT:
				return this.executeReturnStatement(node);
			case ASTNodeType.IF_STATEMENT:
				return this.executeIfStatement(node);
			case ASTNodeType.WHILE_STATEMENT:
				return this.executeWhileStatement(node);
			case ASTNodeType.FOR_STATEMENT:
				return this.executeForStatement(node);
			case ASTNodeType.BREAK_STATEMENT:
				throw new BreakException(node);
			case ASTNodeType.CONTINUE_STATEMENT:
				throw new ContinueException(node);
			default:
				return this.evaluate(node as Expression);
		}
	}

	private executeBlock(block: BlockStatement, newEnv?: Environment): RuntimeValue {
		const previous = this.currentEnvironment;
		if (newEnv) {
			this.currentEnvironment = newEnv;
		}

		try {
			let result: RuntimeValue = null;
			for (const stmt of block.body) {
				if (this.isTerminated) break;
				result = this.execute(stmt);
			}
			return result;
		} finally {
			this.currentEnvironment = previous;
		}
	}

	private executeLetStatement(node: LetStatement): RuntimeValue {
		const value = node.value ? this.evaluate(node.value) : null;
		const oldValue = this.currentEnvironment.variables.get(node.name.name);
		this.currentEnvironment.variables.set(node.name.name, value);

		if (this.onVariableChange && oldValue !== value) {
			this.onVariableChange(node.name.name, oldValue, value);
		}

		return value;
	}

	private executeFunctionDeclaration(node: FunctionDeclaration): RuntimeValue {
		const func: RuntimeFunction = {
			type: 'function',
			name: node.name.name,
			params: node.params.map((p) => p.name),
			body: node.body,
			closure: { ...this.currentEnvironment }
		};

		const oldValue = this.currentEnvironment.variables.get(node.name.name);
		this.currentEnvironment.variables.set(node.name.name, func);

		if (this.onVariableChange && oldValue !== func) {
			this.onVariableChange(node.name.name, oldValue, func);
		}

		return func;
	}

	private executeReturnStatement(node: ReturnStatement): RuntimeValue {
		const value = node.value ? this.evaluate(node.value) : null;
		throw new ReturnException(value, node.startLine);
	}

	private executeIfStatement(node: IfStatement): RuntimeValue {
		const condition = this.evaluate(node.condition);

		if (this.isTruthy(condition)) {
			return this.executeBlock(node.consequent);
		} else if (node.alternate) {
			if ('type' in node.alternate && node.alternate.type === ASTNodeType.IF_STATEMENT) {
				return this.executeIfStatement(node.alternate);
			}
			return this.executeBlock(node.alternate);
		}

		return null;
	}

	private executeWhileStatement(node: WhileStatement): RuntimeValue {
		let result: RuntimeValue = null;

		while (this.isTruthy(this.evaluate(node.condition))) {
			if (this.isTerminated) break;

			try {
				result = this.executeBlock(node.body);
			} catch (e) {
				if (e instanceof BreakException) {
					break;
				}
				if (e instanceof ContinueException) {
					continue;
				}
				throw e;
			}
		}

		return result;
	}

	private executeForStatement(node: ForStatement): RuntimeValue {
		let result: RuntimeValue = null;

		const previous = this.currentEnvironment;
		this.currentEnvironment = {
			variables: new Map(),
			parent: this.currentEnvironment
		};

		try {
			if (node.init) {
				this.execute(node.init);
			}

			while (
				!node.condition ||
				this.isTruthy(this.evaluate(node.condition))
			) {
				if (this.isTerminated) break;

				try {
					result = this.executeBlock(node.body);
				} catch (e) {
					if (e instanceof BreakException) {
						break;
					}
					if (e instanceof ContinueException) {
						if (node.update) {
							this.evaluate(node.update.expression);
						}
						continue;
					}
					throw e;
				}

				if (node.update) {
					this.evaluate(node.update.expression);
				}
			}
		} finally {
			this.currentEnvironment = previous;
		}

		return result;
	}

	evaluate(expr: Expression): RuntimeValue {
		if (this.isTerminated) return null;

		this.stepCount++;
		if (this.stepCount > this.maxSteps) {
			throw this.createRuntimeError(
				`Maximum step count (${this.maxSteps}) exceeded - possible infinite loop`,
				expr
			);
		}

		if (this.onStep) {
			this.onStep(this.getExecutionState(expr), expr);
		}

		switch (expr.type) {
			case ASTNodeType.ASSIGNMENT_EXPRESSION:
				return this.evaluateAssignment(expr);
			case ASTNodeType.BINARY_EXPRESSION:
				return this.evaluateBinary(expr);
			case ASTNodeType.UNARY_EXPRESSION:
				return this.evaluateUnary(expr);
			case ASTNodeType.CALL_EXPRESSION:
				return this.evaluateCall(expr);
			case ASTNodeType.MEMBER_EXPRESSION:
				return this.evaluateMember(expr);
			case ASTNodeType.ARRAY_LITERAL:
				return this.evaluateArrayLiteral(expr);
			case ASTNodeType.IDENTIFIER:
				return this.evaluateIdentifier(expr);
			case ASTNodeType.NUMBER_LITERAL:
				return expr.value;
			case ASTNodeType.STRING_LITERAL:
				return expr.value;
			case ASTNodeType.BOOLEAN_LITERAL:
				return expr.value;
			case ASTNodeType.NULL_LITERAL:
				return null;
			default:
				throw this.createRuntimeError(`Unknown expression type: ${(expr as Expression).type}`, expr);
		}
	}

	private evaluateAssignment(expr: AssignmentExpression): RuntimeValue {
		const right = this.evaluate(expr.right);
		let value: RuntimeValue;

		if (expr.operator === '=') {
			value = right;
		} else {
			const leftValue = this.evaluate(expr.left);
			switch (expr.operator) {
				case '+=':
					value = this.add(leftValue, right);
					break;
				case '-=':
					value = this.subtract(leftValue, right);
					break;
				case '*=':
					value = this.multiply(leftValue, right);
					break;
				case '/=':
					value = this.divide(leftValue, right);
					break;
				default:
					throw this.createRuntimeError(`Unknown assignment operator: ${expr.operator}`, expr);
			}
		}

		if (expr.left.type === ASTNodeType.IDENTIFIER) {
			this.assignVariable(expr.left.name, value, expr);
			return value;
		}

		if (expr.left.type === ASTNodeType.MEMBER_EXPRESSION) {
			const member = expr.left;
			const object = this.evaluate(member.object);

			if (this.isRuntimeArray(object)) {
				const index = this.evaluate(member.property);
				if (typeof index === 'number' && Number.isInteger(index)) {
					object.elements[index] = value;
					return value;
				}
				throw this.createRuntimeError('Array index must be an integer', expr);
			}

			throw this.createRuntimeError('Only arrays support index assignment', expr);
		}

		throw this.createRuntimeError('Invalid assignment target', expr);
	}

	private evaluateBinary(expr: BinaryExpression): RuntimeValue {
		const left = this.evaluate(expr.left);
		const right = this.evaluate(expr.right);

		switch (expr.operator) {
			case '+':
				return this.add(left, right);
			case '-':
				return this.subtract(left, right);
			case '*':
				return this.multiply(left, right);
			case '/':
				return this.divide(left, right);
			case '%':
				return this.modulo(left, right);
			case '==':
				return this.isEqual(left, right);
			case '!=':
				return !this.isEqual(left, right);
			case '<':
				return this.lessThan(left, right);
			case '<=':
				return this.lessThanOrEqual(left, right);
			case '>':
				return this.greaterThan(left, right);
			case '>=':
				return this.greaterThanOrEqual(left, right);
			case '&&':
				return this.isTruthy(left) && this.isTruthy(right);
			case '||':
				return this.isTruthy(left) || this.isTruthy(right);
			default:
				throw this.createRuntimeError(`Unknown operator: ${expr.operator}`, expr);
		}
	}

	private evaluateUnary(expr: UnaryExpression): RuntimeValue {
		if (!expr.prefix && (expr.operator === '++' || expr.operator === '--')) {
			if (expr.argument.type === ASTNodeType.IDENTIFIER) {
				const name = expr.argument.name;
				const value = this.lookupVariable(name, expr);

				if (typeof value !== 'number') {
					throw this.createRuntimeError(
						`Cannot apply ${expr.operator} to non-number`,
						expr
					);
				}

				const newValue = expr.operator === '++' ? value + 1 : value - 1;
				this.assignVariable(name, newValue, expr);
				return value;
			}
			throw this.createRuntimeError('Invalid operand for increment/decrement', expr);
		}

		const arg = this.evaluate(expr.argument);

		if (expr.prefix && (expr.operator === '++' || expr.operator === '--')) {
			if (expr.argument.type === ASTNodeType.IDENTIFIER) {
				const name = expr.argument.name;
				if (typeof arg !== 'number') {
					throw this.createRuntimeError(
						`Cannot apply ${expr.operator} to non-number`,
						expr
					);
				}

				const newValue = expr.operator === '++' ? arg + 1 : arg - 1;
				this.assignVariable(name, newValue, expr);
				return newValue;
			}
			throw this.createRuntimeError('Invalid operand for increment/decrement', expr);
		}

		switch (expr.operator) {
			case '!':
				return !this.isTruthy(arg);
			case '-':
				if (typeof arg !== 'number') {
					throw this.createRuntimeError('Cannot negate non-number', expr);
				}
				return -arg;
			default:
				throw this.createRuntimeError(`Unknown unary operator: ${expr.operator}`, expr);
		}
	}

	private evaluateCall(expr: CallExpression): RuntimeValue {
		const callee = this.evaluate(expr.callee);

		const args = expr.arguments.map((arg) => this.evaluate(arg));

		if (callee && typeof callee === 'object' && 'type' in callee && callee.type === 'function') {
			const func = callee as RuntimeFunction & { isBuiltin?: boolean };

			if (func.isBuiltin) {
				if (func.name === 'print') {
					const str = this.stringify(args[0]);
					this.output.push(str);
					if (this.onOutput) {
						this.onOutput(str);
					}
					return null;
				}
				if (func.name === 'len') {
					const arg = args[0];
					if (this.isRuntimeArray(arg)) {
						return arg.elements.length;
					}
					if (typeof arg === 'string') {
						return arg.length;
					}
					throw this.createRuntimeError('Cannot get length of this type', expr);
				}
			}

			const previous = this.currentEnvironment;
			this.currentEnvironment = {
				variables: new Map(),
				parent: func.closure
			};

			for (let i = 0; i < func.params.length; i++) {
				this.currentEnvironment.variables.set(func.params[i], args[i] ?? null);
			}

			try {
				this.executeBlock(func.body);
			} catch (e) {
				if (e instanceof ReturnException) {
					return e.value;
				}
				throw e;
			} finally {
				this.currentEnvironment = previous;
			}

			return null;
		}

		throw this.createRuntimeError('Can only call functions', expr);
	}

	private evaluateMember(expr: MemberExpression): RuntimeValue {
		const object = this.evaluate(expr.object);

		if (this.isRuntimeArray(object)) {
			const index = this.evaluate(expr.property);
			if (typeof index === 'number' && Number.isInteger(index)) {
				if (index < 0 || index >= object.elements.length) {
					throw this.createRuntimeError(
						`Array index ${index} out of bounds (length: ${object.elements.length})`,
						expr
					);
				}
				return object.elements[index];
			}
			throw this.createRuntimeError('Array index must be an integer', expr);
		}

		throw this.createRuntimeError('Only arrays support index access', expr);
	}

	private evaluateArrayLiteral(expr: ArrayLiteral): RuntimeArray {
		return {
			type: 'array',
			elements: expr.elements.map((el) => this.evaluate(el))
		};
	}

	private evaluateIdentifier(expr: Identifier): RuntimeValue {
		return this.lookupVariable(expr.name, expr);
	}

	private lookupVariable(name: string, node: ASTNode): RuntimeValue {
		let env: Environment | undefined = this.currentEnvironment;

		while (env) {
			if (env.variables.has(name)) {
				return env.variables.get(name)!;
			}
			env = env.parent;
		}

		throw this.createRuntimeError(`Undefined variable: ${name}`, node);
	}

	private assignVariable(name: string, value: RuntimeValue, node: ASTNode): void {
		let env: Environment | undefined = this.currentEnvironment;

		while (env) {
			if (env.variables.has(name)) {
				const oldValue = env.variables.get(name);
				env.variables.set(name, value);

				if (this.onVariableChange && oldValue !== value) {
					this.onVariableChange(name, oldValue, value);
				}

				return;
			}
			env = env.parent;
		}

		throw this.createRuntimeError(`Undefined variable: ${name}`, node);
	}

	private isTruthy(value: RuntimeValue): boolean {
		if (value === null) return false;
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value !== 0;
		if (typeof value === 'string') return value.length > 0;
		if (this.isRuntimeArray(value)) return value.elements.length > 0;
		return true;
	}

	private isEqual(a: RuntimeValue, b: RuntimeValue): boolean {
		if (a === null && b === null) return true;
		if (a === null || b === null) return false;

		if (typeof a !== typeof b) return false;

		if (this.isRuntimeArray(a) && this.isRuntimeArray(b)) {
			if (a.elements.length !== b.elements.length) return false;
			for (let i = 0; i < a.elements.length; i++) {
				if (!this.isEqual(a.elements[i], b.elements[i])) return false;
			}
			return true;
		}

		return a === b;
	}

	private add(a: RuntimeValue, b: RuntimeValue): RuntimeValue {
		if (typeof a === 'number' && typeof b === 'number') return a + b;
		if (typeof a === 'string' || typeof b === 'string') {
			return this.stringify(a) + this.stringify(b);
		}
		return a;
	}

	private subtract(a: RuntimeValue, b: RuntimeValue): number {
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		throw new Error(`Cannot subtract ${typeof b} from ${typeof a}`);
	}

	private multiply(a: RuntimeValue, b: RuntimeValue): number {
		if (typeof a === 'number' && typeof b === 'number') return a * b;
		throw new Error(`Cannot multiply ${typeof a} and ${typeof b}`);
	}

	private divide(a: RuntimeValue, b: RuntimeValue): number {
		if (typeof a === 'number' && typeof b === 'number') {
			if (b === 0) throw new Error('Division by zero');
			return a / b;
		}
		throw new Error(`Cannot divide ${typeof a} by ${typeof b}`);
	}

	private modulo(a: RuntimeValue, b: RuntimeValue): number {
		if (typeof a === 'number' && typeof b === 'number') {
			if (b === 0) throw new Error('Modulo by zero');
			return a % b;
		}
		throw new Error(`Cannot compute modulo of ${typeof a} and ${typeof b}`);
	}

	private lessThan(a: RuntimeValue, b: RuntimeValue): boolean {
		if (typeof a === 'number' && typeof b === 'number') return a < b;
		if (typeof a === 'string' && typeof b === 'string') return a < b;
		throw new Error(`Cannot compare ${typeof a} and ${typeof b}`);
	}

	private lessThanOrEqual(a: RuntimeValue, b: RuntimeValue): boolean {
		if (typeof a === 'number' && typeof b === 'number') return a <= b;
		if (typeof a === 'string' && typeof b === 'string') return a <= b;
		throw new Error(`Cannot compare ${typeof a} and ${typeof b}`);
	}

	private greaterThan(a: RuntimeValue, b: RuntimeValue): boolean {
		if (typeof a === 'number' && typeof b === 'number') return a > b;
		if (typeof a === 'string' && typeof b === 'string') return a > b;
		throw new Error(`Cannot compare ${typeof a} and ${typeof b}`);
	}

	private greaterThanOrEqual(a: RuntimeValue, b: RuntimeValue): boolean {
		if (typeof a === 'number' && typeof b === 'number') return a >= b;
		if (typeof a === 'string' && typeof b === 'string') return a >= b;
		throw new Error(`Cannot compare ${typeof a} and ${typeof b}`);
	}

	private isRuntimeArray(value: RuntimeValue): value is RuntimeArray {
		return value !== null && typeof value === 'object' && 'type' in value && value.type === 'array';
	}

	private stringify(value: RuntimeValue): string {
		if (value === null) return 'null';
		if (typeof value === 'string') return value;
		if (this.isRuntimeArray(value)) {
			return `[${value.elements.map((e) => this.stringify(e)).join(', ')}]`;
		}
		if (typeof value === 'object' && 'type' in value && value.type === 'function') {
			return `<function ${(value as RuntimeFunction).name}>`;
		}
		return String(value);
	}

	private createRuntimeError(message: string, node: ASTNode): TinyLangError {
		return {
			message,
			line: node.startLine,
			column: node.startColumn,
			type: 'runtime'
		};
	}
}
