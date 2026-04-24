import { KLine, MACDResult, BOLLResult, RSResult } from '../types';

export class TechnicalIndicators {
  static SMA(prices: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }

  static EMA(prices: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    let ema: number | null = null;
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else if (i === period - 1) {
        const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
        ema = sma;
        result.push(ema);
      } else {
        ema = (prices[i] - ema!) * multiplier + ema!;
        result.push(ema);
      }
    }
    return result;
  }

  static MACD(
    klines: KLine[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDResult[] {
    const prices = klines.map(k => k.close);
    const fastEMA = this.EMA(prices, fastPeriod);
    const slowEMA = this.EMA(prices, slowPeriod);
    
    const macdLine: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
        macdLine.push(NaN);
      } else {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      }
    }

    const validMacd = macdLine.map(v => isNaN(v) ? 0 : v);
    const signalLine = this.EMA(validMacd, signalPeriod);

    const result: MACDResult[] = [];
    for (let i = 0; i < klines.length; i++) {
      const macd = macdLine[i];
      const signal = signalLine[i];
      const histogram = !isNaN(macd) && !isNaN(signal) ? macd - signal : NaN;

      result.push({
        timestamp: klines[i].timestamp,
        macd,
        signal,
        histogram,
      });
    }

    return result;
  }

  static BOLL(
    klines: KLine[],
    period: number = 20,
    stdDevMultiplier: number = 2
  ): BOLLResult[] {
    const prices = klines.map(k => k.close);
    const middleLine = this.SMA(prices, period);

    const result: BOLLResult[] = [];
    for (let i = 0; i < klines.length; i++) {
      if (i < period - 1) {
        result.push({
          timestamp: klines[i].timestamp,
          upper: NaN,
          middle: NaN,
          lower: NaN,
        });
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = middleLine[i];
        const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        result.push({
          timestamp: klines[i].timestamp,
          upper: mean + stdDevMultiplier * stdDev,
          middle: mean,
          lower: mean - stdDevMultiplier * stdDev,
        });
      }
    }

    return result;
  }

  static RSI(klines: KLine[], period: number = 14): RSResult[] {
    const prices = klines.map(k => k.close);
    const result: RSResult[] = [];

    let gains: number[] = [];
    let losses: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        result.push({
          timestamp: klines[i].timestamp,
          rsi: NaN,
        });
        continue;
      }

      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      gains.push(gain);
      losses.push(loss);

      if (gains.length > period) {
        gains.shift();
        losses.shift();
      }

      if (i < period) {
        result.push({
          timestamp: klines[i].timestamp,
          rsi: NaN,
        });
        continue;
      }

      const avgGain = gains.reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

      let rsi: number;
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
      }

      result.push({
        timestamp: klines[i].timestamp,
        rsi,
      });
    }

    return result;
  }

  static ATR(klines: KLine[], period: number = 14): number[] {
    const trValues: number[] = [];

    for (let i = 0; i < klines.length; i++) {
      if (i === 0) {
        trValues.push(klines[i].high - klines[i].low);
      } else {
        const tr1 = klines[i].high - klines[i].low;
        const tr2 = Math.abs(klines[i].high - klines[i - 1].close);
        const tr3 = Math.abs(klines[i].low - klines[i - 1].close);
        trValues.push(Math.max(tr1, tr2, tr3));
      }
    }

    return this.SMA(trValues, period);
  }

  static Stochastic(
    klines: KLine[],
    kPeriod: number = 14,
    dPeriod: number = 3
  ): { timestamp: number; k: number; d: number }[] {
    const kValues: number[] = [];

    for (let i = 0; i < klines.length; i++) {
      if (i < kPeriod - 1) {
        kValues.push(NaN);
        continue;
      }

      const slice = klines.slice(i - kPeriod + 1, i + 1);
      const low = Math.min(...slice.map(k => k.low));
      const high = Math.max(...slice.map(k => k.high));
      const close = klines[i].close;

      if (high === low) {
        kValues.push(50);
      } else {
        kValues.push(((close - low) / (high - low)) * 100);
      }
    }

    const dValues = this.SMA(kValues.map(v => isNaN(v) ? 0 : v), dPeriod);

    return klines.map((kline, i) => ({
      timestamp: kline.timestamp,
      k: kValues[i],
      d: dValues[i] || NaN,
    }));
  }

  static VWAP(klines: KLine[]): number[] {
    const result: number[] = [];
    let cumulativePV = 0;
    let cumulativeVolume = 0;

    for (const kline of klines) {
      const typicalPrice = (kline.high + kline.low + kline.close) / 3;
      cumulativePV += typicalPrice * kline.volume;
      cumulativeVolume += kline.volume;

      result.push(cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : NaN);
    }

    return result;
  }
}
