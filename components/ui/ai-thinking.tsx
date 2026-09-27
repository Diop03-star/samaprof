export function AiThinking({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3"
    >
      <span className="h-2 w-2 animate-ping rounded-full bg-indigo-400" />
      <span className="text-sm text-indigo-200">{label}</span>
    </div>
  );
}
