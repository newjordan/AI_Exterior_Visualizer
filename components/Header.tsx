interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
  aiReady: boolean;
}

export const Header = ({ onReset, showReset, aiReady }: HeaderProps) => {
  return (
    <header className="border-b border-slate-700/80 bg-slate-950/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-2xl">
            AI Exterior <span className="text-blue-300">Visualizer</span>
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              aiReady ? 'bg-emerald-950 text-emerald-200 ring-1 ring-emerald-700' : 'bg-slate-800 text-slate-200 ring-1 ring-slate-600'
            }`}
          >
            {aiReady ? 'AI ready' : 'Preview'}
          </span>
        </div>
        {showReset && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 sm:px-4"
          >
            Start over
          </button>
        )}
      </div>
    </header>
  );
};
