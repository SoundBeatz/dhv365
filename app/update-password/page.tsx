import type { Metadata } from "next";
import Link from "next/link";
import { updatePassword } from "@/app/login/actions";

export const metadata: Metadata = { title: "Nieuw wachtwoord instellen", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ error?: string }> };

export default async function UpdatePasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  return <main className="authSingle"><form action={updatePassword} className="authForm"><Link href="/" className="brand">DHV<span>365</span></Link><span className="eyebrow">Secure password update</span><h2>Nieuw wachtwoord</h2><p>Gebruik minimaal 14 tekens en een wachtwoord dat nergens anders wordt gebruikt.</p>{params.error && <div className="formError" role="alert">{params.error}</div>}<label htmlFor="password">Nieuw wachtwoord</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={14} required/><label htmlFor="confirmation">Herhaal nieuw wachtwoord</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={14} required/><button type="submit" className="button">Wachtwoord veilig wijzigen →</button><small>Na wijziging worden alle bestaande sessies ingetrokken en moet u opnieuw inloggen.</small></form></main>;
}
