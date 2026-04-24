class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        
        this.viewOptions = {
            showGrid: true,
            showHeatmap: true,
            showForces: true,
            showNodes: true
        };
        
        this.colors = {
            grid: 'rgba(45, 90, 154, 0.3)',
            gridMajor: 'rgba(62, 146, 204, 0.5)',
            ground: '#2d5a3a',
            groundEdge: '#1a3a28',
            water: '#1a5276',
            waterEdge: '#0d3550',
            sky: '#85c1e9',
            node: '#3e92cc',
            nodeFixed: '#27ae60',
            nodeSelected: '#f39c12',
            nodeHovered: '#3498db',
            nodeBroken: '#e74c3c',
            beamWood: '#8B4513',
            beamSteel: '#C0C0C0',
            beamCable: '#DAA520',
            beamSelected: '#f39c12',
            beamHovered: '#3498db',
            beamBroken: '#95a5a6',
            vehicle: '#3498db',
            vehicleWheel: '#2c3e50',
            forceTension: '#e74c3c',
            forceCompression: '#3498db',
            preview: 'rgba(243, 156, 18, 0.6)',
            anchorPoint: 'rgba(46, 204, 113, 0.8)'
        };
        
        this.gridSize = 20;
        this.majorGridSpacing = 100;
        
        this.animationTime = 0;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    setViewport(offsetX, offsetY, scale) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.scale = scale;
    }

    toScreen(worldX, worldY) {
        return {
            x: (worldX + this.offsetX) * this.scale,
            y: (worldY + this.offsetY) * this.scale
        };
    }

    toWorld(screenX, screenY) {
        return new Vector2(
            screenX / this.scale - this.offsetX,
            screenY / this.scale - this.offsetY
        );
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a2463');
        gradient.addColorStop(1, '#1a3a7a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        if (!this.viewOptions.showGrid) return;
        
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        const scaledGrid = this.gridSize * this.scale;
        const offsetX = this.offsetX * this.scale;
        const offsetY = this.offsetY * this.scale;
        
        const startX = -offsetX % scaledGrid;
        const startY = -offsetY % scaledGrid;
        
        this.ctx.beginPath();
        
        for (let x = startX; x < this.width; x += scaledGrid) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
        }
        
        for (let y = startY; y < this.height; y += scaledGrid) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }
        
        this.ctx.stroke();
        
        this.ctx.strokeStyle = this.colors.gridMajor;
        this.ctx.lineWidth = 2;
        
        const majorScaled = this.majorGridSpacing * this.scale;
        const majorStartX = -offsetX % majorScaled;
        const majorStartY = -offsetY % majorScaled;
        
        this.ctx.beginPath();
        
        for (let x = majorStartX; x < this.width; x += majorScaled) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
        }
        
        for (let y = majorStartY; y < this.height; y += majorScaled) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }
        
        this.ctx.stroke();
    }

    drawLevel(level) {
        if (!level) return;
        
        const terrainPoints = level.getTerrainPolyline();
        const waterPoints = level.getWaterPolyline();
        
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.strokeStyle = this.colors.groundEdge;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        
        const firstPoint = this.toScreen(terrainPoints[0].x, terrainPoints[0].y);
        this.ctx.moveTo(firstPoint.x, this.height);
        this.ctx.lineTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < terrainPoints.length; i++) {
            const point = this.toScreen(terrainPoints[i].x, terrainPoints[i].y);
            this.ctx.lineTo(point.x, point.y);
        }
        
        const lastPoint = this.toScreen(terrainPoints[terrainPoints.length - 1].x, terrainPoints[terrainPoints.length - 1].y);
        this.ctx.lineTo(lastPoint.x, this.height);
        this.ctx.closePath();
        
        this.ctx.fill();
        this.ctx.stroke();
        
        if (waterPoints && level.terrainType === TerrainType.RIVER) {
            this.ctx.fillStyle = this.colors.water;
            this.ctx.strokeStyle = this.colors.waterEdge;
            this.ctx.lineWidth = 2;
            
            const waterTop = this.toScreen(waterPoints[0].x, level.waterLevel || 480);
            const waterBottom = this.toScreen(0, level.canyonBottom);
            
            this.ctx.beginPath();
            this.ctx.rect(
                waterTop.x,
                waterTop.y,
                (waterPoints[1].x - waterPoints[0].x) * this.scale,
                (waterBottom.y - waterTop.y)
            );
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const waveOffset = Math.sin(this.animationTime * 2 + i) * 3;
                const y = waterTop.y + i * 15 + 10;
                this.ctx.beginPath();
                this.ctx.moveTo(waterTop.x + 10 + waveOffset, y);
                this.ctx.lineTo(waterTop.x + (waterPoints[1].x - waterPoints[0].x) * this.scale - 10 - waveOffset, y);
                this.ctx.stroke();
            }
        }
        
        this.drawAnchorPoints(level.anchorPoints);
        
        if (level.shipPassage) {
            this.drawShipPassage(level);
        }
    }

    drawAnchorPoints(anchorPoints) {
        if (!anchorPoints || anchorPoints.length === 0) return;
        
        this.ctx.fillStyle = this.colors.anchorPoint;
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 2;
        
        for (const point of anchorPoints) {
            const screen = this.toScreen(point.x, point.y);
            const radius = 8 * this.scale;
            
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x - radius * 0.5, screen.y);
            this.ctx.lineTo(screen.x + radius * 0.5, screen.y);
            this.ctx.moveTo(screen.x, screen.y - radius * 0.5);
            this.ctx.lineTo(screen.x, screen.y + radius * 0.5);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = '#27ae60';
        }
    }

    drawShipPassage(level) {
        const passage = level.shipPassage;
        if (!passage) return;
        
        const startX = passage.centerX - passage.width / 2;
        const endX = passage.centerX + passage.width / 2;
        const topY = (level.waterLevel || 480) - passage.requiredHeight;
        const bottomY = level.waterLevel || 480;
        
        const topLeft = this.toScreen(startX, topY);
        const bottomRight = this.toScreen(endX, bottomY);
        
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
        this.ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        
        this.ctx.beginPath();
        this.ctx.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        const centerScreen = this.toScreen(passage.centerX, (topY + bottomY) / 2);
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        this.ctx.font = `${12 * this.scale}px Consolas`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('船只通行区 (需要净高)', centerScreen.x, centerScreen.y);
    }

    drawNode(node) {
        if (!node) return;
        
        const screen = this.toScreen(node.position.x, node.position.y);
        let radius = node.radius * this.scale;
        let color = this.colors.node;
        
        if (node.isFixed) {
            color = this.colors.nodeFixed;
            radius *= 1.3;
        }
        
        if (node.isSelected) {
            color = this.colors.nodeSelected;
        } else if (node.isHovered) {
            color = this.colors.nodeHovered;
        }
        
        if (node.state === NodeState.BROKEN) {
            color = this.colors.nodeBroken;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        
        const gradient = this.ctx.createRadialGradient(
            screen.x - radius * 0.3, screen.y - radius * 0.3, 0,
            screen.x, screen.y, radius
        );
        gradient.addColorStop(0, this.lightenColor(color, 30));
        gradient.addColorStop(1, color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.darkenColor(color, 30);
        this.ctx.lineWidth = 2 * this.scale;
        this.ctx.stroke();
        
        if (node.isFixed) {
            this.ctx.strokeStyle = '#1a3a28';
            this.ctx.lineWidth = 1.5 * this.scale;
            this.ctx.beginPath();
            const angle = Math.PI / 6;
            for (let i = 0; i < 3; i++) {
                const a = angle + i * (Math.PI * 2 / 3);
                this.ctx.moveTo(screen.x, screen.y);
                this.ctx.lineTo(
                    screen.x + Math.cos(a) * radius * 0.8,
                    screen.y + Math.sin(a) * radius * 0.8
                );
            }
            this.ctx.stroke();
        }
        
        if (this.viewOptions.showForces && !node.isFixed && node.forces.magnitude() > 1) {
            this.drawNodeForce(node, screen);
        }
    }

    drawNodeForce(node, screenPos) {
        const force = node.forces;
        const magnitude = force.magnitude();
        
        if (magnitude < 1) return;
        
        const maxLength = 50 * this.scale;
        const length = Math.min(magnitude * 0.1, maxLength);
        
        const direction = force.normalize();
        const endX = screenPos.x + direction.x * length;
        const endY = screenPos.y + direction.y * length;
        
        this.ctx.strokeStyle = magnitude > 100 ? this.colors.forceTension : this.colors.forceCompression;
        this.ctx.lineWidth = Math.max(1, Math.min(4, magnitude * 0.01)) * this.scale;
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        const arrowSize = 5 * this.scale;
        const angle = direction.angle();
        
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle - 0.5),
            endY - arrowSize * Math.sin(angle - 0.5)
        );
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle + 0.5),
            endY - arrowSize * Math.sin(angle + 0.5)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawBeam(beam) {
        if (!beam || !beam.nodeA || !beam.nodeB) return;
        
        const start = this.toScreen(beam.nodeA.position.x, beam.nodeA.position.y);
        const end = this.toScreen(beam.nodeB.position.x, beam.nodeB.position.y);
        
        let color = beam.material.color;
        let thickness = beam.material.thickness * this.scale;
        
        if (beam.isBroken) {
            this.drawBrokenBeam(beam, start, end, thickness);
            return;
        }
        
        if (this.viewOptions.showHeatmap) {
            color = beam.getStressColor();
        }
        
        if (beam.isSelected) {
            color = this.colors.beamSelected;
            thickness *= 1.5;
        } else if (beam.isHovered) {
            color = this.colors.beamHovered;
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = thickness;
        
        this.ctx.strokeStyle = this.darkenColor(beam.material.color, 20);
        this.ctx.lineWidth = thickness + 2 * this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        
        this.drawBeamMaterialPattern(beam, start, end, thickness);
        
        if (this.viewOptions.showForces && beam.currentForce !== 0) {
            this.drawBeamForce(beam, start, end);
        }
    }

    drawBrokenBeam(beam, start, end, thickness) {
        const t = beam.fracturePosition;
        const midX = start.x + (end.x - start.x) * t;
        const midY = start.y + (end.y - start.y) * t;
        
        this.ctx.strokeStyle = this.colors.beamBroken;
        this.ctx.lineWidth = thickness * 0.8;
        this.ctx.lineCap = 'butt';
        
        const breakOffset = 3 * this.scale;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const perpX = Math.sin(angle) * breakOffset;
        const perpY = -Math.cos(angle) * breakOffset;
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(midX - perpX * 0.5, midY - perpY * 0.5);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(midX + perpX * 0.5, midY + perpY * 0.5);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = this.colors.forceTension;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(midX - perpX, midY - perpY);
        this.ctx.lineTo(midX + perpX, midY + perpY);
        this.ctx.stroke();
    }

    drawBeamMaterialPattern(beam, start, end, thickness) {
        if (beam.material.type === MaterialType.WOOD) {
            const segments = 5;
            const dx = (end.x - start.x) / segments;
            const dy = (end.y - start.y) / segments;
            
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.lineWidth = 1;
            
            for (let i = 1; i < segments; i++) {
                const x = start.x + dx * i;
                const y = start.y + dy * i;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x - thickness * 0.3, y - thickness * 0.2);
                this.ctx.lineTo(x + thickness * 0.3, y + thickness * 0.2);
                this.ctx.stroke();
            }
        } else if (beam.material.type === MaterialType.STEEL) {
            const segments = 8;
            const dx = (end.x - start.x) / segments;
            const dy = (end.y - start.y) / segments;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            
            for (let i = 0; i < segments; i += 2) {
                const x = start.x + dx * i;
                const y = start.y + dy * i;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, thickness * 0.15, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (beam.material.type === MaterialType.CABLE) {
            const segments = 10;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.lineWidth = 1;
            
            const dx = (end.x - start.x) / segments;
            const dy = (end.y - start.y) / segments;
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            
            for (let i = 0; i <= segments; i++) {
                const x = start.x + dx * i;
                const y = start.y + dy * i;
                const twistOffset = Math.sin(i * 0.5) * thickness * 0.2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(
                    x + Math.cos(angle) * twistOffset,
                    y + Math.sin(angle) * twistOffset
                );
                this.ctx.lineTo(
                    x - Math.cos(angle) * twistOffset,
                    y - Math.sin(angle) * twistOffset
                );
                this.ctx.stroke();
            }
        }
    }

    drawBeamForce(beam, start, end) {
        const force = beam.currentForce;
        const isTension = force > 0;
        
        if (Math.abs(force) < 10) return;
        
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const magnitude = Math.abs(force);
        const arrowCount = Math.min(3, Math.floor(magnitude / 500) + 1);
        const spacing = 30 * this.scale;
        
        this.ctx.fillStyle = isTension ? this.colors.forceTension : this.colors.forceCompression;
        
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        for (let i = 0; i < arrowCount; i++) {
            const offset = (i - (arrowCount - 1) / 2) * spacing;
            const x = midX + Math.cos(angle) * offset;
            const y = midY + Math.sin(angle) * offset;
            
            const arrowSize = 8 * this.scale;
            
            if (isTension) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + arrowSize * Math.cos(angle), y + arrowSize * Math.sin(angle));
                this.ctx.lineTo(x + arrowSize * Math.cos(angle + 2.5), y + arrowSize * Math.sin(angle + 2.5));
                this.ctx.lineTo(x, y);
                this.ctx.lineTo(x + arrowSize * Math.cos(angle - 2.5), y + arrowSize * Math.sin(angle - 2.5));
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + arrowSize * Math.cos(angle + 2.5), y + arrowSize * Math.sin(angle + 2.5));
                this.ctx.lineTo(x + arrowSize * Math.cos(angle), y + arrowSize * Math.sin(angle));
                this.ctx.lineTo(x + arrowSize * Math.cos(angle - 2.5), y + arrowSize * Math.sin(angle - 2.5));
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }

    drawVehicle(vehicle) {
        if (!vehicle) return;
        
        const screen = this.toScreen(vehicle.position.x, vehicle.position.y);
        const width = vehicle.width * this.scale;
        const height = vehicle.height * this.scale;
        
        const color = vehicle.color || this.colors.vehicle;
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = this.darkenColor(color, 30);
        this.ctx.lineWidth = 2 * this.scale;
        
        const left = screen.x - width / 2;
        const top = screen.y - height;
        
        this.ctx.beginPath();
        this.ctx.roundRect(left, top, width, height * 0.7, 5 * this.scale);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(left + width * 0.1, top + height * 0.1, width * 0.35, height * 0.35, 3 * this.scale);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        this.ctx.beginPath();
        this.ctx.roundRect(left + width * 0.5, top + height * 0.15, width * 0.4, height * 0.3, 2 * this.scale);
        this.ctx.fill();
        
        this.ctx.fillStyle = this.colors.vehicleWheel;
        for (const wheel of vehicle.wheels) {
            const wheelX = screen.x + wheel.offset * this.scale;
            const wheelY = screen.y;
            const wheelRadius = wheel.radius * this.scale;
            
            this.ctx.beginPath();
            this.ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#555';
            this.ctx.lineWidth = 2 * this.scale;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#777';
            this.ctx.beginPath();
            this.ctx.arc(wheelX, wheelY, wheelRadius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        if (vehicle.state === VehicleState.FALLEN) {
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y - height / 2, 20 * this.scale, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `${24 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('!', screen.x, screen.y - height / 2 + 8 * this.scale);
        }
    }

    drawPreviewLine(start, end, materialType, isValid = true) {
        const startScreen = this.toScreen(start.x, start.y);
        const endScreen = this.toScreen(end.x, end.y);
        
        const material = new Material(materialType);
        
        const baseColor = material.color;
        const previewColor = isValid ? baseColor : 'rgba(231, 76, 60, 0.6)';
        
        this.ctx.strokeStyle = previewColor;
        this.ctx.lineWidth = material.thickness * this.scale;
        this.ctx.setLineDash([10 * this.scale, 5 * this.scale]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startScreen.x, startScreen.y);
        this.ctx.lineTo(endScreen.x, endScreen.y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        const endPointColor = isValid ? this.lightenColor(baseColor, 20) : 'rgba(231, 76, 60, 0.8)';
        this.ctx.fillStyle = endPointColor;
        this.ctx.beginPath();
        this.ctx.arc(endScreen.x, endScreen.y, 6 * this.scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.darkenColor(baseColor, 20);
        this.ctx.lineWidth = 2 * this.scale;
        this.ctx.stroke();
    }

    drawPreviewNode(position) {
        const screen = this.toScreen(position.x, position.y);
        
        this.ctx.fillStyle = this.colors.preview;
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2 * this.scale;
        
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, 8 * this.scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawSnapPoint(position, isActive = false) {
        const screen = this.toScreen(position.x, position.y);
        
        this.ctx.strokeStyle = isActive ? '#27ae60' : 'rgba(39, 174, 96, 0.5)';
        this.ctx.lineWidth = 2 * this.scale;
        this.ctx.setLineDash([5 * this.scale, 3 * this.scale]);
        
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, 12 * this.scale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(screen.x - 8 * this.scale, screen.y);
        this.ctx.lineTo(screen.x + 8 * this.scale, screen.y);
        this.ctx.moveTo(screen.x, screen.y - 8 * this.scale);
        this.ctx.lineTo(screen.x, screen.y + 8 * this.scale);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    drawAll(nodes, beams, vehicles, level) {
        this.clear();
        this.drawGrid();
        
        if (level) {
            this.drawLevel(level);
        }
        
        for (const beam of beams) {
            this.drawBeam(beam);
        }
        
        if (this.viewOptions.showNodes) {
            for (const node of nodes) {
                this.drawNode(node);
            }
        }
        
        for (const vehicle of vehicles) {
            this.drawVehicle(vehicle);
        }
        
        this.animationTime += 0.016;
    }

    lightenColor(color, amount) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        return `rgb(${Math.min(255, rgb.r + amount)}, ${Math.min(255, rgb.g + amount)}, ${Math.min(255, rgb.b + amount)})`;
    }

    darkenColor(color, amount) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        return `rgb(${Math.max(0, rgb.r - amount)}, ${Math.max(0, rgb.g - amount)}, ${Math.max(0, rgb.b - amount)})`;
    }

    hexToRgb(hex) {
        if (hex.startsWith('rgb') || hex.startsWith('rgba')) {
            const match = hex.match(/\d+/g);
            if (match && match.length >= 3) {
                return {
                    r: parseInt(match[0]),
                    g: parseInt(match[1]),
                    b: parseInt(match[2])
                };
            }
            return null;
        }
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Renderer };
}
