import { component$, useVisibleTask$ } from '@builder.io/qwik';
import type { ContinuedFractionResult } from '../types';

interface ContinuedFractionDisplayProps {
  result: ContinuedFractionResult;
}

export const ContinuedFractionDisplay = component$<ContinuedFractionDisplayProps>(({ result }) => {
  const allTerms = [result.integerPart, ...result.fractionalTerms];
  
  useVisibleTask$(() => {
    const badges = document.querySelectorAll('.term-badge');
    badges.forEach((badge, index) => {
      setTimeout(() => {
        badge.classList.add('fly-in');
      }, index * 100);
    });
  });

  return (
    <div class="continued-fraction-display">
      <h4 style={{ marginBottom: '15px', color: 'var(--text-muted)' }}>
        连分数展开结果
      </h4>
      
      <div class="terms-container">
        <span class="term-separator">[</span>
        <span class="term-badge integer">{result.integerPart}</span>
        <span class="term-separator">;</span>
        
        {result.fractionalTerms.map((term, index) => {
          const isPeriod = result.isPeriodic && 
            result.periodStart !== undefined && 
            result.period !== undefined &&
            index >= result.periodStart && 
            index < result.periodStart + result.period.length;
          
          return (
            <>
              <span 
                key={index} 
                class={`term-badge ${isPeriod ? 'period' : ''}`}
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                {term}
              </span>
              {index < result.fractionalTerms.length - 1 && (
                <span class="term-separator">,</span>
              )}
            </>
          );
        })}
        <span class="term-separator">]</span>
      </div>

      {result.isPeriodic && (
        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>🔄 周期性连分数</span>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>
            周期起始位置: 第 {result.periodStart! + 1} 项 | 周期长度: {result.periodLength}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            周期序列: [{result.period?.join(', ')}]
          </p>
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <p>整数部分: a₀ = {result.integerPart}</p>
        <p>分数部分项数: {result.fractionalTerms.length}</p>
        <p>总项数: {allTerms.length}</p>
      </div>
    </div>
  );
});
