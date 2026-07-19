import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Beveiligd inloggen",
  description: "Toegang tot het beveiligde DHV365 Operations Platform.",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    signedout?: string;
    passwordupdated?: string;
    next?: string;
  }>;
};

const accessOptions = [
  {
    href: "/forgot-password",
    title: "Wachtwoord resetten",
    description: "Ontvang een beveiligde herstelkoppeling per e-mail.",
  },
  {
    href: "/register",
    title: "Account aanmaken",
    description: "Vraag een geverifieerd DHV365-account aan.",
  },
  {
    href: "/portal",
    title: "Klantbeheer",
    description: "Open uw beveiligde klant- en opdrachtomgeving.",
  },
  {
    href: "/admin/login",
    title: "Admin inlog",
    description: "Afgeschermde toegang voor bevoegde beheerders.",
  },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="authShell">
      <section className="authPanel">
        <Link href="/" className="brand" aria-label="Terug naar DHV365">
          DHV<span>365</span>
        </Link>

        <div>
          <span className="eyebrow">Secure Operations Platform</span>
          <h1>Beveiligde toegang.</h1>
          <p className="lead">
            Alleen vooraf geverifieerde en uitgenodigde DHV365-gebruikers krijgen toegang.
          </p>
        </div>

        <div className="authAssurance">
          <span>Invite-only accounts</span>
          <span>Versleutelde sessie</span>
          <span>Volledige auditregistratie</span>
        </div>
      </section>

      <section className="authFormWrap">
        <form action={login} className="authForm">
          <span className="eyebrow">Identity verification</span>
          <h2>Inloggen</h2>
          <p>Gebruik uitsluitend uw persoonlijk toegewezen account.</p>

          {params.error && (
            <div className="formError" role="alert">
              {params.error}
            </div>
          )}
          {params.signedout && <div className="formSuccess">U bent veilig uitgelogd.</div>}
          {params.passwordupdated && (
            <div className="formSuccess">Uw wachtwoord is gewijzigd. Log opnieuw in.</div>
          )}

          <input type="hidden" name="next" value={params.next ?? "/portal"} />

          <label htmlFor="email">Zakelijk e-mailadres</label>
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
            Veilig inloggen →
          </button>

          <nav className="authAccessGrid" aria-label="Toegangsopties">
            {accessOptions.map((option) => (
              <Link href={option.href} className="authAccessCard" key={option.href}>
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </Link>
            ))}
          </nav>

          <small>
            Problemen met toegang? Neem contact op met uw DHV365-beheerder. Deel nooit uw
            wachtwoord of verificatiecode.
          </small>
        </form>
      </section>
    </main>
  );
}
