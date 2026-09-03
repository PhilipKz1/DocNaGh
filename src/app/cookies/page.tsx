import Link from "next/link";

export const metadata = { title: "Cookie Notice — MedSwyft" };

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Link href="/" className="text-sm text-teal-700 hover:underline">
          ← Back to home
        </Link>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Draft — pending legal review.</strong> This is a starting point, not a
          finished legal document — have it reviewed before relying on it.
        </div>

        <h1 className="text-2xl font-semibold">Cookie Notice</h1>
        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-5 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="font-semibold text-slate-900">What we use</h2>
            <p className="mt-1">
              MedSwyft only sets <strong>strictly necessary</strong> cookies - specifically, a
              secure session cookie that keeps you signed in. Without it, the site can&apos;t tell
              you&apos;re logged in and the dashboard wouldn&apos;t work.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">What we don&apos;t use</h2>
            <p className="mt-1">
              No advertising cookies, no third-party tracking or analytics cookies. Under Ghana&apos;s
              Data Protection Act, 2012, consent is required for non-essential cookies - since we
              don&apos;t set any, there&apos;s nothing here that needs a consent banner. One small piece
              of browser storage (not a cookie) remembers whether you&apos;ve dismissed a one-time
              onboarding tip; it stays on your device and is never sent to us.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">If that changes</h2>
            <p className="mt-1">
              If we ever add analytics or other non-essential cookies, this page and the consent
              flow on the site will be updated first.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
