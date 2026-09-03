import Link from "next/link";

export const metadata = { title: "Terms of Use — MedSwyft" };

export default function TermsPage() {
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

        <h1 className="text-2xl font-semibold">Terms of Use</h1>
        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-5 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="font-semibold text-slate-900">The service</h2>
            <p className="mt-1">
              MedSwyft lets a registered clinic request documents from a patient and receive them
              through a secure, time-limited upload link. Only registered clinic staff have
              accounts; patients access the service only through a request-specific link and never
              need to register.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Acceptable use</h2>
            <p className="mt-1">
              Clinic accounts are for legitimate healthcare document requests only. Don&apos;t use
              real patient data outside of genuine clinical need, share your login, or attempt to
              access another clinic&apos;s data.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Responsibility for content</h2>
            <p className="mt-1">
              The clinic remains responsible for the accuracy of what it requests and for how it
              uses documents once downloaded. MedSwyft is a transport and audit layer, not a
              clinical record system of its own.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Data controller / processor</h2>
            <p className="mt-1">
              Under Ghana&apos;s Data Protection Act, 2012, your clinic is the{" "}
              <strong>data controller</strong> for the patient data you collect through MedSwyft —
              you decide what to request and why, and you&apos;re responsible for having a lawful
              basis to do so, and for registering with the Data Protection Commission. MedSwyft
              acts as a <strong>data processor</strong>, handling that data only to run the
              service on your behalf. Full detail in our{" "}
              <Link href="/privacy" className="text-teal-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Availability</h2>
            <p className="mt-1">
              We aim to keep the service available but don&apos;t guarantee uninterrupted uptime.
              Clinics should not rely on it as the sole copy of any document.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Changes</h2>
            <p className="mt-1">
              We may update these terms as the product evolves. Continued use after a change means
              you accept the updated terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
