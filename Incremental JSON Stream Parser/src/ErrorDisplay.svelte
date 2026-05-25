<script>
  export let errors = []
  let expandedErrors = new Set()

  function toggleError(id) {
    if (expandedErrors.has(id)) {
      expandedErrors.delete(id)
    } else {
      expandedErrors.add(id)
    }
    expandedErrors = new Set(expandedErrors)
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'warning': return '#fbbf24'
      case 'error': return '#ef4444'
      default: return '#ef4444'
    }
  }
</script>

<div class="error-display">
  <div class="error-header">
    <span class="error-icon">⚠️</span>
    <h3>检测到 {errors.length} 个语法错误</h3>
  </div>
  
  <div class="error-list">
    {#each errors as error, i}
      <div 
        class="error-item"
        class:error-expanded={expandedErrors.has(i)}
        style="--error-color: {getSeverityColor(error.severity)}"
        on:click={() => toggleError(i)}
      >
        <div class="error-main">
          <span class="error-badge">{error.severity || 'error'}</span>
          <span class="error-message">{error.message}</span>
          <span class="error-position">位置: {error.position}</span>
        </div>
        
        {#if expandedErrors.has(i)}
          <div class="error-details">
            <div class="error-wave">
              <svg viewBox="0 0 200 20">
                <path 
                  d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10" 
                  fill="none" 
                  stroke="var(--error-color)" 
                  stroke-width="2"
                />
              </svg>
            </div>
            <p class="error-hint">
              {#if error.message.includes('escape')}
                提示：检查转义字符是否正确，例如 \\n, \\t, \\" 等
              {:else if error.message.includes('Unexpected')}
                提示：JSON 语法要求严格，检查逗号、括号是否匹配
              {:else}
                提示：确保所有字符串必须用双引号包裹
              {/if}
            </p>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .error-display {
    margin-top: 20px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    overflow: hidden;
  }

  .error-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: rgba(239, 68, 68, 0.1);
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  }

  .error-icon {
    font-size: 1.5rem;
  }

  .error-header h3 {
    margin: 0;
    color: #ef4444;
    font-size: 1.1rem;
  }

  .error-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .error-item {
    padding: 12px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(239, 68, 68, 0.1);
  }

  .error-item:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .error-item:last-child {
    border-bottom: none;
  }

  .error-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .error-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    background: var(--error-color);
    color: white;
  }

  .error-message {
    flex: 1;
    color: #fca5a5;
    font-size: 0.9rem;
  }

  .error-position {
    color: #888;
    font-size: 0.8rem;
    font-family: monospace;
  }

  .error-details {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed rgba(239, 68, 68, 0.3);
    animation: errorExpand 0.4s ease-out;
  }

  @keyframes errorExpand {
    0% {
      opacity: 0;
      max-height: 0;
    }
    100% {
      opacity: 1;
      max-height: 100px;
    }
  }

  .error-wave svg {
    width: 100%;
    height: 24px;
    animation: waveMove 2s linear infinite;
  }

  @keyframes waveMove {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50px);
    }
  }

  .error-hint {
    margin: 8px 0 0;
    color: #fbbf24;
    font-size: 0.85rem;
    font-style: italic;
  }

  .error-list::-webkit-scrollbar {
    width: 6px;
  }

  .error-list::-webkit-scrollbar-track {
    background: rgba(239, 68, 68, 0.1);
  }

  .error-list::-webkit-scrollbar-thumb {
    background: rgba(239, 68, 68, 0.3);
    border-radius: 3px;
  }
</style>