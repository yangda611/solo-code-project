import { Trade, Position, PerformanceMetrics, KLine, PnLHistoryEntry, DrawdownEntry } from '../types';

export class PerformanceAnalyzer {
  private pnlHistory: PnLHistoryEntry[] = [];
  private trades: Trade[] = [];
  private initialBalance: number = 0;
  private peakEquity: number = 0;
  private maxDrawdown: number = 0;
  private maxDrawdownStart: number = 0;
  private maxDrawdownEnd: number = 0;
  private currentDrawdownStart: number = 0;
  private wins: number = 0;
  private losses: number = 0;
  private totalProfit: number = 0;
  private totalLoss: number = 0;
  private riskFreeRate: number = 0.02;

  constructor(initialBalance: number) {
    this.initialBalance = initialBalance;
    this.peakEquity = initialBalance;
  }

  recordSnapshot(
    timestamp: number,
    balance: number,
    equity: number,
    positions: Position[]
  ): void {
    const unrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const realizedPnL = positions.reduce((sum, p) => sum + p.realizedPnL, 0);

    this.pnlHistory.push({
      timestamp,
      balance,
      equity,
      unrealizedPnL,
      realizedPnL,
    });

    this.updateDrawdown(timestamp, equity);
  }

  recordTrade(trade: Trade): void {
    this.trades.push(trade);

    if (trade.side === 'buy' || trade.side === 'sell') {
      const pnl = this.calculateTradePnL(trade);
      if (pnl > 0) {
        this.wins++;
        this.totalProfit += pnl;
      } else if (pnl < 0) {
        this.losses++;
        this.totalLoss += Math.abs(pnl);
      }
    }
  }

  private calculateTradePnL(trade: Trade): number {
    return 0;
  }

  private updateDrawdown(timestamp: number, equity: number): void {
    if (equity > this.peakEquity) {
      this.peakEquity = equity;
      this.currentDrawdownStart = timestamp;
    }

    const drawdown = (this.peakEquity - equity) / this.peakEquity;

    if (drawdown > this.maxDrawdown) {
      this.maxDrawdown = drawdown;
      this.maxDrawdownStart = this.currentDrawdownStart;
      this.maxDrawdownEnd = timestamp;
    }
  }

  getMetrics(): PerformanceMetrics {
    const totalReturn = this.calculateTotalReturn();
    const annualizedReturn = this.calculateAnnualizedReturn();
    const sharpeRatio = this.calculateSharpeRatio();
    const winRate = this.wins + this.losses > 0 ? this.wins / (this.wins + this.losses) : 0;
    const profitFactor = this.totalLoss > 0 ? this.totalProfit / this.totalLoss : this.totalProfit > 0 ? Infinity : 0;
    const avgWin = this.wins > 0 ? this.totalProfit / this.wins : 0;
    const avgLoss = this.losses > 0 ? this.totalLoss / this.losses : 0;
    const maxDrawdownDuration = this.maxDrawdownEnd - this.maxDrawdownStart;

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown: this.maxDrawdown,
      maxDrawdownDuration,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      totalTrades: this.trades.length,
      totalVolume: this.trades.reduce((sum, t) => sum + t.quantity * t.price, 0),
    };
  }

  private calculateTotalReturn(): number {
    if (this.pnlHistory.length === 0) return 0;
    const last = this.pnlHistory[this.pnlHistory.length - 1];
    return (last.equity - this.initialBalance) / this.initialBalance;
  }

  private calculateAnnualizedReturn(): number {
    if (this.pnlHistory.length < 2) return 0;
    
    const first = this.pnlHistory[0];
    const last = this.pnlHistory[this.pnlHistory.length - 1];
    const timeDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24 * 365);
    
    if (timeDiff <= 0) return 0;
    
    const totalReturn = this.calculateTotalReturn();
    return Math.pow(1 + totalReturn, 1 / timeDiff) - 1;
  }

  private calculateSharpeRatio(): number {
    if (this.pnlHistory.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < this.pnlHistory.length; i++) {
      const prev = this.pnlHistory[i - 1];
      const curr = this.pnlHistory[i];
      const dailyReturn = (curr.equity - prev.equity) / prev.equity;
      returns.push(dailyReturn);
    }

    if (returns.length === 0) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const dailyRiskFree = this.riskFreeRate / 252;
    return (meanReturn - dailyRiskFree) / stdDev * Math.sqrt(252);
  }

  getPnLHistory(): PnLHistoryEntry[] {
    return [...this.pnlHistory];
  }

  getLogReturns(): { timestamp: number; logReturn: number }[] {
    const result: { timestamp: number; logReturn: number }[] = [];
    for (let i = 1; i < this.pnlHistory.length; i++) {
      const prev = this.pnlHistory[i - 1];
      const curr = this.pnlHistory[i];
      const logReturn = Math.log(curr.equity / prev.equity);
      result.push({
        timestamp: curr.timestamp,
        logReturn,
      });
    }
    return result;
  }

  getDrawdownHistory(): DrawdownEntry[] {
    const result: DrawdownEntry[] = [];
    let peak = this.initialBalance;

    for (const entry of this.pnlHistory) {
      if (entry.equity > peak) {
      peak = entry.equity;
    }
      const drawdown = (peak - entry.equity) / peak;
      result.push({
        timestamp: entry.timestamp,
        drawdown,
        peak,
      });
    }

    return result;
  }

  getRadarMetrics(): { category: string; value: number; max: number }[] {
    const metrics = this.getMetrics();
    
    return [
      { category: '总收益率', value: Math.max(-1, Math.min(1, metrics.totalReturn)), max: 1 },
      { category: '夏普比率', value: Math.min(5, metrics.sharpeRatio / 2), max: 5 },
      { category: '胜率', value: metrics.winRate, max: 1 },
      { category: '盈亏比', value: Math.min(5, metrics.profitFactor / 2), max: 5 },
      { category: '最大回撤', value: 1 - Math.min(1, metrics.maxDrawdown * 5), max: 1 },
      { category: '交易频率', value: Math.min(1, metrics.totalTrades / 100), max: 1 },
    ];
  }

  reset(): void {
    this.pnlHistory = [];
    this.trades = [];
    this.peakEquity = this.initialBalance;
    this.maxDrawdown = 0;
    this.wins = 0;
    this.losses = 0;
    this.totalProfit = 0;
    this.totalLoss = 0;
  }
}
