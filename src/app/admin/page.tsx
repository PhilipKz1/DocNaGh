import { requirePlatformAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { CreateClinicForm } from "./CreateClinicForm";
import { DeleteClinicButton } from "./DeleteClinicButton";

export default async function AdminPage() {
  await requirePlatformAdmin();

  const supabase = createServiceRoleClient();
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, created_at, providers(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0a0f14] dark:text-slate-100">
      <div className="max-w-2xl mx-auto p-8 space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Platform admin</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded text-sm text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:text-slate-400"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clinics</h2>
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {clinics?.map((clinic) => (
              <li key={clinic.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium">{clinic.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {clinic.providers.length} provider(s)
                  </span>
                </div>
                <DeleteClinicButton clinicId={clinic.id} clinicName={clinic.name} />
              </li>
            ))}
            {(!clinics || clinics.length === 0) && (
              <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                No clinics yet.
              </li>
            )}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">New clinic</h2>
          <CreateClinicForm />
        </section>
      </div>
    </div>
  );
}
