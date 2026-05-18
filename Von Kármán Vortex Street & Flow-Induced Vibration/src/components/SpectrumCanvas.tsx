import React, { useEffect, useRef, memo } from 'react';

interface SpectrumCanvasProps {
  liftHistory: number[];
  timeStep: number;
  width: number;
  height: number;
}

const SpectrumCanvasComponent: React.FC<SpectrumCanvasProps> = ({
  liftHistory,
  timeStep,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, width, height);

    let n = Math.min(liftHistory.length, 256);
    if (n < 32) {
      ctx.fillStyle = '#8892b0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据采集中...', width / 2, height / 2);
      ctx.textAlign = 'left';
      return;
    }

    const power = Math.floor(Math.log2(n));
    n = Math.pow(2, power);

    const data = liftHistory.slice(-n);
    const mean = data.reduce((a, b) => a + b, 0) / n;
    
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    
    for (let i = 0; i < n; i++) {
      const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
      real[i] = (data[i] - mean) * window;
      imag[i] = 0;
    }

    fft(real, imag);

    const magnitudes = new Float32Array(n / 2);
    let maxMag = 0;
    for (let i = 0; i < n / 2; i++) {
      magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      maxMag = Math.max(maxMag, magnitudes[i]);
    }

    if (maxMag === 0) maxMag = 1;

    const frequencies = new Float32Array(n / 2);
    const sampleRate = 1 / timeStep;
    for (let i = 0; i < n / 2; i++) {
      frequencies[i] = (i * sampleRate) / n;
    }

    const maxFreq = frequencies[n / 2 - 1] || 0;
    const barWidth = width / (n / 2);

    for (let i = 0; i < n / 2; i++) {
      const barHeight = (magnitudes[i] / maxMag) * height * 0.8;
      const x = i * barWidth;
      const y = height - barHeight;

      const hue = (i / (n / 2)) * 60 + 180;
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    ctx.strokeStyle = '#8892b0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < n / 2; i++) {
      const x = i * barWidth + barWidth / 2;
      const y = height - (magnitudes[i] / maxMag) * height * 0.8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#8892b0';
    ctx.font = '10px sans-serif';
    ctx.fillText(`f_max = ${maxFreq.toFixed(2)}`, width - 60, 15);
    ctx.fillText('频率 (Hz)', width / 2 - 25, height - 5);

  }, [liftHistory, timeStep, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-700 rounded"
    />
  );
};

export const SpectrumCanvas = memo(SpectrumCanvasComponent);

function fft(real: Float32Array, imag: Float32Array): void {
  const n = real.length;
  const log2n = Math.log2(n);

  for (let i = 0; i < n; i++) {
    let j = 0;
    let k = i;
    for (let l = 0; l < log2n; l++) {
      j = (j << 1) | (k & 1);
      k >>= 1;
    }
    if (j > i) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  for (let s = 1; s <= log2n; s++) {
    const m = 1 << s;
    const m2 = m >> 1;
    const wR = Math.cos(-Math.PI / m2);
    const wI = Math.sin(-Math.PI / m2);

    for (let k = 0; k < n; k += m) {
      let uR = 1;
      let uI = 0;

      for (let j = 0; j < m2; j++) {
        const tR = uR * real[k + j + m2] - uI * imag[k + j + m2];
        const tI = uI * real[k + j + m2] + uR * imag[k + j + m2];

        real[k + j + m2] = real[k + j] - tR;
        imag[k + j + m2] = imag[k + j] - tI;
        real[k + j] += tR;
        imag[k + j] += tI;

        const nextUR = uR * wR - uI * wI;
        const nextUI = uI * wR + uR * wI;
        uR = nextUR;
        uI = nextUI;
      }
    }
  }
}
