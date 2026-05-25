<script>
  import { astRoot, undoManager, yjsToJSON } from '../store.js'
  import { onMount, onDestroy } from 'svelte'
  import * as Y from 'yjs'
  
  export let node
  export let path = []
  export let depth = 0
  
  let isExpanded = depth < 2
  let isEditing = false
  let editValue = ''
  let showMenu = false
  let justInserted = false
  let conflictFlash = false
  
  function getType(value) {
    if (!value) return 'null'
    if (value instanceof Y.Map) return 'map'
    if (value instanceof Y.Array) return 'array'
    if (value instanceof Y.Text) return 'text'
    return typeof value
  }
  
  function getChildren(value) {
    if (!value) return []
    const type = getType(value)
    if (type === 'map') {
      const children = []
      value.forEach((v, k) => {
        if (v) children.push({ key: k, value: v })
      })
      return children
    }
    if (type === 'array') {
      return value.toArray().filter(v => v).map((v, i) => ({ key: String(i), value: v }))
    }
    return []
  }
  
  function startEdit() {
    const type = getType(node.value)
    if (type === 'text') {
      editValue = node.value.toString()
    } else if (type === 'string' || type === 'number') {
      editValue = String(node.value)
    }
    isEditing = true
  }
  
  function finishEdit() {
    isEditing = false
    const type = getType(node.value)
    if (type === 'text') {
      node.value.delete(0, node.value.length)
      node.value.insert(0, editValue)
    } else if (node.parent instanceof Y.Map) {
      const num = parseFloat(editValue)
      node.parent.set(node.key, isNaN(num) ? editValue : num)
    } else if (node.parent instanceof Y.Array) {
      const num = parseFloat(editValue)
      node.parent.set(parseInt(node.key), isNaN(num) ? editValue : num)
    }
  }
  
  function addChild(type) {
    const parentType = getType(node.value)
    if (parentType !== 'map' && parentType !== 'array') {
      if (node.parent instanceof Y.Map) {
        const newMap = new Y.Map()
        node.parent.set(node.key, newMap)
        addChildToNode(newMap, type)
      }
      return
    }
    
    addChildToNode(node.value, type)
    justInserted = true
    setTimeout(() => justInserted = false, 600)
    showMenu = false
  }
  
  function addChildToNode(parentNode, type) {
    const key = 'node_' + Math.random().toString(36).substr(2, 5)
    
    switch (type) {
      case 'map':
        if (parentNode instanceof Y.Map) {
          parentNode.set(key, new Y.Map())
        } else if (parentNode instanceof Y.Array) {
          parentNode.push([new Y.Map()])
        }
        break
      case 'array':
        if (parentNode instanceof Y.Map) {
          parentNode.set(key, new Y.Array())
        } else if (parentNode instanceof Y.Array) {
          parentNode.push([new Y.Array()])
        }
        break
      case 'text':
        if (parentNode instanceof Y.Map) {
          parentNode.set(key, new Y.Text('new text'))
        } else if (parentNode instanceof Y.Array) {
          parentNode.push([new Y.Text('new text')])
        }
        break
      case 'string':
        if (parentNode instanceof Y.Map) {
          parentNode.set(key, 'value')
        } else if (parentNode instanceof Y.Array) {
          parentNode.push(['value'])
        }
        break
      case 'number':
        if (parentNode instanceof Y.Map) {
          parentNode.set(key, 0)
        } else if (parentNode instanceof Y.Array) {
          parentNode.push([0])
        }
        break
    }
  }
  
  function deleteNode() {
    if (node.parent instanceof Y.Map) {
      node.parent.delete(node.key)
    } else if (node.parent instanceof Y.Array) {
      node.parent.delete(parseInt(node.key), 1)
    }
  }
  
  function moveUp() {
    if (node.parent instanceof Y.Array) {
      const idx = parseInt(node.key)
      if (idx > 0) {
        const item = node.parent.get(idx)
        node.parent.delete(idx, 1)
        node.parent.insert(idx - 1, [item])
      }
    }
  }
  
  function moveDown() {
    if (node.parent instanceof Y.Array) {
      const idx = parseInt(node.key)
      if (idx < node.parent.length - 1) {
        const item = node.parent.get(idx)
        node.parent.delete(idx, 1)
        node.parent.insert(idx + 1, [item])
      }
    }
  }
  
  function renameNode(newKey) {
    if (node.parent instanceof Y.Map) {
      const value = node.parent.get(node.key)
      node.parent.delete(node.key)
      node.parent.set(newKey, value)
    }
  }

  $: nodeType = getType(node.value)
  $: children = getChildren(node.value)
  $: displayValue = !node.value ? '' :
                     nodeType === 'text' ? node.value.toString() : 
                     (nodeType === 'map' || nodeType === 'array' ? '' : String(node.value))
</script>

{#if node && node.value}
<div 
  class="ast-node"
  class:just-inserted={justInserted}
  class:conflict-flash={conflictFlash}
  style="margin-left: {depth * 20}px"
>
  <div class="node-header">
    {#if children.length > 0}
      <button class="expand-btn" on:click={() => isExpanded = !isExpanded}>
        {isExpanded ? '▼' : '▶'}
      </button>
    {/if}
    
    <span class="node-key">{node.key}</span>
    <span class="node-type">{nodeType}</span>
    
    {#if isEditing}
      <input 
        class="edit-input"
        bind:value={editValue}
        on:blur={finishEdit}
        on:keydown={(e) => e.key === 'Enter' && finishEdit()}
        autofocus
      />
    {:else if displayValue}
      <span class="node-value" on:dblclick={startEdit}>{displayValue}</span>
    {/if}
    
    <div class="node-actions">
      <button class="action-btn" on:click={() => showMenu = !showMenu}>+</button>
      <button class="action-btn" on:click={deleteNode}>-</button>
      {#if nodeType === 'array'}
        <button class="action-btn" on:click={moveUp}>↑</button>
        <button class="action-btn" on:click={moveDown}>↓</button>
      {/if}
    </div>
    
    {#if showMenu}
      <div class="add-menu">
        <button on:click={() => addChild('map')}>Object {'{'}{'}'}</button>
        <button on:click={() => addChild('array')}>Array {'['}{']'}</button>
        <button on:click={() => addChild('text')}>Text</button>
        <button on:click={() => addChild('string')}>String</button>
        <button on:click={() => addChild('number')}>Number</button>
      </div>
    {/if}
  </div>
  
  {#if isExpanded && children.length > 0 && node.value}
    <div class="node-children">
      {#each children as child}
        <svelte:self 
          node={{...child, parent: node.value}} 
          {depth}
          path={[...path, node.key]}
        />
      {/each}
    </div>
  {/if}
</div>
{/if}

<style>
  .ast-node {
    position: relative;
    padding: 4px 0;
    transition: background-color 0.3s;
  }
  
  .ast-node::before {
    content: '';
    position: absolute;
    left: -15px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .just-inserted {
    animation: nodeInsert 0.6s ease-out;
  }
  
  @keyframes nodeInsert {
    0% {
      background-color: rgba(34, 197, 94, 0.4);
      transform: scale(0.95);
    }
    100% {
      background-color: transparent;
      transform: scale(1);
    }
  }
  
  .conflict-flash {
    animation: conflictFlash 1s ease-in-out;
  }
  
  @keyframes conflictFlash {
    0%, 100% { background-color: transparent; }
    25% { background-color: rgba(239, 68, 68, 0.3); }
    50% { background-color: rgba(34, 197, 94, 0.3); }
    75% { background-color: rgba(239, 68, 68, 0.2); }
  }
  
  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
    position: relative;
  }
  
  .node-header:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  
  .expand-btn {
    background: none;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    font-size: 10px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .node-key {
    color: #60a5fa;
    font-weight: 600;
    font-family: 'Fira Code', monospace;
  }
  
  .node-type {
    font-size: 11px;
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .node-value {
    color: #4ade80;
    font-family: 'Fira Code', monospace;
    cursor: text;
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .node-value:hover {
    background: rgba(74, 222, 128, 0.1);
  }
  
  .edit-input {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #3b82f6;
    color: #4ade80;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    outline: none;
  }
  
  .node-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .node-header:hover .node-actions {
    opacity: 1;
  }
  
  .action-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #a1a1aa;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #e4e4e7;
  }
  
  .add-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: #1f2937;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 120px;
  }
  
  .add-menu button {
    background: none;
    border: none;
    color: #e4e4e7;
    padding: 6px 12px;
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
  }
  
  .add-menu button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .node-children {
    margin-top: 4px;
  }
</style>
