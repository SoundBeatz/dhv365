"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetForm() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("De beveiligde herstel-link wordt gecontroleerd…");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function establishRecoverySession() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          url.searchParams.delete("code");
          window.history.replaceState(null, "", `${url.pathname}?reset=1`);
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error("Deze herstel-link is verlopen of ongeldig. Vraag een nieuwe herstelmail aan.");
        }

        setReady(true);
        setError(false);
        setMessage("Herstel-link gecontroleerd. Kies nu een nieuw wachtwoord.");
      } catch (cause) {
        setReady(false);
        setError(true);
        setMessage(cause instanceof Error ? cause.message : "De herstel-link kon niet worden verwerkt.");
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setError(false);
        setMessage("Herstel-link gecontroleerd. Kies nu een nieuw wachtwoord.");
      }
    });

    void establishRecoverySession();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (password.length < 14) {
      setError(true);
      setMessage("Gebruik een wachtwoord van minimaal 14 tekens.");
      return;
    }
    if (password !== confirmation) {
      setError(true);
      setMessage("De twee wachtwoorden zijn niet gelijk.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setSaving(false);
      setError(true);
      setMessage("Het wachtwoord kon niet worden gewijzigd. Vraag eventueel een nieuwe herstelmail aan.");
      return;
    }

    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/login?passwordupdated=1");
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <Link href="/" className="brand" aria-label="Terug naar DHV365">
        DHV<span>365</span>
      </Link>
      <span className="eyebrow">Wachtwoord herstellen</span>
      <h2>Stel een nieuw wachtwoord in</h2>
      <p>Deze beveiligde herstel-link geeft alleen toegang tot dit formulier.</p>

      <div className={error ? "formError" : "formSuccess"} role="status">
        {message}
      </div>

      {ready && (
        <>
          <label htmlFor="password">Nieuw wachtwoord</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={14} required />

          <label htmlFor="confirmation">Herhaal nieuw wachtwoord</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={14} required />

          <button type="submit" className="button" disabled={saving}>
            {saving ? "Wachtwoord opslaan…" : "Nieuw wachtwoord opslaan →"}
          </button>
        </>
      )}

      {!ready && error && <Link href="/forgot-password" className="button ghost">Nieuwe herstelmail aanvragen</Link>}
    </form>
  );
}
