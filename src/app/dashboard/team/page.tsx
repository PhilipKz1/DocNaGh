import { requireClinicAdmin } from "@/lib/adminAuth";
import { getUnderReviewCount } from "@/lib/dashboardCounts";
import { AppHeader } from "@/components/AppHeader";
import { InviteProviderForm } from "./InviteProviderForm";
import { RemoveProviderButton } from "./RemoveProviderButton";
import { ResendInviteButton } from "./ResendInviteButton";

export default async function TeamPage() {
  const { supabase, provider: admin } = await requireClinicAdmin();

  const [{ data: teammates }, reviewCount] = await Promise.all([
    supabase
      .from("providers")
      .select("id, full_name, email, role")
      .eq("clinic_id", admin.clinic_id)
      .order("full_name", { ascending: true }),
    getUnderReviewCount(supabase),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader
        homeHref="/dashboard"
        backHref="/dashboard"
        backLabel="Back to dashboard"
        reviewCount={reviewCount}
      />
      <div className="max-w-2xl mx-auto p-6 sm:p-8 space-y-10">
        <h1 className="text-xl font-semibold">Team</h1>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Teammates</h2>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {teammates?.map((teammate) => (
              <li key={teammate.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{teammate.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {teammate.email} · {teammate.role}
                  </p>
                </div>
                {teammate.id !== admin.id && (
                  <div className="flex items-center gap-4">
                    <ResendInviteButton providerId={teammate.id} />
                    <RemoveProviderButton providerId={teammate.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Invite a teammate</h2>
          <InviteProviderForm />
        </section>
      </div>
    </div>
  );
}
