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
          <strong>Draft — pending legal review.</strong> This is a starting point, not a
          finished legal document. Have it reviewed by a lawyer familiar with Ghana&apos;s Data
          Protection Act, 2012 (Act 843) before relying on it for real patient data.
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
            <h2 className="font-semibold text-slate-900">Why we collect it</h2>
            <p className="mt-1">
              Solely to let a clinic request and receive documents from a patient, and to keep an
              audit trail of who sent and accessed what. We do not use this data for advertising,
              and we do not sell it.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">How long we keep it</h2>
            <p className="mt-1">
              Uploaded documents are automatically deleted a set number of days after upload (see
              the retention period configured for your clinic) in line with the data minimisation
              principle under Ghana&apos;s Data Protection Act. Account and audit-log records are
              kept only as long as needed to operate the service and meet legal obligations.
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
              token rather than a password.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Complaints</h2>
            <p className="mt-1">
              You can also lodge a complaint with Ghana&apos;s Data Protection Commission at{" "}
              <a
                href="https://dataprotection.org.gh"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:underline"
              >
                dataprotection.org.gh
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
