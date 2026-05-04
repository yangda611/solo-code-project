<script lang="ts">
  import type { Alert } from '$lib/types';
  import { resolveAlert } from '$lib/stores';

  export let alerts: Alert[] = [];

  const severityConfig: Record<string, { label: string; class: string; icon: string }> = {
    critical: { label: '严重', class: 'severity-critical', icon: '🚨' },
    warning: { label: '警告', class: 'severity-warning', icon: '⚠️' }
  };

  const typeConfig: Record<string, { label: string; icon: string }> = {
    oxygen: { label: '氧气', icon: '💨' },
    water: { label: '水质', icon: '💧' },
    device: { label: '设备', icon: '⚙️' },
    algae: { label: '藻类', icon: '🦠' }
  };

  async function handleResolve(alertId: number) {
    try {
      await resolveAlert(alertId);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  }

  $: sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1 };
    return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
  });
</script>

<div class="alert-panel">
  <div class="panel-header">
    <h3 class="panel-title">
      <span class="title-icon">🔔</span>
      异常报警
      {#if alerts.length > 0}
        <span class="alert-count {alerts.some(a => a.severity === 'critical') ? 'critical' : ''}">
          {alerts.length}
        </span>
      {/if}
    </h3>
  </div>

  <div class="alert-list">
    {#if sortedAlerts.length === 0}
      <div class="empty-state">
        <span class="empty-icon">✅</span>
        <span class="empty-text">系统运行正常，无异常报警</span>
      </div>
    {:else}
      {#each sortedAlerts as alert (alert.id)}
        <div class="alert-item {severityConfig[alert.severity]?.class || ''}">
          <div class="alert-content">
            <div class="alert-header">
              <div class="alert-type-badge">
                <span>{typeConfig[alert.type]?.icon || '📋'}</span>
                <span class="type-label">{typeConfig[alert.type]?.label || alert.type}</span>
              </div>
              <div class="severity-badge">
                <span>{severityConfig[alert.severity]?.icon}</span>
                <span>{severityConfig[alert.severity]?.label}</span>
              </div>
            </div>
            <p class="alert-message">{alert.message}</p>
            <span class="alert-time">
              {new Date(alert.created_at).toLocaleString('zh-CN')}
            </span>
          </div>
          <button 
            class="resolve-btn"
            on:click={() => handleResolve(alert.id)}
            title="标记为已解决"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .alert-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(15, 23, 42, 0.8);
    border-radius: 0.5rem;
    border: 1px solid rgba(71, 85, 105, 0.5);
    overflow: hidden;
  }

  .panel-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
    background: rgba(30, 41, 59, 0.5);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .title-icon {
    font-size: 1rem;
  }

  .alert-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    margin-left: auto;
    font-size: 0.625rem;
    font-weight: 700;
    border-radius: 9999px;
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .alert-count.critical {
    background: rgba(244, 63, 94, 0.2);
    color: #f43f5e;
    animation: pulse-fast 1s ease-in-out infinite;
  }

  .alert-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 2rem;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.75rem;
    text-align: center;
  }

  .alert-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(30, 41, 59, 0.8);
    border-radius: 0.375rem;
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-left: 3px solid #64748b;
    transition: all 0.2s;
  }

  .alert-item:hover {
    background: rgba(51, 65, 85, 0.8);
  }

  .alert-item.severity-critical {
    border-left-color: #f43f5e;
    background: rgba(244, 63, 94, 0.05);
    animation: pulse-border 2s ease-in-out infinite;
  }

  .alert-item.severity-warning {
    border-left-color: #fbbf24;
    background: rgba(251, 191, 36, 0.05);
  }

  .alert-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .alert-type-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: rgba(71, 85, 105, 0.3);
    border-radius: 0.25rem;
    font-size: 0.625rem;
  }

  .type-label {
    color: #94a3b8;
  }

  .severity-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    color: #fbbf24;
  }

  .severity-critical .severity-badge {
    color: #f43f5e;
  }

  .alert-message {
    margin: 0;
    font-size: 0.75rem;
    color: #e2e8f0;
    line-height: 1.4;
  }

  .alert-time {
    font-size: 0.625rem;
    color: #64748b;
  }

  .resolve-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 0.375rem;
    color: #22c55e;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .resolve-btn:hover {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.5);
  }

  .resolve-btn svg {
    width: 1rem;
    height: 1rem;
  }

  @keyframes pulse-fast {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @keyframes pulse-border {
    0%, 100% {
      border-left-color: #f43f5e;
      box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.2);
    }
    50% {
      border-left-color: #fda4af;
      box-shadow: 0 0 0 4px rgba(244, 63, 94, 0);
    }
  }
</style>
