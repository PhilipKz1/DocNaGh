"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeProvider } from "./actions";

export function RemoveProviderButton({ providerId }: { providerId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    if (!confirm("Remove this teammate's access?")) return;
    setPending(true);
    setError(null);
    const result = await removeProvider(providerId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        onClick={handleRemove}
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing..." : "Remove"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
