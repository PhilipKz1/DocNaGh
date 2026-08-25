import { createServiceRoleClient } from "@/lib/supabase/server";
import { SupabaseDocumentStorageService } from "@/lib/storage/SupabaseDocumentStorageService";
import type { DocumentStorageService } from "@/lib/storage/DocumentStorageService";

export type { DocumentStorageService } from "@/lib/storage/DocumentStorageService";

/** Server-only factory. Swap the implementation here to migrate storage providers. */
export function getDocumentStorageService(): DocumentStorageService {
  return new SupabaseDocumentStorageService(createServiceRoleClient());
}
