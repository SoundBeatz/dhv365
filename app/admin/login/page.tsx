import type { Metadata } from "next";
import Link from "next/link";
import { login } from "../../login/actions";

export const metadata: Metadata = {
  title: "Admin inlog",
  description: "Afgeschermde DHV365-beheerderstoegang.",
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="authPanel">
        <Link href="/" className="brand" aria-label="Terug naar DHV365">
          DHV<span>365</span>
        </Link>
        <div>
          <span className="eyebrow">Restricted administrator zone</span>
          <h1>Admin control.</h1>
          <p className="lead">
            Alleen bevoegde DHV365-beheerders met toegewezen rechten krijgen toegang.
          </p>
        </div>
        <div className="authAssurance">
          <span>Role-based access</span>
          <span>Audit logging</span>
          <span>Beveiligde sessies</span>
        </div>
      </section>

      <section className="authFormWrap">
        <form action={login} className="authForm">
          <span className="eyebrow">Administrator verification</span>
          <h2>Admin inloggen</h2>
          <p>Gebruik uitsluitend uw persoonlijk toegewezen beheerdersaccount.</p>

          {params.error && (
            <div className="formError" role="alert">
              {params.error}
            </div>
          )}

          <input type="hidden" name="next" value="/admin" />

          <label htmlFor="email">Beheerders-e-mailadres</label>
          <input id="email" name="email" type="email" autoComplete="username" required />

          <label htmlFor="password">Wachtwoord</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
          />

          <button className="button" type="submit">
            Adminomgeving openen →
          </button>

          <Link href="/forgot-password" className="authHelp">
            Wachtwoord resetten
          </Link>
          <Link href="/login" className="authHelp">
            Terug naar klantinlog
          </Link>

          <small>
            Onbevoegde toegangspogingen kunnen worden geregistreerd. Deel nooit uw wachtwoord of
            verificatiecode.
          </small>
        </form>
      </section>
    </main>
  );
}
