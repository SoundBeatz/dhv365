import Link from "next/link";

export function Header() {
  return (
    <>
      <header className="nav">
        <div className="wrap navin">
          <Link href="/" className="brand" aria-label="DHV365 home">
            DHV<span>365</span>
          </Link>

          <div className="navActions" style={{ paddingRight: "118px" }}>
            <nav className="links" aria-label="Hoofdnavigatie">
              <Link href="/#diensten">Diensten</Link>
              <Link href="/#werkwijze">Werkwijze</Link>
              <Link href="/veiligheid">Veiligheid</Link>
              <Link href="/werkgebied">Werkgebied</Link>
            </nav>

            <Link href="/opdracht" className="button requestButton">
              Opdracht aanvragen <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      <Link
        href="/login"
        aria-label="Inloggen bij DHV365"
        style={{
          position: "fixed",
          top: "14px",
          right: "16px",
          zIndex: 2147483647,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "42px",
          padding: "10px 16px",
          border: "1px solid rgba(183,255,101,.45)",
          borderRadius: "9px",
          background: "#0d1916",
          color: "#f4f7f5",
          fontWeight: 800,
          fontSize: "14px",
          lineHeight: 1,
          textDecoration: "none",
          whiteSpace: "nowrap",
          visibility: "visible",
          opacity: 1,
          pointerEvents: "auto",
          boxShadow: "0 8px 30px rgba(0,0,0,.28)",
        }}
      >
        Inloggen
      </Link>
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footerGrid">
          <div>
            <Link href="/" className="brand">
              DHV<span>365</span>
            </Link>
            <p>
              Dedicated High Value & Critical Transport vanuit de regio Velp–Nijmegen.
              Rechtstreeks vervoer zonder overslag, na bevestiging van beschikbaarheid en
              opdrachtacceptatie.
            </p>
          </div>
          <div>
            <h3>Diensten</h3>
            <Link href="/#diensten">Critical Documents</Link>
            <Link href="/#diensten">Time Critical</Link>
            <Link href="/#diensten">Digital & Data</Link>
            <Link href="/#diensten">High Value Handling</Link>
          </div>
          <div>
            <h3>Informatie</h3>
            <Link href="/veiligheid">Veiligheid</Link>
            <Link href="/werkgebied">Europa</Link>
            <Link href="/opdracht">Opdracht aanvragen</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} DHV365. Alle rechten voorbehouden.</span>
          <span>24/7 bereikbaar · inzet na bevestiging</span>
        </div>
      </div>
    </footer>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
