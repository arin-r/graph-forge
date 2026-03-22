import { Mode } from '../types/graph';
import { MousePointer2, PlusCircle, Link } from 'lucide-react';

interface ModeToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">Interaction Mode</label>
      <div className="flex bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => onModeChange('view')}
          title="View & Drag Nodes"
          className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'view' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MousePointer2 size={14} /> View
        </button>
        <button
          onClick={() => onModeChange('addNode')}
          title="Add Node"
          className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'addNode' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle size={14} /> Node
        </button>
        <button
          onClick={() => onModeChange('addEdge')}
          title="Add Edge"
          className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'addEdge' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link size={14} /> Edge
        </button>
      </div>
    </div>
  );
}
