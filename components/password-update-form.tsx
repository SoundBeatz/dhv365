"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-form.module.css";

export function PasswordUpdateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("confirmation") || "");

    if (password.length < 12 || password !== confirmation) {
      setError("Gebruik minimaal 12 tekens en vul tweemaal hetzelfde wachtwoord in.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Het wachtwoord kon niet worden gewijzigd. Vraag een nieuwe herstelmail aan.");
      setLoading(false);
      return;
    }

    await fetch("/api/auth/password-changed", { method: "POST" }).catch(() => undefined);
    router.replace("/portal");
    router.refresh();
  }

  return <div className={styles.card}><h1 className={styles.heading}>Nieuw wachtwoord</h1><p className={styles.intro}>Kies een uniek wachtwoord van minimaal 12 tekens.</p><form className={styles.form} onSubmit={submit}><div className={styles.field}><label className={styles.label} htmlFor="password">Nieuw wachtwoord</label><input className={styles.input} id="password" name="password" type="password" autoComplete="new-password" minLength={12} required /></div><div className={styles.field}><label className={styles.label} htmlFor="confirmation">Herhaal wachtwoord</label><input className={styles.input} id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></div>{error && <div className={styles.error} role="alert">{error}</div>}<button className="button" type="submit" disabled={loading}>{loading ? "Wijzigen…" : "Wachtwoord veilig wijzigen"}</button></form></div>;
}
