"use client";

import { useEffect, useState } from "react";
import type { Factor } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AccountSettings() {
  const [email, setEmail] = useState<string | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const supabase = createClient();
    const [{ data: userData }, { data: factorData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.listFactors(),
    ]);
    setEmail(userData.user?.email ?? null);
    setFactors(factorData?.totp ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!loaded) return null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Account</h1>
        {email && <p className="text-sm text-gray-500">{email}</p>}
      </div>

      <ChangePasswordSection email={email} />
      <MfaSection factors={factors} onChange={refresh} />
    </div>
  );
}

function ChangePasswordSection({ email }: { email: string | null }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    // Re-confirm identity with the current password before rotating it, so
    // a hijacked-but-not-fully-compromised session can't be used to lock
    // the real owner out.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) {
      setPending(false);
      setError("Current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setSuccess(true);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Change password</h2>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">Password updated.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}

function MfaSection({ factors, onChange }: { factors: Factor[]; onChange: () => void }) {
  const verified = factors.find((f) => f.status === "verified");

  if (verified) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Two-factor authentication</h2>
        <p className="text-sm text-green-700">Enabled via authenticator app.</p>
        <UnenrollButton factorId={verified.id} onChange={onChange} />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Two-factor authentication</h2>
      <p className="text-sm text-gray-500">
        Not enabled. Add an authenticator app for a second sign-in step.
      </p>
      <EnrollFlow existingUnverified={factors} onChange={onChange} />
    </section>
  );
}

function UnenrollButton({ factorId, onChange }: { factorId: string; onChange: () => void }) {
  const [pending, setPending] = useState(false);

  async function handleUnenroll() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId });
    setPending(false);
    onChange();
  }

  return (
    <button
      onClick={handleUnenroll}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Removing..." : "Remove two-factor authentication"}
    </button>
  );
}

function EnrollFlow({ existingUnverified, onChange }: { existingUnverified: Factor[]; onChange: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startEnroll() {
    setError(null);
    setPending(true);
    const supabase = createClient();

    for (const factor of existingUnverified) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setPending(false);

    if (enrollError) {
      setError(enrollError.message);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    setPending(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setFactorId(null);
    setQrCode(null);
    setCode("");
    onChange();
  }

  if (!factorId) {
    return (
      <div className="space-y-2">
        <button
          onClick={startEnroll}
          disabled={pending}
          className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Starting..." : "Set up two-factor authentication"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="max-w-sm space-y-3">
      <p className="text-sm text-gray-500">
        Scan this QR code with your authenticator app, then enter the 6-digit code.
      </p>
      {qrCode && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCode} alt="Two-factor authentication QR code" className="h-40 w-40" />
      )}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode="numeric"
        maxLength={6}
        required
        className="w-full rounded-md border px-3 py-2 text-sm tracking-widest"
        placeholder="123456"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Verifying..." : "Verify and enable"}
      </button>
    </form>
  );
}
