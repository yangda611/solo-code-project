import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { IncrementalJsonParser } from './json-parser.js'
import {
  createSession,
  saveParseState,
  getLastParseState,
  saveToken,
  saveAstNode,
  saveError,
  getSessionTokens,
  getSessionAstNodes,
  updateSessionProgress,
  getSession,
  getSessionErrors
} from './db.js'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  maxAge: 86400
}))

app.use('*', async (c, next) => {
  c.header('Connection', 'keep-alive')
  c.header('Keep-Alive', 'timeout=60')
  await next()
})

const parserInstances = new Map()

app.post('/api/session', async (c) => {
  const { totalChunks } = await c.req.json()
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2)
  
  createSession(sessionId, totalChunks)
  
  const parser = new IncrementalJsonParser(
    sessionId,
    saveParseState,
    saveToken,
    saveAstNode,
    saveError
  )
  parserInstances.set(sessionId, parser)
  
  return c.json({ sessionId, totalChunks })
})

app.post('/api/parse/:sessionId/:chunkIndex', async (c) => {
  const { sessionId, chunkIndex } = c.req.param()
  const { chunk } = await c.req.json()
  
  let parser = parserInstances.get(sessionId)
  
  if (!parser) {
    parser = new IncrementalJsonParser(
      sessionId,
      saveParseState,
      saveToken,
      saveAstNode,
      saveError
    )
    const lastState = getLastParseState(sessionId)
    if (lastState) {
      parser.setState(lastState)
    }
    parserInstances.set(sessionId, parser)
  }
  
  const result = parser.parse(chunk, parseInt(chunkIndex))
  
  const tokens = getSessionTokens(sessionId)
  const astNodes = getSessionAstNodes(sessionId)
  const errors = getSessionErrors(sessionId)
  const session = getSession(sessionId)
  
  if (session) {
    updateSessionProgress(sessionId, parseInt(chunkIndex) + 1)
  }
  
  return c.json({
    success: true,
    tokens,
    astNodes,
    errors,
    parserState: parser.getState(),
    progress: {
      processed: parseInt(chunkIndex) + 1,
      total: session?.total_chunks || 0
    }
  })
})

app.post('/api/finalize/:sessionId', async (c) => {
  const { sessionId } = c.req.param()
  const parser = parserInstances.get(sessionId)
  
  if (parser) {
    parser.finalize()
  }
  
  const tokens = getSessionTokens(sessionId)
  const astNodes = getSessionAstNodes(sessionId)
  const errors = getSessionErrors(sessionId)
  
  parserInstances.delete(sessionId)
  
  return c.json({
    success: true,
    tokens,
    astNodes,
    errors,
    complete: true
  })
})

app.get('/api/session/:sessionId', async (c) => {
  const { sessionId } = c.req.param()
  const session = getSession(sessionId)
  const tokens = getSessionTokens(sessionId)
  const astNodes = getSessionAstNodes(sessionId)
  const errors = getSessionErrors(sessionId)
  const lastState = getLastParseState(sessionId)
  
  return c.json({
    session,
    tokens,
    astNodes,
    errors,
    lastState
  })
})

app.get('/api/presets', async (c) => {
  return c.json({
    presets: [
      {
        id: 'string-boundary',
        name: '预设一：截断字符串跨越多个分片的边界恢复',
        description: '演示长字符串在分片边界被截断时的恢复机制，观察边界恢复闪烁效果',
        chunkCount: 3
      },
      {
        id: 'deep-nesting',
        name: '预设二：深层嵌套导致调用栈溢出的分块恢复',
        description: '演示深层嵌套JSON结构在分块解析时的栈管理，观察悬空等待状态',
        chunkCount: 5
      },
      {
        id: 'large-array',
        name: '预设三：数组内超大元素的内存压力测试',
        description: '演示大数组元素在分块解析时的内存使用和类型判定延迟',
        chunkCount: 4
      },
      {
        id: 'escape-detection',
        name: '预设四：非法转义字符在不同分片中的检测延迟',
        description: '演示转义字符跨分片时的错误检测延迟现象，观察红色波浪扩散动画',
        chunkCount: 3
      }
    ]
  })
})

app.post('/api/preset/:presetId/chunk/:chunkIndex', async (c) => {
  const { presetId, chunkIndex } = c.req.param()
  const idx = parseInt(chunkIndex)
  
  let chunk = ''
  
  switch (presetId) {
    case 'string-boundary':
      const stringChunks = [
        '{ "message": "这是一个非常',
        '长的字符串，它会跨越多个',
        '分片边界。" }'
      ]
      chunk = stringChunks[idx] || ''
      break
      
    case 'deep-nesting':
      const nestingChunks = [
        '{ "level1": { "level2": { "level3": { "level4": { ',
        '"level5": { "level6": { "level7": { "level8": { ',
        '"level9": { "level10": { "value": "深度嵌套测试"',
        ' } } } } } } } }',
        ' } } } }'
      ]
      chunk = nestingChunks[idx] || ''
      break
      
    case 'large-array':
      const arrayChunks = [
        '{ "data": [ 12345, 67890, "hello", true, null, { "nested": "value" }, ',
        '[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ], "very long string value here", ',
        'false, 3.141592653589793, { "a": 1, "b": 2, "c": 3 }, ',
        '42 ] }'
      ]
      chunk = arrayChunks[idx] || ''
      break
      
    case 'escape-detection':
      const escapeChunks = [
        '{ "valid": "正常字符串", "invalid1": "含有非法转义\\z的字符串',
        '在这里继续", "invalid2": "另一个错误\\x测试',
       '", "valid2": "正常结束" }'
      ]
      chunk = escapeChunks[idx] || ''
      break
  }
  
  return c.json({ chunk, chunkIndex: idx, presetId })
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})