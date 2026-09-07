"use client";

import { useEffect } from "react";

/**
 * Catches any otherwise-uncaught client-side rendering error under this
 * app, so a bug (even one we haven't found yet) shows a recoverable page
 * instead of Next's generic blank "Application error" screen with no way
 * back. Logged to the console so it's findable via browser dev tools /
 * error reporting rather than silently swallowed.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-8">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-500">
          This page hit an unexpected error. Your request was likely still saved - try again, or
          head back to the dashboard.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
