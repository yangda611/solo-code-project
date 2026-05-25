export interface Fraction {
  numerator: string;
  denominator: string;
}

export interface ConvergenceTerm {
  term: number;
  numerator: string;
  denominator: string;
  decimalApprox: number;
}

export interface ContinuedFractionResult {
  integerPart: string;
  fractionalTerms: string[];
  convergents: ConvergenceTerm[];
  isPeriodic: boolean;
  periodStart?: number;
  periodLength?: number;
  period?: string[];
}

export interface EuclideanStep {
  a: string;
  b: string;
  quotient: string;
  remainder: string;
}

export interface HistoryRecord {
  id: number;
  type: 'calculation' | 'operation';
  input: string;
  result: string;
  createdAt: string;
}

export interface FormulaRecord {
  id: number;
  expression: string;
  numerator: string;
  denominator: string;
  continuedFraction: string;
  createdAt: string;
}

export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  type: 'zero-denominator' | 'large-integer' | 'truncation-error' | 'negative-ambiguity';
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'scenario-1',
    name: '分母为零',
    description: '演示分母为零时引发的无穷大标记异常处理',
    type: 'zero-denominator'
  },
  {
    id: 'scenario-2',
    name: '超大整数增长',
    description: '演示超大整数分子分母导致的内存指数增长和性能下降',
    type: 'large-integer'
  },
  {
    id: 'scenario-3',
    name: '截断收敛误差',
    description: '演示循环连分数截断位置不同导致的收敛值偏差',
    type: 'truncation-error'
  },
  {
    id: 'scenario-4',
    name: '负数歧义',
    description: '演示负数的连分数表示歧义与符号处理不一致',
    type: 'negative-ambiguity'
  }
];
