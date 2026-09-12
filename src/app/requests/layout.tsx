import { requireProvider } from "@/lib/adminAuth";
import { getUnderReviewCount } from "@/lib/dashboardCounts";
import { AppShell, type NavItem } from "@/components/AppShell";

export default async function RequestsLayout({ children }: { children: React.ReactNode }) {
  const { supabase, provider } = await requireProvider();
  const reviewCount = await getUnderReviewCount(supabase);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "grid" },
    ...(provider.role === "admin"
      ? [{ href: "/dashboard/team", label: "Team", icon: "team" as const }]
      : []),
    { href: "/account", label: "Account", icon: "account" },
  ];

  return (
    <AppShell navItems={navItems} reviewCount={reviewCount}>
      {children}
    </AppShell>
  );
}
