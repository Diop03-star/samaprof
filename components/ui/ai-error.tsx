export function AiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[16px] bg-red-500/10 border border-red-500/20 p-6 text-center my-4">
      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xl">
         ⚠️
      </div>
      <p className="font-body text-red-600 font-medium">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-secondary shadow-sm hover:bg-surface-dim transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
