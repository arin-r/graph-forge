'use client';

import { useState } from 'react';
import { ChevronDown, Play, Square, RotateCcw } from 'lucide-react';
import { ForceParams, DEFAULT_FORCE_PARAMS } from '../lib/forceSimulation';

interface ForceLayoutPanelProps {
  params: ForceParams;
  onParamsChange: (params: ForceParams) => void;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean; // true when algorithm mode is active
  temperature: number; // current system kinetic energy
}

export function ForceLayoutPanel({
  params,
  onParamsChange,
  isActive,
  onStart,
  onStop,
  disabled,
  temperature,
}: ForceLayoutPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleSlider = (key: keyof ForceParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  const handleReset = () => {
    onParamsChange({ ...DEFAULT_FORCE_PARAMS });
  };

  return (
    <div className={`force-panel ${disabled ? 'force-panel-disabled' : ''}`}>
      <button
        className="force-panel-header"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        <span className="force-panel-title">Layout Physics</span>
        <ChevronDown
          size={16}
          className={`force-panel-chevron ${collapsed ? '' : 'force-panel-chevron-open'}`}
        />
      </button>

      {!collapsed && (
        <div className="force-panel-body">
          {/* Node Repulsion */}
          <div className="force-slider-group">
            <div className="force-slider-header">
              <label className="force-slider-label">Node Repulsion</label>
              <span className="force-slider-value">{params.repulsion}</span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={params.repulsion}
              onChange={(e) => handleSlider('repulsion', Number(e.target.value))}
              disabled={disabled}
              className="force-slider"
            />
            <div className="force-slider-range-labels">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>

          {/* Edge Stiffness / Link Distance */}
          <div className="force-slider-group">
            <div className="force-slider-header">
              <label className="force-slider-label">Edge Stiffness</label>
              <span className="force-slider-value">{params.linkDistance}px</span>
            </div>
            <input
              type="range"
              min={30}
              max={500}
              step={5}
              value={params.linkDistance}
              onChange={(e) => handleSlider('linkDistance', Number(e.target.value))}
              disabled={disabled}
              className="force-slider"
            />
            <div className="force-slider-range-labels">
              <span>Short / Tight</span>
              <span>Long / Loose</span>
            </div>
          </div>

          {/* Central Gravity */}
          <div className="force-slider-group">
            <div className="force-slider-header">
              <label className="force-slider-label">Central Gravity</label>
              <span className="force-slider-value">{params.gravity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={Math.round(params.gravity * 100)}
              onChange={(e) => handleSlider('gravity', Number(e.target.value) / 100)}
              disabled={disabled}
              className="force-slider"
            />
            <div className="force-slider-range-labels">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="force-btn-row">
            {!isActive ? (
              <button
                className="force-btn force-btn-start"
                onClick={onStart}
                disabled={disabled}
              >
                <Play size={14} />
                Apply Forces
              </button>
            ) : (
              <button
                className="force-btn force-btn-stop"
                onClick={onStop}
                disabled={disabled}
              >
                <Square size={14} />
                Stop
              </button>
            )}
            <button
              className="force-btn force-btn-reset"
              onClick={handleReset}
              disabled={disabled}
              title="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {isActive && (
            <div className="force-status">
              <span className="force-status-dot" />
              Simulation running
            </div>
          )}

          {/* System Temperature Indicator */}
          {isActive && (
            <div className="force-temp-group">
              <div className="force-temp-header">
                <span className="force-slider-label">System Temperature</span>
                <span className={`force-temp-badge ${
                  temperature < 0.5 ? 'force-temp-cool' :
                  temperature < 5 ? 'force-temp-warm' :
                  temperature < 30 ? 'force-temp-hot' : 'force-temp-blazing'
                }`}>
                  {temperature < 0.5 ? 'Stable' :
                   temperature < 5 ? 'Settling' :
                   temperature < 30 ? 'Active' : 'Turbulent'}
                </span>
              </div>
              <div className="force-temp-track">
                <div
                  className="force-temp-fill"
                  style={{ width: `${Math.min(100, (Math.log(temperature + 1) / Math.log(100)) * 100)}%` }}
                />
              </div>
              <div className="force-temp-value">
                KE: {temperature.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
