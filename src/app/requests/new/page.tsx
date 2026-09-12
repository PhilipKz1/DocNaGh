import { requireProvider } from "@/lib/adminAuth";
import { NewRequestForm } from "./NewRequestForm";

export default async function NewRequestPage() {
  // RLS scopes request_templates to the caller's own clinic already - see
  // the 0007 migration's policy.
  const { supabase } = await requireProvider();

  const { data: templates } = await supabase
    .from("request_templates")
    .select("id, name, request_template_documents(label)")
    .order("name", { ascending: true });

  const formattedTemplates = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    labels: t.request_template_documents?.map((d) => d.label) ?? [],
  }));

  return <NewRequestForm templates={formattedTemplates} />;
}
