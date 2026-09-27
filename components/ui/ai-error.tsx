"use client";

export function AiError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3"
    >
      <p className="text-sm text-orange-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-orange-400/50 px-3 py-1.5 text-sm text-orange-100 hover:bg-orange-500/20"
        >
          Try again
        </button>
      )}
    </div>
  );
}
