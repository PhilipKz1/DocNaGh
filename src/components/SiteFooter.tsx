import Link from "next/link";
import { GhanaIcon } from "./GhanaIcon";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <GhanaIcon className="h-4 w-4 text-teal-600/60" />
          MedSwyft — built for clinics in Ghana.
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <Link href="/privacy" className="rounded hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600">
            Privacy policy
          </Link>
          <Link href="/terms" className="rounded hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600">
            Terms of use
          </Link>
          <Link href="/cookies" className="rounded hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600">
            Cookie notice
          </Link>
        </nav>
      </div>
    </footer>
  );
}
