class HeatmapRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.enabled = true;
        
        this.gradientStops = [
            { ratio: 0.0, color: { r: 46, g: 204, b: 113, a: 0.0 } },
            { ratio: 0.2, color: { r: 46, g: 204, b: 113, a: 0.2 } },
            { ratio: 0.4, color: { r: 241, g: 196, b: 15, a: 0.3 } },
            { ratio: 0.6, color: { r: 243, g: 156, b: 18, a: 0.5 } },
            { ratio: 0.8, color: { r: 231, g: 76, b: 60, a: 0.7 } },
            { ratio: 1.0, color: { r: 192, g: 57, b: 43, a: 0.9 } }
        ];
        
        this.legendColors = this.generateLegend();
    }

    generateLegend() {
        const colors = [];
        for (let i = 0; i <= 100; i += 5) {
            colors.push(this.getHeatmapColor(i / 100));
        }
        return colors;
    }

    getHeatmapColor(stressRatio) {
        const clamped = MathUtil.clamp(stressRatio, 0, 1);
        
        for (let i = 0; i < this.gradientStops.length - 1; i++) {
            const stop1 = this.gradientStops[i];
            const stop2 = this.gradientStops[i + 1];
            
            if (clamped >= stop1.ratio && clamped <= stop2.ratio) {
                const t = (clamped - stop1.ratio) / (stop2.ratio - stop1.ratio);
                const r = Math.round(MathUtil.lerp(stop1.color.r, stop2.color.r, t));
                const g = Math.round(MathUtil.lerp(stop1.color.g, stop2.color.g, t));
                const b = Math.round(MathUtil.lerp(stop1.color.b, stop2.color.b, t));
                const a = MathUtil.lerp(stop1.color.a, stop2.color.a, t);
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
        }
        
        return this.gradientStops[this.gradientStops.length - 1].color;
    }

    drawBeamHeatmap(beam) {
        if (!this.enabled || !beam || beam.isBroken) return;
        if (beam.stressRatio < 0.1) return;
        
        const start = this.renderer.toScreen(beam.nodeA.position.x, beam.nodeA.position.y);
        const end = this.renderer.toScreen(beam.nodeB.position.x, beam.nodeB.position.y);
        
        const thickness = beam.material.thickness * this.renderer.scale * 2.5;
        const color = this.getHeatmapColor(beam.stressRatio);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        
        this.drawStressIndicator(beam, start, end);
    }

    drawStressIndicator(beam, start, end) {
        if (beam.stressRatio < 0.5) return;
        
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const stressPercent = Math.round(beam.stressRatio * 100);
        
        const labelY = midY - 15 * this.renderer.scale;
        
        this.ctx.fillStyle = beam.stressRatio > 0.8 ? '#e74c3c' : beam.stressRatio > 0.6 ? '#f39c12' : '#fff';
        this.ctx.font = `bold ${11 * this.renderer.scale}px Consolas`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${stressPercent}%`, midX, labelY);
    }

    drawNodeHeatmap(node) {
        if (!this.enabled || !node) return;
        if (node.isFixed) return;
        
        const netForce = node.getNetForce();
        const forceMagnitude = netForce.magnitude();
        
        if (forceMagnitude < 50) return;
        
        const screen = this.renderer.toScreen(node.position.x, node.position.y);
        const stressRatio = Math.min(forceMagnitude / 500, 1);
        
        const pulseRadius = 20 * this.renderer.scale * (0.5 + stressRatio * 0.5);
        const gradient = this.ctx.createRadialGradient(
            screen.x, screen.y, 0,
            screen.x, screen.y, pulseRadius
        );
        
        const color = this.getHeatmapColor(stressRatio);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, pulseRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawAll(beams, nodes) {
        if (!this.enabled) return;
        
        for (const beam of beams) {
            this.drawBeamHeatmap(beam);
        }
        
        for (const node of nodes) {
            this.drawNodeHeatmap(node);
        }
    }

    drawLegend(x, y, width, height) {
        const barWidth = width || 150;
        const barHeight = height || 20;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.9;
        
        this.ctx.fillStyle = 'rgba(10, 36, 99, 0.8)';
        this.ctx.fillRect(x - 10, y - 10, barWidth + 60, barHeight + 40);
        
        this.ctx.strokeStyle = 'rgba(62, 146, 204, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 10, y - 10, barWidth + 60, barHeight + 40);
        
        const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
        for (const stop of this.gradientStops) {
            const color = stop.color;
            gradient.addColorStop(stop.ratio, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.max(color.a, 0.5)})`);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '10px Consolas';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('0%', x, y + barHeight + 14);
        
        this.ctx.textAlign = 'center';
        this.ctx.fillText('50%', x + barWidth / 2, y + barHeight + 14);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText('100%', x + barWidth, y + barHeight + 14);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 11px Consolas';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('应力热力图', x, y - 3);
        
        this.ctx.restore();
    }

    drawForceDiagram(beams, x, y, width, height) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.9;
        
        this.ctx.fillStyle = 'rgba(10, 36, 99, 0.8)';
        this.ctx.fillRect(x - 10, y - 10, width + 20, height + 40);
        
        this.ctx.strokeStyle = 'rgba(62, 146, 204, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 10, y - 10, width + 20, height + 40);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 11px Consolas';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('受力分布', x, y - 3);
        
        const padding = 30;
        const diagramWidth = width - padding * 2;
        const diagramHeight = height - padding;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        for (let i = 0; i <= 4; i++) {
            const lineY = y + padding + (diagramHeight / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x + padding, lineY);
            this.ctx.lineTo(x + padding + diagramWidth, lineY);
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '9px Consolas';
            this.ctx.textAlign = 'right';
            const percent = Math.round(100 - i * 25);
            this.ctx.fillText(`${percent}%`, x + padding - 5, lineY + 3);
        }
        
        this.ctx.setLineDash([]);
        
        const tensionColor = 'rgba(231, 76, 60, 0.8)';
        const compressionColor = 'rgba(52, 152, 219, 0.8)';
        
        let maxForce = 0;
        for (const beam of beams) {
            if (beam.isBroken) continue;
            maxForce = Math.max(maxForce, Math.abs(beam.currentForce));
        }
        
        if (maxForce === 0) maxForce = 1;
        
        const beamSpacing = diagramWidth / Math.max(beams.length, 1);
        const barWidth = Math.min(beamSpacing * 0.6, 15);
        
        beams.forEach((beam, index) => {
            if (beam.isBroken) return;
            
            const barX = x + padding + index * beamSpacing + beamSpacing / 2 - barWidth / 2;
            const force = beam.currentForce;
            const forceRatio = Math.abs(force) / maxForce;
            const barHeight = forceRatio * diagramHeight * 0.8;
            
            const isTension = force > 0;
            const barY = y + padding + diagramHeight;
            
            this.ctx.fillStyle = isTension ? tensionColor : compressionColor;
            
            this.ctx.fillRect(
                barX,
                barY - barHeight,
                barWidth,
                barHeight
            );
            
            if (beam.stressRatio > 0.8) {
                this.ctx.strokeStyle = '#f39c12';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    barX - 1,
                    barY - barHeight - 1,
                    barWidth + 2,
                    barHeight + 2
                );
            }
        });
        
        this.ctx.fillStyle = tensionColor;
        this.ctx.fillRect(x + padding, y + diagramHeight + 15, 12, 12);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Consolas';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('拉力', x + padding + 18, y + diagramHeight + 25);
        
        this.ctx.fillStyle = compressionColor;
        this.ctx.fillRect(x + padding + 70, y + diagramHeight + 15, 12, 12);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('压力', x + padding + 88, y + diagramHeight + 25);
        
        this.ctx.restore();
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { HeatmapRenderer };
}
