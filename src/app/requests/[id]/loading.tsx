export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="h-14 border-b border-slate-200 bg-white/90" />
      <div className="max-w-2xl mx-auto p-6 sm:p-8 space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-40 rounded-lg border border-slate-200 bg-white" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-16 rounded-lg border border-slate-200 bg-white" />
          <div className="h-16 rounded-lg border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
