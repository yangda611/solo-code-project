import { useEffect, useState } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = {
  green: '#00ff41',
  red: '#ff0040',
  cyan: '#00ffff',
  yellow: '#ffff00',
  purple: '#9932cc',
  orange: '#ff8c00',
  gray: '#2a2a2a',
};

export function PerformanceCharts() {
  const [performanceData, setPerformanceData] = useState({
    pnlHistory: [] as any[],
    drawdownHistory: [] as any[],
    radarMetrics: [] as any[],
    metrics: null as any,
  });

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      const response = await fetch('/api/performance');
      if (response.ok) {
        const data = await response.json();
        
        const pnlChartData = data.pnlHistory.slice(-100).map((entry: any) => ({
          time: new Date(entry.timestamp).toLocaleTimeString(),
          balance: entry.balance,
          equity: entry.equity,
          unrealizedPnL: entry.unrealizedPnL,
        }));

        const drawdownChartData = data.drawdownHistory.slice(-100).map((entry: any) => ({
          time: new Date(entry.timestamp).toLocaleTimeString(),
          drawdown: entry.drawdown * 100,
        }));

        setPerformanceData({
          pnlHistory: pnlChartData,
          drawdownHistory: drawdownChartData,
          radarMetrics: data.radarMetrics,
          metrics: data.metrics,
        });
      }
    } catch (err: any) {
      console.error('Failed to load performance data:', err);
    }
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <div className="matrix-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="matrix-panel-header">PERFORMANCE ANALYTICS</div>
      
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {performanceData.metrics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '8px',
            padding: '12px',
            border: '1px solid var(--matrix-border)'
          }}>
            <MetricCard 
              label="Total Return" 
              value={formatPercent(performanceData.metrics.totalReturn)}
              color={performanceData.metrics.totalReturn >= 0 ? COLORS.green : COLORS.red}
            />
            <MetricCard 
              label="Sharpe Ratio" 
              value={performanceData.metrics.sharpeRatio.toFixed(2)}
              color={performanceData.metrics.sharpeRatio >= 1 ? COLORS.green : COLORS.yellow}
            />
            <MetricCard 
              label="Max Drawdown" 
              value={formatPercent(performanceData.metrics.maxDrawdown)}
              color={performanceData.metrics.maxDrawdown < 0.1 ? COLORS.green : COLORS.red}
            />
            <MetricCard 
              label="Win Rate" 
              value={formatPercent(performanceData.metrics.winRate)}
              color={performanceData.metrics.winRate >= 0.5 ? COLORS.green : COLORS.yellow}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ChartCard 
              title="PnL & Equity Curve"
              height={150}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData.pnlHistory}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray} />
                  <XAxis 
                    dataKey="time" 
                    stroke={COLORS.green}
                    tick={{ fill: COLORS.green, fontSize: 10 }}
                  />
                  <YAxis 
                    stroke={COLORS.green}
                    tick={{ fill: COLORS.green, fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#000', 
                      border: `1px solid ${COLORS.green}`,
                      color: COLORS.green
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke={COLORS.green} 
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke={COLORS.cyan} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard 
              title="Drawdown"
              height={120}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData.drawdownHistory}>
                  <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.red} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray} />
                  <XAxis 
                    dataKey="time" 
                    stroke={COLORS.green}
                    tick={{ fill: COLORS.green, fontSize: 10 }}
                  />
                  <YAxis 
                    stroke={COLORS.red}
                    tick={{ fill: COLORS.red, fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#000', 
                      border: `1px solid ${COLORS.red}`,
                      color: COLORS.red
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke={COLORS.red} 
                    fillOpacity={1} 
                    fill="url(#colorDrawdown)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard 
            title="Strategy Radar"
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceData.radarMetrics}>
                <PolarGrid stroke={COLORS.gray} />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: COLORS.green, fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 1]} 
                  tick={{ fill: COLORS.green, fontSize: 8 }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke={COLORS.green}
                  fill={COLORS.green}
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#000', 
                    border: `1px solid ${COLORS.green}`,
                    color: COLORS.green
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {performanceData.metrics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gap: '8px',
            padding: '8px',
            border: '1px solid var(--matrix-border)',
            fontSize: '10px'
          }}>
            <MiniMetric 
              label="Profit Factor" 
              value={performanceData.metrics.profitFactor.toFixed(2)}
            />
            <MiniMetric 
              label="Avg Win" 
              value={`$${performanceData.metrics.avgWin.toFixed(2)}`}
            />
            <MiniMetric 
              label="Avg Loss" 
              value={`$${performanceData.metrics.avgLoss.toFixed(2)}`}
            />
            <MiniMetric 
              label="Total Trades" 
              value={performanceData.metrics.totalTrades.toString()}
            />
            <MiniMetric 
              label="Total Volume" 
              value={`$${(performanceData.metrics.totalVolume / 1000).toFixed(1)}K`}
            />
            <MiniMetric 
              label="DD Duration" 
              value={`${(performanceData.metrics.maxDrawdownDuration / 1000).toFixed(0)}s`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ opacity: 0.5, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, height, children }: { title: string; height: number; children: React.ReactNode }) {
  return (
    <div style={{ 
      border: '1px solid var(--matrix-border)',
      display: 'flex',
      flexDirection: 'column',
      height,
    }}>
      <div style={{ 
        padding: '4px 8px', 
        borderBottom: '1px solid var(--matrix-border)',
        fontSize: '11px',
        opacity: 0.7
      }}>
        {title}
      </div>
      <div style={{ flex: 1, padding: '4px' }}>
        {children}
      </div>
    </div>
  );
}
