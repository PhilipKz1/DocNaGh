import type { ReactNode } from "react";
import { GhanaIcon } from "@/components/GhanaIcon";
import { SiteFooter } from "@/components/SiteFooter";

const steps = [
  {
    number: "01",
    title: "Provider creates a request",
    description:
      "From the dashboard, list the documents you need from a patient — ID, referral letter, lab results, whatever the visit requires.",
  },
  {
    number: "02",
    title: "Patient gets a secure link",
    description:
      "A one-time link and QR code are generated instantly. Share it by WhatsApp, email, or text, or let the patient scan it on their own phone — no account needed.",
  },
  {
    number: "03",
    title: "Patient uploads from their phone",
    description:
      "The patient opens the link, sees exactly what's requested, and uploads photos or files straight from their device. No app install.",
  },
  {
    number: "04",
    title: "Provider reviews and confirms",
    description:
      "Uploads appear against the request live, no refreshing needed. Once everything's in, you review it and confirm it's complete — or ask for more if something's missing.",
  },
];

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" stroke="currentColor" className="h-5 w-5">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" stroke="currentColor" className="h-5 w-5">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" stroke="currentColor" className="h-5 w-5">
      <path d="M12 3.5 5 6v5.5c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" stroke="currentColor" className="h-5 w-5">
      <rect x="6" y="4.5" width="12" height="16" rx="2" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" />
      <path d="M9 11h6M9 15h6" strokeLinecap="round" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" stroke="currentColor" className="h-5 w-5">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" strokeLinecap="round" />
    </svg>
  );
}

const features: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "No app install for patients",
    description:
      "Everything happens in the phone's browser through a single secure link — nothing to download, nothing to log into.",
    icon: <IconPhone />,
  },
  {
    title: "Share it however works",
    description:
      "QR code, direct link, email, or WhatsApp — send the same secure link whichever way is easiest for that patient.",
    icon: <IconShare />,
  },
  {
    title: "Access-token security",
    description:
      "Each link is an unguessable, single-purpose token with an expiry. Patients never get a password, and links stop working once they lapse.",
    icon: <IconLock />,
  },
  {
    title: "Clinic-scoped by default",
    description:
      "Providers only ever see their own clinic's patients, requests, and documents, enforced at the database level.",
    icon: <IconShield />,
  },
  {
    title: "Full audit trail",
    description:
      "Every request, upload, and download is logged, so there's a record of who sent and received what, and when.",
    icon: <IconClipboard />,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0a0f14] dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#0a0f14]/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                <path d="M12 3.5 5 6v5.5c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-2.5Z" strokeLinejoin="round" />
              </svg>
            </span>
            MedSwyft
          </span>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-500">
              Now onboarding clinics in Ghana
            </span>
            <a
              href="/login"
              className="rounded-md bg-teal-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
            >
              Log in
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.teal.100),transparent)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.teal.900/0.25),transparent)]"
          />
          <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-600/20 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              <GhanaIcon className="h-3.5 w-3.5" />
              Built for clinics in Ghana
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
              Get documents from patients{" "}
              <span className="text-teal-600 dark:text-teal-400">
                without chasing them down
              </span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-slate-500 dark:text-slate-400 text-balance">
              Send a secure link, patients upload from their own phone, and
              everything you need lands in your dashboard — no printed forms,
              no messy email attachments, no app for patients to install.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:info@medswyft.com?subject=Interested%20in%20MedSwyft%20for%20our%20clinic"
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                Get in touch
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log in
              </a>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Collecting patient paperwork shouldn&apos;t be this hard
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                Referral letters, lab results, ID copies — clinics spend hours
                on phone calls, printed forms, and email attachments just to
                collect documents patients already have on their phones.
                MedSwyft replaces that back-and-forth
                with one secure link.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              How it works
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              From request to received documents in four steps.
            </p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600/10 text-sm font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* See it in action */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center">
            <h2 className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight">
              See it in action
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              A simplified look at the real dashboard and patient upload page.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-start">
            {/* Provider dashboard mockup */}
            <div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                  <span className="ml-3 truncate rounded bg-white px-2 py-0.5 text-[11px] text-slate-400 dark:bg-white/5 dark:text-slate-500">
                    app.example.com/dashboard
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Requests</span>
                    <span className="rounded-md bg-teal-600 px-2.5 py-1 text-[11px] font-medium text-white">
                      New request
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {[
                      { name: "Ama Boateng", status: "Complete", tone: "green" },
                      { name: "Kwame Asante", status: "Under review", tone: "blue" },
                      { name: "Efua Mensah", status: "Waiting on patient", tone: "slate" },
                    ].map((row) => (
                      <li
                        key={row.name}
                        className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 dark:border-white/5"
                      >
                        <span className="text-xs font-medium">{row.name}</span>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (row.tone === "green"
                              ? "bg-green-100 text-green-700"
                              : row.tone === "blue"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500")
                          }
                        >
                          {row.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                Provider dashboard — track every request at a glance
              </p>
            </div>

            {/* Patient upload-complete mockup */}
            <div className="flex flex-col items-center">
              <div className="w-56 overflow-hidden rounded-[2rem] border-4 border-slate-800 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0a0f14]">
                <div className="flex justify-center bg-slate-800 py-1.5 dark:bg-slate-700">
                  <span className="h-1.5 w-16 rounded-full bg-slate-600 dark:bg-slate-500" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold">Document request</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    For Ama Boateng
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {["Referral letter", "Lab results", "ID copy"].map((label) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5 dark:border-white/5"
                      >
                        <span className="text-[11px]">{label}</span>
                        <span className="text-[11px] text-green-600 dark:text-green-400">
                          ✓
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-2.5 text-center text-[11px] text-green-800 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300">
                    All requested documents have been submitted. You can
                    close this page.
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                Patient view — confirmation after upload
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Built for clinics, not IT departments
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to stop chasing paperwork?
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            We&apos;re onboarding clinics in Ghana now.
          </p>
          <div className="mt-7">
            <a
              href="mailto:info@medswyft.com?subject=Interested%20in%20MedSwyft%20for%20our%20clinic"
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 hover:bg-teal-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Get in touch
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
