import { component$, useVisibleTask$ } from '@builder.io/qwik';
import type { ConvergenceTerm } from '../types';

interface ConvergenceChartProps {
  convergents: ConvergenceTerm[];
}

export const ConvergenceChart = component$<ConvergenceChartProps>(({ convergents }) => {
  const width = 800;
  const height = 250;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = convergents.map(c => c.decimalApprox);
  const minVal = Math.min(...values) - 0.5;
  const maxVal = Math.max(...values) + 0.5;
  const valueRange = maxVal - minVal || 1;

  const scaleX = (index: number) => padding + (index / (convergents.length - 1 || 1)) * chartWidth;
  const scaleY = (value: number) => height - padding - ((value - minVal) / valueRange) * chartHeight;

  const points = convergents.map((c, i) => ({
    x: scaleX(i),
    y: scaleY(c.decimalApprox)
  }));

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div class="convergence-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="50%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#ec4899" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={`h-${i}`}
            class="grid-line"
            x1={padding}
            y1={padding + ratio * chartHeight}
            x2={width - padding}
            y2={padding + ratio * chartHeight}
          />
        ))}

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={`v-${i}`}
            class="grid-line"
            x1={padding + ratio * chartWidth}
            y1={padding}
            x2={padding + ratio * chartWidth}
            y2={height - padding}
          />
        ))}

        {points.length > 0 && (
          <>
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#areaGradient)"
            />
            <path
              class="convergence-line"
              d={pathD}
              fill="none"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </>
        )}

        {points.map((point, i) => (
          <circle
            key={i}
            class="convergence-dot"
            cx={point.x}
            cy={point.y}
            r="6"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}

        <text
          x={padding - 10}
          y={height - padding + 15}
          fill="var(--text-muted)"
          font-size="12"
          text-anchor="end"
        >
          {minVal.toFixed(2)}
        </text>
        <text
          x={padding - 10}
          y={padding + 5}
          fill="var(--text-muted)"
          font-size="12"
          text-anchor="end"
        >
          {maxVal.toFixed(2)}
        </text>

        <text
          x={width / 2}
          y={height - 10}
          fill="var(--text-muted)"
          font-size="12"
          text-anchor="middle"
        >
          收敛项
        </text>

        <text
          x={width / 2}
          y={25}
          fill="var(--text-color)"
          font-size="14"
          font-weight="bold"
          text-anchor="middle"
        >
          收敛过程轨迹
        </text>
      </svg>
    </div>
  );
});
