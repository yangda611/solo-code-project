import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalysisResult {
  graph: Record<string, string[]>;
  stronglyConnectedComponents: string[][];
  cycles: Array<{
    type: string;
    nodes: string[];
    path: string[];
  }>;
  topologicalOrder: string[];
  recommendations: Array<{
    edge: [string, string];
    cycle: string[];
    suggestion: string;
    impactScore: number;
    affectedNodes: string[];
  }>;
  dynamicIssues: Array<{
    type: string;
    nodes: string[];
    description: string;
  }>;
  performance: {
    analysisTime: number;
    nodeCount: number;
    edgeCount: number;
    sccCount: number;
    cycleCount: number;
  };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getPresets(): Observable<{ presets: Preset[] }> {
    return this.http.get<{ presets: Preset[] }>(`${this.baseUrl}/presets`);
  }

  getPreset(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/presets/${id}`);
  }

  analyzeGraph(graph: Record<string, string[]>, dynamicNodes: string[] = []): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(`${this.baseUrl}/analyze`, { graph, dynamicNodes });
  }

  parsePseudocode(code: string): Observable<{ graph: Record<string, string[]> }> {
    return this.http.post<{ graph: Record<string, string[]> }>(`${this.baseUrl}/parse-pseudocode`, { code });
  }

  saveSnapshot(name: string, graphData: any): Observable<{ id: number; success: boolean }> {
    return this.http.post<{ id: number; success: boolean }>(`${this.baseUrl}/snapshots`, { name, graphData });
  }
}
