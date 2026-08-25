import Link from "next/link";
import { requireProvider } from "@/lib/adminAuth";
import { signOut } from "@/app/actions/auth";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  partially_received: "Partially received",
  complete: "Complete",
  expired: "Expired",
  cancelled: "Cancelled",
};

export default async function DashboardPage() {
  const { supabase, provider } = await requireProvider();
  const { data: requests } = await supabase
    .from("requests")
    .select("id, patient_display_name, status, created_at, expires_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Document requests</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/requests/new"
            className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium"
          >
            New request
          </Link>
          {provider.role === "admin" && (
            <Link href="/dashboard/team" className="text-sm text-gray-500 hover:underline">
              Team
            </Link>
          )}
          <Link href="/account" className="text-sm text-gray-500 hover:underline">
            Account
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {(!requests || requests.length === 0) && (
        <p className="text-sm text-gray-500">No requests yet. Create one to get started.</p>
      )}

      <ul className="divide-y rounded-md border">
        {requests?.map((request) => (
          <li key={request.id}>
            <Link
              href={`/requests/${request.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium">{request.patient_display_name}</p>
                <p className="text-xs text-gray-500">
                  Created {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs rounded-full border px-2 py-1">
                {STATUS_LABEL[request.status] ?? request.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
