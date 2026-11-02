import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves "does this request exist for this clinic?" here rather than only
 * in page.tsx. The page sits inside loading.tsx's Suspense boundary, so by
 * the time it calls notFound() the response has already started streaming
 * with a 200 - a request from another clinic (or a bad id) rendered the
 * not-found UI but with the wrong status. A layout renders before that
 * boundary, so notFound() here produces a real 404.
 */
export default async function RequestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: request } = await supabase.from("requests").select("id").eq("id", id).maybeSingle();
  if (!request) notFound();
  return children;
}
