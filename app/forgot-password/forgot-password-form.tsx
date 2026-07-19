"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      setError(true);
      setMessage("Vul een geldig e-mailadres in.");
      return;
    }

    setSending(true);
    setError(false);
    setMessage(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/login/?reset=1`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) throw resetError;

      setMessage(
        "Als het account bestaat, is een herstelmail verzonden. Controleer ook uw spammap.",
      );
      event.currentTarget.reset();
    } catch (cause) {
      console.error("Password recovery request failed", cause);
      setError(true);
      setMessage("De herstelmail kon niet worden verzonden. Probeer het later opnieuw.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="authForm">
      <Link href="/" className="brand" aria-label="Terug naar DHV365">
        DHV<span>365</span>
      </Link>
      <span className="eyebrow">Account recovery</span>
      <h2>Wachtwoord herstellen</h2>
      <p>
        Vul uw geverifieerde zakelijke e-mailadres in. Als het account bestaat, ontvangt u een
        eenmalige herstel-link.
      </p>

      {message && (
        <div className={error ? "formError" : "formSuccess"} role="status">
          {message}
        </div>
      )}

      <label htmlFor="email">Zakelijk e-mailadres</label>
      <input id="email" name="email" type="email" autoComplete="email" required />

      <button type="submit" className="button" disabled={sending}>
        {sending ? "Herstelmail verzenden…" : "Verstuur herstel-link →"}
      </button>

      <Link href="/login" className="authHelp">
        Terug naar inloggen
      </Link>
    </form>
  );
}
