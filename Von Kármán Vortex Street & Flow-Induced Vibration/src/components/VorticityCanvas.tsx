import React, { useEffect, useRef, useCallback, memo } from 'react';
import { MacGrid } from '../solvers/CFD/MacGrid';

interface VorticityCanvasProps {
  grid: MacGrid | null;
  cylinderX: number;
  cylinderY: number;
  cylinderR: number;
  vorticityScale: number;
  width: number;
  height: number;
}

const VorticityCanvasComponent: React.FC<VorticityCanvasProps> = ({
  grid,
  cylinderX,
  cylinderY,
  cylinderR,
  vorticityScale,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!grid) {
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击"开始"启动模拟', width / 2, height / 2);
      ctx.textAlign = 'left';
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    const { nx, ny, vort } = grid;
    const imageData = ctx.createImageData(nx, ny);

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;
        const v = vort[idx] * vorticityScale;
        
        let r: number, g: number, b: number;
        
        if (v > 0) {
          const t = Math.min(v, 1);
          r = 255;
          g = Math.floor(255 * (1 - t));
          b = Math.floor(255 * (1 - t));
        } else {
          const t = Math.min(-v, 1);
          r = Math.floor(255 * (1 - t));
          g = Math.floor(255 * (1 - t));
          b = 255;
        }

        const pixelIdx = ((ny - 1 - j) * nx + i) * 4;
        imageData.data[pixelIdx] = r;
        imageData.data[pixelIdx + 1] = g;
        imageData.data[pixelIdx + 2] = b;
        imageData.data[pixelIdx + 3] = 255;
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = nx;
    tempCanvas.height = ny;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, width, height);
    }

    const scaleX = width / (nx * grid.dx);
    const scaleY = height / (ny * grid.dy);
    const cx = cylinderX * scaleX;
    const cy = cylinderY * scaleY;
    const cr = cylinderR * scaleX;

    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + cr * 0.7);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();

    animationRef.current = requestAnimationFrame(render);
  }, [grid, cylinderX, cylinderY, cylinderR, vorticityScale, width, height]);

  useEffect(() => {
    render();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border-2 border-cyan-500 rounded-lg shadow-lg shadow-cyan-500/20"
    />
  );
};

export const VorticityCanvas = memo(VorticityCanvasComponent);
