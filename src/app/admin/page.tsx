import { requirePlatformAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { CreateClinicForm } from "./CreateClinicForm";

export default async function AdminPage() {
  await requirePlatformAdmin();

  const supabase = createServiceRoleClient();
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, created_at, providers(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Platform admin</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:underline">
            Sign out
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Clinics</h2>
        <ul className="divide-y rounded-md border">
          {clinics?.map((clinic) => (
            <li key={clinic.id} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{clinic.name}</span>
              <span className="text-xs text-gray-500">{clinic.providers.length} provider(s)</span>
            </li>
          ))}
          {(!clinics || clinics.length === 0) && (
            <li className="px-4 py-3 text-sm text-gray-500">No clinics yet.</li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">New clinic</h2>
        <CreateClinicForm />
      </section>
    </div>
  );
}
