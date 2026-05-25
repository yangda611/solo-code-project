import { component$, useSignal, useTask$, $, useVisibleTask$ } from '@builder.io/qwik';
import type { ContinuedFractionResult, HistoryRecord, OperationType, Fraction } from '../types';
import { PRESET_SCENARIOS } from '../types';
import {
  calculateContinuedFraction,
  performOperation,
  getHistory,
  clearHistory as apiClearHistory
} from '../services/api';
import { ContinuedFractionDisplay } from '../components/ContinuedFractionDisplay';
import { ConvergenceChart } from '../components/ConvergenceChart';
import { FractionInput } from '../components/FractionInput';
import { HistoryList } from '../components/HistoryList';
import { PresetScenarios } from '../components/PresetScenarios';

export default component$(() => {
  const numerator1 = useSignal<string>('355');
  const denominator1 = useSignal<string>('113');
  const numerator2 = useSignal<string>('22');
  const denominator2 = useSignal<string>('7');
  const selectedOperation = useSignal<OperationType>('add');
  const activeTab = useSignal<string>('calculator');
  
  const result = useSignal<ContinuedFractionResult | null>(null);
  const operationResult = useSignal<Fraction | null>(null);
  const history = useSignal<HistoryRecord[]>([]);
  const loading = useSignal<boolean>(false);
  const error = useSignal<string>('');
  const animationKey = useSignal<number>(0);
  const performanceWarning = useSignal<string>('');

  useVisibleTask$(async () => {
    try {
      const historyData = await getHistory();
      history.value = historyData;
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  });

  const handleCalculate = $(async () => {
    loading.value = true;
    error.value = '';
    performanceWarning.value = '';
    
    try {
      const startTime = Date.now();
      const data = await calculateContinuedFraction(numerator1.value, denominator1.value);
      const endTime = Date.now();
      
      const calcTime = endTime - startTime;
      
      if (calcTime > 1000) {
        performanceWarning.value = `检测到性能问题：计算耗时 ${calcTime}ms，可能由于大整数运算导致内存和CPU占用过高`;
      }
      
      result.value = data;
      animationKey.value++;
      
      const historyData = await getHistory();
      history.value = historyData;
    } catch (e: any) {
      error.value = e.message || '计算失败';
    } finally {
      loading.value = false;
    }
  });

  const handleOperation = $(async () => {
    loading.value = true;
    error.value = '';
    performanceWarning.value = '';
    
    try {
      const startTime = Date.now();
      const data = await performOperation(
        { numerator: numerator1.value, denominator: denominator1.value },
        { numerator: numerator2.value, denominator: denominator2.value },
        selectedOperation.value
      );
      const endTime = Date.now();
      
      const calcTime = endTime - startTime;
      
      if (calcTime > 1000) {
        performanceWarning.value = `检测到性能问题：计算耗时 ${calcTime}ms，可能由于大整数运算导致内存和CPU占用过高`;
      }
      
      operationResult.value = data.result;
      result.value = data.continuedFraction;
      animationKey.value++;
      
      const historyData = await getHistory();
      history.value = historyData;
    } catch (e: any) {
      error.value = e.message || '运算失败';
    } finally {
      loading.value = false;
    }
  });

  const handleClearHistory = $(async () => {
    try {
      await apiClearHistory();
      history.value = [];
    } catch (e: any) {
      error.value = e.message || '清除历史失败';
    }
  });

  const handlePresetSelect = $((presetId: string) => {
    switch (presetId) {
      case 'scenario-1':
        numerator1.value = '1';
        denominator1.value = '0';
        break;
      case 'scenario-2':
        numerator1.value = '999999999999999999';
        denominator1.value = '888888888888888888';
        numerator2.value = '777777777777777777';
        denominator2.value = '666666666666666666';
        break;
      case 'scenario-3':
        numerator1.value = '1';
        denominator1.value = '2';
        numerator2.value = '1';
        denominator2.value = '3';
        break;
      case 'scenario-4':
        numerator1.value = '-5';
        denominator1.value = '3';
        break;
    }
  });

  return (
    <div class="container">
      <header class="header">
        <h1>➗ 连分数计算器</h1>
        <p>精确有理数四则运算与连分数展开系统</p>
      </header>

      <div class="grid">
        <div class="card">
          <h2>分数计算器</h2>
          <div class="tabs">
            <button
              class={`tab ${activeTab.value === 'calculator' ? 'active' : ''}`}
              onClick$={() => activeTab.value = 'calculator'}
            >
              单分数
            </button>
            <button
              class={`tab ${activeTab.value === 'operation' ? 'active' : ''}`}
              onClick$={() => activeTab.value = 'operation'}
            >
              四则运算
            </button>
          </div>

          {activeTab.value === 'calculator' ? (
            <>
              <FractionInput
                numerator={numerator1}
                denominator={denominator1}
                label="输入分数"
                onError$={() => {}}
              />
              <button
                class="btn btn-primary"
                onClick$={handleCalculate}
                disabled={loading.value}
              >
                {loading.value ? <span class="loading"></span> : null}
                计算连分数展开
              </button>
            </>
          ) : (
            <>
              <FractionInput
                numerator={numerator1}
                denominator={denominator1}
                label="分数 1"
                onError$={() => {}}
              />
              <div class="operation-buttons">
                {(['add', 'subtract', 'multiply', 'divide'] as OperationType[]).map((op) => (
                  <button
                    key={op}
                    class={`operation-btn ${selectedOperation.value === op ? 'active' : ''}`}
                    onClick$={() => selectedOperation.value = op}
                  >
                    {op === 'add' ? '+' : op === 'subtract' ? '-' : op === 'multiply' ? '×' : '÷'}
                  </button>
                ))}
              </div>
              <FractionInput
                numerator={numerator2}
                denominator={denominator2}
                label="分数 2"
                onError$={() => {}}
              />
              <button
                class="btn btn-primary"
                onClick$={handleOperation}
                disabled={loading.value}
              >
                {loading.value ? <span class="loading"></span> : null}
                执行运算
              </button>
            </>
          )}

          {error.value && (
            <div class="error-message shake-error">
              <span>⚠️</span>
              {error.value}
            </div>
          )}

          {performanceWarning.value && (
            <div class="performance-warning">
              <span>🚨</span>
              {performanceWarning.value}
            </div>
          )}

          {result.value && (
            <div class="result-section">
              {operationResult.value && (
                <div class="result-fraction">
                  <div class="fraction">
                    <div class={`numerator ${operationResult.value.numerator.length > 20 ? 'large-width' : ''}`}>
                      {operationResult.value.numerator}
                    </div>
                    <div class="fraction-line"></div>
                    <div class={`denominator ${operationResult.value.denominator.length > 20 ? 'large-width' : ''}`}>
                      {operationResult.value.denominator}
                    </div>
                  </div>
                </div>
              )}
              <ContinuedFractionDisplay
                result={result.value}
                key={animationKey.value}
              />
            </div>
          )}
        </div>

        <div class="card">
          <h2>预设问题场景</h2>
          <PresetScenarios onSelect$={handlePresetSelect} />
        </div>
      </div>

      {result.value && result.value.convergents && result.value.convergents.length > 0 && (
        <div class="card">
          <h2>收敛过程可视化</h2>
          <ConvergenceChart convergents={result.value.convergents} key={animationKey.value} />
          
          <table class="convergence-table">
            <thead>
              <tr>
                <th>项数</th>
                <th>分数</th>
                <th>近似值</th>
              </tr>
            </thead>
            <tbody>
              {result.value.convergents.map((conv, i) => (
                <tr key={i} class={i < 5 ? `fly-in fly-in-stagger-${i + 1}` : ''}>
                  <td>{i + 1}</td>
                  <td class="fraction-cell">
                    {conv.numerator}/{conv.denominator}
                  </td>
                  <td class="decimal-cell">{conv.decimalApprox.toFixed(8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div class="grid">
        <div class="card">
          <h2>📊 计算统计</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{history.value.length}</div>
              <div class="stat-label">总计算次数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">
                {result.value ? result.value.fractionalTerms.length + 1 : 0}
              </div>
              <div class="stat-label">上次展开项数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">
                {result.value ? result.value.convergents.length : 0}
              </div>
              <div class="stat-label">收敛项数</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>📜 计算历史</h2>
            {history.value.length > 0 && (
              <button class="btn btn-danger" onClick$={handleClearHistory}>
                清空
              </button>
            )}
          </div>
          <HistoryList history={history.value} />
        </div>
      </div>
    </div>
  );
});
