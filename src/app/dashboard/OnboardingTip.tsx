"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "medswyft:dashboard-tip-seen";

/**
 * One-time reminder for first-time logins: how to create a request, and
 * that if what a patient sends back isn't enough, more can be requested
 * from that request's page. Auto-dismisses after 5s, or on click; only
 * ever shown once per browser via localStorage.
 */
export function OnboardingTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      // Private browsing / storage blocked - just don't show the tip.
    }
    if (!seen) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Nothing to persist to - it'll just show again next visit.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-4 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200"
    >
      <p>
        <strong>Tip:</strong> Use &quot;New request&quot; to ask a patient for documents by name
        and type. If what comes back isn&apos;t enough, open that request and use &quot;Request
        more documents&quot; to email them again.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="shrink-0 rounded text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:text-teal-300"
      >
        Got it
      </button>
    </div>
  );
}
