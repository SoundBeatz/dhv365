"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const supabase = createClient();

    try {
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/wachtwoord-wijzigen`,
        });
        if (resetError) throw resetError;
        setMessage("Als dit account bestaat, ontvangt u een beveiligde herstelmail.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      await fetch("/api/auth/login-alert", { method: "POST" }).catch(() => undefined);
      router.replace("/portal");
      router.refresh();
    } catch {
      setError(mode === "login" ? "Inloggen is niet gelukt. Controleer uw gegevens." : "De herstelmail kon niet worden aangevraagd.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.heading}>{mode === "login" ? "Inloggen" : "Wachtwoord herstellen"}</h1>
      <p className={styles.intro}>{mode === "login" ? "Toegang tot het beveiligde DHV365-klantportaal." : "U ontvangt een beveiligde link via Supabase Auth en Resend SMTP."}</p>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">E-mailadres</label>
          <input className={styles.input} id="email" name="email" type="email" autoComplete="email" required />
        </div>
        {mode === "login" && <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Wachtwoord</label>
          <input className={styles.input} id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
        </div>}
        {message && <div className={styles.message} role="status">{message}</div>}
        {error && <div className={styles.error} role="alert">{error}</div>}
        <div className={styles.row}>
          <button className="button" type="submit" disabled={loading}>{loading ? "Verwerken…" : mode === "login" ? "Veilig inloggen" : "Herstelmail aanvragen"}</button>
          <button className={styles.linkButton} type="button" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setError(null); setMessage(null); }}>
            {mode === "login" ? "Wachtwoord vergeten?" : "Terug naar inloggen"}
          </button>
        </div>
      </form>
      <p className={styles.small}>Nog geen account? Accounts worden uitsluitend na verificatie door DHV365 aangemaakt.</p>
    </div>
  );
}
