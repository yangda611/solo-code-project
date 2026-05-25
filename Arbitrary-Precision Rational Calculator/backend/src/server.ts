import fastify from 'fastify';
import cors from '@fastify/cors';
import { initDatabase, saveFormula, getFormulas, saveHistory, getHistory, clearHistory, clearFormulas } from './database';
import {
  fractionToContinuedFraction,
  quadraticSurdContinuedFraction,
  addFractions,
  subtractFractions,
  multiplyFractions,
  divideFractions,
  euclideanAlgorithmSteps,
  Fraction,
  ContinuedFractionResult
} from './algorithms/continuedFraction';
import bigInt from 'big-integer';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

const server = fastify({ logger: true });

server.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'DELETE']
});

interface CalculateRequest {
  numerator: string;
  denominator: string;
  maxTerms?: number;
}

interface OperationRequest {
  fraction1: Fraction;
  fraction2: Fraction;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
}

interface QuadraticSurdRequest {
  n: number;
  maxTerms?: number;
}

interface EuclideanRequest {
  a: string;
  b: string;
}

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

server.post<{ Body: CalculateRequest }>('/api/calculate', async (request, reply) => {
  try {
    const { numerator, denominator, maxTerms = 100 } = request.body;
    
    const result = fractionToContinuedFraction(numerator, denominator, maxTerms);
    
    const cfString = `[${result.integerPart}; ${result.fractionalTerms.join(', ')}]`;
    saveHistory({
      type: 'calculation',
      input: `${numerator}/${denominator}`,
      result: cfString
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    reply.status(400);
    return {
      success: false,
      error: error.message
    };
  }
});

server.post<{ Body: OperationRequest }>('/api/operate', async (request, reply) => {
  try {
    const { fraction1, fraction2, operation } = request.body;
    
    let result: Fraction;
    let opSymbol: string;
    
    switch (operation) {
      case 'add':
        result = addFractions(fraction1, fraction2);
        opSymbol = '+';
        break;
      case 'subtract':
        result = subtractFractions(fraction1, fraction2);
        opSymbol = '-';
        break;
      case 'multiply':
        result = multiplyFractions(fraction1, fraction2);
        opSymbol = '×';
        break;
      case 'divide':
        result = divideFractions(fraction1, fraction2);
        opSymbol = '÷';
        break;
      default:
        throw new Error('Invalid operation');
    }
    
    const cfResult = fractionToContinuedFraction(result.numerator, result.denominator);
    
    saveHistory({
      type: 'operation',
      input: `${fraction1.numerator}/${fraction1.denominator} ${opSymbol} ${fraction2.numerator}/${fraction2.denominator}`,
      result: `${result.numerator}/${result.denominator}`
    });
    
    return {
      success: true,
      data: {
        result,
        continuedFraction: cfResult
      }
    };
  } catch (error: any) {
    reply.status(400);
    return {
      success: false,
      error: error.message
    };
  }
});

server.post<{ Body: QuadraticSurdRequest }>('/api/quadratic-surd', async (request, reply) => {
  try {
    const { n, maxTerms = 200 } = request.body;
    
    const result = quadraticSurdContinuedFraction(n, maxTerms);
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    reply.status(400);
    return {
      success: false,
      error: error.message
    };
  }
});

server.post<{ Body: EuclideanRequest }>('/api/euclidean', async (request, reply) => {
  try {
    const { a, b } = request.body;
    
    const steps = euclideanAlgorithmSteps(bigInt(a), bigInt(b));
    
    return {
      success: true,
      data: { steps }
    };
  } catch (error: any) {
    reply.status(400);
    return {
      success: false,
      error: error.message
    };
  }
});

server.post('/api/formulas', async (request) => {
  const { expression, numerator, denominator, continuedFraction } = request.body as any;
  
  const id = saveFormula({ expression, numerator, denominator, continuedFraction });
  
  return { success: true, id };
});

server.get('/api/formulas', async () => {
  const formulas = getFormulas(50);
  return { success: true, data: formulas };
});

server.get('/api/history', async () => {
  const history = getHistory(100);
  return { success: true, data: history };
});

server.delete('/api/history', async () => {
  clearHistory();
  return { success: true };
});

server.delete('/api/formulas', async () => {
  clearFormulas();
  return { success: true };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
