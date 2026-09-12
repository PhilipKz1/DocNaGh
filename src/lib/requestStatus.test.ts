import { describe, expect, it } from "vitest";
import { recomputeRequestStatus } from "./requestStatus";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Minimal stand-in for the two query shapes recomputeRequestStatus actually
 * uses (requests.select().eq().single(), request_documents.select().eq(),
 * requests.update().eq()) - not a general Supabase mock.
 */
function fakeSupabase(opts: { currentStatus: string; docStatuses: string[] }) {
  const updates: Record<string, unknown>[] = [];

  const supabase = {
    from(table: string) {
      if (table === "requests") {
        return {
          select() {
            return { eq: () => ({ single: async () => ({ data: { status: opts.currentStatus } }) }) };
          },
          update(payload: Record<string, unknown>) {
            updates.push(payload);
            return { eq: async () => ({ data: null, error: null }) };
          },
        };
      }
      if (table === "request_documents") {
        return {
          select() {
            return { eq: async () => ({ data: opts.docStatuses.map((status) => ({ status })) }) };
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  };

  return { supabase: supabase as unknown as SupabaseClient<Database>, updates };
}

describe("recomputeRequestStatus", () => {
  it("marks under_review once every document is uploaded", async () => {
    const { supabase, updates } = fakeSupabase({
      currentStatus: "pending",
      docStatuses: ["uploaded", "uploaded"],
    });
    const result = await recomputeRequestStatus(supabase, "req-1");
    expect(result).toBe("under_review");
    expect(updates).toEqual([{ status: "under_review" }]);
  });

  it("marks partially_received when only some documents are uploaded", async () => {
    const { supabase } = fakeSupabase({
      currentStatus: "pending",
      docStatuses: ["uploaded", "requested"],
    });
    expect(await recomputeRequestStatus(supabase, "req-1")).toBe("partially_received");
  });

  it("stays pending when nothing has been uploaded yet", async () => {
    const { supabase } = fakeSupabase({ currentStatus: "pending", docStatuses: ["requested"] });
    expect(await recomputeRequestStatus(supabase, "req-1")).toBe("pending");
  });

  it("treats a request with no documents as pending, not under_review", async () => {
    const { supabase } = fakeSupabase({ currentStatus: "pending", docStatuses: [] });
    expect(await recomputeRequestStatus(supabase, "req-1")).toBe("pending");
  });

  it("never resurrects a cancelled request, even if a document still shows uploaded", async () => {
    const { supabase, updates } = fakeSupabase({
      currentStatus: "cancelled",
      docStatuses: ["uploaded", "uploaded"],
    });
    const result = await recomputeRequestStatus(supabase, "req-1");
    expect(result).toBe("cancelled");
    expect(updates).toEqual([]); // must not write a new status over a cancelled request
  });
});
