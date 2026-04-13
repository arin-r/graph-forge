import { ReactFlow, Controls, Background, Node, Edge, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { Mode, AlgorithmStep } from '../types/graph';
import { useCallback, useMemo } from 'react';

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
  algorithmStep: AlgorithmStep | null;
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
  theme,
  algorithmStep,
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

  const styledNodes = useMemo(() => {
    return nodes.map((n) => {
      // Algorithm visual states take priority
      if (algorithmStep) {
        const isCurrent = n.id === algorithmStep.currentNodeId;
        const isProcessing = algorithmStep.processing.has(n.id);
        const isFullyVisited = algorithmStep.fullyVisited.has(n.id);

        if (isCurrent) {
          // State: Currently being processed (dequeued/popped THIS step)
          return {
            ...n,
            className: 'algo-node-current',
            style: {
              ...n.style,
              background: '#f59e0b',
              border: '3px solid #d97706',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.6), 0 0 40px rgba(245, 158, 11, 0.3)',
              color: '#1e293b',
              fontWeight: 700,
              transition: 'all 0.3s ease',
            },
          };
        }
        if (isFullyVisited) {
          // State 3: Fully visited / explored
          return {
            ...n,
            className: 'algo-node-visited',
            style: {
              ...n.style,
              background: theme === 'dark' ? '#1e3a2f' : '#d1fae5',
              border: '2px solid #4ade80',
              boxShadow: '0 0 8px rgba(74, 222, 128, 0.25)',
              color: theme === 'dark' ? '#86efac' : '#166534',
              opacity: 0.85,
              transition: 'all 0.3s ease',
            },
          };
        }
        if (isProcessing) {
          // State 2: In frontier (Queue/Stack)
          return {
            ...n,
            className: 'algo-node-processing',
            style: {
              ...n.style,
              background: theme === 'dark' ? '#1e293b' : '#eff6ff',
              border: '3px solid #3b82f6',
              boxShadow: '0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.2)',
              color: theme === 'dark' ? '#93c5fd' : '#1e40af',
              fontWeight: 600,
              transition: 'all 0.3s ease',
            },
          };
        }
        // Unvisited during algorithm — dim slightly
        return {
          ...n,
          style: {
            ...n.style,
            opacity: 0.45,
            transition: 'all 0.3s ease',
          },
        };
      }

      // Non-algorithm mode: existing edge-add selection highlight
      if (n.id === selectedNodeId) {
        return {
          ...n,
          style: {
            ...n.style,
            border: '2px solid #10b981',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
          },
        };
      }

      return n;
    });
  }, [nodes, algorithmStep, selectedNodeId, theme]);

  const styledEdges = useMemo(() => {
    if (!algorithmStep || !algorithmStep.activeEdge) return edges;

    return edges.map((e) => {
      const ae = algorithmStep.activeEdge!;
      const isActive =
        (e.source === ae.source && e.target === ae.target) ||
        (e.source === ae.target && e.target === ae.source);

      if (isActive) {
        return {
          ...e,
          style: {
            ...e.style,
            stroke: '#f59e0b',
            strokeWidth: 4,
            filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))',
            transition: 'all 0.3s ease',
          },
          animated: true,
        };
      }

      // Check if both endpoints are visited — dim the edge
      const srcVisited = algorithmStep.fullyVisited.has(e.source);
      const tgtVisited = algorithmStep.fullyVisited.has(e.target);
      if (srcVisited && tgtVisited) {
        return {
          ...e,
          style: {
            ...e.style,
            stroke: '#4ade80',
            strokeWidth: 2,
            opacity: 0.5,
            transition: 'all 0.3s ease',
          },
        };
      }

      // Unvisited edge — dim
      return {
        ...e,
        style: {
          ...e.style,
          opacity: 0.3,
          transition: 'all 0.3s ease',
        },
      };
    });
  }, [edges, algorithmStep]);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#0a0f1c] relative">
      <ReactFlow 
        nodes={styledNodes} 
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        nodesDraggable={mode !== 'addEdge' && mode !== 'algorithm'}
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
