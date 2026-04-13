import { Edge, Node } from 'reactflow';

export function computeNextNodeId(nodes: Node[]): number {
  if (nodes.length === 0) return 1;
  const ids = nodes
    .map((n) => parseInt(n.id, 10))
    .filter((id) => !isNaN(id));
  
  if (ids.length === 0) return 1;
  return Math.max(...ids) + 1;
}

export function handleAddEdge(
  source: string,
  target: string,
  edges: Edge[],
  directed: boolean
): Edge | null {
  // Prevent self-loops
  if (source === target) return null;

  // Prevent duplicate edges
  const exists = edges.some(e => {
    if (directed) {
      return e.source === source && e.target === target;
    } else {
      return (e.source === source && e.target === target) ||
             (e.source === target && e.target === source);
    }
  });

  if (exists) return null;

  return {
    id: `edge-${source}-${target}-${Date.now()}`,
    source,
    target,
    label: undefined,
    type: 'default',
    style: { strokeWidth: 2 },
    markerEnd: directed ? { type: 'arrowclosed', width: 20, height: 20 } : undefined,
  } as Edge;
}

export function generateAdjacencyList(nodes: Node[], edges: Edge[], directed: boolean): string {
  const adj: Record<string, string[]> = {};
  
  // Initialize to maintain node order
  nodes.forEach(n => {
    adj[n.id] = [];
  });
  
  edges.forEach(e => {
    if (adj[e.source]) {
      adj[e.source].push(e.target);
    }
    if (!directed && adj[e.target]) {
      adj[e.target].push(e.source);
    }
  });

  const lines = nodes.map(n => {
    const neighbors = Array.from(new Set(adj[n.id])); // keep unique
    if (neighbors.length === 0) {
      return `${n.id}:`;
    }
    return `${n.id}: ${neighbors.join(' ')}`;
  });
  
  return lines.join('\n');
}

export function generateAdjacencyMatrix(nodes: Node[], edges: Edge[], directed: boolean): string {
  const nodeMap = new Map<string, number>();
  
  // Sort nodes sequentially to maintain a logical matrix structure.
  const sortedNodes = [...nodes].sort((a, b) => {
    const numA = parseInt(a.id, 10);
    const numB = parseInt(b.id, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.id.localeCompare(b.id);
  });
  
  sortedNodes.forEach((n, i) => nodeMap.set(n.id, i));
  const n = sortedNodes.length;
  
  if (n === 0) return '';
  
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  
  edges.forEach(e => {
    const u = nodeMap.get(e.source);
    const v = nodeMap.get(e.target);
    if (u !== undefined && v !== undefined) {
      matrix[u][v] = 1;
      if (!directed) {
        matrix[v][u] = 1;
      }
    }
  });
  
  return matrix.map(row => row.join(' ')).join('\n');
}
