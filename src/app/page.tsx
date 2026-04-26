'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { InputPanel } from '../components/InputPanel';
import { GraphCanvas } from '../components/GraphCanvas';
import { AlgorithmPanel } from '../components/AlgorithmPanel';
import { ForceLayoutPanel } from '../components/ForceLayoutPanel';
import { parseAdjacencyList, parseAdjacencyMatrix } from '../lib/parsers';
import { applyCircularLayout } from '../lib/layout';
import { calculateBFS, calculateDFS } from '../lib/algorithms';
import {
  ForceParams,
  DEFAULT_FORCE_PARAMS,
  SimulationState,
  initSimulation,
  reheatSimulation,
  tickSimulation,
  pinNode,
  unpinNode,
  movePinnedNode,
} from '../lib/forceSimulation';
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

  // --- Force Simulation State ---
  const [forceParams, setForceParams] = useState<ForceParams>({ ...DEFAULT_FORCE_PARAMS });
  const [forceSimActive, setForceSimActive] = useState(false);
  const simStateRef = useRef<SimulationState | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const forceParamsRef = useRef<ForceParams>(forceParams);

  // Keep ref in sync with state (so the rAF loop reads latest params)
  useEffect(() => {
    forceParamsRef.current = forceParams;
  }, [forceParams]);

  // --- Force simulation loop ---
  const stopSimLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const runSimLoop = useCallback(() => {
    const tick = () => {
      if (!simStateRef.current) return;

      // Calculate canvas center from current nodes
      let cx = 400, cy = 300;
      const phys = simStateRef.current.physics;
      if (phys.size > 0) {
        let sx = 0, sy = 0;
        for (const [, p] of phys) { sx += p.x; sy += p.y; }
        cx = sx / phys.size;
        cy = sy / phys.size;
      }

      simStateRef.current = tickSimulation(
        simStateRef.current,
        // Read edges from latest ref — we need a stable ref
        edgesRef.current,
        forceParamsRef.current,
        cx,
        cy,
      );

      // Update ReactFlow node positions
      const sim = simStateRef.current;
      setNodes((nds) =>
        nds.map((n) => {
          const p = sim.physics.get(n.id);
          if (!p) return n;
          // Only update if position actually changed (avoid re-render churn)
          if (Math.abs(n.position.x - p.x) < 0.01 && Math.abs(n.position.y - p.y) < 0.01) return n;
          return { ...n, position: { x: p.x, y: p.y } };
        })
      );

      if (sim.isSettled) {
        // Simulation converged — stop the loop
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    stopSimLoop();
    rafIdRef.current = requestAnimationFrame(tick);
  }, [stopSimLoop, setNodes]);

  // Stable ref for edges (so the rAF loop doesn't need edges in its dep array)
  const edgesRef = useRef<Edge[]>(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // --- Force handlers ---
  const handleForceStart = useCallback(() => {
    // Initialize simulation from current node positions
    simStateRef.current = initSimulation(nodes);
    setForceSimActive(true);
    runSimLoop();
  }, [nodes, runSimLoop]);

  const handleForceStop = useCallback(() => {
    stopSimLoop();
    setForceSimActive(false);
    simStateRef.current = null;
  }, [stopSimLoop]);

  const handleForceParamsChange = useCallback((newParams: ForceParams) => {
    setForceParams(newParams);
    // If simulation is active, re-heat it so it animates to new equilibrium
    if (simStateRef.current && forceSimActive) {
      simStateRef.current = reheatSimulation(simStateRef.current);
      // Ensure the loop is running
      if (rafIdRef.current === null) {
        runSimLoop();
      }
    }
  }, [forceSimActive, runSimLoop]);

  // --- Node drag handlers for force simulation ---
  const handleNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    if (!forceSimActive || !simStateRef.current) return;
    simStateRef.current = pinNode(simStateRef.current, node.id, node.position.x, node.position.y);
    // Ensure loop is running
    if (rafIdRef.current === null) {
      runSimLoop();
    }
  }, [forceSimActive, runSimLoop]);

  const handleNodeDrag = useCallback((_event: React.MouseEvent, node: Node) => {
    if (!forceSimActive || !simStateRef.current) return;
    simStateRef.current = movePinnedNode(simStateRef.current, node.id, node.position.x, node.position.y);
  }, [forceSimActive]);

  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    if (!forceSimActive || !simStateRef.current) return;
    simStateRef.current = unpinNode(simStateRef.current, node.id);
    // Re-heat so the released node settles back naturally
    simStateRef.current = reheatSimulation(simStateRef.current);
    if (rafIdRef.current === null) {
      runSimLoop();
    }
  }, [forceSimActive, runSimLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopSimLoop(); };
  }, [stopSimLoop]);

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

    // Stop force sim when entering algorithm mode
    handleForceStop();

    const computedSteps = algorithmType === 'bfs'
      ? calculateBFS(nodes, edges, startNodeId, directed)
      : calculateDFS(nodes, edges, startNodeId, directed);

    setSteps(computedSteps);
    setCurrentStepIndex(0);
    setMode('algorithm');
    setSelectedNodeId(null);
    setIsPlaying(false);
  }, [algorithmType, startNodeId, nodes, edges, directed, handleForceStop]);

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
      // Stop force sim on new render
      handleForceStop();

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
  }, [inputText, format, directed, setNodes, setEdges, handleAlgorithmReset, handleForceStop]);

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
        >
          <ForceLayoutPanel
            params={forceParams}
            onParamsChange={handleForceParamsChange}
            isActive={forceSimActive}
            onStart={handleForceStart}
            onStop={handleForceStop}
            disabled={isAlgorithmActive}
          />
        </InputPanel>
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
              forceSimActive={forceSimActive}
              onNodeDragStart={handleNodeDragStart}
              onNodeDrag={handleNodeDrag}
              onNodeDragStop={handleNodeDragStop}
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
