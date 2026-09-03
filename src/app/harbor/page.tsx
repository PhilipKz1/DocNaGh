import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CreateClinicForm } from "./CreateClinicForm";
import { DeleteClinicButton } from "./DeleteClinicButton";
import { ResendInviteButton } from "./ResendInviteButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requirePlatformAdmin();

  const supabase = createServiceRoleClient();
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, created_at, providers(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader homeHref="/harbor" />
      <div className="max-w-2xl mx-auto p-6 sm:p-8 space-y-10">
        <h1 className="text-xl font-semibold">Platform admin</h1>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Clinics</h2>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {clinics?.map((clinic) => (
              <li key={clinic.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium">{clinic.name}</span>
                  <span className="block text-xs text-slate-500">
                    {clinic.providers.length} provider(s)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <ResendInviteButton clinicId={clinic.id} />
                  <DeleteClinicButton clinicId={clinic.id} clinicName={clinic.name} />
                </div>
              </li>
            ))}
            {(!clinics || clinics.length === 0) && (
              <li className="px-4 py-3 text-sm text-slate-500">No clinics yet.</li>
            )}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">New clinic</h2>
          <CreateClinicForm />
        </section>
      </div>
    </div>
  );
}
