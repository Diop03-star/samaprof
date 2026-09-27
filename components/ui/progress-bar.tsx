export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-3 rounded-full bg-surface-dim overflow-hidden shadow-inner">
      <div 
        className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
