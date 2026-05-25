<script>
  import { concurrentOps, onlineUsers } from '../store.js'
  import { onMount, onDestroy } from 'svelte'
  
  let particles = []
  let particleId = 0
  
  function spawnParticles(count) {
    const colors = ['#22c55e', '#3b82f6', '#a78bfa', '#f59e0b', '#ef4444']
    
    for (let i = 0; i < count; i++) {
      const id = particleId++
      const particle = {
        id,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6
      }
      particles = [...particles, particle]
      
      setTimeout(() => {
        particles = particles.filter(p => p.id !== id)
      }, 1000)
    }
  }
  
  $: if ($concurrentOps > 0) {
    spawnParticles($concurrentOps)
  }
</script>

<div class="counter-container particle-container">
  <div class="counter-display">
    <div class="counter-value">{$concurrentOps}</div>
    <div class="counter-label">并发操作</div>
  </div>
  
  <div class="users-display">
    <div class="users-value">{$onlineUsers}</div>
    <div class="users-label">在线用户</div>
  </div>
  
  {#each particles as particle}
    <div 
      class="particle"
      style="left: {particle.x}%; 
             background-color: {particle.color}; 
             width: {particle.size}px; 
             height: {particle.size}px;"
    />
  {/each}
</div>

<style>
  .counter-container {
    display: flex;
    gap: 24px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
  }
  
  .counter-display, .users-display {
    text-align: center;
    position: relative;
  }
  
  .counter-value, .users-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .counter-value {
    color: #22c55e;
    text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  }
  
  .users-value {
    color: #3b82f6;
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  
  .counter-label, .users-label {
    font-size: 11px;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .particle {
    position: absolute;
    bottom: 0;
    border-radius: 50%;
    pointer-events: none;
    animation: particleRise 1s ease-out forwards;
  }
  
  @keyframes particleRise {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-60px) scale(0);
      opacity: 0;
    }
  }
</style>
