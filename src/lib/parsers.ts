import { Graph, GraphNode, GraphEdge } from '../types/graph';

export function parseAdjacencyList(input: string, directed: boolean): Graph {
  const nodesMap = new Set<string>();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const lines = input.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Example: "1: 2 3" or "A:B C"
    const parts = trimmed.split(':');
    if (parts.length < 1) continue;
    
    const source = parts[0].trim();
    if (!source) continue;
    
    nodesMap.add(source);
    
    if (parts.length > 1) {
      const targetsStr = parts.slice(1).join(':').trim();
      if (!targetsStr) continue;
      
      const targets = targetsStr.split(/\s+/);
      for (const target of targets) {
        if (!target) continue;
        nodesMap.add(target);
        
        // Edge identification to prevent duplicates
        const normalizedEdge = directed 
          ? `${source}->${target}` 
          : [source, target].sort().join('-');
          
        if (!edgeSet.has(normalizedEdge)) {
          edgeSet.add(normalizedEdge);
          edges.push({
            id: `edge-${source}-${target}-${edges.length}`,
            source,
            target
          });
        }
      }
    }
  }

  const nodes: GraphNode[] = Array.from(nodesMap).map(id => ({ id }));
  
  return {
    nodes,
    edges,
    directed
  };
}

export function parseAdjacencyMatrix(input: string, directed: boolean): Graph {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const n = lines.length;
  
  const nodesMap = new Set<string>();
  for (let i = 0; i < n; i++) {
    nodesMap.add(i.toString());
  }

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < n; i++) {
    const row = lines[i].split(/\s+/);
    for (let j = 0; j < Math.min(row.length, n); j++) {
      const weight = parseFloat(row[j]);
      if (!isNaN(weight) && weight !== 0) {
        const source = i.toString();
        const target = j.toString();
        
        // Skip self loops for now if needed, or keep them. Let's keep them.
        
        const normalizedEdge = directed 
          ? `${source}->${target}` 
          : [source, target].sort().join('-');
          
        if (!edgeSet.has(normalizedEdge)) {
          edgeSet.add(normalizedEdge);
          edges.push({
            id: `edge-${source}-${target}-${edges.length}`,
            source,
            target,
            weight: weight !== 1 ? weight : undefined
          });
        }
      }
    }
  }

  const nodes: GraphNode[] = Array.from(nodesMap).map(id => ({ id }));

  return {
    nodes,
    edges,
    directed
  };
}
