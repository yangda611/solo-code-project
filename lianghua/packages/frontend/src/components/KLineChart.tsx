import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { useStore } from '../store';
import type { KLine } from '../../../backend/src/types';

interface ChartProps {
  height?: number;
}

export function KLineChart({ height = 400 }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const bollUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  const { klineHistory, kline, selectedInterval, tick } = useStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#00ff41',
      },
      grid: {
        vertLines: { color: '#003b00' },
        horzLines: { color: '#003b00' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#00ff41',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#00ff41',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#003b00',
      },
      timeScale: {
        borderColor: '#003b00',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ff41',
      downColor: '#ff0040',
      borderUpColor: '#00ff41',
      borderDownColor: '#ff0040',
      wickUpColor: '#00ff41',
      wickDownColor: '#ff0040',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addHistogramSeries({
      color: '#008b23',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const historyToUse = klineHistory.length > 0 ? klineHistory : (kline ? [kline] : []);
    if (historyToUse.length === 0) return;

    const candlestickData: CandlestickData<Time>[] = historyToUse.map((k: KLine) => ({
      time: (k.timestamp / 1000) as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    const volumeData = historyToUse.map((k: KLine) => ({
      time: (k.timestamp / 1000) as Time,
      value: k.volume,
      color: k.close >= k.open ? '#00ff4155' : '#ff004055',
    }));

    candlestickSeriesRef.current.setData(candlestickData);
    volumeSeriesRef.current.setData(volumeData);

    calculateAndSetIndicators(historyToUse);
  }, [klineHistory, kline, selectedInterval]);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !tick) return;

    const lastKline = klineHistory[klineHistory.length - 1] || kline;
    if (lastKline) {
      const midPrice = (tick.bid + tick.ask) / 2;
      const time = (lastKline.timestamp / 1000) as Time;
      
      candlestickSeriesRef.current.update({
        time,
        open: lastKline.open,
        high: Math.max(lastKline.high, midPrice),
        low: Math.min(lastKline.low, midPrice),
        close: midPrice,
      });
    }
  }, [tick, klineHistory, kline]);

  const calculateAndSetIndicators = (klines: KLine[]) => {
    if (!candlestickSeriesRef.current) return;

    const prices = klines.map(k => k.close);
    const times = klines.map(k => (k.timestamp / 1000) as Time);

    const macdData = calculateMACD(prices);
    const bollData = calculateBollinger(prices);

    if (macdLineRef.current && signalLineRef.current && histogramSeriesRef.current) {
      macdLineRef.current.setData(macdData.macd.map((v, i) => ({ time: times[i], value: v })).filter(d => !isNaN(d.value)));
      signalLineRef.current.setData(macdData.signal.map((v, i) => ({ time: times[i], value: v })).filter(d => !isNaN(d.value)));
      histogramSeriesRef.current.setData(macdData.histogram.map((v, i) => ({ 
        time: times[i], 
        value: v,
        color: v >= 0 ? '#00ff41' : '#ff0040'
      })).filter(d => !isNaN(d.value)));
    }

    if (bollUpperRef.current && bollMiddleRef.current && bollLowerRef.current) {
      bollUpperRef.current.setData(bollData.upper.map((v, i) => ({ time: times[i], value: v })).filter(d => !isNaN(d.value)));
      bollMiddleRef.current.setData(bollData.middle.map((v, i) => ({ time: times[i], value: v })).filter(d => !isNaN(d.value)));
      bollLowerRef.current.setData(bollData.lower.map((v, i) => ({ time: times[i], value: v })).filter(d => !isNaN(d.value)));
    }
  };

  return (
    <div className="matrix-panel" style={{ height, position: 'relative' }}>
      <div className="matrix-panel-header">
        K-LINE CHART [{selectedInterval.toUpperCase()}]
        <span style={{ float: 'right', opacity: 0.7 }}>
          BTC/USDT
        </span>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: 'calc(100% - 30px)' }} />
    </div>
  );
}

function SMA(prices: number[], period: number): number[] {
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

function EMA(prices: number[], period: number): number[] {
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

function calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const fastEMA = EMA(prices, fast);
  const slowEMA = EMA(prices, slow);
  
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const validMacd = macdLine.map(v => isNaN(v) ? 0 : v);
  const signalLine = EMA(validMacd, signal);
  const histogram = macdLine.map((v, i) => isNaN(v) || isNaN(signalLine[i]) ? NaN : v - signalLine[i]);

  return { macd: macdLine, signal: signalLine, histogram };
}

function calculateBollinger(prices: number[], period = 20, stdDev = 2) {
  const middle = SMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { upper, middle, lower };
}
