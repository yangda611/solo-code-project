import React, { useEffect, useRef, memo } from 'react';

interface LissajousCanvasProps {
  displacementHistory: number[];
  velocityHistory: number[];
  width: number;
  height: number;
}

const LissajousCanvasComponent: React.FC<LissajousCanvasProps> = ({
  displacementHistory,
  velocityHistory,
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

    if (displacementHistory.length < 2 || velocityHistory.length < 2) {
      ctx.fillStyle = '#8892b0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据采集中...', width / 2, height / 2);
      ctx.textAlign = 'left';
      return;
    }

    const maxDisp = Math.max(...displacementHistory.map(Math.abs), 0.01);
    const maxVel = Math.max(...velocityHistory.map(Math.abs), 0.01);

    const scaleX = width * 0.4 / maxDisp;
    const scaleY = height * 0.4 / maxVel;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = '#1a2744';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < displacementHistory.length; i++) {
      const x = centerX + displacementHistory[i] * scaleX;
      const y = centerY - velocityHistory[i] * scaleY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (displacementHistory.length > 0) {
      const lastX = centerX + displacementHistory[displacementHistory.length - 1] * scaleX;
      const lastY = centerY - velocityHistory[velocityHistory.length - 1] * scaleY;
      
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#e94560';
      ctx.fill();
    }

    ctx.fillStyle = '#8892b0';
    ctx.font = '12px sans-serif';
    ctx.fillText('位移 (y)', width - 60, centerY - 5);
    ctx.save();
    ctx.translate(10, 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('速度 (ẏ)', 0, 0);
    ctx.restore();

  }, [displacementHistory, velocityHistory, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-700 rounded"
    />
  );
};

export const LissajousCanvas = memo(LissajousCanvasComponent);
