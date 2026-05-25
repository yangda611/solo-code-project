<script>
  import { onMount } from 'svelte'
  import ProgressRing from './ProgressRing.svelte'
  import JsonViewer from './JsonViewer.svelte'
  import AstTree from './AstTree.svelte'
  import ErrorDisplay from './ErrorDisplay.svelte'

  let presets = []
  let selectedPreset = null
  let sessionId = null
  let tokens = []
  let astNodes = []
  let errors = []
  let progress = 0
  let isParsing = false
  let currentChunk = 0
  let parserState = null
  let chunkBoundaries = []

  const API_BASE = '/api'

  async function safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'same-origin'
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      return await res.json()
    } catch (err) {
      console.warn('Fetch error, retrying...', err.message)
      await new Promise(r => setTimeout(r, 300))
      const res = await fetch(url, options)
      return await res.json()
    }
  }

  onMount(async () => {
    try {
      const data = await safeFetch(`${API_BASE}/presets`)
      presets = data.presets
    } catch (err) {
      console.error('Failed to load presets:', err)
    }
  })

  async function startPreset(preset) {
    selectedPreset = preset
    tokens = []
    astNodes = []
    errors = []
    chunkBoundaries = []
    currentChunk = 0
    progress = 0

    try {
      const sessionData = await safeFetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalChunks: preset.chunkCount })
      })
      sessionId = sessionData.sessionId

      await parseChunks(preset)
    } catch (err) {
      console.error('Session error:', err)
      isParsing = false
    }
  }

  async function parseChunks(preset) {
    isParsing = true
    
    for (let i = 0; i < preset.chunkCount; i++) {
      currentChunk = i
      
      try {
        const chunkData = await safeFetch(`${API_BASE}/preset/${preset.id}/chunk/${i}`, {
          method: 'POST'
        })
        
        chunkBoundaries.push({
          index: i,
          start: tokens.length > 0 ? tokens[tokens.length - 1].end_pos + 1 : 0,
          content: chunkData.chunk
        })

        await new Promise(r => setTimeout(r, 600))

        const parseData = await safeFetch(`${API_BASE}/parse/${sessionId}/${i}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunk: chunkData.chunk })
        })
        
        tokens = parseData.tokens
        astNodes = parseData.astNodes
        errors = parseData.errors
        parserState = parseData.parserState
        progress = ((i + 1) / preset.chunkCount) * 100

        await new Promise(r => setTimeout(r, 400))
      } catch (err) {
        console.error(`Chunk ${i} error:`, err)
      }
    }

    try {
      await fetch(`${API_BASE}/finalize/${sessionId}`, { method: 'POST' })
    } catch (err) {
      console.warn('Finalize error:', err)
    }
    
    isParsing = false
  }

  function reset() {
    selectedPreset = null
    sessionId = null
    tokens = []
    astNodes = []
    errors = []
    progress = 0
    isParsing = false
    chunkBoundaries = []
  }
</script>

<main class="app">
  <header>
    <h1>JSON 分块解析与语法高亮系统</h1>
    <p>状态机驱动的流式解析器 · 路径索引缓存 · SQLite 持久化</p>
  </header>

  {#if !selectedPreset}
    <div class="preset-selector">
      <h2>选择预设测试场景</h2>
      <div class="preset-grid">
        {#each presets as preset}
          <button class="preset-card" on:click={() => startPreset(preset)}>
            <h3>{preset.name}</h3>
            <p>{preset.description}</p>
            <span class="chunk-count">{preset.chunkCount} 个分片</span>
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="parser-container">
      <div class="control-panel">
        <div class="preset-info">
          <h3>{selectedPreset.name}</h3>
          <p>{selectedPreset.description}</p>
        </div>
        <ProgressRing {progress} {isParsing} />
        <div class="chunk-status">
          <span>分片: {currentChunk + 1} / {selectedPreset.chunkCount}</span>
          {#if isParsing}
            <span class="parsing-indicator">解析中...</span>
          {/if}
        </div>
        <button class="reset-btn" on:click={reset} disabled={isParsing}>
          重新开始
        </button>
      </div>

      <div class="content-grid">
        <div class="panel json-panel">
          <h2>JSON 视图</h2>
          <JsonViewer {tokens} {errors} {chunkBoundaries} {isParsing} />
        </div>

        <div class="panel ast-panel">
          <h2>AST 树形结构</h2>
          <AstTree {astNodes} {isParsing} />
        </div>
      </div>

      {#if errors.length > 0}
        <ErrorDisplay {errors} />
      {/if}
    </div>
  {/if}
</main>

<style>
  .app {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #e0e0e0;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 40px;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #00d4ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  header p {
    color: #888;
    font-size: 1rem;
  }

  .preset-selector {
    max-width: 1200px;
    margin: 0 auto;
  }

  .preset-selector h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #00d4ff;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .preset-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    color: inherit;
  }

  .preset-card:hover {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
    transform: translateY(-4px);
    box-shadow: 0 10px 40px rgba(0, 212, 255, 0.2);
  }

  .preset-card h3 {
    margin: 0 0 12px 0;
    color: #fff;
    font-size: 1.1rem;
  }

  .preset-card p {
    margin: 0 0 12px 0;
    color: #888;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .chunk-count {
    display: inline-block;
    background: rgba(124, 58, 237, 0.3);
    color: #a78bfa;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
  }

  .parser-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .control-panel {
    display: flex;
    align-items: center;
    gap: 30px;
    background: rgba(255, 255, 255, 0.05);
    padding: 20px 30px;
    border-radius: 12px;
    margin-bottom: 30px;
  }

  .preset-info {
    flex: 1;
  }

  .preset-info h3 {
    margin: 0 0 8px 0;
    color: #00d4ff;
  }

  .preset-info p {
    margin: 0;
    color: #888;
    font-size: 0.9rem;
  }

  .chunk-status {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .parsing-indicator {
    color: #fbbf24;
    font-size: 0.9rem;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .reset-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s ease;
  }

  .reset-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }

  .reset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .panel {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
  }

  .panel h2 {
    margin: 0 0 20px 0;
    color: #00d4ff;
    font-size: 1.3rem;
  }

  .json-panel {
    min-height: 500px;
  }

  .ast-panel {
    min-height: 500px;
  }

  @media (max-width: 1024px) {
    .preset-grid {
      grid-template-columns: 1fr;
    }
    
    .content-grid {
      grid-template-columns: 1fr;
    }
    
    .control-panel {
      flex-wrap: wrap;
    }
  }
</style>