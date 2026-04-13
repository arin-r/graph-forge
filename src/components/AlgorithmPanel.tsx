'use client';

import { AlgorithmStep } from '../types/graph';
import { Node } from 'reactflow';
import {
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface AlgorithmPanelProps {
  nodes: Node[];
  algorithmType: 'bfs' | 'dfs';
  onAlgorithmTypeChange: (type: 'bfs' | 'dfs') => void;
  startNodeId: string | null;
  onStartNodeChange: (id: string) => void;
  steps: AlgorithmStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playSpeed: number;
  onStart: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  isActive: boolean;
}

export function AlgorithmPanel({
  nodes,
  algorithmType,
  onAlgorithmTypeChange,
  startNodeId,
  onStartNodeChange,
  steps,
  currentStepIndex,
  isPlaying,
  playSpeed,
  onStart,
  onStepForward,
  onStepBackward,
  onPlayPause,
  onReset,
  onSpeedChange,
  isActive,
}: AlgorithmPanelProps) {
  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length
    ? steps[currentStepIndex]
    : null;

  const sortedNodes = [...nodes].sort((a, b) => {
    const numA = parseInt(a.id, 10);
    const numB = parseInt(b.id, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.id.localeCompare(b.id);
  });

  const isComplete = isActive && currentStepIndex >= steps.length - 1;

  return (
    <div className="algo-panel">
      {/* Left: Controls */}
      <div className="algo-controls">
        <div className="algo-controls-top">
          {/* Algorithm Selector */}
          <div className="algo-control-group">
            <label className="algo-label">Algorithm</label>
            <div className="algo-toggle-group">
              <button
                onClick={() => onAlgorithmTypeChange('bfs')}
                disabled={isActive}
                className={`algo-toggle-btn ${algorithmType === 'bfs' ? 'algo-toggle-active' : ''}`}
              >
                BFS
              </button>
              <button
                onClick={() => onAlgorithmTypeChange('dfs')}
                disabled={isActive}
                className={`algo-toggle-btn ${algorithmType === 'dfs' ? 'algo-toggle-active' : ''}`}
              >
                DFS
              </button>
            </div>
          </div>

          {/* Start Node */}
          <div className="algo-control-group">
            <label className="algo-label">Start Node</label>
            <select
              value={startNodeId || ''}
              onChange={(e) => onStartNodeChange(e.target.value)}
              disabled={isActive}
              className="algo-select"
            >
              {sortedNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  Node {n.id}
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div className="algo-control-group">
            <label className="algo-label">
              Speed: {Math.round((2200 - playSpeed) / 200)}×
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={Math.round((2200 - playSpeed) / 200)}
              onChange={(e) => onSpeedChange(2200 - Number(e.target.value) * 200)}
              className="algo-slider"
            />
          </div>
        </div>

        {/* Playback Controls */}
        <div className="algo-playback">
          {!isActive ? (
            <button onClick={onStart} className="algo-start-btn" disabled={nodes.length === 0}>
              <Zap size={16} />
              Run {algorithmType.toUpperCase()}
            </button>
          ) : isComplete ? (
            <button onClick={onReset} className="algo-start-btn">
              <SkipBack size={16} />
              Reset
            </button>
          ) : (
            <>
              <button
                onClick={onReset}
                className="algo-play-btn"
                title="Reset"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={onStepBackward}
                className="algo-play-btn"
                disabled={currentStepIndex <= 0}
                title="Step Backward"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={onPlayPause}
                className="algo-play-btn algo-play-btn-primary"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={onStepForward}
                className="algo-play-btn"
                disabled={currentStepIndex >= steps.length - 1}
                title="Step Forward"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Step Counter */}
        {isActive && (
          <div className="algo-step-counter">
            Step {currentStepIndex + 1} / {steps.length}
          </div>
        )}
      </div>

      {/* Right: Data Structure Visualization */}
      <div className="algo-data-viz">
        {/* Queue / Stack */}
        <div className="algo-ds-section">
          <div className="algo-ds-header">
            <span className="algo-ds-title">
              {algorithmType === 'bfs' ? 'Queue' : 'Stack'}
            </span>
            {algorithmType === 'bfs' ? (
              <span className="algo-ds-hint">Front ← Back</span>
            ) : (
              <span className="algo-ds-hint">Top →</span>
            )}
          </div>
          <div className="algo-ds-container">
            {currentStep && currentStep.dataStructure.length > 0 ? (
              algorithmType === 'bfs' ? (
                // BFS Queue: front is index 0, back is last
                currentStep.dataStructure.map((nodeId, i) => (
                  <div
                    key={`${nodeId}-${i}`}
                    className={`algo-ds-box ${i === 0 ? 'algo-ds-box-front' : ''}`}
                  >
                    {nodeId}
                  </div>
                ))
              ) : (
                // DFS Stack: top is last index, display reversed so top is leftmost
                [...currentStep.dataStructure].reverse().map((nodeId, i) => (
                  <div
                    key={`${nodeId}-${i}`}
                    className={`algo-ds-box ${i === 0 ? 'algo-ds-box-front' : ''}`}
                  >
                    {nodeId}
                  </div>
                ))
              )
            ) : (
              <div className="algo-ds-empty">
                {isActive ? 'Empty' : '—'}
              </div>
            )}
          </div>
        </div>

        {/* Traversal Order */}
        <div className="algo-ds-section">
          <div className="algo-ds-header">
            <span className="algo-ds-title">Traversal Order</span>
          </div>
          <div className="algo-ds-container">
            {currentStep && currentStep.traversalOrder.length > 0 ? (
              currentStep.traversalOrder.map((nodeId, i) => (
                <div key={`trav-${nodeId}-${i}`} className="algo-ds-box algo-ds-box-visited">
                  {i > 0 && <span className="algo-ds-arrow">→</span>}
                  {nodeId}
                </div>
              ))
            ) : (
              <div className="algo-ds-empty">
                {isActive ? 'No nodes visited yet' : '—'}
              </div>
            )}
          </div>
        </div>

        {/* Step Description */}
        {currentStep && (
          <div className="algo-description">
            {currentStep.description}
          </div>
        )}
      </div>
    </div>
  );
}
