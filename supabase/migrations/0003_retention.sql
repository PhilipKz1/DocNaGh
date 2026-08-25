-- Document retention: uploaded files are purged automatically after
-- DOCUMENT_RETENTION_DAYS (see src/lib/retention.ts). This index makes the
-- purge job's "find everything past its retention window" query cheap
-- instead of a full table scan as the documents table grows.

create index documents_uploaded_at_idx on documents (uploaded_at);
