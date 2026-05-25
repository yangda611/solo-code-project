const STATES = {
  START: 'start',
  VALUE: 'value',
  OBJECT_START: 'object_start',
  OBJECT_KEY: 'object_key',
  COLON: 'colon',
  OBJECT_VALUE: 'object_value',
  COMMA: 'comma',
  ARRAY_START: 'array_start',
  ARRAY_VALUE: 'array_value',
  STRING: 'string',
  NUMBER: 'number',
  TRUE: 'true',
  FALSE: 'false',
  NULL: 'null',
  ESCAPE: 'escape',
  UNICODE: 'unicode'
}

export class IncrementalJsonParser {
  constructor(sessionId, saveStateCallback, saveTokenCallback, saveAstCallback, saveErrorCallback) {
    this.sessionId = sessionId
    this.saveStateCallback = saveStateCallback
    this.saveTokenCallback = saveTokenCallback
    this.saveAstCallback = saveAstCallback
    this.saveErrorCallback = saveErrorCallback
    
    this.reset()
  }

  reset() {
    this.state = STATES.START
    this.buffer = ''
    this.stack = []
    this.position = 0
    this.currentToken = null
    this.currentPath = []
    this.unicodeBuffer = ''
    this.chunkIndex = 0
    this.astNodeId = 0
    this.lastChunkBoundary = 0
    this.pendingErrors = []
  }

  getState() {
    return {
      state: this.state,
      buffer: this.buffer,
      stack: [...this.stack],
      position: this.position
    }
  }

  setState(savedState) {
    this.state = savedState.state
    this.buffer = savedState.buffer || ''
    this.stack = savedState.stack || []
    this.position = savedState.position || 0
  }

  generateNodeId() {
    return `node_${++this.astNodeId}`
  }

  getCurrentPath() {
    return this.currentPath.length > 0 ? '.' + this.currentPath.join('.') : ''
  }

  createAstNode(type, value, parentId = null) {
    const node = {
      id: this.generateNodeId(),
      type,
      parentId,
      path: this.getCurrentPath(),
      value: value !== undefined ? String(value) : null,
      depth: this.stack.length
    }
    this.saveAstCallback(this.sessionId, node)
    return node
  }

  emitToken(type, value, start, end) {
    const token = { type, value, start, end }
    this.saveTokenCallback(this.sessionId, this.chunkIndex, token, this.getCurrentPath())
    return token
  }

  emitError(message, position, severity = 'error') {
    this.saveErrorCallback(this.sessionId, this.chunkIndex, position, message, severity)
    this.pendingErrors.push({ message, position, severity })
  }

  parse(chunk, chunkIndex = 0) {
    this.chunkIndex = chunkIndex
    this.lastChunkBoundary = this.position
    const results = {
      tokens: [],
      astNodes: [],
      errors: [],
      complete: false,
      chunkBoundary: this.lastChunkBoundary
    }

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i]
      const pos = this.position

      try {
        switch (this.state) {
          case STATES.START:
            this.handleStart(char, pos)
            break
          case STATES.VALUE:
            this.handleValue(char, pos)
            break
          case STATES.OBJECT_START:
            this.handleObjectStart(char, pos)
            break
          case STATES.OBJECT_KEY:
            this.handleObjectKey(char, pos)
            break
          case STATES.COLON:
            this.handleColon(char, pos)
            break
          case STATES.OBJECT_VALUE:
            this.handleObjectValue(char, pos)
            break
          case STATES.COMMA:
            this.handleComma(char, pos)
            break
          case STATES.ARRAY_START:
            this.handleArrayStart(char, pos)
            break
          case STATES.ARRAY_VALUE:
            this.handleArrayValue(char, pos)
            break
          case STATES.STRING:
            this.handleString(char, pos)
            break
          case STATES.NUMBER:
            this.handleNumber(char, pos)
            break
          case STATES.TRUE:
            this.handleTrue(char, pos)
            break
          case STATES.FALSE:
            this.handleFalse(char, pos)
            break
          case STATES.NULL:
            this.handleNull(char, pos)
            break
          case STATES.ESCAPE:
            this.handleEscape(char, pos)
            break
          case STATES.UNICODE:
            this.handleUnicode(char, pos)
            break
        }
      } catch (e) {
        this.emitError(e.message, pos)
      }

      this.position++
    }

    this.saveStateCallback(this.sessionId, chunkIndex, this.getState())

    results.tokens = this.getTokensFromChunk()
    results.errors = [...this.pendingErrors]
    this.pendingErrors = []
    results.complete = this.stack.length === 0 && this.state === STATES.START && this.position > 0

    return results
  }

  getTokensFromChunk() {
    return []
  }

  handleStart(char, pos) {
    if (char === '{') {
      this.emitToken('object_start', '{', pos, pos)
      this.stack.push({ type: 'object', node: this.createAstNode('object') })
      this.state = STATES.OBJECT_START
    } else if (char === '[') {
      this.emitToken('array_start', '[', pos, pos)
      this.stack.push({ type: 'array', node: this.createAstNode('array'), index: 0 })
      this.state = STATES.ARRAY_START
    } else if (!/\s/.test(char)) {
      this.emitError(`Unexpected character '${char}' at start`, pos)
    }
  }

  handleValue(char, pos) {
    if (char === '"') {
      this.currentToken = { type: 'string', value: '', start: pos }
      this.state = STATES.STRING
    } else if (char === '{') {
      this.emitToken('object_start', '{', pos, pos)
      this.stack.push({ type: 'object', node: this.createAstNode('object') })
      this.state = STATES.OBJECT_START
    } else if (char === '[') {
      this.emitToken('array_start', '[', pos, pos)
      this.stack.push({ type: 'array', node: this.createAstNode('array'), index: 0 })
      this.state = STATES.ARRAY_START
    } else if (char === 't') {
      this.currentToken = { type: 'true', value: 't', start: pos }
      this.state = STATES.TRUE
    } else if (char === 'f') {
      this.currentToken = { type: 'false', value: 'f', start: pos }
      this.state = STATES.FALSE
    } else if (char === 'n') {
      this.currentToken = { type: 'null', value: 'n', start: pos }
      this.state = STATES.NULL
    } else if (char === '-' || /\d/.test(char)) {
      this.currentToken = { type: 'number', value: char, start: pos }
      this.state = STATES.NUMBER
    } else if (!/\s/.test(char)) {
      this.emitError(`Unexpected character '${char}'`, pos)
    }
  }

  handleObjectStart(char, pos) {
    if (char === '"') {
      this.currentToken = { type: 'key', value: '', start: pos }
      this.state = STATES.OBJECT_KEY
    } else if (char === '}') {
      this.emitToken('object_end', '}', pos, pos)
      const frame = this.stack.pop()
      if (frame && this.currentPath.length > 0) {
        this.currentPath.pop()
      }
      this.afterContainer(pos)
    } else if (!/\s/.test(char)) {
      this.emitError(`Expected '\"' or '}}' but got '${char}'`, pos)
    }
  }

  handleObjectKey(char, pos) {
    if (char === '"') {
      this.emitToken('key', this.currentToken.value, this.currentToken.start, pos)
      this.currentPath.push(this.currentToken.value)
      this.createAstNode('key', this.currentToken.value)
      this.state = STATES.COLON
    } else if (char === '\\') {
      this.state = STATES.ESCAPE
    } else {
      this.currentToken.value += char
    }
  }

  handleColon(char, pos) {
    if (char === ':') {
      this.emitToken('colon', ':', pos, pos)
      this.state = STATES.OBJECT_VALUE
    } else if (!/\s/.test(char)) {
      this.emitError(`Expected ':' but got '${char}'`, pos)
    }
  }

  handleObjectValue(char, pos) {
    this.handleValue(char, pos)
    if (this.state === STATES.OBJECT_VALUE && /\s/.test(char)) {
      return
    }
    if (this.state !== STATES.OBJECT_VALUE) {
      const frame = this.stack[this.stack.length - 1]
      if (frame) frame.expectingColon = false
    }
  }

  handleComma(char, pos) {
    if (char === ',') {
      this.emitToken('comma', ',', pos, pos)
      const frame = this.stack[this.stack.length - 1]
      if (frame) {
        if (frame.type === 'object') {
          this.currentPath.pop()
          this.state = STATES.OBJECT_START
        } else if (frame.type === 'array') {
          frame.index++
          this.state = STATES.ARRAY_VALUE
        }
      }
    } else if (char === '}') {
      this.emitToken('object_end', '}', pos, pos)
      this.stack.pop()
      this.currentPath.pop()
      this.afterContainer(pos)
    } else if (char === ']') {
      this.emitToken('array_end', ']', pos, pos)
      this.stack.pop()
      this.currentPath.pop()
      this.afterContainer(pos)
    } else if (!/\s/.test(char)) {
      this.emitError(`Expected ',' or ']' or '}}' but got '${char}'`, pos)
    }
  }

  handleArrayStart(char, pos) {
    if (char === ']') {
      this.emitToken('array_end', ']', pos, pos)
      this.stack.pop()
      this.afterContainer(pos)
    } else if (!/\s/.test(char)) {
      const frame = this.stack[this.stack.length - 1]
      if (frame) {
        this.currentPath.push(String(frame.index))
      }
      this.state = STATES.ARRAY_VALUE
      this.handleValue(char, pos)
    }
  }

  handleArrayValue(char, pos) {
    this.handleValue(char, pos)
  }

  handleString(char, pos) {
    if (char === '"') {
      this.emitToken('string', this.currentToken.value, this.currentToken.start, pos)
      this.createAstNode('string', this.currentToken.value)
      this.state = STATES.COMMA
    } else if (char === '\\') {
      this.state = STATES.ESCAPE
    } else {
      this.currentToken.value += char
    }
  }

  handleEscape(char, pos) {
    const escapeMap = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      'b': '\b',
      'f': '\f',
      'n': '\n',
      'r': '\r',
      't': '\t'
    }

    if (char in escapeMap) {
      this.currentToken.value += escapeMap[char]
      this.state = this.currentToken.type === 'key' ? STATES.OBJECT_KEY : STATES.STRING
    } else if (char === 'u') {
      this.unicodeBuffer = ''
      this.state = STATES.UNICODE
    } else {
      this.emitError(`Invalid escape character: \\${char}`, pos)
      this.currentToken.value += char
      this.state = this.currentToken.type === 'key' ? STATES.OBJECT_KEY : STATES.STRING
    }
  }

  handleUnicode(char, pos) {
    if (/[0-9a-fA-F]/.test(char)) {
      this.unicodeBuffer += char
      if (this.unicodeBuffer.length === 4) {
        const code = parseInt(this.unicodeBuffer, 16)
        this.currentToken.value += String.fromCharCode(code)
        this.state = this.currentToken.type === 'key' ? STATES.OBJECT_KEY : STATES.STRING
      }
    } else {
      this.emitError(`Invalid unicode escape: \\u${this.unicodeBuffer}${char}`, pos)
      this.state = this.currentToken.type === 'key' ? STATES.OBJECT_KEY : STATES.STRING
    }
  }

  handleNumber(char, pos) {
    if (/[\d.eE+-]/.test(char)) {
      this.currentToken.value += char
    } else {
      this.emitToken('number', this.currentToken.value, this.currentToken.start, pos - 1)
      this.createAstNode('number', this.currentToken.value)
      this.state = STATES.COMMA
      this.position--
    }
  }

  handleTrue(char, pos) {
    this.currentToken.value += char
    if (this.currentToken.value === 'true') {
      this.emitToken('true', 'true', this.currentToken.start, pos)
      this.createAstNode('boolean', true)
      this.state = STATES.COMMA
    } else if (!'rue'.startsWith(this.currentToken.value.slice(1))) {
      this.emitError(`Invalid token: ${this.currentToken.value}`, pos)
    }
  }

  handleFalse(char, pos) {
    this.currentToken.value += char
    if (this.currentToken.value === 'false') {
      this.emitToken('false', 'false', this.currentToken.start, pos)
      this.createAstNode('boolean', false)
      this.state = STATES.COMMA
    } else if (!'alse'.startsWith(this.currentToken.value.slice(1))) {
      this.emitError(`Invalid token: ${this.currentToken.value}`, pos)
    }
  }

  handleNull(char, pos) {
    this.currentToken.value += char
    if (this.currentToken.value === 'null') {
      this.emitToken('null', 'null', this.currentToken.start, pos)
      this.createAstNode('null', null)
      this.state = STATES.COMMA
    } else if (!'ull'.startsWith(this.currentToken.value.slice(1))) {
      this.emitError(`Invalid token: ${this.currentToken.value}`, pos)
    }
  }

  afterContainer(pos) {
    if (this.stack.length === 0) {
      this.state = STATES.START
    } else {
      this.state = STATES.COMMA
    }
  }

  finalize() {
    if (this.currentToken && this.currentToken.type === 'number') {
      this.emitToken('number', this.currentToken.value, this.currentToken.start, this.position)
      this.createAstNode('number', this.currentToken.value)
    }
    
    if (this.stack.length > 0) {
      this.emitError(`Unexpected end of input. Missing ${this.stack.length} closing brackets`, this.position)
    }

    if (this.state === STATES.STRING || this.state === STATES.OBJECT_KEY) {
      this.emitError('Unterminated string', this.position)
    }
  }
}

export { STATES }