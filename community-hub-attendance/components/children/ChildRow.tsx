'use client';

export type RowStatus = 'pending' | 'optimistic' | 'done' | 'error';

interface ChildRowProps {
  name: string;
  status: RowStatus;
  onAction: () => void;
  onRetry: () => void;
  actionLabel: string;
  doneLabel: string;
  accentColor: 'blue' | 'orange';
  errorMessage?: string;
}

export function ChildRow({
  name,
  status,
  onAction,
  onRetry,
  actionLabel,
  doneLabel,
  accentColor,
  errorMessage,
}: ChildRowProps) {
  const isDone = status === 'done' || status === 'optimistic';

  return (
    <div
      role="listitem"
      className={[
        'flex items-center justify-between gap-3 px-4',
        'min-h-[60px] rounded-xl border transition-colors duration-150',
        status === 'error'
          ? 'bg-red-50 border-red-300'
          : isDone
          ? 'bg-gray-50 border-gray-100'
          : 'bg-white border-gray-200 shadow-sm',
      ].join(' ')}
    >
      {/* Status dot + name */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={[
            'w-3 h-3 rounded-full shrink-0 transition-colors duration-150',
            status === 'error'
              ? 'bg-red-500'
              : isDone
              ? accentColor === 'blue'
                ? 'bg-blue-400'
                : 'bg-orange-400'
              : 'bg-gray-300',
          ].join(' ')}
        />
        <span
          className={[
            'text-base font-medium truncate',
            isDone ? 'text-gray-400' : 'text-gray-800',
          ].join(' ')}
        >
          {name}
        </span>
      </div>

      {/* Action area */}
      {status === 'error' ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-red-600 font-semibold hidden sm:block">
            {errorMessage ?? 'Failed'}
          </span>
          <button
            onClick={onRetry}
            className="min-w-[110px] min-h-[44px] px-4 rounded-xl text-sm font-bold
                       bg-red-600 hover:bg-red-700 text-white
                       active:scale-95 transition-transform duration-75"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          onClick={onAction}
          disabled={isDone}
          aria-label={isDone ? `${name} — ${doneLabel}` : `${actionLabel} ${name}`}
          className={[
            'shrink-0 min-w-[120px] min-h-[44px] px-5 rounded-xl text-sm font-bold',
            'active:scale-95 transition-transform duration-75',
            isDone
              ? accentColor === 'blue'
                ? 'bg-blue-100 text-blue-600 cursor-default'
                : 'bg-orange-100 text-orange-600 cursor-default'
              : accentColor === 'blue'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm',
          ].join(' ')}
        >
          {isDone ? `✓ ${doneLabel}` : actionLabel}
        </button>
      )}
    </div>
  );
}
