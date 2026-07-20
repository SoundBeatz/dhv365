import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/site";
import { TransportRequestForm } from "@/components/transport-request-form";

export const metadata: Metadata = {
  title: "Beveiligde transportopdracht aanvragen",
  description: "Vraag dedicated vervoer aan voor een vertrouwelijke, waardevolle of tijdkritische zakelijke zending.",
  alternates: { canonical: "/opdracht" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section className="pageHero">
          <div className="wrap">
            <span className="eyebrow">Secure intake</span>
            <h1>Uw opdracht begint met controle.</h1>
            <p className="lead">
              Dien de eerste zakelijke aanvraag veilig in. Iedere aanvraag krijgt een uniek referentienummer en wordt handmatig beoordeeld voordat DHV365 een opdracht accepteert.
            </p>
          </div>
        </section>
        <article className="wrap content">
          <div className="notice">
            <strong>Beveiligde vooraanmelding</strong>
            <p>
              Deel in deze fase geen identiteitsbewijs, toegangscodes, serienummers, exacte waardegegevens of vertrouwelijke documenten. Beveiligde uploads worden pas na verificatie beschikbaar gesteld.
            </p>
          </div>

          <h2>Vraag een beoordeling aan</h2>
          <p>
            Na verzending ontvangt u automatisch een bevestiging. DHV365 controleert vervolgens haalbaarheid, risico, route, dekking en benodigde beveiligingsmaatregelen.
          </p>

          <TransportRequestForm />

          <h2>Wat gebeurt hierna?</h2>
          <ul>
            <li>Technische en operationele haalbaarheidscontrole</li>
            <li>Risico-inschatting en verificatie van de zakelijke opdrachtgever</li>
            <li>Voorstel met prijs, voorwaarden en uitvoeringsprotocol</li>
            <li>Formele opdrachtacceptatie uitsluitend via het beveiligde platform</li>
          </ul>

          <div className="actions">
            <Link className="button ghost" href="/">Terug naar overzicht</Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
