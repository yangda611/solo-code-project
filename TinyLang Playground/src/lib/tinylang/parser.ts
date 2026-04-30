import { TokenType, type Token, type TinyLangError, type Program, type Statement, type Expression, type BlockStatement, type LetStatement, type FunctionDeclaration, type ReturnStatement, type IfStatement, type WhileStatement, type ForStatement, type BreakStatement, type ContinueStatement, type ExpressionStatement, type AssignmentExpression, type BinaryExpression, type UnaryExpression, type CallExpression, type MemberExpression, type ArrayLiteral, type Identifier, type NumberLiteral, type StringLiteral, type BooleanLiteral, type NullLiteral, ASTNodeType } from './types';

export class Parser {
	private tokens: Token[];
	private errors: TinyLangError[] = [];
	private current = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): { ast: Program | null; errors: TinyLangError[] } {
		const statements: Statement[] = [];

		while (!this.isAtEnd()) {
			const stmt = this.declaration();
			if (stmt) {
				statements.push(stmt);
			}
		}

		if (this.errors.length > 0) {
			return { ast: null, errors: this.errors };
		}

		const firstToken = this.tokens[0];
		const lastToken = this.tokens[this.tokens.length - 2];

		return {
			ast: {
				type: ASTNodeType.PROGRAM,
				body: statements,
				startLine: firstToken?.line ?? 1,
				startColumn: firstToken?.column ?? 1,
				endLine: lastToken?.line ?? 1,
				endColumn: lastToken?.column ?? 1
			},
			errors: this.errors
		};
	}

	private declaration(): Statement | null {
		try {
			if (this.match(TokenType.LET)) return this.letDeclaration();
			if (this.match(TokenType.FUNCTION)) return this.functionDeclaration();
			return this.statement();
		} catch {
			this.synchronize();
			return null;
		}
	}

	private letDeclaration(): LetStatement {
		const keywordToken = this.previous();
		const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

		let value: Expression | undefined;
		if (this.match(TokenType.ASSIGN)) {
			value = this.expression();
		}

		this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

		return {
			type: ASTNodeType.LET_STATEMENT,
			name: {
				type: ASTNodeType.IDENTIFIER,
				name: name.lexeme,
				startLine: name.line,
				startColumn: name.column,
				endLine: name.line,
				endColumn: name.column + name.lexeme.length
			},
			value,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: this.previous().line,
			endColumn: this.previous().column + 1
		};
	}

	private functionDeclaration(): FunctionDeclaration {
		const keywordToken = this.previous();
		const name = this.consume(TokenType.IDENTIFIER, 'Expect function name.');

		this.consume(TokenType.LEFT_PAREN, "Expect '(' after function name.");

		const params: Identifier[] = [];
		if (!this.check(TokenType.RIGHT_PAREN)) {
			do {
				const param = this.consume(TokenType.IDENTIFIER, 'Expect parameter name.');
				params.push({
					type: ASTNodeType.IDENTIFIER,
					name: param.lexeme,
					startLine: param.line,
					startColumn: param.column,
					endLine: param.line,
					endColumn: param.column + param.lexeme.length
				});
			} while (this.match(TokenType.COMMA));
		}

		this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
		this.consume(TokenType.LEFT_BRACE, "Expect '{' before function body.");

		const body = this.block();

		return {
			type: ASTNodeType.FUNCTION_DECLARATION,
			name: {
				type: ASTNodeType.IDENTIFIER,
				name: name.lexeme,
				startLine: name.line,
				startColumn: name.column,
				endLine: name.line,
				endColumn: name.column + name.lexeme.length
			},
			params,
			body,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: body.endLine,
			endColumn: body.endColumn
		};
	}

	private statement(): Statement {
		if (this.match(TokenType.IF)) return this.ifStatement();
		if (this.match(TokenType.WHILE)) return this.whileStatement();
		if (this.match(TokenType.FOR)) return this.forStatement();
		if (this.match(TokenType.RETURN)) return this.returnStatement();
		if (this.match(TokenType.BREAK)) return this.breakStatement();
		if (this.match(TokenType.CONTINUE)) return this.continueStatement();
		if (this.match(TokenType.LEFT_BRACE)) return this.block();

		return this.expressionStatement();
	}

	private ifStatement(): IfStatement {
		const keywordToken = this.previous();
		this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
		const condition = this.expression();
		this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

		this.consume(TokenType.LEFT_BRACE, "Expect '{' before if body.");
		const consequent = this.block();

		let alternate: BlockStatement | IfStatement | undefined;
		if (this.match(TokenType.ELSE)) {
			if (this.match(TokenType.IF)) {
				alternate = this.ifStatement();
			} else {
				this.consume(TokenType.LEFT_BRACE, "Expect '{' before else body.");
				alternate = this.block();
			}
		}

		return {
			type: ASTNodeType.IF_STATEMENT,
			condition,
			consequent,
			alternate,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: alternate ? alternate.endLine : consequent.endLine,
			endColumn: alternate ? alternate.endColumn : consequent.endColumn
		};
	}

	private whileStatement(): WhileStatement {
		const keywordToken = this.previous();
		this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
		const condition = this.expression();
		this.consume(TokenType.RIGHT_PAREN, "Expect ')' after while condition.");

		this.consume(TokenType.LEFT_BRACE, "Expect '{' before while body.");
		const body = this.block();

		return {
			type: ASTNodeType.WHILE_STATEMENT,
			condition,
			body,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: body.endLine,
			endColumn: body.endColumn
		};
	}

	private forStatement(): ForStatement {
		const keywordToken = this.previous();
		this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

		let init: LetStatement | ExpressionStatement | undefined;
		if (this.match(TokenType.SEMICOLON)) {
			// No init
		} else if (this.match(TokenType.LET)) {
			init = this.letDeclaration();
		} else {
			init = this.expressionStatement();
		}

		let condition: Expression | undefined;
		if (!this.check(TokenType.SEMICOLON)) {
			condition = this.expression();
		}
		this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

		let update: ExpressionStatement | undefined;
		if (!this.check(TokenType.RIGHT_PAREN)) {
			update = {
				type: ASTNodeType.EXPRESSION_STATEMENT,
				expression: this.expression(),
				startLine: 0,
				startColumn: 0,
				endLine: 0,
				endColumn: 0
			};
		}
		this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

		this.consume(TokenType.LEFT_BRACE, "Expect '{' before for body.");
		const body = this.block();

		return {
			type: ASTNodeType.FOR_STATEMENT,
			init,
			condition,
			update,
			body,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: body.endLine,
			endColumn: body.endColumn
		};
	}

	private returnStatement(): ReturnStatement {
		const keywordToken = this.previous();
		let value: Expression | undefined;

		if (!this.check(TokenType.SEMICOLON)) {
			value = this.expression();
		}

		this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");

		return {
			type: ASTNodeType.RETURN_STATEMENT,
			value,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: this.previous().line,
			endColumn: this.previous().column + 1
		};
	}

	private breakStatement(): BreakStatement {
		const keywordToken = this.previous();
		this.consume(TokenType.SEMICOLON, "Expect ';' after 'break'.");

		return {
			type: ASTNodeType.BREAK_STATEMENT,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: this.previous().line,
			endColumn: this.previous().column + 1
		};
	}

	private continueStatement(): ContinueStatement {
		const keywordToken = this.previous();
		this.consume(TokenType.SEMICOLON, "Expect ';' after 'continue'.");

		return {
			type: ASTNodeType.CONTINUE_STATEMENT,
			startLine: keywordToken.line,
			startColumn: keywordToken.column,
			endLine: this.previous().line,
			endColumn: this.previous().column + 1
		};
	}

	private block(): BlockStatement {
		const startToken = this.previous();
		const statements: Statement[] = [];

		while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
			const decl = this.declaration();
			if (decl) statements.push(decl);
		}

		const endToken = this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

		return {
			type: ASTNodeType.BLOCK_STATEMENT,
			body: statements,
			startLine: startToken.line,
			startColumn: startToken.column,
			endLine: endToken.line,
			endColumn: endToken.column + 1
		};
	}

	private expressionStatement(): ExpressionStatement {
		const expression = this.expression();
		const endToken = this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");

		return {
			type: ASTNodeType.EXPRESSION_STATEMENT,
			expression,
			startLine: expression.startLine,
			startColumn: expression.startColumn,
			endLine: endToken.line,
			endColumn: endToken.column + 1
		};
	}

	private expression(): Expression {
		return this.assignment();
	}

	private assignment(): Expression {
		const expr = this.or();

		if (
			this.match(TokenType.ASSIGN) ||
			this.match(TokenType.PLUS_ASSIGN) ||
			this.match(TokenType.MINUS_ASSIGN) ||
			this.match(TokenType.MULTIPLY_ASSIGN) ||
			this.match(TokenType.DIVIDE_ASSIGN)
		) {
			const operator = this.previous().lexeme;
			const value = this.assignment();

			if (
				expr.type === ASTNodeType.IDENTIFIER ||
				expr.type === ASTNodeType.MEMBER_EXPRESSION
			) {
				return {
					type: ASTNodeType.ASSIGNMENT_EXPRESSION,
					operator,
					left: expr,
					right: value,
					startLine: expr.startLine,
					startColumn: expr.startColumn,
					endLine: value.endLine,
					endColumn: value.endColumn
				};
			}

			this.error('Invalid assignment target.', this.previous());
		}

		return expr;
	}

	private or(): Expression {
		let expr = this.and();

		while (this.match(TokenType.OR)) {
			const operator = this.previous().lexeme;
			const right = this.and();
			expr = {
				type: ASTNodeType.BINARY_EXPRESSION,
				operator,
				left: expr,
				right,
				startLine: expr.startLine,
				startColumn: expr.startColumn,
				endLine: right.endLine,
				endColumn: right.endColumn
			};
		}

		return expr;
	}

	private and(): Expression {
		let expr = this.equality();

		while (this.match(TokenType.AND)) {
			const operator = this.previous().lexeme;
			const right = this.equality();
			expr = {
				type: ASTNodeType.BINARY_EXPRESSION,
				operator,
				left: expr,
				right,
				startLine: expr.startLine,
				startColumn: expr.startColumn,
				endLine: right.endLine,
				endColumn: right.endColumn
			};
		}

		return expr;
	}

	private equality(): Expression {
		let expr = this.comparison();

		while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
			const operator = this.previous().lexeme;
			const right = this.comparison();
			expr = {
				type: ASTNodeType.BINARY_EXPRESSION,
				operator,
				left: expr,
				right,
				startLine: expr.startLine,
				startColumn: expr.startColumn,
				endLine: right.endLine,
				endColumn: right.endColumn
			};
		}

		return expr;
	}

	private comparison(): Expression {
		let expr = this.term();

		while (
			this.match(TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER, TokenType.GREATER_EQUAL)
		) {
			const operator = this.previous().lexeme;
			const right = this.term();
			expr = {
				type: ASTNodeType.BINARY_EXPRESSION,
				operator,
				left: expr,
				right,
				startLine: expr.startLine,
				startColumn: expr.startColumn,
				endLine: right.endLine,
				endColumn: right.endColumn
			};
		}

		return expr;
	}

	private term(): Expression {
		let expr = this.factor();

		while (this.match(TokenType.PLUS, TokenType.MINUS)) {
			const operator = this.previous().lexeme;
			const right = this.factor();
			expr = {
				type: ASTNodeType.BINARY_EXPRESSION,
				operator,
				left: expr,
				right,
				startLine: expr.startLine,
				startColumn: expr.startColumn,
				endLine: right.endLine,
				endColumn: right.endColumn
			};
		}

		return expr;
	}

	private factor(): Expression {
		let expr = this.unary();

		while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
			const operator = this.previous().lexeme;
			const right = this.unary();
			expr = {
				type: ASTNodeType.BINARY_EXPRESSION,
				operator,
				left: expr,
				right,
				startLine: expr.startLine,
				startColumn: expr.startColumn,
				endLine: right.endLine,
				endColumn: right.endColumn
			};
		}

		return expr;
	}

	private unary(): Expression {
		if (this.match(TokenType.NOT, TokenType.MINUS)) {
			const operator = this.previous().lexeme;
			const argument = this.unary();
			return {
				type: ASTNodeType.UNARY_EXPRESSION,
				operator,
				argument,
				prefix: true,
				startLine: this.previous().line,
				startColumn: this.previous().column,
				endLine: argument.endLine,
				endColumn: argument.endColumn
			};
		}

		if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
			const operator = this.previous().lexeme;
			const argument = this.unary();
			return {
				type: ASTNodeType.UNARY_EXPRESSION,
				operator,
				argument,
				prefix: true,
				startLine: this.previous().line,
				startColumn: this.previous().column,
				endLine: argument.endLine,
				endColumn: argument.endColumn
			};
		}

		return this.call();
	}

	private call(): Expression {
		let expr = this.primary();

		while (true) {
			if (this.match(TokenType.LEFT_PAREN)) {
				expr = this.finishCall(expr);
			} else if (this.match(TokenType.LEFT_BRACKET)) {
				const property = this.expression();
				const bracket = this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after index.");
				expr = {
					type: ASTNodeType.MEMBER_EXPRESSION,
					object: expr,
					property,
					computed: true,
					startLine: expr.startLine,
					startColumn: expr.startColumn,
					endLine: bracket.line,
					endColumn: bracket.column + 1
				};
			} else if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
				const operator = this.previous().lexeme;
				expr = {
					type: ASTNodeType.UNARY_EXPRESSION,
					operator,
					argument: expr,
					prefix: false,
					startLine: expr.startLine,
					startColumn: expr.startColumn,
					endLine: this.previous().line,
					endColumn: this.previous().column + 1
				};
			} else {
				break;
			}
		}

		return expr;
	}

	private finishCall(callee: Expression): CallExpression {
		const args: Expression[] = [];
		if (!this.check(TokenType.RIGHT_PAREN)) {
			do {
				args.push(this.expression());
			} while (this.match(TokenType.COMMA));
		}

		const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

		return {
			type: ASTNodeType.CALL_EXPRESSION,
			callee,
			arguments: args,
			startLine: callee.startLine,
			startColumn: callee.startColumn,
			endLine: paren.line,
			endColumn: paren.column + 1
		};
	}

	private primary(): Expression {
		if (this.match(TokenType.FALSE)) {
			const token = this.previous();
			return {
				type: ASTNodeType.BOOLEAN_LITERAL,
				value: false,
				startLine: token.line,
				startColumn: token.column,
				endLine: token.line,
				endColumn: token.column + token.lexeme.length
			};
		}

		if (this.match(TokenType.TRUE)) {
			const token = this.previous();
			return {
				type: ASTNodeType.BOOLEAN_LITERAL,
				value: true,
				startLine: token.line,
				startColumn: token.column,
				endLine: token.line,
				endColumn: token.column + token.lexeme.length
			};
		}

		if (this.match(TokenType.NULL)) {
			const token = this.previous();
			return {
				type: ASTNodeType.NULL_LITERAL,
				value: null,
				startLine: token.line,
				startColumn: token.column,
				endLine: token.line,
				endColumn: token.column + token.lexeme.length
			};
		}

		if (this.match(TokenType.NUMBER)) {
			const token = this.previous();
			return {
				type: ASTNodeType.NUMBER_LITERAL,
				value: token.literal as number,
				startLine: token.line,
				startColumn: token.column,
				endLine: token.line,
				endColumn: token.column + token.lexeme.length
			};
		}

		if (this.match(TokenType.STRING)) {
			const token = this.previous();
			return {
				type: ASTNodeType.STRING_LITERAL,
				value: token.literal as string,
				startLine: token.line,
				startColumn: token.column,
				endLine: token.line,
				endColumn: token.column + token.lexeme.length
			};
		}

		if (this.match(TokenType.IDENTIFIER)) {
			const token = this.previous();
			return {
				type: ASTNodeType.IDENTIFIER,
				name: token.lexeme,
				startLine: token.line,
				startColumn: token.column,
				endLine: token.line,
				endColumn: token.column + token.lexeme.length
			};
		}

		if (this.match(TokenType.LEFT_PAREN)) {
			const expr = this.expression();
			this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
			return expr;
		}

		if (this.match(TokenType.LEFT_BRACKET)) {
			const startToken = this.previous();
			const elements: Expression[] = [];
			if (!this.check(TokenType.RIGHT_BRACKET)) {
				do {
					elements.push(this.expression());
				} while (this.match(TokenType.COMMA));
			}
			const endToken = this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after array literal.");

			return {
				type: ASTNodeType.ARRAY_LITERAL,
				elements,
				startLine: startToken.line,
				startColumn: startToken.column,
				endLine: endToken.line,
				endColumn: endToken.column + 1
			};
		}

		throw this.error('Expect expression.', this.peek());
	}

	private match(...types: TokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private consume(type: TokenType, message: string): Token {
		if (this.check(type)) return this.advance();

		throw this.error(message, this.peek());
	}

	private check(type: TokenType): boolean {
		if (this.isAtEnd()) return false;
		return this.peek().type === type;
	}

	private advance(): Token {
		if (!this.isAtEnd()) this.current++;
		return this.previous();
	}

	private isAtEnd(): boolean {
		return this.peek().type === TokenType.EOF;
	}

	private peek(): Token {
		return this.tokens[this.current];
	}

	private previous(): Token {
		return this.tokens[this.current - 1];
	}

	private error(message: string, token: Token): TinyLangError {
		const err: TinyLangError = {
			message,
			line: token.line,
			column: token.column,
			type: 'parser'
		};
		this.errors.push(err);
		return err;
	}

	private synchronize(): void {
		this.advance();

		while (!this.isAtEnd()) {
			if (this.previous().type === TokenType.SEMICOLON) return;

			switch (this.peek().type) {
				case TokenType.FUNCTION:
				case TokenType.LET:
				case TokenType.IF:
				case TokenType.WHILE:
				case TokenType.FOR:
				case TokenType.RETURN:
					return;
			}

			this.advance();
		}
	}
}
