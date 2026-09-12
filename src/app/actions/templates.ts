"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getCurrentProvider(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: provider, error } = await supabase
    .from("providers")
    .select("id, clinic_id")
    .eq("user_id", user.id)
    .single();

  if (error || !provider) throw new Error("No provider profile for this account");
  return provider;
}

/**
 * Saves the document checklist from the "new request" form as a reusable
 * template, so a clinic that requests the same bundle repeatedly (e.g. a
 * standard intake or pre-op set) doesn't retype it every time.
 */
export async function createTemplate(name: string, labels: string[]) {
  const trimmedName = name.trim();
  const trimmedLabels = labels.map((l) => l.trim()).filter(Boolean);

  if (!trimmedName) return { error: "Name the template so you can find it again." };
  if (trimmedLabels.length === 0) return { error: "Add at least one document first." };

  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  const { data: template, error: templateError } = await supabase
    .from("request_templates")
    .insert({ clinic_id: provider.clinic_id, name: trimmedName })
    .select("id")
    .single();
  if (templateError) return { error: templateError.message };

  const { error: docsError } = await supabase.from("request_template_documents").insert(
    trimmedLabels.map((label) => ({ template_id: template.id, label }))
  );
  if (docsError) return { error: docsError.message };

  revalidatePath("/requests/new");
  return { error: null };
}

/** Removes a saved template. Its document rows cascade-delete with it. */
export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  await getCurrentProvider(supabase);

  const { error } = await supabase.from("request_templates").delete().eq("id", templateId);
  if (error) return { error: error.message };

  revalidatePath("/requests/new");
  return { error: null };
}
