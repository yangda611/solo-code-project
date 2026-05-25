import type { Fraction, ContinuedFractionResult, HistoryRecord, FormulaRecord, OperationType } from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data.data;
}

export async function calculateContinuedFraction(
  numerator: string,
  denominator: string,
  maxTerms?: number
): Promise<ContinuedFractionResult> {
  return request<ContinuedFractionResult>('/calculate', {
    method: 'POST',
    body: JSON.stringify({ numerator, denominator, maxTerms })
  });
}

export async function performOperation(
  fraction1: Fraction,
  fraction2: Fraction,
  operation: OperationType
): Promise<{ result: Fraction; continuedFraction: ContinuedFractionResult }> {
  return request<{ result: Fraction; continuedFraction: ContinuedFractionResult }>('/operate', {
    method: 'POST',
    body: JSON.stringify({ fraction1, fraction2, operation })
  });
}

export async function calculateQuadraticSurd(
  n: number,
  maxTerms?: number
): Promise<ContinuedFractionResult> {
  return request<ContinuedFractionResult>('/quadratic-surd', {
    method: 'POST',
    body: JSON.stringify({ n, maxTerms })
  });
}

export async function getEuclideanSteps(a: string, b: string): Promise<{ steps: any[] }> {
  return request<{ steps: any[] }>('/euclidean', {
    method: 'POST',
    body: JSON.stringify({ a, b })
  });
}

export async function getHistory(): Promise<HistoryRecord[]> {
  return request<HistoryRecord[]>('/history', { method: 'GET' });
}

export async function clearHistory(): Promise<void> {
  return request<void>('/history', { method: 'DELETE' });
}

export async function getFormulas(): Promise<FormulaRecord[]> {
  return request<FormulaRecord[]>('/formulas', { method: 'GET' });
}

export async function saveFormula(formula: {
  expression: string;
  numerator: string;
  denominator: string;
  continuedFraction: string;
}): Promise<{ id: number }> {
  return request<{ id: number }>('/formulas', {
    method: 'POST',
    body: JSON.stringify(formula)
  });
}

export async function clearFormulas(): Promise<void> {
  return request<void>('/formulas', { method: 'DELETE' });
}
