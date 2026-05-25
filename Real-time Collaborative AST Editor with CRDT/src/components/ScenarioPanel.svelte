<script>
  import { 
    simulationMode, 
    simulatedLatency, 
    intentStrategy, 
    semanticLossEvents,
    showInconsistencyWindow,
    astRoot,
    undo,
    redo,
    requestSync
  } from '../store.js'
  import * as Y from 'yjs'
  
  function initSampleAST() {
    astRoot.clear()
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
  
  function runScenario1() {
    simulationMode.set('scenario1')
    
    setTimeout(() => {
      const program = astRoot.get('program')
      if (program) {
        const body = program.get('body')
        if (body) {
          const nodeA = new Y.Map()
          nodeA.set('type', 'ExpressionStatement')
          nodeA.set('label', 'UserA')
          body.push([nodeA])
        }
      }
    }, 0)
    
    setTimeout(() => {
      const program = astRoot.get('program')
      if (program) {
        const body = program.get('body')
        if (body) {
          const nodeB = new Y.Map()
          nodeB.set('type', 'ExpressionStatement')
          nodeB.set('label', 'UserB')
          body.push([nodeB])
        }
      }
    }, 50)
    
    setTimeout(() => {
      const program = astRoot.get('program')
      if (program) {
        const body = program.get('body')
        if (body) {
          const nodeC = new Y.Map()
          nodeC.set('type', 'ExpressionStatement')
          nodeC.set('label', 'UserC')
          body.push([nodeC])
        }
      }
    }, 100)
    
    setTimeout(() => {
      simulationMode.set(null)
    }, 2000)
  }
  
  function runScenario2() {
    simulationMode.set('scenario2')
    
    const program = astRoot.get('program')
    if (!program) return
    const body = program.get('body')
    if (!body || body.length === 0) return
    
    setTimeout(() => {
      const first = body.get(0)
      if (first && first.set) {
        first.set('value', 'DELETED_BY_USER_A')
      }
    }, 0)
    
    setTimeout(() => {
      const first = body.get(0)
      if (first && first.set) {
        first.set('value', 'MODIFIED_BY_USER_B')
      }
    }, 50)
    
    setTimeout(() => {
      simulationMode.set(null)
    }, 2000)
  }
  
  function runScenario3() {
    simulationMode.set('scenario3')
    
    const program = astRoot.get('program')
    if (!program) return
    const body = program.get('body')
    if (!body || body.length < 2) return
    
    setTimeout(() => {
      const item = body.get(1)
      body.delete(1, 1)
      body.insert(0, [item])
    }, 0)
    
    setTimeout(() => {
      const item = body.get(0)
      if (item && item.set) {
        item.set('renamed', 'true')
        item.set('parentName', 'renamedParent')
      }
    }, 50)
    
    setTimeout(() => {
      simulationMode.set(null)
    }, 2000)
  }
  
  function runScenario4() {
    simulationMode.set('scenario4')
    simulatedLatency.set(2000)
    
    const program = astRoot.get('program')
    if (!program) return
    const body = program.get('body')
    if (!body) return
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const node = new Y.Map()
        node.set('type', 'DelayedOperation')
        node.set('index', i)
        body.push([node])
      }, i * 200)
    }
    
    setTimeout(() => {
      undo()
    }, 1000)
    
    setTimeout(() => {
      simulatedLatency.set(0)
      simulationMode.set(null)
    }, 4000)
  }
  
  function triggerInconsistency() {
    showInconsistencyWindow.set(true)
    setTimeout(() => {
      showInconsistencyWindow.set(false)
    }, 3000)
  }
</script>

<div class="scenario-panel">
  <h3>预设场景演示</h3>
  
  <div class="scenario-buttons">
    <button 
      class="scenario-btn scenario1"
      on:click={runScenario1}
      disabled={$simulationMode !== null}
    >
      <span class="btn-icon">👥</span>
      <span class="btn-text">场景一</span>
      <span class="btn-desc">三用户并发添加</span>
    </button>
    
    <button 
      class="scenario-btn scenario2"
      on:click={runScenario2}
      disabled={$simulationMode !== null}
    >
      <span class="btn-icon">⚔️</span>
      <span class="btn-text">场景二</span>
      <span class="btn-desc">删除与修改冲突</span>
    </button>
    
    <button 
      class="scenario-btn scenario3"
      on:click={runScenario3}
      disabled={$simulationMode !== null}
    >
      <span class="btn-icon">🔄</span>
      <span class="btn-text">场景三</span>
      <span class="btn-desc">移动与重命名冲突</span>
    </button>
    
    <button 
      class="scenario-btn scenario4"
      on:click={runScenario4}
      disabled={$simulationMode !== null}
    >
      <span class="btn-icon">⏳</span>
      <span class="btn-text">场景四</span>
      <span class="btn-desc">高延迟回滚</span>
    </button>
  </div>
  
  <div class="control-section">
    <h4>CRDT 策略</h4>
    <div class="strategy-selector">
      <button 
        class="strategy-btn"
        class:active={$intentStrategy === 'lww'}
        on:click={() => intentStrategy.set('lww')}
      >
        LWW (Last Write Wins)
      </button>
      <button 
        class="strategy-btn"
        class:active={$intentStrategy === 'semantic'}
        on:click={() => intentStrategy.set('semantic')}
      >
        Semantic Merge
      </button>
    </div>
  </div>
  
  <div class="control-section">
    <h4>操作控制</h4>
    <div class="action-buttons">
      <button class="action-control" on:click={undo}>
        ↶ 撤销
      </button>
      <button class="action-control" on:click={redo}>
        ↷ 重做
      </button>
      <button class="action-control" on:click={initSampleAST}>
        📋 重置AST
      </button>
      <button class="action-control" on:click={requestSync}>
        🔄 同步
      </button>
    </div>
  </div>
  
  <div class="control-section">
    <h4>调试功能</h4>
    <button 
      class="debug-btn"
      on:click={triggerInconsistency}
    >
      ⚠️ 模拟快照压缩不一致窗口
    </button>
  </div>
  
  {#if $semanticLossEvents.length > 0}
    <div class="loss-events">
      <h4>语义丢失事件 ({$semanticLossEvents.length})</h4>
      <div class="event-list">
        {#each $semanticLossEvents.slice(-5) as event}
          <div class="event-item">
            <span class="event-type">{event.type}</span>
            <span class="event-strategy">{event.strategy}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  {#if $simulationMode}
    <div class="simulation-indicator">
      <div class="simulation-pulse"></div>
      <span>正在运行: {$simulationMode}</span>
      {#if $simulatedLatency > 0}
        <span class="latency-badge">{$simulatedLatency}ms延迟</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .scenario-panel {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 16px;
  }
  
  h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  h4 {
    margin: 0 0 10px 0;
    font-size: 13px;
    color: #a1a1aa;
    font-weight: 500;
  }
  
  .scenario-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .scenario-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .scenario-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .scenario1 {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
    border: 1px solid rgba(34, 197, 94, 0.3);
  }
  
  .scenario2 {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .scenario3 {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1));
    border: 1px solid rgba(251, 191, 36, 0.3);
  }
  
  .scenario4 {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(167, 139, 250, 0.1));
    border: 1px solid rgba(167, 139, 250, 0.3);
  }
  
  .btn-icon {
    font-size: 20px;
  }
  
  .btn-text {
    font-weight: 600;
    font-size: 13px;
    color: #e4e4e7;
  }
  
  .btn-desc {
    font-size: 10px;
    color: #a1a1aa;
  }
  
  .control-section {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .control-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  .strategy-selector {
    display: flex;
    gap: 8px;
  }
  
  .strategy-btn {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a1a1aa;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .strategy-btn.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: #60a5fa;
  }
  
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .action-control {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #e4e4e7;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .action-control:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .debug-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2));
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #fca5a5;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
  }
  
  .loss-events {
    margin-top: 16px;
    padding: 12px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  .event-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .event-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 11px;
  }
  
  .event-type {
    color: #fca5a5;
  }
  
  .event-strategy {
    color: #a1a1aa;
  }
  
  .simulation-indicator {
    margin-top: 16px;
    padding: 12px;
    background: rgba(59, 130, 246, 0.15);
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #60a5fa;
  }
  
  .simulation-pulse {
    width: 10px;
    height: 10px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
  
  .latency-badge {
    margin-left: auto;
    padding: 2px 8px;
    background: rgba(167, 139, 250, 0.3);
    border-radius: 4px;
    font-size: 11px;
    color: #a78bfa;
  }
</style>
