import { Play, Upload, Sun, Moon } from 'lucide-react';
import { useRef } from 'react';
import { ModeToggle } from './ModeToggle';
import { Mode } from '../types/graph';
import { DEFAULT_LIST_INPUT, DEFAULT_MATRIX_INPUT } from '../lib/constants';

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
  theme: 'light' | 'dark';
  onThemeChange: (val: 'light' | 'dark') => void;
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
  error,
  theme,
  onThemeChange
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onInputChange(text);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Graph Visualizer</h1>
        <button
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Format</label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => onFormatChange('list')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${format === 'list' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Adjacency List
            </button>
            <button
              onClick={() => onFormatChange('matrix')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${format === 'matrix' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Adjacency Matrix
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Graph Type</label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => onDirectedChange(true)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${directed ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Directed
            </button>
            <button
              onClick={() => onDirectedChange(false)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${!directed ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Undirected
            </button>
          </div>
        </div>

        <ModeToggle mode={mode} onModeChange={onModeChange} />

        <div className="flex flex-col gap-2 flex-1 min-h-[250px]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Graph Input</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 px-2 py-1 rounded"
              title="Import from .txt file"
            >
              <Upload size={14} /> Import File
            </button>
            <input 
              type="file" 
              accept=".txt" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
          </div>
          <textarea
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 w-full p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-none"
            placeholder={format === 'list' ? DEFAULT_LIST_INPUT : DEFAULT_MATRIX_INPUT}
          />
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onRender}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 active:bg-emerald-800 dark:active:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Play size={18} className="fill-current" />
            Render Graph
          </button>
        </div>
      </div>
    </div>
  );
}
