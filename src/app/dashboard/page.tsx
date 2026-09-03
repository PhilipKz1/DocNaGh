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

export default async function DashboardPage() {
  const { supabase, provider } = await requireProvider();
  const { data: requests } = await supabase
    .from("requests")
    .select("id, patient_display_name, status, created_at, expires_at, providers(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader homeHref="/dashboard" />
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

        {(!requests || requests.length === 0) && (
          <p className="text-sm text-slate-500">No requests yet. Create one to get started.</p>
        )}

        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {requests?.map((request) => {
            const status = STATUS_STYLE[request.status] ?? {
              label: request.status,
              className: "bg-slate-100 text-slate-700",
            };
            return (
              <li key={request.id}>
                <Link
                  href={`/requests/${request.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium">{request.patient_display_name}</p>
                    <p className="text-xs text-slate-500">
                      Created {new Date(request.created_at).toLocaleDateString()}
                      {provider.role === "admin" &&
                        request.providers?.full_name &&
                        ` · Handled by ${request.providers.full_name}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
