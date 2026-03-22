'use client';

import { useState, useCallback, useEffect } from 'react';
import { InputPanel } from '../components/InputPanel';
import { GraphCanvas } from '../components/GraphCanvas';
import { parseAdjacencyList, parseAdjacencyMatrix } from '../lib/parsers';
import { applyCircularLayout } from '../lib/layout';
import { Node, Edge, ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import { Mode } from '../types/graph';
import { computeNextNodeId, handleAddEdge } from '../lib/graphUtils';

export default function Home() {
  const [inputText, setInputText] = useState('1: 2 3\n2: 3\n3: 1');
  const [format, setFormat] = useState<'list' | 'matrix'>('list');
  const [directed, setDirected] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  
  const [mode, setMode] = useState<Mode>('view');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nextNodeId, setNextNodeId] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleRender = useCallback(() => {
    try {
      setError(null);
      let graph;
      if (format === 'list') {
        graph = parseAdjacencyList(inputText, directed);
      } else {
        graph = parseAdjacencyMatrix(inputText, directed);
      }
      
      const { nodes: flowNodes, edges: flowEdges } = applyCircularLayout(graph);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setNextNodeId(computeNextNodeId(flowNodes));
      setMode('view');
      setSelectedNodeId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to parse graph');
    }
  }, [inputText, format, directed, setNodes, setEdges]);

  // Initial render effect
  useEffect(() => {
    handleRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setSelectedNodeId(null);
  }, []);

  const onAddNode = useCallback((position: { x: number; y: number }) => {
    const id = nextNodeId.toString();
    const newNode: Node = {
      id,
      position,
      data: { label: id },
      type: 'default',
      sourcePosition: 'bottom' as any,
      targetPosition: 'top' as any,
      style: { 
        width: 48, 
        height: 48, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setNextNodeId((prev) => prev + 1);
  }, [nextNodeId, setNodes]);

  const onNodeSelect = useCallback((nodeId: string | null) => {
    if (nodeId && mode === 'addEdge') {
      if (!selectedNodeId) {
        setSelectedNodeId(nodeId);
      } else {
        const newEdge = handleAddEdge(selectedNodeId, nodeId, edges, directed);
        if (newEdge) {
          setEdges((eds) => eds.concat(newEdge));
        }
        setSelectedNodeId(null);
      }
    } else {
      setSelectedNodeId(null);
    }
  }, [mode, selectedNodeId, edges, directed, setEdges]);

  return (
    <main className="w-screen h-screen flex overflow-hidden bg-[#0a0f1c]">
      <div className="w-[350px] relative z-10 shrink-0">
        <InputPanel
          inputText={inputText}
          onInputChange={setInputText}
          format={format}
          onFormatChange={(fmt) => {
            setFormat(fmt);
            if (fmt === 'list') {
              setInputText('1: 2 3\n2: 3\n3: 1');
            } else {
              setInputText('0 1 1\n0 0 1\n1 0 0');
            }
          }}
          directed={directed}
          onDirectedChange={setDirected}
          mode={mode}
          onModeChange={handleModeChange}
          onRender={handleRender}
          error={error}
        />
      </div>
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <GraphCanvas 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            mode={mode}
            selectedNodeId={selectedNodeId}
            onAddNode={onAddNode}
            onNodeSelect={onNodeSelect}
          />
        </ReactFlowProvider>
      </div>
    </main>
  );
}
