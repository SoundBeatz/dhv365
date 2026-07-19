import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/site";

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  description: "De opgevraagde DHV365-pagina bestaat niet of is verplaatst.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <section className="pageHero">
          <div className="wrap">
            <span className="eyebrow">404 · Route niet beschikbaar</span>
            <h1>Deze pagina is niet gevonden.</h1>
            <p className="lead">
              De gevraagde pagina bestaat niet of is verplaatst. Ga terug naar
              het DHV365-overzicht of start een nieuwe aanvraag.
            </p>
            <div className="actions">
              <Link className="button" href="/">
                Terug naar DHV365 →
              </Link>
              <Link className="button ghost" href="/opdracht">
                Opdracht aanvragen
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
