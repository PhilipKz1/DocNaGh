import Link from "next/link";
import { requireProvider } from "@/lib/adminAuth";
import { AppHeader } from "@/components/AppHeader";
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

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader homeHref="/dashboard" reviewCount={counts.under_review} />
      <div className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Document requests</h1>
            <InfoTooltip text="Each request sends a patient a secure link to upload files from their phone. Click a row to see progress, download files, or follow up." />
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/requests/new"
              className="rounded-md bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              New request
            </Link>
            {provider.role === "admin" && (
              <Link
                href="/dashboard/team"
                className="rounded text-sm text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              >
                Team
              </Link>
            )}
            <Link
              href="/account"
              className="rounded text-sm text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              Account
            </Link>
          </div>
        </div>

        <OnboardingTip />

        {counts.expiringSoon > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <span aria-hidden>⏱</span>
            {counts.expiringSoon} link{counts.expiringSoon > 1 ? "s expire" : " expires"} within
            48 hours — follow up before {counts.expiringSoon > 1 ? "they" : "it"} go{counts.expiringSoon > 1 ? "" : "es"} dead.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
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
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            />
          </form>
        </div>

        {visible.length === 0 && (
          <p className="text-sm text-slate-500">
            {all.length === 0 ? "No requests yet. Create one to get started." : "No requests match this filter."}
          </p>
        )}

        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
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
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium">{request.patient_display_name}</p>
                    <p className="text-xs text-slate-500">
                      Created {new Date(request.created_at).toLocaleDateString()}
                      {totalDocs > 0 && ` · ${uploadedDocs}/${totalDocs} documents received`}
                      {provider.role === "admin" &&
                        request.providers?.full_name &&
                        ` · Handled by ${request.providers.full_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
  );
}
