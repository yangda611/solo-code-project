<script lang="ts">
  import type { Device, WaterParameters } from '$lib/types';

  export let devices: Device[] = [];
  export let waterParams: WaterParameters | null = null;

  const deviceTypeLabels: Record<string, string> = {
    filter: '过滤器',
    air_pump: '氧气泵',
    heater: '加热棒',
    light: '灯光'
  };

  const deviceTypeIcons: Record<string, string> = {
    filter: '🔄',
    air_pump: '🫧',
    heater: '🔥',
    light: '💡'
  };

  $: filterDevice = devices.find(d => d.type === 'filter');
  $: airPumpDevice = devices.find(d => d.type === 'air_pump');
  $: heaterDevice = devices.find(d => d.type === 'heater');
  $: lightDevice = devices.find(d => d.type === 'light');

  function getStatusClass(status: string) {
    switch (status) {
      case 'running': return 'status-running';
      case 'stopped': return 'status-stopped';
      case 'malfunction': return 'status-malfunction';
      default: return 'status-running';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'running': return '运行中';
      case 'stopped': return '已停止';
      case 'malfunction': return '故障';
      default: return '未知';
    }
  }
</script>

<div class="status-panel">
  <div class="panel-section">
    <h3 class="section-title">设备状态</h3>
    <div class="device-grid">
      {#each devices as device}
        <div class="device-card" class:{getStatusClass(device.status)}>
          <div class="device-header">
            <span class="device-icon">{deviceTypeIcons[device.type] || '⚙️'}</span>
            <div class="device-status-indicator {getStatusClass(device.status)}">
              {getStatusText(device.status)}
            </div>
          </div>
          <div class="device-info">
            <span class="device-name">{device.name}</span>
            <span class="device-type">{deviceTypeLabels[device.type]}</span>
          </div>
          <div class="device-metrics">
            <div class="metric">
              <span class="metric-label">功率</span>
              <span class="metric-value">{device.power}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {device.power}%"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if waterParams}
    <div class="panel-section">
      <h3 class="section-title">水质参数</h3>
      <div class="water-params-grid">
        <div class="param-card">
          <div class="param-icon">🌡️</div>
          <div class="param-info">
            <span class="param-label">温度</span>
            <span class="param-value {waterParams.temperature > 28 ? 'warning' : ''}">
              {waterParams.temperature.toFixed(1)}°C
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">📊</div>
          <div class="param-info">
            <span class="param-label">pH 值</span>
            <span class="param-value {waterParams.ph < 7.5 || waterParams.ph > 8.5 ? 'warning' : ''}">
              {waterParams.ph.toFixed(1)}
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">💨</div>
          <div class="param-info">
            <span class="param-label">氧气</span>
            <span class="param-value {waterParams.oxygen < 5 ? 'danger' : ''}">
              {waterParams.oxygen.toFixed(1)} mg/L
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">🧪</div>
          <div class="param-info">
            <span class="param-label">氨氮</span>
            <span class="param-value {waterParams.ammonia > 0.2 ? 'danger' : ''}">
              {waterParams.ammonia.toFixed(2)} ppm
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">🔬</div>
          <div class="param-info">
            <span class="param-label">亚硝酸盐</span>
            <span class="param-value {waterParams.nitrite > 0.2 ? 'danger' : ''}">
              {waterParams.nitrite.toFixed(2)} ppm
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">📈</div>
          <div class="param-info">
            <span class="param-label">硝酸盐</span>
            <span class="param-value {waterParams.nitrate > 40 ? 'warning' : ''}">
              {waterParams.nitrate.toFixed(0)} ppm
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">🌊</div>
          <div class="param-info">
            <span class="param-label">盐度</span>
            <span class="param-value">{waterParams.salinity.toFixed(3)}</span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">👁️</div>
          <div class="param-info">
            <span class="param-label">透明度</span>
            <span class="param-value {waterParams.clarity < 50 ? 'warning' : ''}">
              {waterParams.clarity.toFixed(0)}%
            </span>
          </div>
        </div>
        <div class="param-card">
          <div class="param-icon">🦠</div>
          <div class="param-info">
            <span class="param-label">藻类水平</span>
            <span class="param-value {waterParams.algae_level > 50 ? 'danger' : waterParams.algae_level > 30 ? 'warning' : ''}">
              {waterParams.algae_level.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .status-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .device-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .device-card {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: 0.5rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .device-card.status-running {
    border-left: 3px solid #22c55e;
  }

  .device-card.status-stopped {
    border-left: 3px solid #64748b;
    opacity: 0.7;
  }

  .device-card.status-malfunction {
    border-left: 3px solid #f43f5e;
    animation: blink-border 1s ease-in-out infinite;
  }

  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .device-icon {
    font-size: 1.25rem;
  }

  .device-status-indicator {
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
  }

  .device-status-indicator.status-running {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .device-status-indicator.status-stopped {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
  }

  .device-status-indicator.status-malfunction {
    background: rgba(244, 63, 94, 0.2);
    color: #f43f5e;
  }

  .device-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .device-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #e2e8f0;
  }

  .device-type {
    font-size: 0.7rem;
    color: #64748b;
  }

  .device-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .metric-label {
    font-size: 0.7rem;
    color: #64748b;
  }

  .metric-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .progress-bar {
    height: 4px;
    background: rgba(71, 85, 105, 0.3);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0ea5e9, #06b6d4);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .water-params-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .param-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 0.375rem;
    border: 1px solid rgba(71, 85, 105, 0.3);
  }

  .param-icon {
    font-size: 1rem;
  }

  .param-info {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .param-label {
    font-size: 0.625rem;
    color: #64748b;
  }

  .param-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .param-value.warning {
    color: #fbbf24;
  }

  .param-value.danger {
    color: #f43f5e;
  }

  @keyframes blink-border {
    0%, 100% {
      border-left-color: #f43f5e;
      box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.3);
    }
    50% {
      border-left-color: #fda4af;
      box-shadow: 0 0 0 4px rgba(244, 63, 94, 0);
    }
  }
</style>
