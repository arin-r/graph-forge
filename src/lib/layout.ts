import { Graph } from '../types/graph';
import { Node, Edge } from 'reactflow';

export function applyCircularLayout(graph: Graph, centerX = 400, centerY = 300) {
  const totalNodes = graph.nodes.length;
  // Calculate a dynamic radius ensuring at least 60px of arc per node
  const radius = Math.max(200, (totalNodes * 60) / (2 * Math.PI));
  
  const reactFlowNodes: Node[] = graph.nodes.map((node: any, index: number) => {
    const angle = (2 * Math.PI * index) / totalNodes;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    return {
      id: node.id,
      position: { x, y },
      data: { label: node.id },
      type: 'default',
      style: { 
        width: 48, 
        height: 48, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      },
    } as any;
  });

  const reactFlowEdges: Edge[] = graph.edges.map((edge: any) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.weight !== undefined ? String(edge.weight) : undefined,
    type: 'floating',
    style: { strokeWidth: 2 },
    markerEnd: graph.directed ? { type: 'arrowclosed' as any, width: 14, height: 14 } : undefined
  }));

  return { nodes: reactFlowNodes, edges: reactFlowEdges };
}
