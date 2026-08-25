import Link from "next/link";
import { requireClinicAdmin } from "@/lib/adminAuth";
import { InviteProviderForm } from "./InviteProviderForm";
import { RemoveProviderButton } from "./RemoveProviderButton";

export default async function TeamPage() {
  const { supabase, provider: admin } = await requireClinicAdmin();

  const { data: teammates } = await supabase
    .from("providers")
    .select("id, full_name, email, role")
    .eq("clinic_id", admin.clinic_id)
    .order("full_name", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          Back to dashboard
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Teammates</h2>
        <ul className="divide-y rounded-md border">
          {teammates?.map((teammate) => (
            <li key={teammate.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{teammate.full_name}</p>
                <p className="text-xs text-gray-500">
                  {teammate.email} · {teammate.role}
                </p>
              </div>
              {teammate.id !== admin.id && <RemoveProviderButton providerId={teammate.id} />}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Invite a teammate</h2>
        <InviteProviderForm />
      </section>
    </div>
  );
}
