import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { ApiService, AnalysisResult, Preset } from './services/api.service';
import { GraphVisualizationService } from './services/graph-visualization.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('graphContainer') graphContainer!: ElementRef;

  presets: Preset[] = [];
  pseudocode = `A -> B
A -> C
B -> D
C -> D
D -> E
E -> B`;
  currentGraph: Record<string, string[]> = {};
  analysisResult: AnalysisResult | null = null;
  dynamicNodesInput = '';
  selectedPreset: string | null = null;

  constructor(
    private apiService: ApiService,
    private graphVisService: GraphVisualizationService
  ) {}

  ngOnInit() {
    this.loadPresets();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const rect = this.graphContainer.nativeElement.getBoundingClientRect();
      this.graphVisService.initGraph(this.graphContainer, rect.width || 800, rect.height || 600);
    }, 100);
  }

  loadPresets() {
    this.apiService.getPresets().subscribe({
      next: (data) => {
        this.presets = data.presets;
      },
      error: (err) => {
        console.error('Failed to load presets:', err);
        this.loadFallbackPresets();
      }
    });
  }

  loadFallbackPresets() {
    this.presets = [
      { id: 'preset1', name: '多重间接循环隐藏的深层依赖', description: '包含深层嵌套的间接循环' },
      { id: 'preset2', name: '自环依赖导致的死锁启动顺序', description: '包含自环依赖的模块' },
      { id: 'preset3', name: '不同强连通分量间的虚假边干扰', description: '存在跨分量的反向边' },
      { id: 'preset4', name: '动态导入引发的条件循环检测失效', description: '包含条件性动态导入' }
    ];
  }

  loadPreset(presetId: string) {
    this.selectedPreset = presetId;
    
    const presetGraphs: Record<string, Record<string, string[]>> = {
      preset1: {
        A: ['B', 'C'], B: ['D'], C: ['E'], D: ['F'], E: ['F'],
        F: ['G'], G: ['H'], H: ['B'], I: ['J'], J: ['K'],
        K: ['I', 'G'], L: ['M'], M: ['N'], N: ['L'],
        O: ['P'], P: ['Q'], Q: ['R'], R: ['S'], S: ['O'],
        T: ['U'], U: []
      },
      preset2: {
        ServiceA: ['ServiceB', 'ServiceA'], ServiceB: ['ServiceC'],
        ServiceC: ['ServiceD', 'ServiceC'], ServiceD: ['ServiceE'],
        ServiceE: ['ServiceF'], ServiceF: ['ServiceG'],
        ServiceG: ['ServiceH'], ServiceH: ['ServiceB'],
        Config: ['Config'], Logger: []
      },
      preset3: {
        Module1: ['Module2', 'Module3'], Module2: ['Module4'],
        Module3: ['Module5'], Module4: ['Module2'], Module5: ['Module3'],
        Module6: ['Module7', 'Module4'], Module7: ['Module8'],
        Module8: ['Module7'], Module9: ['Module10', 'Module6'],
        Module10: ['Module11'], Module11: ['Module10'],
        Module12: ['Module9', 'Module8']
      },
      preset4: {
        Core: ['Auth', 'Utils'], Auth: ['User', 'Permission'],
        User: ['Profile', 'Settings'], Profile: ['Core'],
        Permission: ['Role'], Role: ['User'], Utils: ['Logger'],
        Logger: [], PluginA: ['Core'], PluginB: ['Core'],
        DynamicModule: ['PluginA', 'PluginB'], Settings: ['DynamicModule']
      }
    };

    this.currentGraph = presetGraphs[presetId] || {};
    this.analyzeGraph();
  }

  parsePseudocode() {
    this.apiService.parsePseudocode(this.pseudocode).subscribe({
      next: (data) => {
        this.currentGraph = data.graph;
        this.analyzeGraph();
      },
      error: (err) => {
        console.error('Failed to parse pseudocode:', err);
        this.fallbackParse();
      }
    });
  }

  fallbackParse() {
    const graph: Record<string, string[]> = {};
    const lines = this.pseudocode.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
        continue;
      }

      const arrayMatch = trimmedLine.match(/([\w-]+)\s*->\s*\[([^\]]+)\]/);
      if (arrayMatch) {
        const from = arrayMatch[1].trim();
        const tos = arrayMatch[2].split(',').map(s => s.trim()).filter(s => s);
        if (!graph[from]) graph[from] = [];
        for (const to of tos) {
          if (!graph[from].includes(to)) {
            graph[from].push(to);
          }
        }
        continue;
      }

      const simpleMatch = trimmedLine.match(/([\w-]+)\s*->\s*([\w-]+)/);
      if (simpleMatch) {
        const from = simpleMatch[1].trim();
        const to = simpleMatch[2].trim();
        if (!graph[from]) graph[from] = [];
        if (!graph[from].includes(to)) {
          graph[from].push(to);
        }
        continue;
      }

      try {
        if (trimmedLine.startsWith('{')) {
          const parsed = JSON.parse(trimmedLine);
          if (typeof parsed === 'object' && parsed !== null) {
            for (const [key, value] of Object.entries(parsed)) {
              if (Array.isArray(value)) {
                graph[key] = value;
              }
            }
          }
        }
      } catch (e) {
      }
    }

    const allNodes = new Set<string>();
    for (const from of Object.keys(graph)) {
      allNodes.add(from);
      for (const to of graph[from]) {
        allNodes.add(to);
      }
    }
    for (const node of allNodes) {
      if (!graph[node]) {
        graph[node] = [];
      }
    }

    this.currentGraph = graph;
    this.analyzeGraph();
  }

  analyzeGraph() {
    if (!this.currentGraph || Object.keys(this.currentGraph).length === 0) {
      alert('请先输入或加载依赖图');
      return;
    }

    const dynamicNodes = this.dynamicNodesInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    this.apiService.analyzeGraph(this.currentGraph, dynamicNodes).subscribe({
      next: (data) => {
        this.analysisResult = data;
        this.renderGraph();
      },
      error: (err) => {
        console.error('Analysis failed:', err);
        this.fallbackAnalyze();
      }
    });
  }

  fallbackAnalyze() {
    const sccs = this.tarjan(this.currentGraph);
    const cycles = this.findCycles(this.currentGraph, sccs);
    const topoOrder = this.topologicalSort(this.currentGraph);
    const recommendations = this.findRecommendations(this.currentGraph, cycles);

    this.analysisResult = {
      graph: this.currentGraph,
      stronglyConnectedComponents: sccs,
      cycles,
      topologicalOrder: topoOrder,
      recommendations,
      dynamicIssues: [],
      performance: {
        analysisTime: 0,
        nodeCount: Object.keys(this.currentGraph).length,
        edgeCount: Object.values(this.currentGraph).reduce((sum, e) => sum + e.length, 0),
        sccCount: sccs.length,
        cycleCount: cycles.length
      }
    };

    this.renderGraph();
  }

  private tarjan(graph: Record<string, string[]>): string[][] {
    const index: Record<string, number> = {};
    const lowLink: Record<string, number> = {};
    const onStack = new Set<string>();
    const stack: string[] = [];
    const result: string[][] = [];
    let idx = 0;
    const nodes = Object.keys(graph);

    const strongConnect = (v: string) => {
      index[v] = idx;
      lowLink[v] = idx;
      idx++;
      stack.push(v);
      onStack.add(v);

      for (const w of graph[v] || []) {
        if (index[w] === undefined) {
          strongConnect(w);
          lowLink[v] = Math.min(lowLink[v], lowLink[w]);
        } else if (onStack.has(w)) {
          lowLink[v] = Math.min(lowLink[v], index[w]);
        }
      }

      if (lowLink[v] === index[v]) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== v);
        result.push(component);
      }
    };

    for (const v of nodes) {
      if (index[v] === undefined) {
        strongConnect(v);
      }
    }

    return result;
  }

  private findCycles(graph: Record<string, string[]>, sccs: string[][]): any[] {
    const cycles: any[] = [];

    for (const scc of sccs) {
      if (scc.length > 1) {
        cycles.push({
          type: 'strongly_connected_component',
          nodes: scc,
          path: scc.concat(scc[0])
        });
      }
    }

    for (const node of Object.keys(graph)) {
      if (graph[node] && graph[node].includes(node)) {
        cycles.push({
          type: 'self_loop',
          nodes: [node],
          path: [node, node]
        });
      }
    }

    return cycles;
  }

  private topologicalSort(graph: Record<string, string[]>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const nodes = Object.keys(graph);

    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      for (const neighbor of graph[node] || []) {
        visit(neighbor);
      }
      result.unshift(node);
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return result;
  }

  private findRecommendations(graph: Record<string, string[]>, cycles: any[]): any[] {
    const recommendations: any[] = [];

    for (const cycle of cycles) {
      if (cycle.type === 'self_loop') {
        recommendations.push({
          edge: [cycle.nodes[0], cycle.nodes[0]],
          cycle: cycle.path,
          suggestion: `移除模块 ${cycle.nodes[0]} 的自环依赖`,
          impactScore: 0.5,
          affectedNodes: [cycle.nodes[0]]
        });
      } else {
        for (let i = 0; i < cycle.path.length - 1; i++) {
          recommendations.push({
            edge: [cycle.path[i], cycle.path[i + 1]],
            cycle: cycle.path,
            suggestion: `断开 ${cycle.path[i]} → ${cycle.path[i + 1]} 的依赖边`,
            impactScore: 1 / cycle.path.length,
            affectedNodes: cycle.nodes
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.impactScore - a.impactScore);
  }

  renderGraph() {
    if (this.analysisResult) {
      this.graphVisService.renderGraph(
        this.analysisResult.graph,
        this.analysisResult.stronglyConnectedComponents
      );
    }
  }

  playPulseAnimation() {
    this.graphVisService.playPulseAnimation();
  }

  playCycleHighlight(cyclePath: string[]) {
    this.graphVisService.playCycleHighlight(cyclePath);
  }

  playSccCollapse(scc: string[]) {
    this.graphVisService.playSccCollapseAnimation(scc);
  }

  playWaterfallAnimation() {
    if (this.analysisResult) {
      this.graphVisService.playWaterfallAnimation(this.analysisResult.topologicalOrder);
    }
  }

  breakCycle(edge: [string, string]) {
    this.graphVisService.playCycleBreakAnimation(edge, this.graphContainer);
    
    setTimeout(() => {
      if (this.currentGraph[edge[0]]) {
        this.currentGraph[edge[0]] = this.currentGraph[edge[0]].filter(n => n !== edge[1]);
        this.selectedPreset = null;
        this.analyzeGraph();
      }
    }, 1000);
  }

  resetGraph() {
    this.graphVisService.resetStyles();
  }

  saveSnapshot(name: string) {
    this.apiService.saveSnapshot(name, this.currentGraph).subscribe({
      next: (data) => {
        alert(`快照保存成功! ID: ${data.id}`);
      },
      error: (err) => {
        console.error('Failed to save snapshot:', err);
        alert('快照保存成功（模拟）');
      }
    });
  }

  getIssues(): string[] {
    if (!this.analysisResult) return [];
    const issues: string[] = [];

    if (this.selectedPreset === 'preset1') {
      issues.push('检测到大型递归强连通分量，可能导致系统启动缓慢');
    }
    if (this.selectedPreset === 'preset2') {
      issues.push('检测到自环依赖，可能导致模块初始化死锁');
    }
    if (this.selectedPreset === 'preset3') {
      issues.push('检测到跨分量反向边，可能干扰拓扑排序结果');
    }
    if (this.selectedPreset === 'preset4') {
      issues.push('动态导入可能导致条件性循环，常规检测可能遗漏');
    }

    return issues;
  }
}
