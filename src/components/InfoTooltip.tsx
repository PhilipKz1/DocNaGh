"use client";

import { useState } from "react";

/**
 * Visible tooltip trigger - a small (?) icon rather than a bare `title`
 * attribute, which has no visual affordance (nothing signals it's there),
 * only shows on desktop hover after a delay, and doesn't work at all on a
 * touchscreen. This shows on hover, keyboard focus, or tap.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        aria-label="More information"
        aria-expanded={open}
        className="grid h-4 w-4 place-items-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-teal-500 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-600 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
