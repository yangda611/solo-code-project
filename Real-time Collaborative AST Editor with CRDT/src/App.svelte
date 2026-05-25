<script>
  import { onMount } from 'svelte'
  import { 
    connected, 
    reconnecting, 
    syncProgress, 
    conflictResolution,
    showInconsistencyWindow,
    clientId,
    initWebSocket,
    astRoot
  } from './store.js'
  import ASTNode from './components/ASTNode.svelte'
  import OperationTimeline from './components/OperationTimeline.svelte'
  import ConcurrentCounter from './components/ConcurrentCounter.svelte'
  import ScenarioPanel from './components/ScenarioPanel.svelte'
  import * as Y from 'yjs'
  
  let rootChildren = []
  
  function updateRootChildren() {
    const children = []
    astRoot.forEach((value, key) => {
      if (value) {
        children.push({ key, value, parent: astRoot })
      }
    })
    rootChildren = children
  }
  
  astRoot.observeDeep(() => {
    updateRootChildren()
  })
  
  onMount(() => {
    updateRootChildren()
    initWebSocket()
    
    if (rootChildren.length === 0) {
      const program = new Y.Map()
      const body = new Y.Array()
      
      const func1 = new Y.Map()
      func1.set('type', 'FunctionDeclaration')
      func1.set('id', 'myFunction')
      func1.set('params', new Y.Array())
      
      const var1 = new Y.Map()
      var1.set('type', 'VariableDeclaration')
      var1.set('kind', 'let')
      var1.set('name', 'count')
      var1.set('value', 0)
      
      body.push([func1, var1])
      program.set('body', body)
      program.set('type', 'Program')
      
      astRoot.set('program', program)
    }
  })
</script>

<div class="app">
  <header class="header">
    <div class="header-left">
      <h1>
        <span class="logo-icon">🌳</span>
        CRDT AST 协同编辑器
      </h1>
      <div class="connection-status">
        <span class="status-dot" class:connected={$connected} class:reconnecting={$reconnecting}></span>
        <span class="status-text">
          {#if $connected}
            已连接
          {:else if $reconnecting}
            重连中...
          {:else}
            未连接
          {/if}
        </span>
      </div>
    </div>
    <div class="header-right">
      <span class="client-id">客户端: {$clientId}</span>
    </div>
  </header>
  
  {#if $syncProgress > 0 && $syncProgress < 100}
    <div class="sync-progress">
      <div class="sync-bar" style="width: {$syncProgress}%"></div>
      <span class="sync-text">正在同步... {$syncProgress}%</span>
    </div>
  {/if}
  
  <main class="main-content">
    <aside class="sidebar-left">
      <div class="panel">
        <ConcurrentCounter />
        <div class="panel-spacer"></div>
        <ScenarioPanel />
      </div>
    </aside>
    
    <section class="editor-area">
      <div class="ast-tree">
        <div class="tree-header">
          <h2>抽象语法树 (AST)</h2>
          <span class="node-count">{rootChildren.length} 个根节点</span>
        </div>
        <div class="tree-content">
          {#each rootChildren as child}
            <ASTNode 
              node={child} 
              depth={0}
              path={[child.key]}
            />
          {/each}
          
          {#if rootChildren.length === 0}
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <p>AST 为空</p>
              <p class="empty-hint">点击"重置AST"按钮添加示例数据</p>
            </div>
          {/if}
        </div>
      </div>
    </section>
    
    <aside class="sidebar-right">
      <OperationTimeline />
    </aside>
  </main>
  
  {#if $conflictResolution}
    <div class="conflict-overlay" class:resolve-animation={$conflictResolution}>
      <div class="conflict-modal">
        <div class="conflict-icon">⚡</div>
        <h3>冲突检测!</h3>
        <p>策略: {$conflictResolution.type}</p>
        <p class="conflict-result">
          {#if $conflictResolution.localWon}
            本地操作胜出 ✓
          {:else}
            远程操作胜出 ✓
          {/if}
        </p>
      </div>
    </div>
  {/if}
  
  {#if $showInconsistencyWindow}
    <div class="inconsistency-overlay">
      <div class="inconsistency-modal">
        <div class="warning-flash">⚠️</div>
        <h3>快照压缩临时不一致窗口</h3>
        <p class="inconsistency-desc">
          在快照压缩期间，由于操作日志被截断，
          新加入的客户端可能会观察到短暂的不一致状态。
        </p>
        <div class="inconsistency-steps">
          <div class="step">1. 快照创建中...</div>
          <div class="step active">2. 日志清理中...</div>
          <div class="step">3. 等待重新同步...</div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .logo-icon {
    font-size: 24px;
  }
  
  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #a1a1aa;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
  }
  
  .status-dot.connected {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  }
  
  .status-dot.reconnecting {
    background: #f59e0b;
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .client-id {
    font-size: 12px;
    color: #71717a;
    font-family: monospace;
  }
  
  .sync-progress {
    position: relative;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  
  .sync-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  
  .sync-text {
    position: absolute;
    right: 16px;
    top: -20px;
    font-size: 11px;
    color: #60a5fa;
  }
  
  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 300px 1fr 300px;
    gap: 20px;
    padding: 20px;
    min-height: 0;
  }
  
  .sidebar-left, .sidebar-right {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .panel-spacer {
    height: 0;
  }
  
  .editor-area {
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .ast-tree {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
  }
  
  .tree-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .node-count {
    font-size: 12px;
    color: #a1a1aa;
  }
  
  .tree-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #71717a;
    text-align: center;
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  .empty-state p {
    margin: 4px 0;
  }
  
  .empty-hint {
    font-size: 13px;
    opacity: 0.7;
  }
  
  .conflict-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }
  
  .conflict-overlay.resolve-animation {
    animation: conflictPulse 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes conflictPulse {
    0%, 100% { background: rgba(0, 0, 0, 0.7); }
    50% { background: rgba(239, 68, 68, 0.3); }
  }
  
  .conflict-modal {
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    border: 2px solid rgba(167, 139, 250, 0.5);
    box-shadow: 0 0 40px rgba(167, 139, 250, 0.3);
    animation: modalIn 0.4s ease;
  }
  
  @keyframes modalIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .conflict-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: shake 0.5s ease;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .conflict-modal h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #a78bfa;
  }
  
  .conflict-modal p {
    margin: 0;
    color: #a1a1aa;
    font-size: 14px;
  }
  
  .conflict-result {
    margin-top: 16px !important;
    font-weight: 600;
    color: #22c55e !important;
  }
  
  .inconsistency-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .inconsistency-modal {
    background: linear-gradient(135deg, #451a03, #78350f);
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    border: 2px solid rgba(251, 191, 36, 0.5);
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
    max-width: 400px;
  }
  
  .warning-flash {
    font-size: 48px;
    margin-bottom: 16px;
    animation: warningPulse 0.5s ease infinite;
  }
  
  @keyframes warningPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .inconsistency-modal h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #fbbf24;
  }
  
  .inconsistency-desc {
    color: #fcd34d;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .inconsistency-steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .step {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 12px;
    color: #a1a1aa;
  }
  
  .step.active {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    animation: stepPulse 1s ease infinite;
  }
  
  @keyframes stepPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
</style>
