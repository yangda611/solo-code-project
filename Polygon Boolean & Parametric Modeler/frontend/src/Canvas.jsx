import { createEffect, onMount, onCleanup } from 'solid-js';

function Canvas(props) {
  let canvas;
  let ctx;
  let animationId;
  let time = 0;
  let wavePhase = 0;
  
  let isDragging = false;
  let dragTarget = null;
  let dragOffset = { x: 0, y: 0 };
  let hoveredPoint = null;

  onMount(() => {
    canvas = document.getElementById('main-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startAnimationLoop();
  });

  onCleanup(() => {
    window.removeEventListener('resize', resizeCanvas);
    cancelAnimationFrame(animationId);
  });

  const resizeCanvas = () => {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };

  const startAnimationLoop = () => {
    const animate = () => {
      time += 0.016;
      wavePhase += 0.05;
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();
  };

  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findNearestPoint = (pos, threshold = 15) => {
    let nearest = null;
    let minDist = threshold;
    
    for (let i = 0; i < props.subject.length; i++) {
      const dist = Math.sqrt((pos.x - props.subject[i].x) ** 2 + (pos.y - props.subject[i].y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = { index: i, polygon: 'subject' };
      }
    }
    
    for (let i = 0; i < props.clip.length; i++) {
      const dist = Math.sqrt((pos.x - props.clip[i].x) ** 2 + (pos.y - props.clip[i].y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = { index: i, polygon: 'clip' };
      }
    }
    
    return nearest;
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const nearest = findNearestPoint(pos, 15);
    
    if (nearest) {
      isDragging = true;
      dragTarget = nearest;
      const points = nearest.polygon === 'subject' ? props.subject : props.clip;
      dragOffset = {
        x: pos.x - points[nearest.index].x,
        y: pos.y - points[nearest.index].y
      };
      return;
    }
    
    if (props.isDrawing) {
      props.onAddPoint(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    
    if (isDragging && dragTarget) {
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;
      
      if (dragTarget.polygon === 'subject') {
        const newPoints = [...props.subject];
        newPoints[dragTarget.index] = { x: newX, y: newY };
        props.setSubjectPoints(newPoints);
      } else {
        const newPoints = [...props.clip];
        newPoints[dragTarget.index] = { x: newX, y: newY };
        props.setClipPoints(newPoints);
      }
      return;
    }
    
    hoveredPoint = findNearestPoint(pos, 15);
    
    if (hoveredPoint) {
      canvas.style.cursor = 'move';
    } else if (props.isDrawing) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseUp = () => {
    isDragging = false;
    dragTarget = null;
  };

  const handleDoubleClick = () => {
    if (props.isDrawing) {
      props.onFinishDrawing();
    }
  };

  const drawGrid = () => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    const gridSize = 40;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawPolygon = (points, color, fillOpacity = 0.3, isHole = false, isActive = false) => {
    if (points.length < 2) return;
    
    ctx.save();
    
    if (points.length >= 3) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColor(color, 30));
      
      ctx.fillStyle = isHole ? 'rgba(0, 0, 0, 0.5)' : gradient;
      ctx.globalAlpha = fillOpacity;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    const strokeGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    strokeGradient.addColorStop(0, color);
    strokeGradient.addColorStop(0.5, adjustColor(color, 40));
    strokeGradient.addColorStop(1, color);
    
    ctx.strokeStyle = strokeGradient;
    ctx.lineWidth = isActive ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const dashOffset = props.animationPhase === 'result' ? (time * 50) % 50 : 0;
    if (props.animationPhase === 'result') {
      ctx.setLineDash([10, 5]);
      ctx.lineDashOffset = -dashOffset;
    }
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (points.length >= 3) {
      ctx.closePath();
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    points.forEach((point, i) => {
      const isHovered = hoveredPoint && hoveredPoint.index === i && 
        ((isActive && hoveredPoint.polygon === 'subject') || 
         (!isActive && hoveredPoint.polygon === 'clip'));
      const isDragged = isDragging && dragTarget && dragTarget.index === i &&
        ((dragTarget.polygon === 'subject' && isActive) ||
         (dragTarget.polygon === 'clip' && !isActive));
      
      const baseRadius = isHovered || isDragged ? 10 : 6;
      const pulse = isHovered || isDragged ? 1.2 : 1 + Math.sin(time * 3 + i * 0.5) * 0.2;
      const radius = baseRadius * pulse;
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDragged ? '#fff' : color;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = isHovered ? '#fff' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();
      
      if (isHovered || isDragged) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    ctx.restore();
  };

  const drawResultWithWave = (polygons, baseColor) => {
    polygons.forEach((polygon, polyIndex) => {
      if (polygon.length < 3) return;
      
      const waveIntensity = props.animationPhase === 'filling' ? 1 : 0.3;
      
      ctx.save();
      
      ctx.beginPath();
      ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
      }
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const wave = Math.sin(wavePhase + t * 5) * 0.1;
        gradient.addColorStop(t, `rgba(46, 204, 113, ${(0.4 + wave * waveIntensity) * t})`);
      }
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      const strokeGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const hueShift = (time * 20) % 360;
      strokeGradient.addColorStop(0, `hsl(${hueShift}, 70%, 60%)`);
      strokeGradient.addColorStop(0.5, `hsl(${(hueShift + 60) % 360}, 70%, 50%)`);
      strokeGradient.addColorStop(1, `hsl(${(hueShift + 120) % 360}, 70%, 60%)`);
      
      ctx.strokeStyle = strokeGradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const dashOffset = (time * 30) % 40;
      ctx.setLineDash([15, 10]);
      ctx.lineDashOffset = -dashOffset;
      
      ctx.beginPath();
      ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.restore();
    });
  };

  const drawIntersections = (points, isSelfIntersection = false) => {
    if (props.animationPhase === 'idle' && props.result.length === 0) return;
    
    points.forEach((point, i) => {
      const p = point.point || point;
      const blink = Math.sin(time * 8 + i) * 0.5 + 0.5;
      const baseRadius = isSelfIntersection ? 12 : 10;
      const radius = baseRadius + blink * 5;
      
      ctx.save();
      
      for (let j = 0; j < 3; j++) {
        const r = radius + j * 8 + Math.sin(time * 5 + j) * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isSelfIntersection 
          ? `rgba(231, 76, 60, ${0.8 - j * 0.25})` 
          : `rgba(241, 196, 15, ${0.8 - j * 0.25})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = isSelfIntersection ? '#e74c3c' : '#f1c40f';
      ctx.fill();
      
      if (isSelfIntersection) {
        const rotation = time * 2;
        ctx.translate(p.x, p.y);
        ctx.rotate(rotation);
        
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2;
          const r = j % 2 === 0 ? 10 : 5;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      
      ctx.restore();
    });
  };

  const drawErrorBoundaries = () => {
    if (props.animationPhase !== 'error') return;
    
    const shake = Math.sin(time * 20) * 3;
    
    ctx.save();
    ctx.translate(shake, 0);
    
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.rect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawMousePreview = () => {
    const pos = hoveredPoint || isDragging ? null : (() => {
      const rect = canvas && canvas.getBoundingClientRect();
      if (!rect || !props.isDrawing) return null;
      return hoveredPoint;
    })();
    
    if (!props.isDrawing || hoveredPoint || isDragging) return;
  };

  const adjustColor = (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const render = () => {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawErrorBoundaries();
    
    if (props.clip.length > 0) {
      drawPolygon(props.clip, '#D94A4A', 0.25, false, props.drawingPolygon === 'clip');
    }
    
    if (props.subject.length > 0) {
      drawPolygon(props.subject, '#4A90D9', 0.3, false, props.drawingPolygon === 'subject');
    }
    
    if (props.result.length > 0) {
      drawResultWithWave(props.result, '#2ecc71');
    }
    
    drawIntersections(props.intersections, false);
    drawIntersections(props.selfIntersections, true);
    
    drawMousePreview();
  };

  createEffect(() => {
    render();
  });

  return (
    <canvas
      id="main-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDblClick={handleDoubleClick}
      style={{
        cursor: isDragging ? 'grabbing' : (hoveredPoint ? 'move' : (props.isDrawing ? 'crosshair' : 'default')),
        width: '100%',
        height: '100%',
        'user-select': 'none'
      }}
    />
  );
}

export default Canvas;
