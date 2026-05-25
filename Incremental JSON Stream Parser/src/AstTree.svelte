<script>
  import { onMount, onDestroy } from 'svelte'

  export let astNodes = []
  export let isParsing = false

  let expandedNodes = new Set()
  let animationTimeout

  const nodeIcons = {
    object: '{ }',
    array: '[ ]',
    key: '🔑',
    string: '📝',
    number: '🔢',
    boolean: '✓',
    null: '∅'
  }

  $: rootNodes = astNodes.filter(node => node.depth === 0)
  $: allNodes = astNodes

  function getChildren(parentId) {
    return astNodes.filter(node => node.depth === parentId + 1)
  }

  function toggleNode(nodeId) {
    if (expandedNodes.has(nodeId)) {
      expandedNodes.delete(nodeId)
    } else {
      expandedNodes.add(nodeId)
    }
    expandedNodes = new Set(expandedNodes)
  }

  onMount(() => {
    if (isParsing) {
      startTreeAnimation()
    }
  })

  $: if (isParsing) {
    startTreeAnimation()
  }

  function startTreeAnimation() {
    if (animationTimeout) clearTimeout(animationTimeout)
    
    let index = 0
    function expandNext() {
      if (index < astNodes.length) {
      const node = astNodes[index]
      if (node) {
        expandedNodes.add(node.id)
        expandedNodes = new Set(expandedNodes)
      }
      index++
      animationTimeout = setTimeout(expandNext, 300)
    }
  }
  
  expandNext()
  }

  onDestroy(() => {
    if (animationTimeout) {
      clearTimeout(animationTimeout)
    }
  })
</script>

<div class="ast-tree">
  {#if astNodes.length === 0}
    <div class="empty-state">
      <p>等待 AST 节点生成...</p>
    </div>
  {:else}
    <div class="tree-container">
      {#each astNodes as node, i}
        <div 
          class="tree-node"
          class:node-animating={isParsing && i === astNodes.length - 1}
          style="margin-left: {node.depth * 24}px"
        >
          <div class="node-content" on:click={() => toggleNode(node.id)}>
            <span class="node-icon">{nodeIcons[node.type] || '•'}</span>
            <span class="node-type">{node.type}</span>
            {#if node.value}
              <span class="node-value"> = {node.value}</span>
            {/if}
            {#if node.path}
              <span class="node-path">{node.path}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
  
  <div class="tree-stats">
    <span class="stat-item">节点总数: {astNodes.length}</span>
    <span class="stat-item">最大深度: {Math.max(...astNodes.map(n => n.depth), 0)}</span>
  </div>
</div>

<style>
  .ast-tree {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.85rem;
  }

  .empty-state {
    color: #666;
    text-align: center;
    padding: 60px 20px;
    font-style: italic;
  }

  .tree-container {
    max-height: 400px;
    overflow-y: auto;
    padding: 10px 0;
  }

  .tree-node {
    position: relative;
    padding: 4px 0;
  }

  .tree-node::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(0, 212, 255, 0.2);
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.03);
    position: relative;
    z-index: 1;
  }

  .node-content:hover {
    background: rgba(0, 212, 255, 0.1);
  }

  .node-animating .node-content {
    animation: nodeGrow 0.6s ease-out;
  }

  @keyframes nodeGrow {
    0% {
      opacity: 0;
      transform: scale(0.8) translateY(-10px);
      background: rgba(0, 212, 255, 0.3);
    }
    50% {
      background: rgba(0, 212, 255, 0.2);
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
      background: rgba(255, 255, 255, 0.03);
    }
  }

  .node-icon {
    font-size: 0.9rem;
    min-width: 24px;
    text-align: center;
  }

  .node-type {
    color: #00d4ff;
    font-weight: 500;
  }

  .node-value {
    color: #34d399;
  }

  .node-path {
    color: #666;
    font-size: 0.75rem;
    margin-left: auto;
  }

  .tree-stats {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 20px;
  }

  .stat-item {
    color: #888;
    font-size: 0.8rem;
  }

  .tree-container::-webkit-scrollbar {
    width: 6px;
  }

  .tree-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .tree-container::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 3px;
  }
</style>