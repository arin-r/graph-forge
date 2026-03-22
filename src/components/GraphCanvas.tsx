import { ReactFlow, Controls, Background, Node, Edge, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { Mode } from '../types/graph';
import { useCallback } from 'react';

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  mode: Mode;
  selectedNodeId: string | null;
  onAddNode: (position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string | null) => void;
  theme: 'dark' | 'light';
}

const nodeTypes = {};
const edgeTypes = {};

export function GraphCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  mode, 
  selectedNodeId, 
  onAddNode,
  onNodeSelect,
  theme
}: GraphCanvasProps) {
  const { project } = useReactFlow();

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (mode === 'addNode') {
      const bounds = (event.target as Element).getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      onAddNode(position);
    } else {
      onNodeSelect(null);
    }
  }, [mode, project, onAddNode, onNodeSelect]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (mode === 'addEdge') {
      onNodeSelect(node.id);
    }
  }, [mode, onNodeSelect]);

  const styledNodes = nodes.map((n) => {
    const isSelected = n.id === selectedNodeId;
    if (!isSelected) {
      // For general nodes, the user might inject colors if desired. Wait, node natively handles its background
      // React Flow default nodes have white background by default, we'll let it handle its own CSS or they can edit global CSS
      return n;
    }
    
    return {
      ...n,
      style: {
        ...n.style,
        border: '2px solid #10b981',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
      }
    };
  });

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#0a0f1c] relative">
      <ReactFlow 
        nodes={styledNodes} 
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        nodesDraggable={mode !== 'addEdge'}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        className="touch-none"
      >
        <Background color={theme === 'dark' ? '#1e293b' : '#cbd5e1'} gap={24} size={1} />
        <Controls 
          className="bg-white border-slate-200 fill-slate-700 dark:bg-slate-800 dark:border-none dark:shadow-xl dark:fill-slate-300"
          showInteractive={false} 
        />
      </ReactFlow>
      
      {mode === 'addEdge' && selectedNodeId && (
        <div className="absolute top-4 left-4 z-10 bg-emerald-500 dark:bg-emerald-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg font-semibold border border-emerald-400 dark:border-emerald-500/50 pointer-events-none">
          Selected Node: {selectedNodeId}
        </div>
      )}
    </div>
  );
}
