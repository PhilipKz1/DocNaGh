export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="h-14 border-b border-slate-200 bg-white/90" />
      <div className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="h-9 w-full max-w-md rounded bg-slate-100" />
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-3 w-56 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
