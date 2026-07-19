import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account aanmaken",
  description: "Vraag een geverifieerd DHV365-account aan.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="accessPage">
      <section className="accessCard">
        <Link href="/" className="brand" aria-label="Terug naar DHV365">
          DHV<span>365</span>
        </Link>
        <span className="eyebrow">Verified account access</span>
        <h1>Account aanmaken.</h1>
        <p>
          DHV365 werkt met gecontroleerde accounts. Nieuwe klanten, partners en medewerkers
          worden eerst geverifieerd voordat toegang tot het platform wordt geactiveerd.
        </p>
        <div className="notice">
          Stuur uw bedrijfsnaam, contactpersoon en zakelijk e-mailadres naar onze accountservice.
          U ontvangt daarna een beveiligde uitnodiging.
        </div>
        <div className="accessActions">
          <a className="button" href="mailto:account@dhv365.nl?subject=Aanvraag%20DHV365-account">
            Account aanvragen →
          </a>
          <Link className="button ghost" href="/login">
            Terug naar inloggen
          </Link>
        </div>
      </section>
    </main>
  );
}
