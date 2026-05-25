import { component$, $, useSignal } from '@builder.io/qwik';
import { PRESET_SCENARIOS } from '../types';

interface PresetScenariosProps {
  onSelect$: (presetId: string) => void;
}

export const PresetScenarios = component$<PresetScenariosProps>(({ onSelect$ }) => {
  const selectedId = useSignal<string>('');

  const handleClick = $((id: string) => {
    selectedId.value = id;
    onSelect$(id);
  });

  return (
    <div>
      <div class="preset-scenarios">
        {PRESET_SCENARIOS.map((scenario) => (
          <div
            key={scenario.id}
            class={`scenario-card ${selectedId.value === scenario.id ? 'active' : ''}`}
            onClick$={() => handleClick(scenario.id)}
          >
            <h4>
              {scenario.type === 'zero-denominator' && '❌'}
              {scenario.type === 'large-integer' && '📈'}
              {scenario.type === 'truncation-error' && '⚠️'}
              {scenario.type === 'negative-ambiguity' && '🔀'}
              {' '}{scenario.name}
            </h4>
            <p>{scenario.description}</p>
          </div>
        ))}
      </div>

      {selectedId.value && (
        <div class="scenario-warning">
          {selectedId.value === 'scenario-1' && (
            <>
              <h5>⚠️ 分母为零异常</h5>
              <p>
                数学上，分母为零是未定义的。点击计算后，系统将抛出
                <strong>"Division by zero"</strong> 错误，
                演示错误处理机制和抖动动画效果。
              </p>
            </>
          )}
          {selectedId.value === 'scenario-2' && (
            <>
              <h5>📈 大整数性能问题</h5>
              <p>
                超大整数运算会导致内存和CPU占用急剧增加。
                观察分子/分母显示框的动态宽度变化，并注意计算时间。
                大整数的任意精度运算会显著影响性能。
              </p>
            </>
          )}
          {selectedId.value === 'scenario-3' && (
            <>
              <h5>⚠️ 截断误差演示</h5>
              <p>
                连分数截断在不同位置会导致不同的收敛值偏差。
                观察收敛轨迹曲线，注意不同项数的近似值与真实值之间的差异。
                周期性连分数的截断位置会影响近似精度。
              </p>
            </>
          )}
          {selectedId.value === 'scenario-4' && (
            <>
              <h5>🔀 负数表示歧义</h5>
              <p>
                负数的连分数表示存在多种约定。
                观察不同符号处理方式可能导致的结果不一致。
                注意欧几里得算法对负数的处理逻辑。
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
});
