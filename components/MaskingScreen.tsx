import type { HouseMasks, MaskingProgress, MaskingStatus } from '../types';
import { Loader } from './Loader';

interface MaskingScreenProps {
  progress: MaskingProgress | null;
  masks: HouseMasks;
}

const labels: Record<keyof HouseMasks, string> = {
  siding: 'Siding',
  roofing: 'Roofing',
  trim: 'Trim',
  door: 'Door',
};

const StatusIndicator = ({ status }: { status: MaskingStatus }) => {
  if (status === 'generating') {
    return (
      <span className="inline-flex items-center gap-2 text-slate-200">
        <Loader size="sm" />
        <span>Analyzing</span>
      </span>
    );
  }
  if (status === 'complete') {
    return <span className="font-medium text-emerald-300">Done</span>;
  }
  if (status === 'error') {
    return <span className="font-medium text-red-300">Failed</span>;
  }
  return <span className="text-slate-300">Waiting</span>;
};

export const MaskingScreen = ({ progress, masks }: MaskingScreenProps) => {
  const elements: (keyof HouseMasks)[] = ['siding', 'roofing', 'trim', 'door'];
  const active = elements.find((element) => progress?.[element] === 'generating');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl sm:p-8" aria-labelledby="analysis-title">
        <div className="mb-6 flex justify-center">
          <Loader size="lg" />
        </div>
        <h2 id="analysis-title" className="text-center text-3xl font-semibold text-slate-50">
          Analyzing the house
        </h2>
        <p className="mt-2 text-center text-slate-300" role="status">
          {active ? `Looking at the ${active}.` : 'Preparing a mask for each exterior surface.'} This can take a minute.
        </p>

        <ul className="mt-8 space-y-3">
          {elements.map((element) => {
            const status = progress?.[element] ?? 'pending';
            return (
              <li key={element} className="flex items-center justify-between gap-4 rounded-xl bg-slate-800/80 px-4 py-3">
                <span className="font-medium text-slate-100">{labels[element]}</span>
                <span className="flex items-center gap-3">
                  {status === 'complete' && masks[element] && (
                    <img
                      src={`data:image/png;base64,${masks[element]}`}
                      alt=""
                      className="h-12 w-12 rounded-md border border-slate-600 bg-white object-contain p-1"
                    />
                  )}
                  <StatusIndicator status={status} />
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
