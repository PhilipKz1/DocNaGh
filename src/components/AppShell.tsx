"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/actions/auth";

type IconName = "grid" | "team" | "account" | "clinics";

const ICONS: Record<IconName, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.3.4 4 2.3 4 5.3" strokeLinecap="round" />
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" strokeLinecap="round" />
    </svg>
  ),
  clinics: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
      <path d="M4 21V8l8-4.5L20 8v13" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" strokeLinejoin="round" />
    </svg>
  ),
};

const BrandMark = ({ className }: { className: string }) => (
  <span className={`grid place-items-center rounded-lg bg-teal-600 text-white ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
      <path d="M12 3.5 5 6v5.5c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-2.5Z" strokeLinejoin="round" />
    </svg>
  </span>
);

export type NavItem = { href: string; label: string; icon: IconName };

/**
 * Sidebar shell shared by every signed-in page (provider dashboard, team,
 * account, request flows, platform admin). Replaces the old top-bar
 * AppHeader with a persistent left nav so moving between sections doesn't
 * reset your bearings - active state is highlighted via the current path.
 */
export function AppShell({
  children,
  navItems,
  reviewCount,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  /** Requests sitting in "under_review" - shown as a badge on the Overview nav item. */
  reviewCount?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && href !== "/harbor" && pathname.startsWith(`${href}/`));

  const sidebarBody = (
    <>
      <Link
        href={navItems[0]?.href ?? "/dashboard"}
        className="flex items-center gap-2.5 px-5 py-5 text-[15px] font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <BrandMark className="h-8 w-8" />
        MedSwyft
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
                active ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {ICONS[item.icon]}
              {item.label}
              {item.label === "Overview" && !!reviewCount && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {reviewCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <form action={signOut} className="px-3 pb-5 pt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
            <path d="M15.5 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7.5a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 12H10m10 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </button>
      </form>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 md:flex">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link href={navItems[0]?.href ?? "/dashboard"} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <BrandMark className="h-7 w-7" />
          MedSwyft
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {sidebarBody}
          </div>
        </div>
      )}

      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white">
        {sidebarBody}
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
