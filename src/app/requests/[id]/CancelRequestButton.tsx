"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelRequest } from "@/app/actions/requests";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setPending(true);
    setError(null);
    const result = await cancelRequest(requestId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Cancel request
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
      <p className="text-xs text-red-800">
        This immediately revokes the patient&apos;s link and QR code. This
        can&apos;t be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={pending}
          className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
        >
          {pending ? "Cancelling..." : "Yes, cancel this request"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-sm text-gray-500 hover:underline"
        >
          Keep it
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
