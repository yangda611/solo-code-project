function tarjan(graph) {
  const index = {};
  const lowLink = {};
  const onStack = {};
  const stack = [];
  const result = [];
  let idx = 0;

  const nodes = Object.keys(graph);

  function strongConnect(v) {
    index[v] = idx;
    lowLink[v] = idx;
    idx++;
    stack.push(v);
    onStack[v] = true;

    const neighbors = graph[v] || [];
    for (const w of neighbors) {
      if (index[w] === undefined) {
        strongConnect(w);
        lowLink[v] = Math.min(lowLink[v], lowLink[w]);
      } else if (onStack[w]) {
        lowLink[v] = Math.min(lowLink[v], index[w]);
      }
    }

    if (lowLink[v] === index[v]) {
      const component = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        component.push(w);
      } while (w !== v);
      result.push(component);
    }
  }

  for (const v of nodes) {
    if (index[v] === undefined) {
      strongConnect(v);
    }
  }

  return result;
}

function topologicalSort(graph) {
  const visited = {};
  const result = [];
  const nodes = Object.keys(graph);

  function visit(node) {
    if (visited[node]) return;
    visited[node] = true;
    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      visit(neighbor);
    }
    result.unshift(node);
  }

  for (const node of nodes) {
    if (!visited[node]) {
      visit(node);
    }
  }

  return result;
}

function hasCycle(graph) {
  const components = tarjan(graph);
  return components.some(c => c.length > 1) || hasSelfLoops(graph);
}

function hasSelfLoops(graph) {
  for (const node of Object.keys(graph)) {
    if (graph[node] && graph[node].includes(node)) {
      return true;
    }
  }
  return false;
}

function getCyclePaths(graph) {
  const components = tarjan(graph);
  const cycles = [];

  for (const component of components) {
    if (component.length > 1) {
      cycles.push({
        type: 'strongly_connected_component',
        nodes: component,
        path: findCycleInComponent(graph, component)
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

function findCycleInComponent(graph, component) {
  if (component.length === 1) {
    return component.concat(component[0]);
  }
  const nodeSet = new Set(component);
  for (const start of component) {
    const path = dfsFindCycle(graph, start, nodeSet, [start], new Set([start]), 0, 1000);
    if (path) return path;
  }
  return component.concat(component[0]);
}

function dfsFindCycle(graph, current, nodeSet, path, visited, depth, maxDepth) {
  if (depth > maxDepth) {
    return null;
  }
  const neighbors = (graph[current] || []).filter(n => nodeSet.has(n));
  for (const neighbor of neighbors) {
    if (path[0] === neighbor && path.length > 1) {
      return [...path, neighbor];
    }
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      const result = dfsFindCycle(graph, neighbor, nodeSet, [...path, neighbor], visited, depth + 1, maxDepth);
      if (result) return result;
      visited.delete(neighbor);
    }
  }
  return null;
}

function calculateImpact(graph, edgeToRemove) {
  const [from, to] = edgeToRemove;
  const newGraph = JSON.parse(JSON.stringify(graph));
  if (newGraph[from]) {
    newGraph[from] = newGraph[from].filter(n => n !== to);
  }

  const affectedNodes = new Set();
  const queue = [from];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!affectedNodes.has(node)) {
      affectedNodes.add(node);
      const neighbors = newGraph[node] || [];
      for (const neighbor of neighbors) {
        if (!affectedNodes.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return {
    affectedNodes: Array.from(affectedNodes),
    impactScore: affectedNodes.size / Object.keys(graph).length
  };
}

function recommendBreakingEdges(graph) {
  const cycles = getCyclePaths(graph);
  const recommendations = [];

  for (const cycle of cycles) {
    if (cycle.type === 'self_loop') {
      const node = cycle.nodes[0];
      const impact = calculateImpact(graph, [node, node]);
      recommendations.push({
        edge: [node, node],
        cycle: cycle.path,
        suggestion: `移除模块 ${node} 的自环依赖`,
        impactScore: impact.impactScore,
        affectedNodes: impact.affectedNodes
      });
    } else {
      const path = cycle.path;
      for (let i = 0; i < path.length - 1; i++) {
        const edge = [path[i], path[i + 1]];
        const impact = calculateImpact(graph, edge);
        recommendations.push({
          edge: edge,
          cycle: cycle.path,
          suggestion: `断开 ${edge[0]} → ${edge[1]} 的依赖边`,
          impactScore: impact.impactScore,
          affectedNodes: impact.affectedNodes
        });
      }
    }
  }

  return recommendations.sort((a, b) => b.impactScore - a.impactScore);
}

function calculateInfluenceRange(graph, startNode) {
  const visited = new Set();
  const queue = [startNode];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!visited.has(node)) {
      visited.add(node);
      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return Array.from(visited);
}

function parsePseudocode(code) {
  const graph = {};
  const lines = code.split('\n');
  
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

    const jsonMatch = trimmedLine.match(/^\s*\{[\s\S]*\}\s*$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(trimmedLine);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [key, value] of Object.entries(parsed)) {
            if (Array.isArray(value)) {
              graph[key] = value;
            }
          }
        }
      } catch (e) {
      }
    }
  }

  const allNodes = new Set();
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

  return graph;
}

function detectDynamicImportIssues(graph, dynamicNodes) {
  const issues = [];
  const reportedPairs = new Set();
  
  for (const node of dynamicNodes) {
    if (!graph[node]) continue;
    
    const reachable = calculateInfluenceRange(graph, node);
    for (const target of reachable) {
      if (target === node) continue;
      
      const pairKey = [node, target].sort().join('->');
      if (reportedPairs.has(pairKey)) continue;
      
      const targetReachable = calculateInfluenceRange(graph, target);
      if (targetReachable.includes(node)) {
        reportedPairs.add(pairKey);
        issues.push({
          type: 'conditional_cycle',
          nodes: [node, target],
          description: `动态导入 ${node} 在条件执行路径下可能与 ${target} 形成循环依赖`
        });
      }
    }
  }

  return issues;
}

module.exports = {
  tarjan,
  topologicalSort,
  hasCycle,
  getCyclePaths,
  recommendBreakingEdges,
  calculateInfluenceRange,
  parsePseudocode,
  detectDynamicImportIssues
};
