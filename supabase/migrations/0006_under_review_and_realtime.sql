-- A request that has every document uploaded now lands in 'under_review'
-- instead of jumping straight to 'complete' - the provider still needs to
-- actually look at what came in and confirm it's sufficient (or use
-- "Request more documents" if something's missing/wrong) before it's
-- truly done.
alter table requests drop constraint requests_status_check;
alter table requests add constraint requests_status_check
  check (status in ('pending', 'partially_received', 'under_review', 'complete', 'expired', 'cancelled'));

-- Lets the request detail page live-refresh via Supabase Realtime when a
-- document is uploaded, instead of the provider needing to keep hitting
-- refresh to see what a patient just sent.
alter publication supabase_realtime add table audit_events;
