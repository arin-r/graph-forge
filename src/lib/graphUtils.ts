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
    animated: true,
    style: { strokeWidth: 2 },
    markerEnd: directed ? { type: 'arrowclosed', width: 20, height: 20 } : undefined,
  } as Edge;
}
