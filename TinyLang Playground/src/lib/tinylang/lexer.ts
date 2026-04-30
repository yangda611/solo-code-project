import { TokenType, type Token, type TinyLangError } from './types';

const KEYWORDS: Map<string, TokenType> = new Map([
	['let', TokenType.LET],
	['fn', TokenType.FUNCTION],
	['return', TokenType.RETURN],
	['if', TokenType.IF],
	['else', TokenType.ELSE],
	['while', TokenType.WHILE],
	['for', TokenType.FOR],
	['break', TokenType.BREAK],
	['continue', TokenType.CONTINUE],
	['true', TokenType.TRUE],
	['false', TokenType.FALSE],
	['null', TokenType.NULL]
]);

export class Lexer {
	private source: string;
	private tokens: Token[] = [];
	private errors: TinyLangError[] = [];
	private start = 0;
	private current = 0;
	private line = 1;
	private column = 1;
	private startColumn = 1;

	constructor(source: string) {
		this.source = source;
	}

	tokenize(): { tokens: Token[]; errors: TinyLangError[] } {
		while (!this.isAtEnd()) {
			this.start = this.current;
			this.startColumn = this.column;
			this.scanToken();
		}

		this.tokens.push({
			type: TokenType.EOF,
			lexeme: '',
			literal: null,
			line: this.line,
			column: this.column
		});

		return { tokens: this.tokens, errors: this.errors };
	}

	private scanToken(): void {
		const c = this.advance();

		switch (c) {
			case '(':
				this.addToken(TokenType.LEFT_PAREN);
				break;
			case ')':
				this.addToken(TokenType.RIGHT_PAREN);
				break;
			case '{':
				this.addToken(TokenType.LEFT_BRACE);
				break;
			case '}':
				this.addToken(TokenType.RIGHT_BRACE);
				break;
			case '[':
				this.addToken(TokenType.LEFT_BRACKET);
				break;
			case ']':
				this.addToken(TokenType.RIGHT_BRACKET);
				break;
			case ',':
				this.addToken(TokenType.COMMA);
				break;
			case ';':
				this.addToken(TokenType.SEMICOLON);
				break;
			case ':':
				this.addToken(TokenType.COLON);
				break;
			case '.':
				this.addToken(TokenType.DOT);
				break;
			case '+':
				if (this.match('+')) {
					this.addToken(TokenType.INCREMENT);
				} else if (this.match('=')) {
					this.addToken(TokenType.PLUS_ASSIGN);
				} else {
					this.addToken(TokenType.PLUS);
				}
				break;
			case '-':
				if (this.match('-')) {
					this.addToken(TokenType.DECREMENT);
				} else if (this.match('=')) {
					this.addToken(TokenType.MINUS_ASSIGN);
				} else {
					this.addToken(TokenType.MINUS);
				}
				break;
			case '*':
				if (this.match('=')) {
					this.addToken(TokenType.MULTIPLY_ASSIGN);
				} else {
					this.addToken(TokenType.MULTIPLY);
				}
				break;
			case '/':
				if (this.match('/')) {
					while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
				} else if (this.match('*')) {
					this.blockComment();
				} else if (this.match('=')) {
					this.addToken(TokenType.DIVIDE_ASSIGN);
				} else {
					this.addToken(TokenType.DIVIDE);
				}
				break;
			case '%':
				if (this.match('=')) {
					// %= not supported, but handle gracefully
					this.advance();
				} else {
					this.addToken(TokenType.MODULO);
				}
				break;
			case '!':
				this.addToken(this.match('=') ? TokenType.NOT_EQUAL : TokenType.NOT);
				break;
			case '=':
				this.addToken(this.match('=') ? TokenType.EQUAL : TokenType.ASSIGN);
				break;
			case '<':
				this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
				break;
			case '>':
				this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
				break;
			case '&':
				if (this.match('&')) {
					this.addToken(TokenType.AND);
				} else {
					this.error('Unexpected character: &');
				}
				break;
			case '|':
				if (this.match('|')) {
					this.addToken(TokenType.OR);
				} else {
					this.error('Unexpected character: |');
				}
				break;
			case ' ':
			case '\r':
			case '\t':
				break;
			case '\n':
				this.line++;
				this.column = 1;
				break;
			case '"':
			case "'":
				this.string(c);
				break;
			default:
				if (this.isDigit(c)) {
					this.number();
				} else if (this.isAlpha(c)) {
					this.identifier();
				} else {
					this.error(`Unexpected character: ${c}`);
				}
		}
	}

	private blockComment(): void {
		while (!this.isAtEnd()) {
			if (this.peek() === '*' && this.peekNext() === '/') {
				this.advance();
				this.advance();
				return;
			}
			if (this.peek() === '\n') {
				this.line++;
				this.column = 1;
			}
			this.advance();
		}
		this.error('Unterminated block comment');
	}

	private string(quote: string): void {
		while (this.peek() !== quote && !this.isAtEnd()) {
			if (this.peek() === '\n') {
				this.line++;
				this.column = 1;
			}
			this.advance();
		}

		if (this.isAtEnd()) {
			this.error('Unterminated string');
			return;
		}

		this.advance();

		const value = this.source.substring(this.start + 1, this.current - 1);
		this.addTokenWithLiteral(TokenType.STRING, value);
	}

	private number(): void {
		while (this.isDigit(this.peek())) this.advance();

		if (this.peek() === '.' && this.isDigit(this.peekNext())) {
			this.advance();
			while (this.isDigit(this.peek())) this.advance();
		}

		const value = parseFloat(this.source.substring(this.start, this.current));
		this.addTokenWithLiteral(TokenType.NUMBER, value);
	}

	private identifier(): void {
		while (this.isAlphaNumeric(this.peek())) this.advance();

		const text = this.source.substring(this.start, this.current);
		const type = KEYWORDS.get(text) ?? TokenType.IDENTIFIER;

		if (type === TokenType.TRUE) {
			this.addTokenWithLiteral(TokenType.TRUE, true);
		} else if (type === TokenType.FALSE) {
			this.addTokenWithLiteral(TokenType.FALSE, false);
		} else if (type === TokenType.NULL) {
			this.addTokenWithLiteral(TokenType.NULL, null);
		} else {
			this.addToken(type);
		}
	}

	private isAtEnd(): boolean {
		return this.current >= this.source.length;
	}

	private advance(): string {
		const char = this.source.charAt(this.current);
		this.current++;
		this.column++;
		return char;
	}

	private match(expected: string): boolean {
		if (this.isAtEnd()) return false;
		if (this.source.charAt(this.current) !== expected) return false;

		this.current++;
		this.column++;
		return true;
	}

	private peek(): string {
		if (this.isAtEnd()) return '\0';
		return this.source.charAt(this.current);
	}

	private peekNext(): string {
		if (this.current + 1 >= this.source.length) return '\0';
		return this.source.charAt(this.current + 1);
	}

	private isDigit(c: string): boolean {
		return c >= '0' && c <= '9';
	}

	private isAlpha(c: string): boolean {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
	}

	private isAlphaNumeric(c: string): boolean {
		return this.isAlpha(c) || this.isDigit(c);
	}

	private addToken(type: TokenType): void {
		this.addTokenWithLiteral(type, null);
	}

	private addTokenWithLiteral(type: TokenType, literal: number | string | boolean | null): void {
		const lexeme = this.source.substring(this.start, this.current);
		this.tokens.push({
			type,
			lexeme,
			literal,
			line: this.line,
			column: this.startColumn
		});
	}

	private error(message: string): void {
		this.errors.push({
			message,
			line: this.line,
			column: this.column,
			type: 'lexer'
		});
	}
}
