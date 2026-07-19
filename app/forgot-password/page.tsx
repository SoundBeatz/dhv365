import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/login/actions";

export const metadata: Metadata = { title: "Wachtwoord herstellen", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ error?: string; sent?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  return <main className="authSingle"><form action={requestPasswordReset} className="authForm"><Link href="/" className="brand">DHV<span>365</span></Link><span className="eyebrow">Account recovery</span><h2>Wachtwoord herstellen</h2><p>Vul uw geverifieerde zakelijke e-mailadres in. Als het account bestaat, ontvangt u een eenmalige herstel-link.</p>{params.error && <div className="formError" role="alert">{params.error}</div>}{params.sent && <div className="formSuccess">Als het account bestaat, is een herstelmail verzonden. Controleer ook uw spammap.</div>}<label htmlFor="email">Zakelijk e-mailadres</label><input id="email" name="email" type="email" autoComplete="email" required/><button type="submit" className="button">Verstuur herstel-link →</button><Link href="/login" className="authHelp">Terug naar inloggen</Link></form></main>;
}
