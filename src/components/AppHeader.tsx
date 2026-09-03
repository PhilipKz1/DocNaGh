import Link from "next/link";
import { signOut } from "@/app/actions/auth";

/** Shared header for every signed-in page: brand, optional back link, sign out. */
export function AppHeader({
  homeHref,
  backHref,
  backLabel,
  reviewCount,
}: {
  homeHref: string;
  backHref?: string;
  backLabel?: string;
  /** Requests sitting in "under_review" for this clinic - shown as a persistent, clickable indicator so it isn't only visible on the dashboard. */
  reviewCount?: number;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href={homeHref}
            className="flex items-center gap-2 rounded text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                <path d="M12 3.5 5 6v5.5c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-2.5Z" strokeLinejoin="round" />
              </svg>
            </span>
            MedSwyft
          </Link>
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1 rounded text-sm text-slate-500 hover:text-slate-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {backLabel ?? "Back"}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!!reviewCount && (
            <Link
              href="/dashboard?status=under_review"
              className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              {reviewCount} need{reviewCount === 1 ? "s" : ""} review
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded text-sm text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
