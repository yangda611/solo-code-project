<script>
  import { operations, timelineExpanded, versionVector, concurrentOps } from '../store.js'
  
  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString()
  }
  
  function getOpTypeClass(op) {
    if (!op || !op.type) return 'unknown'
    if (op.type.includes('add') || op.type.includes('insert')) return 'add'
    if (op.type.includes('delete') || op.type.includes('remove')) return 'delete'
    if (op.type.includes('modify') || op.type.includes('update')) return 'modify'
    return 'other'
  }
</script>

<div class="timeline" class:expanded={$timelineExpanded}>
  <div class="timeline-header" on:click={() => timelineExpanded.set(!$timelineExpanded)}>
    <span class="expand-icon">{$timelineExpanded ? '▼' : '▶'}</span>
    <h3>操作时间线</h3>
    <span class="op-count">{$operations.length} 操作</span>
  </div>
  
  {#if $timelineExpanded}
    <div class="timeline-content timeline-expand">
      <div class="vector-display">
        <h4>版本向量</h4>
        <div class="vector-items">
          {#each Object.entries($versionVector) as [client, seq]}
            <div class="vector-item">
              <span class="client-id">{client.slice(-6)}</span>
              <span class="seq-num">{seq}</span>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="operations-list">
        {#each $operations.slice().reverse() as op, i}
          <div class="operation-item op-{getOpTypeClass(op)}" style="animation-delay: {i * 0.05}s">
            <div class="op-time">{formatTime(op.timestamp || Date.now())}</div>
            <div class="op-client">{op.clientId ? op.clientId.slice(-6) : 'local'}</div>
            <div class="op-type">{op.type || 'update'}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .timeline {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .timeline-header {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .timeline-header:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .expand-icon {
    font-size: 10px;
    color: #a1a1aa;
    transition: transform 0.2s;
  }
  
  .timeline.expanded .expand-icon {
    transform: rotate(90deg);
  }
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  .op-count {
    margin-left: auto;
    font-size: 12px;
    color: #a1a1aa;
  }
  
  .timeline-content {
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .vector-display {
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
  }
  
  .vector-display h4 {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #a1a1aa;
  }
  
  .vector-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .vector-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(96, 165, 250, 0.1);
    border-radius: 4px;
    font-size: 11px;
  }
  
  .client-id {
    color: #60a5fa;
    font-family: monospace;
  }
  
  .seq-num {
    color: #4ade80;
    font-weight: 600;
  }
  
  .operations-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .operation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    animation: slideIn 0.3s ease-out forwards;
    opacity: 0;
    transform: translateX(-10px);
  }
  
  @keyframes slideIn {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .op-add {
    background: rgba(34, 197, 94, 0.1);
    border-left: 3px solid #22c55e;
  }
  
  .op-delete {
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid #ef4444;
  }
  
  .op-modify {
    background: rgba(251, 191, 36, 0.1);
    border-left: 3px solid #fbbf24;
  }
  
  .op-other, .op-unknown {
    background: rgba(161, 161, 170, 0.1);
    border-left: 3px solid #a1a1aa;
  }
  
  .op-time {
    color: #71717a;
    font-family: monospace;
    min-width: 70px;
  }
  
  .op-client {
    color: #60a5fa;
    font-family: monospace;
    min-width: 50px;
  }
  
  .op-type {
    color: #e4e4e7;
    font-weight: 500;
  }
</style>
