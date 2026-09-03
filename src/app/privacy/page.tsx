import Link from "next/link";

export const metadata = { title: "Privacy Policy — MedSwyft" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Link href="/" className="text-sm text-teal-700 hover:underline">
          ← Back to home
        </Link>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Draft — pending legal review.</strong> This reflects good-faith research into
          Ghana&apos;s Data Protection Act, 2012 (Act 843), but it is not legal advice and has not
          been reviewed by a lawyer. Have it reviewed before relying on it for real patient data,
          and see the clinic obligations section below — it likely applies to you directly.
        </div>

        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-5 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="font-semibold text-slate-900">What we collect</h2>
            <p className="mt-1">
              To operate a document request, we collect: a patient&apos;s name and, if provided,
              phone number and email; the documents a patient uploads in response to a request;
              and account details for clinic staff (name, email, role). Every action on a request
              — creation, upload, download, deletion — is logged with a timestamp for audit
              purposes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">This is &quot;special personal data&quot;</h2>
            <p className="mt-1">
              Ghana&apos;s Data Protection Act, 2012 classifies health-related information as{" "}
              <strong>special personal data</strong>, alongside categories like race, religion,
              and criminal record — it requires explicit consent or another valid legal basis
              before it can be processed. That&apos;s why the patient upload page requires an
              explicit consent step before any file can be uploaded, rather than treating a click
              on the link as consent by itself.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">Why we collect it</h2>
            <p className="mt-1">
              Solely to let a clinic request and receive documents from a patient, and to keep an
              audit trail of who sent and accessed what. We do not use this data for advertising,
              and we do not sell it.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">Where it&apos;s stored, and who processes it</h2>
            <p className="mt-1">
              MedSwyft acts as a <strong>data processor</strong> on behalf of each clinic (the{" "}
              <strong>data controller</strong> — see below). We use a small number of
              sub-processors to run the service:
            </p>
            <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Service</th>
                    <th className="px-3 py-2 font-medium">Purpose</th>
                    <th className="px-3 py-2 font-medium">Data location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2">Supabase</td>
                    <td className="px-3 py-2">Database, file storage, authentication</td>
                    <td className="px-3 py-2">EU (Ireland)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Vercel</td>
                    <td className="px-3 py-2">Application hosting</td>
                    <td className="px-3 py-2">Global edge network</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Resend</td>
                    <td className="px-3 py-2">Transactional email delivery</td>
                    <td className="px-3 py-2">United States</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              As of this writing, Ghana&apos;s 2012 Act has no data localization requirement — data
              may lawfully be processed outside Ghana. A draft 2025 Data Protection Bill under
              public consultation would introduce a <em>preference</em> for keeping personal data
              in Ghana where feasible, with stricter rules for a narrower set of highly sensitive
              categories. We&apos;re watching this and will update this policy — and evaluate
              Ghana-based hosting — if the law changes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">
              If you run a clinic: your obligations as data controller
            </h2>
            <p className="mt-1">
              Using MedSwyft doesn&apos;t change who&apos;s legally responsible for your patients&apos; data —
              that&apos;s your clinic, as the data controller, under Ghana&apos;s Data Protection Act.
              In particular:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Your clinic is required to <strong>register with Ghana&apos;s Data Protection
                Commission</strong> as a data controller within 20 days of starting to process
                personal data, and renew that registration every 2 years. Operating unregistered
                can mean a fine, up to 2 years&apos; imprisonment, or a Commission stop-order
                barring further processing. Register at{" "}
                <a
                  href="https://app.dataprotection.org.gh"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:underline"
                >
                  app.dataprotection.org.gh
                </a>{" "}
                — the Commission can also be reached at info@dpc.gov.gh.
              </li>
              <li>
                You&apos;re responsible for having a lawful basis (typically patient consent) for
                each document request you create.
              </li>
              <li>
                We&apos;re happy to provide a data processing agreement or answer a compliance
                question — reach us at{" "}
                <a href="mailto:info@medswyft.com" className="text-teal-700 hover:underline">
                  info@medswyft.com
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">How long we keep it</h2>
            <p className="mt-1">
              Uploaded documents are kept for <strong>1 year</strong> after upload, then
              automatically and permanently deleted. Ghana&apos;s Data Protection Act doesn&apos;t set a
              fixed retention limit — it requires retention to match the actual purpose data was
              collected for. That purpose here is supporting a patient&apos;s ongoing care, not just
              a one-off hand-off, which is why the window is a year rather than days. Account and
              audit-log records are kept only as long as needed to operate the service and meet
              legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">Your rights</h2>
            <p className="mt-1">
              Under the Data Protection Act, 2012, you can ask to see what data we hold about you,
              ask us to correct it, or ask us to delete it where we&apos;re not required to keep it.
              Contact your clinic directly, or reach us at{" "}
              <a href="mailto:info@medswyft.com" className="text-teal-700 hover:underline">
                info@medswyft.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">Security</h2>
            <p className="mt-1">
              Documents are stored encrypted, access is scoped so a clinic only ever sees its own
              patients&apos; data, and every patient upload link is a unique, expiring, single-purpose
              token rather than a password. If a security incident affecting your data ever
              occurs, we will notify affected clinics without undue delay.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">Complaints</h2>
            <p className="mt-1">
              You can lodge a complaint with Ghana&apos;s Data Protection Commission at{" "}
              <a
                href="https://dataprotection.org.gh"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:underline"
              >
                dataprotection.org.gh
              </a>{" "}
              or +233 25 630 1533.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
