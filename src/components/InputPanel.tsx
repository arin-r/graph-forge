import { Play } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { Mode } from '../types/graph';

interface InputPanelProps {
  inputText: string;
  onInputChange: (val: string) => void;
  format: 'list' | 'matrix';
  onFormatChange: (val: 'list' | 'matrix') => void;
  directed: boolean;
  onDirectedChange: (val: boolean) => void;
  mode: Mode;
  onModeChange: (val: Mode) => void;
  onRender: () => void;
  error: string | null;
}

export function InputPanel({
  inputText,
  onInputChange,
  format,
  onFormatChange,
  directed,
  onDirectedChange,
  mode,
  onModeChange,
  onRender,
  error
}: InputPanelProps) {
  return (
    <div className="w-full h-full flex flex-col p-6 bg-slate-900 border-r border-slate-700 shadow-xl overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-emerald-400">Graph Visualizer</h1>
      
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300">Format</label>
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => onFormatChange('list')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${format === 'list' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Adjacency List
            </button>
            <button
              onClick={() => onFormatChange('matrix')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${format === 'matrix' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Adjacency Matrix
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300">Graph Type</label>
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => onDirectedChange(true)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${directed ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Directed
            </button>
            <button
              onClick={() => onDirectedChange(false)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${!directed ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Undirected
            </button>
          </div>
        </div>

        <ModeToggle mode={mode} onModeChange={onModeChange} />

        <div className="flex flex-col gap-2 flex-1 min-h-[250px]">
          <label className="text-sm font-semibold text-slate-300">Graph Input</label>
          <textarea
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-none"
            placeholder={format === 'list' ? '1: 2 3\n2: 3\n3: 1' : '0 1 1\n0 0 1\n1 0 0'}
          />
        </div>
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onRender}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Play size={18} className="fill-current" />
            Render Graph
          </button>
        </div>
      </div>
    </div>
  );
}
