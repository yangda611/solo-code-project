<script>
  import { onMount, onDestroy } from 'svelte'
  
  export let tokens = []
  export let errors = []
  export let chunkBoundaries = []
  export let isParsing = false

  let container
  let highlightPositions = []
  let animationFrame

  const tokenColors = {
    key: '#a78bfa',
    string: '#34d399',
    number: '#fbbf24',
    boolean: '#60a5fa',
    null: '#f472b6',
    object_start: '#00d4ff',
    object_end: '#00d4ff',
    array_start: '#00d4ff',
    array_end: '#00d4ff',
    colon: '#888',
    comma: '#888'
  }

  $: {
    if (tokens.length > 0) {
      highlightPositions = tokens.map((t, i) => ({
        start: t.start_pos,
        end: t.end_pos,
        type: t.type,
        index: i
      }))
    }
  }

  function getTokenDisplay(token) {
    switch (token.type) {
      case 'key':
        return `"${token.value}"`
      case 'string':
        return `"${token.value}"`
      case 'object_start':
        return '{'
      case 'object_end':
        return '}'
      case 'array_start':
        return '['
      case 'array_end':
        return ']'
      case 'colon':
        return ':'
      case 'comma':
        return ','
      default:
        return token.value
    }
  }

  function isErrorPosition(pos) {
    return errors.some(e => Math.abs(e.position - pos) < 5)
  }

  function getChunkBoundary(pos) {
    return chunkBoundaries.find(b => {
      const boundaryStart = b.start
      return Math.abs(pos - boundaryStart) < 3
    })
  }

  onMount(() => {
    if (isParsing) {
      startStreamAnimation()
    }
  })

  $: if (isParsing && container) {
    startStreamAnimation()
  } else {
    stopAnimation()
  }

  function startStreamAnimation() {
    let charIndex = 0
    const maxChars = tokens.reduce((acc, t) => acc + (t.end_pos - t.start_pos + 1), 0)
    
    function animate() {
      charIndex = (charIndex + 1) % (maxChars + 50)
      highlightPositions = tokens
        .filter((_, i) => i < charIndex / 3)
        .map((t, i) => ({
          ...t,
          animating: i === Math.floor(charIndex / 3) - 1
        }))
      animationFrame = requestAnimationFrame(animate)
    }
    
    animate()
  }

  function stopAnimation() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  }

  onDestroy(() => {
    stopAnimation()
  })
</script>

<div class="json-viewer" bind:this={container}>
  <pre class="json-content">
    {#each tokens as token, i}
      {#if i > 0 && token.type !== 'comma' && token.type !== 'colon'}
        <span class="whitespace"> </span>
      {/if}
      <span 
        class="token"
        class:token-animating={isParsing && i === tokens.length - 1}
        class:token-error={isErrorPosition(token.start_pos)}
        class:boundary={getChunkBoundary(token.start_pos)}
        style="color: {tokenColors[token.type] || '#fff'}"
      >{getTokenDisplay(token)}</span>
    {/each}
    {#if tokens.length === 0}
      <span class="waiting">等待数据...</span>
    {/if}
  </pre>
  
  <div class="legend">
    <span class="legend-item"><span style="color: #a78bfa">键名</span></span>
    <span class="legend-item"><span style="color: #34d399">字符串</span></span>
    <span class="legend-item"><span style="color: #fbbf24">数字</span></span>
    <span class="legend-item"><span style="color: #60a5fa">布尔</span></span>
    <span class="legend-item"><span style="color: #f472b6">null</span></span>
  </div>
</div>

<style>
  .json-viewer {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 16px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    overflow-x: auto;
    min-height: 400px;
  }

  .json-content {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .token {
    display: inline-block;
    transition: all 0.3s ease;
    position: relative;
  }

  .token-animating {
    animation: tokenGlow 0.8s ease-out;
  }

  @keyframes tokenGlow {
    0% {
      opacity: 0;
      transform: translateX(-10px);
      filter: blur(5px);
    }
    50% {
      text-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
    }
    100% {
      opacity: 1;
      transform: translateX(0);
      filter: blur(0);
    }
  }

  .token-error {
    position: relative;
  }

  .token-error::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #ef4444, transparent);
    animation: waveAnimation 1s ease-in-out infinite;
  }

  @keyframes waveAnimation {
    0%, 100% {
      transform: scaleX(0.5);
      opacity: 0.5;
    }
    50% {
      transform: scaleX(1.2);
      opacity: 1;
    }
  }

  .boundary {
    position: relative;
  }

  .boundary::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: #fbbf24;
    animation: boundaryFlash 0.6s ease-in-out infinite;
  }

  @keyframes boundaryFlash {
    0%, 100% {
      opacity: 0.3;
      box-shadow: 0 0 5px #fbbf24;
    }
    50% {
      opacity: 1;
      box-shadow: 0 0 15px #fbbf24, 0 0 30px #fbbf24;
    }
  }

  .waiting {
    color: #666;
    font-style: italic;
  }

  .whitespace {
    display: inline;
  }

  .legend {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .legend-item {
    font-size: 0.8rem;
    color: #888;
  }
</style>