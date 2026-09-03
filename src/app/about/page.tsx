import Link from "next/link";

export const metadata = { title: "About Us — MedSwyft" };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Link href="/" className="text-sm text-teal-700 hover:underline">
          ← Back to home
        </Link>

        <h1 className="text-2xl font-semibold">About MedSwyft</h1>

        <div className="space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            MedSwyft is built for clinics in Ghana that spend too much time chasing patients for
            documents - referral letters, lab results, ID copies - over phone calls, printed
            forms, and scattered email attachments. We replace that back-and-forth with one
            secure link: a patient uploads straight from their phone, and it lands in the
            clinic&apos;s dashboard, tracked and auditable.
          </p>
          <p>
            We&apos;re a small team building this specifically for the realities of running a
            clinic here - unreliable connectivity, patients without smartphones&apos; worth of data to
            spare, staff who need something that works the first time without training.
          </p>

          <section>
            <h2 className="font-semibold text-slate-900">Contact</h2>
            <p className="mt-1">
              Questions, feedback, or a compliance/security question a clinic needs answered
              before onboarding -{" "}
              <a href="mailto:info@medswyft.com" className="text-teal-700 hover:underline">
                info@medswyft.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
