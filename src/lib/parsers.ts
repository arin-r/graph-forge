import { Graph, GraphNode, GraphEdge } from '../types/graph';

export function parseAdjacencyList(input: string, directed: boolean): Graph {
  const nodesMap = new Set<string>();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const lines = input.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (!trimmed.includes(':')) {
      throw new Error(`Parse error on line ${lineNumber}: Missing colon ':'. Expected format is 'Node: Neighbor1 Neighbor2 ...'`);
    }

    const parts = trimmed.split(':');
    const source = parts[0].trim();
    
    if (!source) {
      throw new Error(`Parse error on line ${lineNumber}: Missing source node ID before colon. Expected format is 'Node: Neighbor1 Neighbor2 ...'`);
    }
    
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
  const rawLines = input.split('\n');
  const validLines: { text: string; lineNumber: number }[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed) {
      validLines.push({ text: trimmed, lineNumber: i + 1 });
    }
  }

  const n = validLines.length;
  if (n === 0) {
    return { nodes: [], edges: [], directed };
  }
  
  const nodesMap = new Set<string>();
  for (let i = 0; i < n; i++) {
    nodesMap.add(i.toString());
  }

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < n; i++) {
    const lineObj = validLines[i];
    const row = lineObj.text.split(/\s+/);
    
    if (row.length !== n) {
      throw new Error(`Parse error on line ${lineObj.lineNumber}: Matrix must be square. Expected ${n} columns for ${n} rows, but found ${row.length} columns. Expected format: N rows of N space-separated numbers.`);
    }

    for (let j = 0; j < n; j++) {
      const valStr = row[j];
      const weight = parseFloat(valStr);
      if (isNaN(weight)) {
        throw new Error(`Parse error on line ${lineObj.lineNumber}: Invalid value '${valStr}' at column ${j + 1}. Matrix elements must be numbers.`);
      }

      if (weight !== 0 && weight !== 1) {
        throw new Error(`Parse error on line ${lineObj.lineNumber}: Invalid value '${valStr}' at column ${j + 1}. Expected a binary value (0 or 1) representing edge existence in an unweighted adjacency matrix.`);
      }

      if (weight !== 0) {
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
