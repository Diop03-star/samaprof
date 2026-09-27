export function AiThinking({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 my-8">
      <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center relative">
         <div className="absolute inset-0 border-4 border-tertiary/30 rounded-full animate-ping" />
         <span className="text-2xl">✨</span>
      </div>
      <p className="font-label-md font-bold text-tertiary">{label}</p>
    </div>
  );
}
