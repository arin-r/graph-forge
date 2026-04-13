'use client';

import { useState, useCallback, useEffect } from 'react';
import { InputPanel } from '../components/InputPanel';
import { GraphCanvas } from '../components/GraphCanvas';
import { parseAdjacencyList, parseAdjacencyMatrix } from '../lib/parsers';
import { applyCircularLayout } from '../lib/layout';
import { Node, Edge, ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import { Mode } from '../types/graph';
import { computeNextNodeId, handleAddEdge, generateAdjacencyList, generateAdjacencyMatrix } from '../lib/graphUtils';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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

  // Initial load effect
  useEffect(() => {
    const initFormat = (localStorage.getItem('graphFormat') as 'list' | 'matrix') || 'list';
    setFormat(initFormat);

    const savedText = localStorage.getItem(`graphInput_${initFormat}`);
    const initText = savedText || (initFormat === 'list' ? '1: 2 3\n2: 3\n3: 1' : '0 1 1\n0 0 1\n1 0 0');
    setInputText(initText);

    try {
      const graph = initFormat === 'list' 
        ? parseAdjacencyList(initText, true)
        : parseAdjacencyMatrix(initText, true);
      
      const { nodes: flowNodes, edges: flowEdges } = applyCircularLayout(graph);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setNextNodeId(computeNextNodeId(flowNodes));
    } catch {
      // ignore
    }
    
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage when text changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(`graphInput_${format}`, inputText);
    }
  }, [inputText, format, mounted]);

  const handleFormatChange = useCallback((newFormat: 'list' | 'matrix') => {
    setFormat(newFormat);
    if (mounted) {
      localStorage.setItem('graphFormat', newFormat);
      const savedText = localStorage.getItem(`graphInput_${newFormat}`);
      if (savedText) {
        setInputText(savedText);
      } else {
        setInputText(newFormat === 'list' ? '1: 2 3\n2: 3\n3: 1' : '0 1 1\n0 0 1\n1 0 0');
      }
    }
  }, [mounted]);

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

  // Sync graph state to input text box when topology or layout changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mounted) return;
    
    let newText = '';
    if (format === 'list') {
      newText = generateAdjacencyList(nodes, edges, directed);
    } else {
      newText = generateAdjacencyMatrix(nodes, edges, directed);
    }
    
    setInputText(prev => prev === newText ? prev : newText);
  }, [nodes, edges, directed, mounted]); // Intentionally omitting 'format' to prevent overwriting local history on mode switch

  if (!mounted) {
    return <div className="w-screen h-screen bg-slate-50 dark:bg-[#0a0f1c]" />;
  }

  return (
    <main className={`w-screen h-screen flex overflow-hidden ${theme === 'dark' ? 'dark ' : ''}bg-slate-50 dark:bg-[#0a0f1c]`}>
      <div className="w-[350px] relative z-10 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
        <InputPanel
          inputText={inputText}
          onInputChange={setInputText}
          format={format}
          onFormatChange={handleFormatChange}
          directed={directed}
          onDirectedChange={setDirected}
          mode={mode}
          onModeChange={handleModeChange}
          onRender={handleRender}
          error={error}
          theme={theme}
          onThemeChange={setTheme}
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
            theme={theme}
          />
        </ReactFlowProvider>
      </div>
    </main>
  );
}
