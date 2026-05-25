import bigInt from 'big-integer';

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

export function gcd(a: bigInt.BigInteger, b: bigInt.BigInteger): bigInt.BigInteger {
  while (!b.isZero()) {
    const temp = b;
    b = a.mod(b);
    a = temp;
  }
  return a;
}

export function euclideanAlgorithmSteps(a: bigInt.BigInteger, b: bigInt.BigInteger): EuclideanStep[] {
  const steps: EuclideanStep[] = [];
  let x = a.abs();
  let y = b.abs();
  
  while (!y.isZero()) {
    const quotient = x.divide(y);
    const remainder = x.mod(y);
    steps.push({
      a: x.toString(),
      b: y.toString(),
      quotient: quotient.toString(),
      remainder: remainder.toString()
    });
    x = y;
    y = remainder;
  }
  
  return steps;
}

export function simplifyFraction(num: bigInt.BigInteger, den: bigInt.BigInteger): Fraction {
  if (den.isZero()) {
    throw new Error('Division by zero');
  }
  
  const commonDivisor = gcd(num.abs(), den.abs());
  let numerator = num.divide(commonDivisor);
  let denominator = den.divide(commonDivisor);
  
  if (denominator.isNegative()) {
    numerator = numerator.multiply(bigInt(-1));
    denominator = denominator.abs();
  }
  
  return {
    numerator: numerator.toString(),
    denominator: denominator.toString()
  };
}

export function fractionToContinuedFraction(
  numerator: string,
  denominator: string,
  maxTerms: number = 100
): ContinuedFractionResult {
  let num = bigInt(numerator);
  let den = bigInt(denominator);
  
  if (den.isZero()) {
    throw new Error('Division by zero: denominator cannot be zero');
  }
  
  const terms: string[] = [];
  const convergents: ConvergenceTerm[] = [];
  
  let hPrevPrev = bigInt(0);
  let hPrev = bigInt(1);
  let kPrevPrev = bigInt(1);
  let kPrev = bigInt(0);
  
  for (let i = 0; i < maxTerms && !den.isZero(); i++) {
    const quotient = num.divide(den);
    terms.push(quotient.toString());
    
    const h = quotient.multiply(hPrev).add(hPrevPrev);
    const k = quotient.multiply(kPrev).add(kPrevPrev);
    
    if (!k.isZero()) {
      const decimalApprox = parseFloat(h.toString()) / parseFloat(k.toString());
      convergents.push({
        term: i,
        numerator: h.toString(),
        denominator: k.toString(),
        decimalApprox
      });
    }
    
    hPrevPrev = hPrev;
    hPrev = h;
    kPrevPrev = kPrev;
    kPrev = k;
    
    const remainder = num.mod(den);
    num = den;
    den = remainder;
  }
  
  return {
    integerPart: terms[0] || '0',
    fractionalTerms: terms.slice(1),
    convergents,
    isPeriodic: false
  };
}

export function detectPeriod(terms: string[], minPeriod: number = 1): { start: number; length: number; period: string[] } | null {
  for (let start = 0; start < terms.length; start++) {
    for (let periodLen = minPeriod; periodLen <= (terms.length - start) / 2; periodLen++) {
      let isPeriod = true;
      for (let i = start; i + periodLen < terms.length; i++) {
        if (terms[i] !== terms[i + periodLen]) {
          isPeriod = false;
          break;
        }
      }
      if (isPeriod) {
        return {
          start,
          length: periodLen,
          period: terms.slice(start, start + periodLen)
        };
      }
    }
  }
  return null;
}

export function quadraticSurdContinuedFraction(
  n: number,
  maxTerms: number = 200
): ContinuedFractionResult {
  if (n < 0) {
    throw new Error('Square root of negative number');
  }
  
  const sqrtN = Math.sqrt(n);
  const a0 = Math.floor(sqrtN);
  
  if (a0 * a0 === n) {
    return {
      integerPart: a0.toString(),
      fractionalTerms: [],
      convergents: [{
        term: 0,
        numerator: a0.toString(),
        denominator: '1',
        decimalApprox: a0
      }],
      isPeriodic: false
    };
  }
  
  const terms: string[] = [a0.toString()];
  const convergents: ConvergenceTerm[] = [];
  
  let hPrevPrev = bigInt(0);
  let hPrev = bigInt(1);
  let kPrevPrev = bigInt(1);
  let kPrev = bigInt(0);
  
  let m = 0;
  let d = 1;
  let a = a0;
  
  const seenStates: string[] = [];
  
  for (let i = 0; i < maxTerms; i++) {
    const h = bigInt(a).multiply(hPrev).add(hPrevPrev);
    const k = bigInt(a).multiply(kPrev).add(kPrevPrev);
    
    if (i === 0) {
      convergents.push({
        term: 0,
        numerator: h.toString(),
        denominator: k.toString(),
        decimalApprox: parseFloat(h.toString()) / parseFloat(k.toString())
      });
    }
    
    hPrevPrev = hPrev;
    hPrev = h;
    kPrevPrev = kPrev;
    kPrev = k;
    
    m = d * a - m;
    d = (n - m * m) / d;
    
    if (d === 0) break;
    
    a = Math.floor((a0 + m) / d);
    
    const state = `${m},${d},${a}`;
    if (seenStates.includes(state)) {
      const periodStart = seenStates.indexOf(state);
      return {
        integerPart: terms[0],
        fractionalTerms: terms.slice(1),
        convergents,
        isPeriodic: true,
        periodStart,
        periodLength: terms.slice(1).length - periodStart,
        period: terms.slice(1 + periodStart)
      };
    }
    
    seenStates.push(state);
    terms.push(a.toString());
    
    convergents.push({
      term: convergents.length,
      numerator: hPrev.toString(),
      denominator: kPrev.toString(),
      decimalApprox: parseFloat(hPrev.toString()) / parseFloat(kPrev.toString())
    });
  }
  
  return {
    integerPart: terms[0],
    fractionalTerms: terms.slice(1),
    convergents,
    isPeriodic: false
  };
}

export function addFractions(f1: Fraction, f2: Fraction): Fraction {
  const num1 = bigInt(f1.numerator);
  const den1 = bigInt(f1.denominator);
  const num2 = bigInt(f2.numerator);
  const den2 = bigInt(f2.denominator);
  
  if (den1.isZero() || den2.isZero()) {
    throw new Error('Division by zero');
  }
  
  const commonDen = den1.multiply(den2);
  const resultNum = num1.multiply(den2).add(num2.multiply(den1));
  
  return simplifyFraction(resultNum, commonDen);
}

export function subtractFractions(f1: Fraction, f2: Fraction): Fraction {
  const num1 = bigInt(f1.numerator);
  const den1 = bigInt(f1.denominator);
  const num2 = bigInt(f2.numerator);
  const den2 = bigInt(f2.denominator);
  
  if (den1.isZero() || den2.isZero()) {
    throw new Error('Division by zero');
  }
  
  const commonDen = den1.multiply(den2);
  const resultNum = num1.multiply(den2).subtract(num2.multiply(den1));
  
  return simplifyFraction(resultNum, commonDen);
}

export function multiplyFractions(f1: Fraction, f2: Fraction): Fraction {
  const num1 = bigInt(f1.numerator);
  const den1 = bigInt(f1.denominator);
  const num2 = bigInt(f2.numerator);
  const den2 = bigInt(f2.denominator);
  
  if (den1.isZero() || den2.isZero()) {
    throw new Error('Division by zero');
  }
  
  const resultNum = num1.multiply(num2);
  const resultDen = den1.multiply(den2);
  
  return simplifyFraction(resultNum, resultDen);
}

export function divideFractions(f1: Fraction, f2: Fraction): Fraction {
  const num1 = bigInt(f1.numerator);
  const den1 = bigInt(f1.denominator);
  const num2 = bigInt(f2.numerator);
  const den2 = bigInt(f2.denominator);
  
  if (den1.isZero() || den2.isZero()) {
    throw new Error('Division by zero');
  }
  
  if (num2.isZero()) {
    throw new Error('Division by zero: cannot divide by zero fraction');
  }
  
  const resultNum = num1.multiply(den2);
  const resultDen = den1.multiply(num2);
  
  return simplifyFraction(resultNum, resultDen);
}
