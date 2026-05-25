import { Injectable, ElementRef } from '@angular/core';
import * as d3 from 'd3';

interface Node {
  id: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

@Injectable({
  providedIn: 'root'
})
export class GraphVisualizationService {
  private svg: any;
  private simulation: any;
  private width = 800;
  private height = 600;

  private sccColors = [
    '#00d4ff', '#7b2ff7', '#f107a3', '#ff6b6b',
    '#4ecdc4', '#45b7d1', '#96ceb4', '#ffcc5c'
  ];

  constructor() { }

  initGraph(container: ElementRef, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.svg = d3.select(container.nativeElement)
      .append('svg')
      .attr('id', 'graph-svg')
      .attr('width', width)
      .attr('height', height);

    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('class', 'arrowhead');
  }

  renderGraph(graph: Record<string, string[]>, sccs: string[][]) {
    if (!this.svg) {
      console.warn('Graph not initialized. Call initGraph first.');
      return;
    }

    if (!graph || Object.keys(graph).length === 0) {
      console.warn('Empty graph provided.');
      return;
    }

    this.clearGraph();

    const nodes: Node[] = Object.keys(graph).map(id => ({ id }));
    const links: Link[] = [];

    for (const source of Object.keys(graph)) {
      for (const target of graph[source]) {
        links.push({ source, target });
      }
    }

    const nodeSccMap = new Map<string, number>();
    sccs.forEach((scc, index) => {
      scc.forEach(node => nodeSccMap.set(node, index));
    });

    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    const linkElements = this.svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const nodeElements = this.svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', (event: any, d: any) => this.dragstarted(event, d))
        .on('drag', (event: any, d: any) => this.dragged(event, d))
        .on('end', (event: any, d: any) => this.dragended(event, d)));

    nodeElements.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => {
        const sccIndex = nodeSccMap.get(d.id) || 0;
        return this.sccColors[sccIndex % this.sccColors.length];
      })
      .attr('stroke', (d: any) => {
        const sccIndex = nodeSccMap.get(d.id) || 0;
        return this.lightenColor(this.sccColors[sccIndex % this.sccColors.length], 30);
      });

    nodeElements.append('text')
      .text((d: any) => d.id)
      .attr('dy', 4);

    this.simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }

  playPulseAnimation() {
    this.svg.selectAll('.node')
      .classed('node-pulse', true);

    setTimeout(() => {
      this.svg.selectAll('.node').classed('node-pulse', false);
    }, 3000);
  }

  playCycleHighlight(cyclePath: string[]) {
    this.resetStyles();

    const nodeSet = new Set(cyclePath);

    this.svg.selectAll('.node')
      .filter((d: any) => nodeSet.has(d.id))
      .classed('cycle-node', true);

    this.svg.selectAll('.edge')
      .filter((d: any) => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        for (let i = 0; i < cyclePath.length - 1; i++) {
          if (cyclePath[i] === sourceId && cyclePath[i + 1] === targetId) {
            return true;
          }
        }
        return false;
      })
      .classed('cycle-edge', true);
  }

  playSccCollapseAnimation(scc: string[]) {
    const nodeSet = new Set(scc);

    this.svg.selectAll('.node')
      .filter((d: any) => nodeSet.has(d.id))
      .classed('scc-collapsed', true);

    setTimeout(() => {
      this.svg.selectAll('.node').classed('scc-collapsed', false);
    }, 1000);
  }

  playWaterfallAnimation(topOrder: string[]) {
    this.resetStyles();

    const nodeOrder = new Map(topOrder.map((id, index) => [id, index]));

    this.svg.selectAll('.node')
      .each(function(this: any, d: any) {
        const delay = (nodeOrder.get(d.id) || 0) * 100;
        d3.select(this)
          .style('opacity', 0)
          .transition()
          .delay(delay)
          .duration(500)
          .style('opacity', 1);
      });
  }

  playCycleBreakAnimation(edge: [string, string], container: ElementRef) {
    const [source, target] = edge;

    const edgeElement = this.svg.selectAll('.edge')
      .filter((d: any) => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        return sourceId === source && targetId === target;
      });

    if (edgeElement.empty()) return;

    const bounds = container.nativeElement.getBoundingClientRect();
    const x1 = parseFloat(edgeElement.attr('x1'));
    const y1 = parseFloat(edgeElement.attr('y1'));
    const x2 = parseFloat(edgeElement.attr('x2'));
    const y2 = parseFloat(edgeElement.attr('y2'));

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const distance = 30 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${bounds.left + midX}px`;
      particle.style.top = `${bounds.top + midY}px`;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1000);
    }

    edgeElement
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  }

  resetStyles() {
    this.svg.selectAll('.node')
      .classed('cycle-node', false)
      .classed('node-pulse', false)
      .classed('scc-collapsed', false);

    this.svg.selectAll('.edge')
      .classed('cycle-edge', false);
  }

  clearGraph() {
    if (this.svg) {
      this.svg.selectAll('g').remove();
      if (this.simulation) {
        this.simulation.stop();
        this.simulation = null;
      }
    }
  }

  private dragstarted(event: any, d: any) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(event: any, d: any) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}
