'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { InputPanel } from '../components/InputPanel';
import { GraphCanvas } from '../components/GraphCanvas';
import { AlgorithmPanel } from '../components/AlgorithmPanel';
import { parseAdjacencyList, parseAdjacencyMatrix } from '../lib/parsers';
import { applyCircularLayout } from '../lib/layout';
import { calculateBFS, calculateDFS } from '../lib/algorithms';
import { Node, Edge, ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import { Mode, AlgorithmStep } from '../types/graph';
import { computeNextNodeId, handleAddEdge, generateAdjacencyList, generateAdjacencyMatrix } from '../lib/graphUtils';
import { DEFAULT_LIST_INPUT, DEFAULT_MATRIX_INPUT } from '../lib/constants';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [inputText, setInputText] = useState(DEFAULT_LIST_INPUT);
  const [format, setFormat] = useState<'list' | 'matrix'>('list');
  const [directed, setDirected] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  
  const [mode, setMode] = useState<Mode>('view');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nextNodeId, setNextNodeId] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // --- Algorithm State ---
  const [algorithmType, setAlgorithmType] = useState<'bfs' | 'dfs'>('bfs');
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(800);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAlgorithmActive = currentStepIndex >= 0;
  const currentStep = isAlgorithmActive && currentStepIndex < steps.length
    ? steps[currentStepIndex]
    : null;

  // Auto-select start node when nodes change
  useEffect(() => {
    if (nodes.length > 0 && !startNodeId) {
      const sorted = [...nodes].sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.id.localeCompare(b.id);
      });
      setStartNodeId(sorted[0].id);
    }
    if (nodes.length === 0) {
      setStartNodeId(null);
    }
  }, [nodes, startNodeId]);

  // --- Algorithm Handlers ---
  const handleStartAlgorithm = useCallback(() => {
    if (!startNodeId || nodes.length === 0) return;

    const computedSteps = algorithmType === 'bfs'
      ? calculateBFS(nodes, edges, startNodeId, directed)
      : calculateDFS(nodes, edges, startNodeId, directed);

    setSteps(computedSteps);
    setCurrentStepIndex(0);
    setMode('algorithm');
    setSelectedNodeId(null);
    setIsPlaying(false);
  }, [algorithmType, startNodeId, nodes, edges, directed]);

  const handleStepForward = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < steps.length - 1) return prev + 1;
      setIsPlaying(false);
      return prev;
    });
  }, [steps.length]);

  const handleStepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleAlgorithmReset = useCallback(() => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setIsPlaying(false);
    setMode('view');
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && isAlgorithmActive) {
      playIntervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, isAlgorithmActive, steps.length, playSpeed]);

  // --- Existing Handlers ---
  const handleRender = useCallback(() => {
    try {
      setError(null);
      // Reset algorithm state on new render
      handleAlgorithmReset();

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
  }, [inputText, format, directed, setNodes, setEdges, handleAlgorithmReset]);

  // Initial load effect
  useEffect(() => {
    const initFormat = (localStorage.getItem('graphFormat') as 'list' | 'matrix') || 'list';
    setFormat(initFormat);

    const savedText = localStorage.getItem(`graphInput_${initFormat}`);
    const initText = savedText || (initFormat === 'list' ? DEFAULT_LIST_INPUT : DEFAULT_MATRIX_INPUT);
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
        setInputText(newFormat === 'list' ? DEFAULT_LIST_INPUT : DEFAULT_MATRIX_INPUT);
      }
    }
  }, [mounted]);

  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode !== 'algorithm') {
      handleAlgorithmReset();
    }
    setMode(newMode);
    setSelectedNodeId(null);
  }, [handleAlgorithmReset]);

  const onAddNode = useCallback((position: { x: number; y: number }) => {
    const id = nextNodeId.toString();
    const newNode: Node = {
      id,
      position,
      data: { label: id },
      type: 'default',
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
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 relative min-h-0">
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
              algorithmStep={currentStep}
            />
          </ReactFlowProvider>
        </div>
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 backdrop-blur-sm">
          <AlgorithmPanel
            nodes={nodes}
            algorithmType={algorithmType}
            onAlgorithmTypeChange={setAlgorithmType}
            startNodeId={startNodeId}
            onStartNodeChange={setStartNodeId}
            steps={steps}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            playSpeed={playSpeed}
            onStart={handleStartAlgorithm}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onPlayPause={handlePlayPause}
            onReset={handleAlgorithmReset}
            onSpeedChange={setPlaySpeed}
            isActive={isAlgorithmActive}
          />
        </div>
      </div>
    </main>
  );
}
