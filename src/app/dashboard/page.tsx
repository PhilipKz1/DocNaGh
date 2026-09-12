import Link from "next/link";
import { requireProvider } from "@/lib/adminAuth";
import { AppShell, type NavItem } from "@/components/AppShell";
import { OnboardingTip } from "./OnboardingTip";
import { InfoTooltip } from "@/components/InfoTooltip";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "Waiting on patient", className: "bg-slate-100 text-slate-700" },
  partially_received: { label: "Partially received", className: "bg-amber-100 text-amber-800" },
  under_review: { label: "Under review", className: "bg-blue-100 text-blue-800" },
  complete: { label: "Complete", className: "bg-emerald-100 text-emerald-800" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-500" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

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
    { key: "under_review", label: "Under review", count: counts.under_review },
    { key: "partially_received", label: "Partially received", count: counts.partially_received },
    { key: "pending", label: "Waiting on patient", count: counts.pending },
  ];

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "grid" },
    ...(provider.role === "admin"
      ? [{ href: "/dashboard/team", label: "Team", icon: "team" as const }]
      : []),
    { href: "/account", label: "Account", icon: "account" },
  ];

  const firstName = provider.full_name.split(" ")[0];

  const statTiles: { label: string; value: number; accent: string }[] = [
    { label: "Waiting on patient", value: counts.pending, accent: "text-slate-700" },
    { label: "Partially received", value: counts.partially_received, accent: "text-amber-700" },
    { label: "Under review", value: counts.under_review, accent: "text-blue-700" },
    { label: "Expiring soon", value: counts.expiringSoon, accent: "text-red-600" },
  ];

  return (
    <AppShell navItems={navItems} reviewCount={counts.under_review}>
      <div className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Good day, {firstName}!</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              Here&apos;s what your document requests look like today.
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
          {statTiles.map((tile) => (
            <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{tile.label}</p>
              <p className={`mt-1.5 text-2xl font-semibold ${tile.accent}`}>{tile.value}</p>
            </div>
          ))}
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
              const status = STATUS_STYLE[request.status] ?? {
                label: request.status,
                className: "bg-slate-100 text-slate-700",
              };
              const totalDocs = request.request_documents?.length ?? 0;
              const uploadedDocs =
                request.request_documents?.filter((d) => d.status === "uploaded").length ?? 0;
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
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                        {request.patient_display_name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{request.patient_display_name}</p>
                        <p className="text-xs text-slate-500">
                          Created {new Date(request.created_at).toLocaleDateString()}
                          {totalDocs > 0 && ` · ${uploadedDocs}/${totalDocs} documents received`}
                          {provider.role === "admin" &&
                            request.providers?.full_name &&
                            ` · Handled by ${request.providers.full_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {expiringSoon && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          Expiring soon
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
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
