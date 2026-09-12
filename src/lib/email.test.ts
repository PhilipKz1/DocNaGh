import { describe, expect, it } from "vitest";
import { escapeHtml } from "./email";

describe("escapeHtml", () => {
  it("escapes all five HTML-significant characters", () => {
    expect(escapeHtml(`<script>alert('x') & "y"</script>`)).toBe(
      "&lt;script&gt;alert(&#39;x&#39;) &amp; &quot;y&quot;&lt;/script&gt;"
    );
  });

  it("neutralizes a script-injection attempt in patient/provider-supplied text", () => {
    const malicious = `"><img src=x onerror=alert(1)>`;
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<img");
    expect(escaped).not.toContain('">');
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Referral letter")).toBe("Referral letter");
  });

  it("handles an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});
