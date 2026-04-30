export enum TokenType {
	// Keywords
	LET = 'LET',
	FUNCTION = 'FUNCTION',
	RETURN = 'RETURN',
	IF = 'IF',
	ELSE = 'ELSE',
	WHILE = 'WHILE',
	FOR = 'FOR',
	BREAK = 'BREAK',
	CONTINUE = 'CONTINUE',
	TRUE = 'TRUE',
	FALSE = 'FALSE',
	NULL = 'NULL',

	// Literals
	IDENTIFIER = 'IDENTIFIER',
	NUMBER = 'NUMBER',
	STRING = 'STRING',

	// Operators
	PLUS = 'PLUS',
	MINUS = 'MINUS',
	MULTIPLY = 'MULTIPLY',
	DIVIDE = 'DIVIDE',
	MODULO = 'MODULO',
	ASSIGN = 'ASSIGN',
	PLUS_ASSIGN = 'PLUS_ASSIGN',
	MINUS_ASSIGN = 'MINUS_ASSIGN',
	MULTIPLY_ASSIGN = 'MULTIPLY_ASSIGN',
	DIVIDE_ASSIGN = 'DIVIDE_ASSIGN',
	EQUAL = 'EQUAL',
	NOT_EQUAL = 'NOT_EQUAL',
	LESS = 'LESS',
	LESS_EQUAL = 'LESS_EQUAL',
	GREATER = 'GREATER',
	GREATER_EQUAL = 'GREATER_EQUAL',
	AND = 'AND',
	OR = 'OR',
	NOT = 'NOT',
	INCREMENT = 'INCREMENT',
	DECREMENT = 'DECREMENT',

	// Punctuation
	LEFT_PAREN = 'LEFT_PAREN',
	RIGHT_PAREN = 'RIGHT_PAREN',
	LEFT_BRACE = 'LEFT_BRACE',
	RIGHT_BRACE = 'RIGHT_BRACE',
	LEFT_BRACKET = 'LEFT_BRACKET',
	RIGHT_BRACKET = 'RIGHT_BRACKET',
	COMMA = 'COMMA',
	SEMICOLON = 'SEMICOLON',
	COLON = 'COLON',
	DOT = 'DOT',

	EOF = 'EOF'
}

export interface Token {
	type: TokenType;
	lexeme: string;
	literal: number | string | boolean | null;
	line: number;
	column: number;
}

export enum ASTNodeType {
	PROGRAM = 'Program',
	BLOCK_STATEMENT = 'BlockStatement',
	EXPRESSION_STATEMENT = 'ExpressionStatement',
	LET_STATEMENT = 'LetStatement',
	FUNCTION_DECLARATION = 'FunctionDeclaration',
	RETURN_STATEMENT = 'ReturnStatement',
	IF_STATEMENT = 'IfStatement',
	WHILE_STATEMENT = 'WhileStatement',
	FOR_STATEMENT = 'ForStatement',
	BREAK_STATEMENT = 'BreakStatement',
	CONTINUE_STATEMENT = 'ContinueStatement',
	ASSIGNMENT_EXPRESSION = 'AssignmentExpression',
	BINARY_EXPRESSION = 'BinaryExpression',
	UNARY_EXPRESSION = 'UnaryExpression',
	CALL_EXPRESSION = 'CallExpression',
	MEMBER_EXPRESSION = 'MemberExpression',
	ARRAY_LITERAL = 'ArrayLiteral',
	IDENTIFIER = 'Identifier',
	NUMBER_LITERAL = 'NumberLiteral',
	STRING_LITERAL = 'StringLiteral',
	BOOLEAN_LITERAL = 'BooleanLiteral',
	NULL_LITERAL = 'NullLiteral'
}

export interface ASTNode {
	type: ASTNodeType;
	startLine: number;
	startColumn: number;
	endLine: number;
	endColumn: number;
}

export interface Program extends ASTNode {
	type: ASTNodeType.PROGRAM;
	body: Statement[];
}

export type Statement =
	| BlockStatement
	| ExpressionStatement
	| LetStatement
	| FunctionDeclaration
	| ReturnStatement
	| IfStatement
	| WhileStatement
	| ForStatement
	| BreakStatement
	| ContinueStatement;

export interface BlockStatement extends ASTNode {
	type: ASTNodeType.BLOCK_STATEMENT;
	body: Statement[];
}

export interface ExpressionStatement extends ASTNode {
	type: ASTNodeType.EXPRESSION_STATEMENT;
	expression: Expression;
}

export interface LetStatement extends ASTNode {
	type: ASTNodeType.LET_STATEMENT;
	name: Identifier;
	value?: Expression;
}

export interface FunctionDeclaration extends ASTNode {
	type: ASTNodeType.FUNCTION_DECLARATION;
	name: Identifier;
	params: Identifier[];
	body: BlockStatement;
}

export interface ReturnStatement extends ASTNode {
	type: ASTNodeType.RETURN_STATEMENT;
	value?: Expression;
}

export interface IfStatement extends ASTNode {
	type: ASTNodeType.IF_STATEMENT;
	condition: Expression;
	consequent: BlockStatement;
	alternate?: BlockStatement | IfStatement;
}

export interface WhileStatement extends ASTNode {
	type: ASTNodeType.WHILE_STATEMENT;
	condition: Expression;
	body: BlockStatement;
}

export interface ForStatement extends ASTNode {
	type: ASTNodeType.FOR_STATEMENT;
	init?: LetStatement | ExpressionStatement;
	condition?: Expression;
	update?: ExpressionStatement;
	body: BlockStatement;
}

export interface BreakStatement extends ASTNode {
	type: ASTNodeType.BREAK_STATEMENT;
}

export interface ContinueStatement extends ASTNode {
	type: ASTNodeType.CONTINUE_STATEMENT;
}

export type Expression =
	| AssignmentExpression
	| BinaryExpression
	| UnaryExpression
	| CallExpression
	| MemberExpression
	| ArrayLiteral
	| Identifier
	| NumberLiteral
	| StringLiteral
	| BooleanLiteral
	| NullLiteral;

export interface AssignmentExpression extends ASTNode {
	type: ASTNodeType.ASSIGNMENT_EXPRESSION;
	operator: string;
	left: Expression;
	right: Expression;
}

export interface BinaryExpression extends ASTNode {
	type: ASTNodeType.BINARY_EXPRESSION;
	operator: string;
	left: Expression;
	right: Expression;
}

export interface UnaryExpression extends ASTNode {
	type: ASTNodeType.UNARY_EXPRESSION;
	operator: string;
	argument: Expression;
	prefix: boolean;
}

export interface CallExpression extends ASTNode {
	type: ASTNodeType.CALL_EXPRESSION;
	callee: Expression;
	arguments: Expression[];
}

export interface MemberExpression extends ASTNode {
	type: ASTNodeType.MEMBER_EXPRESSION;
	object: Expression;
	property: Expression;
	computed: boolean;
}

export interface ArrayLiteral extends ASTNode {
	type: ASTNodeType.ARRAY_LITERAL;
	elements: Expression[];
}

export interface Identifier extends ASTNode {
	type: ASTNodeType.IDENTIFIER;
	name: string;
}

export interface NumberLiteral extends ASTNode {
	type: ASTNodeType.NUMBER_LITERAL;
	value: number;
}

export interface StringLiteral extends ASTNode {
	type: ASTNodeType.STRING_LITERAL;
	value: string;
}

export interface BooleanLiteral extends ASTNode {
	type: ASTNodeType.BOOLEAN_LITERAL;
	value: boolean;
}

export interface NullLiteral extends ASTNode {
	type: ASTNodeType.NULL_LITERAL;
	value: null;
}

export type RuntimeValue =
	| number
	| string
	| boolean
	| null
	| RuntimeArray
	| RuntimeFunction;

export interface RuntimeArray {
	type: 'array';
	elements: RuntimeValue[];
}

export interface RuntimeFunction {
	type: 'function';
	name: string;
	params: string[];
	body: BlockStatement;
	closure: Environment;
}

export interface Environment {
	variables: Map<string, RuntimeValue>;
	parent?: Environment;
}

export interface ExecutionState {
	currentNode: ASTNode | null;
	variables: Map<string, RuntimeValue>;
	callStack: { name: string; line: number }[];
	output: string[];
	isPaused: boolean;
	isTerminated: boolean;
	error: TinyLangError | null;
	stepCount: number;
	maxSteps: number;
}

export interface TinyLangError {
	message: string;
	line: number;
	column: number;
	type: 'lexer' | 'parser' | 'runtime';
}

export enum WorkerMessageType {
	PARSE = 'PARSE',
	RUN = 'RUN',
	STEP = 'STEP',
	PAUSE = 'PAUSE',
	RESUME = 'RESUME',
	STOP = 'STOP',
	RESET = 'RESET',
	PARSE_RESULT = 'PARSE_RESULT',
	EXECUTION_STATE = 'EXECUTION_STATE',
	AST_VISIT = 'AST_VISIT',
	VARIABLE_CHANGE = 'VARIABLE_CHANGE',
	OUTPUT = 'OUTPUT',
	ERROR = 'ERROR',
	COMPLETED = 'COMPLETED'
}

export interface WorkerMessage {
	type: WorkerMessageType;
	data?: unknown;
}

export interface ParseResult {
	ast: Program | null;
	tokens: Token[];
	errors: TinyLangError[];
}

export interface ExecutionStep {
	node: ASTNode;
	line: number;
	column: number;
	variables: Map<string, RuntimeValue>;
	output: string;
}
