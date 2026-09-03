export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="h-14 border-b border-slate-200 bg-white/90" />
      <div className="max-w-lg mx-auto p-6 sm:p-8 animate-pulse">
        <div className="mb-1 h-6 w-56 rounded bg-slate-200" />
        <div className="mb-6 h-4 w-full max-w-sm rounded bg-slate-100" />
        <div className="h-96 rounded-lg border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
