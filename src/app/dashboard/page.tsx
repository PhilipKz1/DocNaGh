import Link from "next/link";
import { requireProvider } from "@/lib/adminAuth";
import { AppShell, type NavItem } from "@/components/AppShell";
import { OnboardingTip } from "./OnboardingTip";
import { InfoTooltip } from "@/components/InfoTooltip";

/**
 * Plain-language "what's happening / what do I do" framing instead of
 * internal workflow-state names ("partially received", "under review") -
 * a doctor shouldn't have to learn the request lifecycle to know what a row
 * needs from them. dotClassName drives the small status dot; cta is the
 * row's trailing action link text.
 */
const STATUS_PRESENTATION: Record<string, { dotClassName: string; cta: string }> = {
  pending: { dotClassName: "bg-slate-300", cta: "View" },
  partially_received: { dotClassName: "bg-amber-500", cta: "View" },
  under_review: { dotClassName: "bg-blue-600", cta: "Review" },
  complete: { dotClassName: "bg-emerald-500", cta: "View" },
  expired: { dotClassName: "bg-slate-300", cta: "View" },
  cancelled: { dotClassName: "bg-red-500", cta: "View" },
};

function nextActionText(status: string, uploadedDocs: number, totalDocs: number): string {
  const missing = totalDocs - uploadedDocs;
  switch (status) {
    case "pending":
      return "Waiting for patient";
    case "partially_received":
      return `Waiting for patient — ${missing} document${missing === 1 ? "" : "s"} missing`;
    case "under_review":
      return "Needs your review";
    case "complete":
      return "Complete";
    case "expired":
      return "Link expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

const ACTIVE_STATUSES = ["pending", "partially_received", "under_review"];
const EXPIRING_SOON_HOURS = 48;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusFilter, q } = await searchParams;
  const { supabase, provider } = await requireProvider();
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, patient_display_name, status, created_at, expires_at, providers(full_name), request_documents(status)"
    )
    .order("created_at", { ascending: false });

  const all = requests ?? [];
  const counts = {
    pending: all.filter((r) => r.status === "pending").length,
    partially_received: all.filter((r) => r.status === "partially_received").length,
    under_review: all.filter((r) => r.status === "under_review").length,
    expiringSoon: all.filter(
      (r) =>
        ACTIVE_STATUSES.includes(r.status) &&
        new Date(r.expires_at).getTime() - Date.now() < EXPIRING_SOON_HOURS * 60 * 60 * 1000 &&
        new Date(r.expires_at).getTime() > Date.now()
    ).length,
  };

  const visible = all
    .filter((r) => !statusFilter || r.status === statusFilter)
    .filter(
      (r) => !q || r.patient_display_name.toLowerCase().includes(q.toLowerCase())
    );

  const filterPills: { key: string | undefined; label: string; count?: number }[] = [
    { key: undefined, label: "All" },
    { key: "under_review", label: "Needs your review", count: counts.under_review },
    { key: "partially_received", label: "Missing documents", count: counts.partially_received },
    { key: "pending", label: "Waiting for patient", count: counts.pending },
  ];

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "grid" },
    ...(provider.role === "admin"
      ? [{ href: "/dashboard/team", label: "Team", icon: "team" as const }]
      : []),
    { href: "/account", label: "Account", icon: "account" },
  ];

  const firstName = provider.full_name.split(" ")[0];

  const statTiles: { label: string; value: number; accent: string; statusKey?: string }[] = [
    { label: "Needs your review", value: counts.under_review, accent: "text-blue-700", statusKey: "under_review" },
    { label: "Missing documents", value: counts.partially_received, accent: "text-amber-700", statusKey: "partially_received" },
    { label: "Waiting for patient", value: counts.pending, accent: "text-slate-700", statusKey: "pending" },
    { label: "Expiring soon", value: counts.expiringSoon, accent: "text-red-600" },
  ];

  return (
    <AppShell navItems={navItems} reviewCount={counts.under_review}>
      <div className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Good day, {firstName}!</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              Here&apos;s what needs your attention today.
              <InfoTooltip text="Each request sends a patient a secure link to upload files from their phone. Click a row to see progress, download files, or follow up." />
            </p>
          </div>
          <Link
            href="/requests/new"
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            + New request
          </Link>
        </div>

        <OnboardingTip />

        {counts.expiringSoon > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <span aria-hidden>⏱</span>
            {counts.expiringSoon} link{counts.expiringSoon > 1 ? "s expire" : " expires"} within
            48 hours — follow up before {counts.expiringSoon > 1 ? "they" : "it"} go{counts.expiringSoon > 1 ? "" : "es"} dead.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statTiles.map((tile) => {
            const content = (
              <>
                <p className="text-xs font-medium text-slate-500">{tile.label}</p>
                <p className={`mt-1.5 text-2xl font-semibold ${tile.accent}`}>{tile.value}</p>
              </>
            );
            const className = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left";
            return tile.statusKey ? (
              <Link
                key={tile.label}
                href={`/dashboard?status=${tile.statusKey}`}
                className={`${className} hover:border-slate-300 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600`}
              >
                {content}
              </Link>
            ) : (
              <div key={tile.label} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">Document requests</h2>
            <nav className="flex flex-wrap gap-2">
              {filterPills.map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.key ? `/dashboard?status=${pill.key}` : "/dashboard"}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    statusFilter === pill.key
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {pill.label}
                  {typeof pill.count === "number" && ` (${pill.count})`}
                </Link>
              ))}
            </nav>
            <form action="/dashboard" method="GET" className="flex items-center gap-2">
              {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search patient name…"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              />
            </form>
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">
              {all.length === 0 ? "No requests yet. Create one to get started." : "No requests match this filter."}
            </p>
          )}

          <ul className="mt-4 divide-y divide-slate-100">
            {visible.map((request) => {
              const presentation = STATUS_PRESENTATION[request.status] ?? {
                dotClassName: "bg-slate-300",
                cta: "View",
              };
              const totalDocs = request.request_documents?.length ?? 0;
              const uploadedDocs =
                request.request_documents?.filter((d) => d.status === "uploaded").length ?? 0;
              const fullyReceived = totalDocs > 0 && uploadedDocs === totalDocs;
              const expiringSoon =
                ACTIVE_STATUSES.includes(request.status) &&
                new Date(request.expires_at).getTime() - Date.now() <
                  EXPIRING_SOON_HOURS * 60 * 60 * 1000 &&
                new Date(request.expires_at).getTime() > Date.now();

              return (
                <li key={request.id}>
                  <Link
                    href={`/requests/${request.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                        {request.patient_display_name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{request.patient_display_name}</p>
                        {totalDocs > 0 && (
                          <p className="text-xs text-slate-500">
                            {fullyReceived ? "✓" : "○"} {uploadedDocs} of {totalDocs} documents received
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${presentation.dotClassName}`} />
                          {nextActionText(request.status, uploadedDocs, totalDocs)}
                          {expiringSoon && (
                            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                              Expiring soon
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs font-medium text-teal-700">
                      {presentation.cta} →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
