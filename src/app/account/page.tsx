import { requireProvider } from "@/lib/adminAuth";
import { getUnderReviewCount } from "@/lib/dashboardCounts";
import { AppHeader } from "@/components/AppHeader";
import { AccountSettings } from "./AccountSettings";

export default async function AccountPage() {
  const { supabase } = await requireProvider();
  const reviewCount = await getUnderReviewCount(supabase);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader homeHref="/dashboard" backHref="/dashboard" backLabel="Back to dashboard" reviewCount={reviewCount} />
      <div className="max-w-lg mx-auto p-6 sm:p-8">
        <AccountSettings />
      </div>
    </div>
  );
}
