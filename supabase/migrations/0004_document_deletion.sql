-- Lets a provider delete an uploaded document from their own clinic (e.g. a
-- patient calls asking for something removed after their link has expired
-- and self-service removal - see /api/requests/[token]/remove-upload - is
-- no longer reachable). Scoped identically to the existing select policy.

create policy "providers can delete own clinic documents" on documents
  for delete using (
    exists (
      select 1 from request_documents
      join requests on requests.id = request_documents.request_id
      where request_documents.id = documents.request_document_id
        and requests.clinic_id = my_clinic_id()
    )
  );
