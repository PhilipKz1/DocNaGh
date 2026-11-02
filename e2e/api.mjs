// API-level end-to-end test: patient flow, provider pages, exports, erasure
// and clinic isolation, against a running app with throwaway clinics that
// are deleted afterwards. Needs the service-role key (it creates the test
// clinics/logins directly) - see .github/workflows/ci.yml.
//
//   SITE=http://localhost:3000 node --env-file=.env.local e2e/api.mjs
//
// Against production, set SITE=https://www.medswyft.com. Test logins use
// Resend's delivered@resend.dev test inbox, so no real email is sent.
import { createClient } from "@supabase/supabase-js";
import { unzipSync } from "fflate";

const SITE = process.env.SITE ?? "http://localhost:3000";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET ?? "patient-documents";
const REF = new URL(URL_).hostname.split(".")[0];
const RUN = Date.now().toString(36);
const PASSWORD = "E2e-" + crypto.randomUUID();

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
const created = { clinics: [], users: [] };

async function makeClinic(label) {
  const email = `delivered+e2e-${RUN}-${label}@resend.dev`;
  const { data: u, error: ue } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (ue) throw ue;
  created.users.push(u.user.id);
  const { data: clinic, error: ce } = await admin.from("clinics").insert({ name: `E2E Test Clinic ${label} ${RUN}` }).select("id").single();
  if (ce) throw ce;
  created.clinics.push(clinic.id);
  const { data: provider, error: pe } = await admin.from("providers")
    .insert({ clinic_id: clinic.id, user_id: u.user.id, full_name: `E2E Admin ${label}`, email, role: "admin" })
    .select("id").single();
  if (pe) throw pe;
  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: s, error: se } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (se) throw se;
  return { email, clinicId: clinic.id, providerId: provider.id, client, session: s.session };
}

// @supabase/ssr cookie format: "base64-" + base64url(session JSON), chunked.
function cookieHeader(session) {
  const key = `sb-${REF}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const CHUNK = 3180;
  if (value.length <= CHUNK) return `${key}=${value}`;
  const parts = [];
  for (let i = 0; i * CHUNK < value.length; i++) parts.push(`${key}.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`);
  return parts.join("; ");
}

const get = (path, cookie) => fetch(SITE + path, { headers: cookie ? { cookie } : {}, redirect: "manual" });
const post = (path, body) => fetch(SITE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });

const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

async function main() {
  // ---------------- Public pages ----------------
  for (const p of ["/", "/about", "/privacy", "/terms", "/cookies", "/login"]) {
    const r = await get(p);
    check(`public page ${p}`, r.status === 200, `HTTP ${r.status}`);
  }
  {
    const r = await get("/");
    const csp = r.headers.get("content-security-policy") ?? "";
    check("CSP header present", csp.includes("frame-ancestors 'none'"));
    const html = await r.text();
    check("homepage title is MedSwyft", /<title>MedSwyft<\/title>/.test(html));
    check("footer shows contact email", html.includes("info@medswyft.com"));
  }
  {
    const html = await (await get("/privacy")).text();
    check("privacy has fixed date", html.includes("2 November 2026"));
    check("privacy has children section", html.includes("Children"));
    check("privacy has deletion process", html.includes("how to ask for deletion"));
  }
  for (const p of ["/dashboard", "/requests/new", "/harbor", "/account"]) {
    const r = await get(p);
    const loc = r.headers.get("location") ?? "";
    check(`unauthenticated ${p} redirects to login`, r.status >= 300 && r.status < 400 && loc.includes("/login"), `HTTP ${r.status} -> ${loc}`);
  }
  {
    const r = await get("/api/cron/purge-documents");
    check("cron endpoint rejects without secret", r.status === 401, `HTTP ${r.status}`);
  }
  {
    const r = await get("/r/not-a-real-token");
    const html = await r.text();
    check("invalid patient link shows 'Link not found'", r.status === 200 && html.includes("Link not found"));
  }

  // ---------------- Setup ----------------
  const A = await makeClinic("A");
  const B = await makeClinic("B");
  check("test clinics + logins created", true, `${A.email}, ${B.email}`);
  const cookieA = cookieHeader(A.session);

  // Provider creates a patient + request through their own RLS-scoped session
  const { data: patient, error: patErr } = await A.client.from("patients")
    .insert({ clinic_id: A.clinicId, full_name: "Test Patient E2E", phone: "+233200000000" }).select("id").single();
  check("provider can create patient (RLS)", !patErr, patErr?.message);
  const { data: request, error: reqErr } = await A.client.from("requests").insert({
    clinic_id: A.clinicId, provider_id: A.providerId, patient_id: patient.id,
    patient_display_name: "Test Patient E2E", expires_at: new Date(Date.now() + 72 * 3600e3).toISOString(),
  }).select("id, access_token").single();
  check("provider can create request (RLS)", !reqErr, reqErr?.message);
  const { data: rds, error: rdErr } = await A.client.from("request_documents")
    .insert([{ request_id: request.id, label: "Referral letter" }, { request_id: request.id, label: "Lab results" }])
    .select("id, label");
  check("provider can add requested documents", !rdErr && rds.length === 2, rdErr?.message);
  const token = request.access_token;
  const [doc1, doc2] = rds;

  // ---------------- Authenticated provider pages ----------------
  {
    const r = await get("/dashboard", cookieA);
    const html = await r.text();
    check("dashboard loads for provider", r.status === 200 && html.includes("Test Patient E2E"), `HTTP ${r.status}`);
  }
  for (const p of ["/requests/new", "/account", "/dashboard/team"]) {
    const r = await get(p, cookieA);
    check(`provider page ${p} loads`, r.status === 200, `HTTP ${r.status} ${r.headers.get("location") ?? ""}`);
  }
  {
    const r = await get("/harbor", cookieA);
    check("clinic admin is kept out of /harbor (platform admin only)", r.status >= 300 && r.status < 400, `HTTP ${r.status} -> ${r.headers.get("location")}`);
    const e = await get(`/api/harbor/clinics/${A.clinicId}/export`, cookieA);
    check("clinic admin can't use platform clinic export", e.status !== 200, `HTTP ${e.status}`);
  }

  // ---------------- Patient flow (live API) ----------------
  {
    const r = await get(`/r/${token}`);
    const html = await r.text();
    check("patient link page loads with consent step", r.status === 200 && html.includes("I agree, continue"));
    check("consent step mentions parent/guardian", html.includes("parent or guardian"));
  }
  {
    const r = await post(`/api/requests/${token}/upload-target`, { requestDocumentId: doc1.id, fileName: "referral.pdf", mimeType: "application/pdf", sizeBytes: PDF.length });
    check("upload blocked before consent", r.status === 403, `HTTP ${r.status}`);
  }
  {
    const r = await post(`/api/requests/${token}/consent`);
    check("consent recorded", r.ok, `HTTP ${r.status}`);
    const { data } = await admin.from("requests").select("consented_at, consent_version").eq("id", request.id).single();
    check("consent stored with timestamp + version", !!data.consented_at && !!data.consent_version, JSON.stringify(data));
    const again = await post(`/api/requests/${token}/consent`);
    const { data: d2 } = await admin.from("requests").select("consented_at").eq("id", request.id).single();
    check("repeat consent keeps original timestamp", again.ok && d2.consented_at === data.consented_at);
  }
  async function upload(doc, name, mime, bytes) {
    const t = await post(`/api/requests/${token}/upload-target`, { requestDocumentId: doc.id, fileName: name, mimeType: mime, sizeBytes: bytes.length });
    if (!t.ok) return { step: "target", status: t.status, body: await t.text() };
    const { storagePath, uploadToken } = await t.json();
    const { error } = await admin.storage.from(BUCKET).uploadToSignedUrl(storagePath, uploadToken, new Blob([bytes], { type: mime }), { contentType: mime });
    if (error) return { step: "storage", error: error.message };
    const c = await post(`/api/requests/${token}/confirm-upload`, { requestDocumentId: doc.id, storagePath, fileName: name, mimeType: mime, sizeBytes: bytes.length });
    return { step: "confirm", status: c.status, body: await c.text(), storagePath };
  }
  {
    const r = await upload(doc1, "referral.pdf", "application/pdf", PDF);
    check("patient uploads a PDF", r.step === "confirm" && r.status === 200, JSON.stringify(r).slice(0, 200));
  }
  {
    const fake = new TextEncoder().encode("this is not really a png file at all");
    const r = await upload(doc2, "photo.png", "application/png".replace("application", "image"), fake);
    check("mislabelled file rejected (content check)", r.step === "confirm" && r.status === 400, JSON.stringify(r).slice(0, 160));
  }
  {
    const r = await post(`/api/requests/${token}/upload-target`, { requestDocumentId: doc2.id, fileName: "x.exe", mimeType: "application/x-msdownload", sizeBytes: 100 });
    check("disallowed file type rejected", r.status === 400, `HTTP ${r.status}`);
  }
  {
    const r = await post(`/api/requests/${token}/upload-target`, { requestDocumentId: B.clinicId, fileName: "a.pdf", mimeType: "application/pdf", sizeBytes: 100 });
    check("unknown document id rejected", r.status === 400, `HTTP ${r.status}`);
  }
  {
    const r = await upload(doc2, "lab.pdf", "application/pdf", PDF);
    check("second document uploaded", r.step === "confirm" && r.status === 200, JSON.stringify(r).slice(0, 160));
    const { data } = await admin.from("requests").select("status").eq("id", request.id).single();
    check("request moves to under_review when all uploaded", data.status === "under_review", data.status);
  }
  {
    const r = await post(`/api/requests/${token}/remove-upload`, { requestDocumentId: doc2.id });
    check("patient can remove an upload", r.ok, `HTTP ${r.status}`);
    const { data } = await admin.from("audit_events").select("metadata").eq("request_id", request.id).eq("event_type", "document_uploaded");
    const withName = data.filter((e) => e.metadata.fileName);
    check("removed file's name scrubbed from audit log", data.length === 2 && withName.length === 1 && withName[0].metadata.fileName === "referral.pdf", JSON.stringify(data.map((e) => e.metadata)));
  }

  // ---------------- Provider sees results ----------------
  {
    const r = await get(`/requests/${request.id}`, cookieA);
    const html = await r.text();
    check("request page loads", r.status === 200, `HTTP ${r.status}`);
    check("request page shows uploaded file", html.includes("referral.pdf"));
    check("activity shows the patient's consent", html.includes("Patient gave consent"));
    check("admin sees patient data controls", html.includes("Patient data requests"));
  }
  {
    const r = await get(`/api/patients/${patient.id}/export`, cookieA);
    check("patient export returns ZIP", r.status === 200 && r.headers.get("content-type") === "application/zip", `HTTP ${r.status}`);
    if (r.status === 200) {
      const files = unzipSync(new Uint8Array(await r.arrayBuffer()));
      const names = Object.keys(files);
      const data = JSON.parse(new TextDecoder().decode(files["data.json"]));
      check("export contains data.json + the uploaded PDF", names.includes("data.json") && names.some((n) => n.endsWith("referral.pdf")), names.join(", "));
      check("export omits access token", !JSON.stringify(data).includes(token));
      check("export file content intact", Object.entries(files).some(([n, b]) => n.endsWith(".pdf") && b.length === PDF.length));
    }
  }

  // ---------------- Isolation between clinics ----------------
  {
    const { data: reqs } = await B.client.from("requests").select("id").eq("id", request.id);
    check("clinic B can't see clinic A's request", reqs.length === 0);
    const { data: pats } = await B.client.from("patients").select("id").eq("id", patient.id);
    check("clinic B can't see clinic A's patient", pats.length === 0);
    const { data: docs } = await B.client.from("documents").select("id");
    check("clinic B sees no documents", docs.length === 0);
    const { data: evs } = await B.client.from("audit_events").select("clinic_id");
    check("clinic B audit log only has its own (or nothing)", evs.every((e) => e.clinic_id === B.clinicId), `${evs.length} rows`);
    const { data: allEvs } = await A.client.from("audit_events").select("clinic_id, event_type");
    check("clinic A can't see platform/other-clinic events", allEvs.every((e) => e.clinic_id === A.clinicId), `${allEvs.length} rows`);
    const r = await get(`/requests/${request.id}`, cookieHeader(B.session));
    const leakHtml = await r.text();
    check("clinic B gets a real 404 on clinic A's request page", r.status === 404, `HTTP ${r.status}`);
    check("clinic B's view of clinic A's request page leaks nothing",
      !leakHtml.includes("Test Patient E2E") && !leakHtml.includes("referral.pdf") && !leakHtml.includes(token),
      `HTTP ${r.status}, not-found UI: ${/could not be found|404/i.test(leakHtml)}`);
    const ex = await get(`/api/patients/${patient.id}/export`, cookieHeader(B.session));
    check("clinic B can't export clinic A's patient", ex.status === 404, `HTTP ${ex.status}`);
    const { error: insErr } = await A.client.from("audit_events").insert({ request_id: request.id, actor_type: "provider", event_type: "forged" });
    check("provider can't forge audit entries", !!insErr, insErr?.message);
    const { error: xErr } = await admin.from("audit_events").insert({ request_id: request.id, clinic_id: B.clinicId, actor_type: "provider", event_type: "cross_clinic_probe" });
    check("DB rejects audit event whose clinic doesn't match its request (needs 0010)", !!xErr, xErr?.message ?? "inserted!");
    if (!xErr) await admin.from("audit_events").delete().eq("event_type", "cross_clinic_probe");
  }

  // ---------------- Erasure via the real server action ----------------
  {
    const page = await (await get(`/requests/${request.id}`, cookieA)).text();
    const chunks = [...new Set([...page.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]))];
    let actionId = null;
    for (const c of chunks) {
      const js = await (await fetch(SITE + c)).text();
      const m = js.match(/createServerReference\)\("([0-9a-f]{40,})"[^)]*"erasePatientData"\)/) ||
                js.match(/\("([0-9a-f]{40,})",[^()]*?,"erasePatientData"\)/);
      if (m) { actionId = m[1]; break; }
    }
    if (!actionId) {
      check("found erasePatientData action", false, "couldn't locate action id in client bundle - erase untested");
    } else {
      const r = await fetch(SITE + `/requests/${request.id}`, {
        method: "POST",
        headers: { cookie: cookieA, "Next-Action": actionId, "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component" },
        body: JSON.stringify([patient.id]),
      });
      const body = await r.text();
      check("erase action responds", r.status === 200, `HTTP ${r.status} ${body.slice(0, 120)}`);
      const { data: p } = await admin.from("patients").select("id").eq("id", patient.id);
      const { data: rq } = await admin.from("requests").select("id").eq("id", request.id);
      const { data: objs } = await admin.storage.from(BUCKET).list(`${A.clinicId}/${request.id}`);
      check("erase removed patient, requests and files", p.length === 0 && rq.length === 0 && (objs ?? []).length === 0, `patients=${p.length} requests=${rq.length} files=${objs?.length}`);
      const { data: ev } = await admin.from("audit_events").select("event_type, metadata").eq("clinic_id", A.clinicId).eq("event_type", "patient_data_erased");
      check("erasure logged in audit trail", ev.length === 1, JSON.stringify(ev));
      const { data: leftover } = await admin.from("audit_events").select("metadata").eq("clinic_id", A.clinicId).eq("event_type", "document_uploaded");
      check("no file names left in audit after erasure", leftover.every((e) => !e.metadata.fileName));
    }
  }
}

async function cleanup() {
  for (const clinicId of created.clinics) {
    const { data: reqs } = await admin.from("requests").select("id").eq("clinic_id", clinicId);
    for (const r of reqs ?? []) {
      const { data: objs } = await admin.storage.from(BUCKET).list(`${clinicId}/${r.id}`);
      if (objs?.length) await admin.storage.from(BUCKET).remove(objs.map((o) => `${clinicId}/${r.id}/${o.name}`));
    }
    await admin.from("requests").delete().eq("clinic_id", clinicId);
    await admin.from("audit_events").delete().eq("clinic_id", clinicId);
    await admin.from("providers").delete().eq("clinic_id", clinicId);
    await admin.from("clinics").delete().eq("id", clinicId);
  }
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  const { data: left } = await admin.from("clinics").select("id").in("id", created.clinics.length ? created.clinics : ["00000000-0000-0000-0000-000000000000"]);
  console.log(`cleanup: removed ${created.clinics.length} clinics, ${created.users.length} users; leftover clinics: ${left?.length ?? "?"}`);
}

try {
  await main();
} catch (err) {
  check("test run crashed", false, err?.stack ?? String(err));
} finally {
  await cleanup();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log("FAILURES:"); failed.forEach((f) => console.log(" - " + f.name + (f.detail ? ": " + f.detail : ""))); }
  process.exit(failed.length ? 1 : 0);
}
