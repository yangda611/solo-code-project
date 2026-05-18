import React, { useRef, useEffect, useState } from 'react';
import { GRID_SIZE } from '../types';

interface TerrainEditorProps {
  terrain: number[][];
  onTerrainChange: (terrain: number[][]) => void;
  isEditing: boolean;
}

export const TerrainEditor: React.FC<TerrainEditorProps> = ({ terrain, onTerrainChange, isEditing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(15);
  const [brushStrength, setBrushStrength] = useState(3);
  const isDrawing = useRef(false);

  useEffect(() => {
    renderTerrain();
  }, [terrain]);

  const renderTerrain = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = canvas.width / GRID_SIZE;
    const scaleY = canvas.height / GRID_SIZE;

    const imageData = ctx.createImageData(canvas.width, canvas.height);

    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const gx = Math.floor(px / scaleX);
        const gy = Math.floor(py / scaleY);
        const depth = terrain[gy]?.[gx] ?? 5;

        const idx = (py * canvas.width + px) * 4;

        if (depth < 0) {
          imageData.data[idx] = 100;
          imageData.data[idx + 1] = 80;
          imageData.data[idx + 2] = 60;
        } else {
          const normalized = Math.min(depth / 15, 1);
          imageData.data[idx] = Math.floor(50 + normalized * 100);
          imageData.data[idx + 1] = Math.floor(100 + normalized * 100);
          imageData.data[idx + 2] = Math.floor(150 + normalized * 100);
        }
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5;
    for (let d = 0; d <= 15; d += 2) {
      ctx.beginPath();
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const depth = terrain[y]?.[x] ?? 5;
          if (Math.abs(depth - d) < 0.5) {
            const px = x * scaleX;
            const py = y * scaleY;
            if (x === 0 || Math.abs((terrain[y]?.[x - 1] ?? 5) - d) >= 0.5) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing || !isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / GRID_SIZE;
    const scaleY = canvas.height / GRID_SIZE;
    const x = Math.floor((e.clientX - rect.left) / scaleX);
    const y = Math.floor((e.clientY - rect.top) / scaleY);

    const newTerrain = terrain.map(row => [...row]);

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= brushSize) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
            const falloff = 1 - dist / brushSize;
            if (e.button === 0) {
              newTerrain[ty][tx] = Math.max(0.5, newTerrain[ty][tx] - brushStrength * falloff);
            } else {
              newTerrain[ty][tx] = Math.min(20, newTerrain[ty][tx] + brushStrength * falloff);
            }
          }
        }
      }
    }

    onTerrainChange(newTerrain);
  };

  return (
    <div className="terrain-editor">
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        onMouseDown={() => isDrawing.current = true}
        onMouseUp={() => isDrawing.current = false}
        onMouseLeave={() => isDrawing.current = false}
        onMouseMove={draw}
        style={{
          cursor: isEditing ? 'crosshair' : 'default',
          border: '2px solid #333',
          borderRadius: '4px'
        }}
      />
      {isEditing && (
        <div className="editor-controls" style={{ marginTop: '10px' }}>
          <label style={{ marginRight: '15px' }}>
            笔刷大小:
            <input
              type="range"
              min="5"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ marginLeft: '5px' }}
            />
          </label>
          <label>
            笔刷强度:
            <input
              type="range"
              min="1"
              max="10"
              value={brushStrength}
              onChange={(e) => setBrushStrength(Number(e.target.value))}
              style={{ marginLeft: '5px' }}
            />
          </label>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            左键：降低水深 | 右键：抬升水深
          </p>
        </div>
      )}
    </div>
  );
};
